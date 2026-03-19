from app.PARKING_LOTS.repository import ParkingLotRepository
from app.PARKING_LOTS.schemas import ParkingLotResponse


class ParkingLotService:
    def __init__(self, parking_lot_repository: ParkingLotRepository) -> None:
        self.parking_lot_repository = parking_lot_repository

    def list_lots(self) -> list[ParkingLotResponse]:
        lots = self.parking_lot_repository.list_all()
        return [ParkingLotResponse.model_validate(lot) for lot in lots]
