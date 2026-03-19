from fastapi import APIRouter, Depends, Request

from app.OCCUPANCY.service import OccupancyService
from app.PARKING_LOTS.repository import ParkingLotRepository
from app.PLATFORM.database import get_db
from app.PLATFORM.security import require_api_key
from app.SPOT_ALLOCATION.repository import SpotRepository
from app.SPOT_ALLOCATION.schemas import SpotActionResponse
from app.SPOT_ALLOCATION.service import SpotService

router = APIRouter(prefix="/api", tags=["spot-allocation"])


def _build_service(request: Request, db=Depends(get_db)) -> SpotService:
    event_bus = getattr(request.app.state, "event_bus", None)
    cache = getattr(request.app.state, "cache", None)
    return SpotService(spot_repository=SpotRepository(db), occupancy_service=OccupancyService(), event_bus=event_bus, cache=cache)


@router.post("/spots/{spot_id}/occupy", response_model=SpotActionResponse, dependencies=[Depends(require_api_key)])
async def occupy_spot(spot_id: str, service: SpotService = Depends(_build_service)) -> SpotActionResponse:
    return await service.occupy(spot_id)


@router.post("/spots/{spot_id}/release", response_model=SpotActionResponse, dependencies=[Depends(require_api_key)])
async def release_spot(spot_id: str, service: SpotService = Depends(_build_service)) -> SpotActionResponse:
    return await service.release(spot_id)


@router.get("/stats/occupancy", dependencies=[Depends(require_api_key)])
def occupancy_stats(service: SpotService = Depends(_build_service)) -> dict[str, object]:
    parking_lots = ParkingLotRepository(service.spot_repository.db).list_all()
    data: list[dict[str, int | str]] = []

    for lot in parking_lots:
        availability = service.get_availability(lot.id)
        data.append(
            {
                "parking_lot_id": lot.id,
                "parking_lot_name": lot.name,
                "total_spots": availability.total_spots,
                "available_spots": availability.available_spots,
                "occupied_spots": availability.occupied_spots,
                "reserved_spots": availability.reserved_spots,
            }
        )

    return {"items": data, "count": len(data)}
