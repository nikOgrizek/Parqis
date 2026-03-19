from fastapi import APIRouter, Depends

from app.dependencies import get_parking_lot_service, get_spot_service
from app.PARKING_LOTS.schemas import ParkingLotResponse
from app.PARKING_LOTS.service import ParkingLotService
from app.SPOT_ALLOCATION.schemas import SpotResponse
from app.SPOT_ALLOCATION.service import SpotService

router = APIRouter(prefix="/api/parking-lots", tags=["parking-lots"])


@router.get("", response_model=list[ParkingLotResponse])
def list_parking_lots(service: ParkingLotService = Depends(get_parking_lot_service)) -> list[ParkingLotResponse]:
    return service.list_lots()


@router.get("/{parking_lot_id}/spots", response_model=list[SpotResponse])
def list_spots(parking_lot_id: str, service: SpotService = Depends(get_spot_service)) -> list[SpotResponse]:
    return service.list_spots_for_lot(parking_lot_id)


@router.get("/{parking_lot_id}/availability")
def get_availability(parking_lot_id: str, service: SpotService = Depends(get_spot_service)) -> dict[str, int | str]:
    result = service.get_availability(parking_lot_id)
    return {
        "parking_lot_id": result.parking_lot_id,
        "total_spots": result.total_spots,
        "available_spots": result.available_spots,
        "occupied_spots": result.occupied_spots,
        "reserved_spots": result.reserved_spots,
    }
