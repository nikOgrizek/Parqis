from fastapi import Depends
from sqlalchemy.orm import Session

from app.OCCUPANCY.service import OccupancyService
from app.PARKING_LOTS.repository import ParkingLotRepository
from app.PARKING_LOTS.service import ParkingLotService
from app.PLATFORM.database import get_db
from app.SPOT_ALLOCATION.repository import SpotRepository
from app.SPOT_ALLOCATION.service import SpotService


def get_parking_lot_service(db: Session = Depends(get_db)) -> ParkingLotService:
    return ParkingLotService(parking_lot_repository=ParkingLotRepository(db))


def get_spot_service(db: Session = Depends(get_db)) -> SpotService:
    return SpotService(spot_repository=SpotRepository(db), occupancy_service=OccupancyService(), cache=None)
