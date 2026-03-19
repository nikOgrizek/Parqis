import asyncio
import json
import logging
import threading
from typing import Any
from collections.abc import Awaitable, Callable

try:
    from kafka import KafkaConsumer, KafkaProducer
    KAFKA_IMPORT_ERROR: Exception | None = None
except Exception as exc:  # pragma: no cover
    KafkaConsumer = Any  # type: ignore[assignment]
    KafkaProducer = Any  # type: ignore[assignment]
    KAFKA_IMPORT_ERROR = exc

from app.INTEGRATIONS.contracts import SpotChangedEvent
from app.PLATFORM.config import settings

LOGGER = logging.getLogger(__name__)


class KafkaEventBus:
    def __init__(self) -> None:
        self._producer: KafkaProducer | None = None
        self._consumer: KafkaConsumer | None = None
        self._consumer_thread: threading.Thread | None = None
        self._stop_event = threading.Event()

    async def start(self, reservation_handler: Callable[[dict[str, object]], Awaitable[None]]) -> None:
        if KAFKA_IMPORT_ERROR is not None:
            LOGGER.warning("Kafka client unavailable; continuing without event messaging. reason=%s", KAFKA_IMPORT_ERROR)
            return

        try:
            self._producer = KafkaProducer(
                bootstrap_servers=settings.kafka_bootstrap_servers,
                client_id=settings.kafka_client_id,
                value_serializer=lambda value: json.dumps(value).encode("utf-8"),
            )

            self._consumer = KafkaConsumer(
                settings.kafka_reservations_topic,
                bootstrap_servers=settings.kafka_bootstrap_servers,
                group_id=settings.kafka_group_id,
                client_id=f"{settings.kafka_client_id}-consumer",
                value_deserializer=lambda value: json.loads(value.decode("utf-8")),
                auto_offset_reset="latest",
                enable_auto_commit=True,
                consumer_timeout_ms=1000,
            )

            loop = asyncio.get_running_loop()
            self._stop_event.clear()
            self._consumer_thread = threading.Thread(
                target=self._consume_loop,
                args=(reservation_handler, loop),
                daemon=True,
                name="ms2-kafka-consumer",
            )
            self._consumer_thread.start()
            LOGGER.info("Kafka producer and consumer started")
        except Exception as exc:
            LOGGER.warning("Kafka not available; continuing without event messaging. reason=%s", exc)
            await self.stop()

    async def stop(self) -> None:
        self._stop_event.set()

        if self._consumer_thread:
            self._consumer_thread.join(timeout=2)
            self._consumer_thread = None

        if self._consumer:
            self._consumer.close()
            self._consumer = None

        if self._producer:
            self._producer.close()
            self._producer = None

    def _consume_loop(self, reservation_handler: Callable[[dict[str, object]], Awaitable[None]], loop) -> None:
        assert self._consumer is not None
        while not self._stop_event.is_set():
            for message in self._consumer:
                if self._stop_event.is_set():
                    return
                payload = message.value
                if not isinstance(payload, dict):
                    continue
                try:
                    future = asyncio.run_coroutine_threadsafe(reservation_handler(payload), loop)
                    future.result(timeout=5)
                except Exception as exc:
                    LOGGER.error("Failed to process reservation event: %s", exc)
            if self._stop_event.is_set():
                return

    async def publish_spot_changed(self, event: SpotChangedEvent) -> None:
        if not self._producer:
            return

        event_payload = {
            "eventType": event.event_type,
            "payload": {
                "spotId": event.spot_id,
                "parkingLotId": event.parking_lot_id,
                "status": event.status,
            },
        }
        send_future = self._producer.send(settings.kafka_spot_updates_topic, event_payload)
        send_future.get(timeout=5)
