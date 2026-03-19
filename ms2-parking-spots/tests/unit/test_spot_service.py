from collections.abc import Generator

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.OCCUPANCY.service import OccupancyService
from app.PARKING_LOTS.models import ParkingLot
from app.PLATFORM.database import Base
from app.SPOT_ALLOCATION.models import ParkingSpot
from app.SPOT_ALLOCATION.repository import SpotRepository
from app.SPOT_ALLOCATION.service import SpotService


class FakeEventBus:
    def __init__(self) -> None:
        self.events: list[tuple[str, str]] = []

    async def publish_spot_changed(self, event) -> None:
        self.events.append((event.event_type, event.spot_id))


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    engine = create_engine("sqlite+pysqlite:///:memory:", future=True)
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)
    Base.metadata.create_all(bind=engine)

    with TestingSessionLocal() as db:
        db.add(ParkingLot(id="lot-1", name="Test Lot", location="Test"))
        db.add(ParkingSpot(id="spot-1", parking_lot_id="lot-1", label="A1", spot_type="standard"))
        db.add(ParkingSpot(id="spot-2", parking_lot_id="lot-1", label="A2", spot_type="standard"))
        db.commit()
        yield db


def test_availability_counts(db_session: Session) -> None:
    service = SpotService(SpotRepository(db_session), OccupancyService())

    result = service.get_availability("lot-1")

    assert result.total_spots == 2
    assert result.available_spots == 2
    assert result.occupied_spots == 0


@pytest.mark.asyncio
async def test_reserve_first_available_publishes_event(db_session: Session) -> None:
    event_bus = FakeEventBus()
    service = SpotService(SpotRepository(db_session), OccupancyService(), event_bus=event_bus)

    result = await service.reserve_first_available("lot-1")

    assert result is not None
    assert result.status == "reserved"
    assert event_bus.events == [("spot.reserved", result.spot_id)]


@pytest.mark.asyncio
async def test_release_after_occupy(db_session: Session) -> None:
    event_bus = FakeEventBus()
    service = SpotService(SpotRepository(db_session), OccupancyService(), event_bus=event_bus)

    occupy_result = await service.occupy("spot-1")
    release_result = await service.release("spot-1")

    assert occupy_result.status == "occupied"
    assert release_result.status == "free"
    assert ("spot.occupied", "spot-1") in event_bus.events
    assert ("spot.released", "spot-1") in event_bus.events
