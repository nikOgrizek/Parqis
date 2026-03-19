from sqlalchemy import select
from sqlalchemy.orm import Session

from app.PARKING_LOTS.models import ParkingLot


class ParkingLotRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_all(self) -> list[ParkingLot]:
        stmt = select(ParkingLot).order_by(ParkingLot.id)
        return list(self.db.scalars(stmt))

    def get_by_id(self, parking_lot_id: str) -> ParkingLot | None:
        stmt = select(ParkingLot).where(ParkingLot.id == parking_lot_id)
        return self.db.scalar(stmt)

    def create(self, parking_lot: ParkingLot) -> ParkingLot:
        self.db.add(parking_lot)
        self.db.flush()
        return parking_lot
