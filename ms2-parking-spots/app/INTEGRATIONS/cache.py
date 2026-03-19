import json
import logging

from redis import Redis
from redis.exceptions import RedisError

from app.PLATFORM.config import settings

LOGGER = logging.getLogger(__name__)


class OccupancyCache:
    def __init__(self) -> None:
        self._client: Redis | None = None

    def start(self) -> None:
        try:
            self._client = Redis.from_url(settings.redis_url, decode_responses=True)
            self._client.ping()
            LOGGER.info("Redis cache connected")
        except RedisError as exc:
            self._client = None
            LOGGER.warning("Redis cache unavailable; fallback to DB only. reason=%s", exc)

    def stop(self) -> None:
        if self._client:
            self._client.close()
            self._client = None

    def get_availability(self, parking_lot_id: str) -> dict[str, int | str] | None:
        if not self._client:
            return None
        raw = self._client.get(self._key(parking_lot_id))
        if not raw:
            return None
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            return None
        return payload if isinstance(payload, dict) else None

    def set_availability(self, parking_lot_id: str, payload: dict[str, int | str], ttl_seconds: int = 20) -> None:
        if not self._client:
            return
        self._client.setex(self._key(parking_lot_id), ttl_seconds, json.dumps(payload))

    def invalidate(self, parking_lot_id: str) -> None:
        if not self._client:
            return
        self._client.delete(self._key(parking_lot_id))

    @staticmethod
    def _key(parking_lot_id: str) -> str:
        return f"lot:{parking_lot_id}:availability"
