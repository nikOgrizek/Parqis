from dataclasses import dataclass

from app.SPOT_ALLOCATION.models import ParkingSpot


@dataclass
class AvailabilityResult:
    parking_lot_id: str
    total_spots: int
    available_spots: int
    occupied_spots: int
    reserved_spots: int


class OccupancyService:
    def calculate(self, parking_lot_id: str, spots: list[ParkingSpot]) -> AvailabilityResult:
        total = len(spots)
        occupied = len([spot for spot in spots if spot.is_occupied])
        reserved = len([spot for spot in spots if spot.is_reserved and not spot.is_occupied])
        available = total - occupied - reserved

        return AvailabilityResult(
            parking_lot_id=parking_lot_id,
            total_spots=total,
            available_spots=available,
            occupied_spots=occupied,
            reserved_spots=reserved,
        )
