from sqlalchemy import select
from sqlalchemy.orm import Session

from app.SPOT_ALLOCATION.models import ParkingSpot


class SpotRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_by_lot(self, parking_lot_id: str) -> list[ParkingSpot]:
        stmt = select(ParkingSpot).where(ParkingSpot.parking_lot_id == parking_lot_id).order_by(ParkingSpot.label)
        return list(self.db.scalars(stmt))

    def get_by_id(self, spot_id: str) -> ParkingSpot | None:
        stmt = select(ParkingSpot).where(ParkingSpot.id == spot_id)
        return self.db.scalar(stmt)

    def list_all(self) -> list[ParkingSpot]:
        stmt = select(ParkingSpot).order_by(ParkingSpot.parking_lot_id, ParkingSpot.label)
        return list(self.db.scalars(stmt))

    def first_available_for_lot(self, parking_lot_id: str) -> ParkingSpot | None:
        stmt = (
            select(ParkingSpot)
            .where(ParkingSpot.parking_lot_id == parking_lot_id)
            .where(ParkingSpot.is_reserved.is_(False))
            .where(ParkingSpot.is_occupied.is_(False))
            .order_by(ParkingSpot.label)
            .limit(1)
        )
        return self.db.scalar(stmt)
