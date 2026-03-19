import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.INTEGRATIONS.cache import OccupancyCache
from app.INTEGRATIONS.grpc_server import create_grpc_server, stop_server
from app.INTEGRATIONS.kafka import KafkaEventBus
from app.OCCUPANCY.service import OccupancyService
from app.PARKING_LOTS.api import router as parking_lots_router
from app.PARKING_LOTS.models import ParkingLot
from app.PARKING_LOTS.repository import ParkingLotRepository
from app.PLATFORM.config import settings
from app.PLATFORM.database import Base, SessionLocal, engine
from app.PLATFORM.logging import configure_logging
from app.SPOT_ALLOCATION.api import router as spot_allocation_router
from app.SPOT_ALLOCATION.models import ParkingSpot
from app.SPOT_ALLOCATION.repository import SpotRepository
from app.SPOT_ALLOCATION.service import SpotService

LOGGER = logging.getLogger(__name__)


def initialize_database() -> None:
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        lot_repository = ParkingLotRepository(db)
        if lot_repository.list_all():
            return

        lot_repository.create(ParkingLot(id="lot-1", name="Center Garage", location="Maribor Center"))
        lot_repository.create(ParkingLot(id="lot-2", name="Train Station", location="Maribor Station"))

        spots = [
            ParkingSpot(id="spot-101", parking_lot_id="lot-1", label="A1", spot_type="standard"),
            ParkingSpot(id="spot-102", parking_lot_id="lot-1", label="A2", spot_type="standard"),
            ParkingSpot(id="spot-103", parking_lot_id="lot-1", label="A3", spot_type="ev"),
            ParkingSpot(id="spot-201", parking_lot_id="lot-2", label="B1", spot_type="standard"),
            ParkingSpot(id="spot-202", parking_lot_id="lot-2", label="B2", spot_type="disabled"),
        ]
        db.add_all(spots)
        db.commit()
        LOGGER.info("Seeded default parking lot data")


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    initialize_database()

    event_bus = KafkaEventBus()
    cache = OccupancyCache()
    cache.start()

    async def handle_reservation_event(event: dict) -> None:
        event_type = event.get("eventType")
        payload = event.get("payload", {})
        parking_lot_id = str(payload.get("parkingLotId", ""))
        spot_id = str(payload.get("spotId", ""))

        with SessionLocal() as db:
            service = SpotService(
                spot_repository=SpotRepository(db),
                occupancy_service=OccupancyService(),
                event_bus=event_bus,
                cache=cache,
            )
            if event_type == "reservation.created" and parking_lot_id:
                await service.reserve_first_available(parking_lot_id)
            elif event_type in {"reservation.cancelled", "reservation.completed"} and spot_id:
                await service.release(spot_id)

    await event_bus.start(handle_reservation_event)

    grpc_server = create_grpc_server(session_factory=SessionLocal, event_bus=event_bus, cache=cache)
    grpc_server.add_insecure_port(f"{settings.grpc_host}:{settings.grpc_port}")
    await grpc_server.start()

    app.state.event_bus = event_bus
    app.state.grpc_server = grpc_server
    app.state.cache = cache

    LOGGER.info("MS2 started. rest_port=%s grpc_port=%s", settings.app_port, settings.grpc_port)
    try:
        yield
    finally:
        await stop_server(app.state.grpc_server)
        await app.state.event_bus.stop()
        app.state.cache.stop()


app = FastAPI(title="Parqis MS2 - Parking Spots", version="1.0.0", lifespan=lifespan)
app.include_router(parking_lots_router)
app.include_router(spot_allocation_router)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": settings.app_name}
