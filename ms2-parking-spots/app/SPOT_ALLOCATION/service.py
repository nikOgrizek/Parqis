from fastapi import HTTPException, status

from app.INTEGRATIONS.cache import OccupancyCache
from app.INTEGRATIONS.contracts import EventBus, SpotChangedEvent
from app.OCCUPANCY.service import AvailabilityResult, OccupancyService
from app.SPOT_ALLOCATION.repository import SpotRepository
from app.SPOT_ALLOCATION.schemas import SpotActionResponse, SpotResponse


class SpotService:
    def __init__(
        self,
        spot_repository: SpotRepository,
        occupancy_service: OccupancyService,
        event_bus: EventBus | None = None,
        cache: OccupancyCache | None = None,
    ) -> None:
        self.spot_repository = spot_repository
        self.occupancy_service = occupancy_service
        self.event_bus = event_bus
        self.cache = cache

    def list_spots_for_lot(self, parking_lot_id: str) -> list[SpotResponse]:
        spots = self.spot_repository.list_by_lot(parking_lot_id)
        return [SpotResponse.model_validate(spot) for spot in spots]

    def get_availability(self, parking_lot_id: str) -> AvailabilityResult:
        if self.cache:
            cached = self.cache.get_availability(parking_lot_id)
            if cached:
                return AvailabilityResult(
                    parking_lot_id=str(cached["parking_lot_id"]),
                    total_spots=int(cached["total_spots"]),
                    available_spots=int(cached["available_spots"]),
                    occupied_spots=int(cached["occupied_spots"]),
                    reserved_spots=int(cached["reserved_spots"]),
                )

        spots = self.spot_repository.list_by_lot(parking_lot_id)
        result = self.occupancy_service.calculate(parking_lot_id, spots)
        if self.cache:
            self.cache.set_availability(
                parking_lot_id,
                {
                    "parking_lot_id": result.parking_lot_id,
                    "total_spots": result.total_spots,
                    "available_spots": result.available_spots,
                    "occupied_spots": result.occupied_spots,
                    "reserved_spots": result.reserved_spots,
                },
            )
        return result

    async def occupy(self, spot_id: str) -> SpotActionResponse:
        spot = self.spot_repository.get_by_id(spot_id)
        if not spot:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Spot not found")
        if spot.is_occupied:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Spot already occupied")

        spot.is_reserved = False
        spot.is_occupied = True
        self.spot_repository.db.commit()
        if self.cache:
            self.cache.invalidate(spot.parking_lot_id)

        await self._publish_event("spot.occupied", spot.id, spot.parking_lot_id, "occupied")
        return SpotActionResponse(spot_id=spot.id, status="occupied", message="Spot marked as occupied")

    async def release(self, spot_id: str) -> SpotActionResponse:
        spot = self.spot_repository.get_by_id(spot_id)
        if not spot:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Spot not found")
        if not (spot.is_occupied or spot.is_reserved):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Spot already free")

        spot.is_reserved = False
        spot.is_occupied = False
        self.spot_repository.db.commit()
        if self.cache:
            self.cache.invalidate(spot.parking_lot_id)

        await self._publish_event("spot.released", spot.id, spot.parking_lot_id, "free")
        return SpotActionResponse(spot_id=spot.id, status="free", message="Spot released")

    async def reserve_first_available(self, parking_lot_id: str) -> SpotActionResponse | None:
        spot = self.spot_repository.first_available_for_lot(parking_lot_id)
        if not spot:
            return None

        spot.is_reserved = True
        self.spot_repository.db.commit()
        if self.cache:
            self.cache.invalidate(spot.parking_lot_id)
        await self._publish_event("spot.reserved", spot.id, spot.parking_lot_id, "reserved")
        return SpotActionResponse(spot_id=spot.id, status="reserved", message="Spot reserved")

    async def _publish_event(self, event_type: str, spot_id: str, parking_lot_id: str, status_value: str) -> None:
        if not self.event_bus:
            return
        await self.event_bus.publish_spot_changed(
            SpotChangedEvent(
                event_type=event_type,
                spot_id=spot_id,
                parking_lot_id=parking_lot_id,
                status=status_value,
            )
        )
