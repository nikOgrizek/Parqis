import logging
from collections.abc import Callable

import grpc
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.INTEGRATIONS.cache import OccupancyCache
from app.INTEGRATIONS.contracts import EventBus
from app.INTEGRATIONS.proto_generated import parking_spots_pb2, parking_spots_pb2_grpc
from app.OCCUPANCY.service import OccupancyService
from app.SPOT_ALLOCATION.repository import SpotRepository
from app.SPOT_ALLOCATION.service import SpotService

LOGGER = logging.getLogger(__name__)


class ParkingSpotGrpcServicer(parking_spots_pb2_grpc.ParkingSpotServiceServicer):
    def __init__(
        self,
        session_factory: Callable[[], Session],
        event_bus: EventBus | None,
        cache: OccupancyCache | None,
    ) -> None:
        self.session_factory = session_factory
        self.event_bus = event_bus
        self.cache = cache

    async def CheckAvailability(self, request, context):
        parking_lot_id = request.parking_lot_id
        with self.session_factory() as db:
            service = SpotService(
                spot_repository=SpotRepository(db),
                occupancy_service=OccupancyService(),
                event_bus=self.event_bus,
                cache=self.cache,
            )
            availability = service.get_availability(parking_lot_id)
            return parking_spots_pb2.AvailabilityResponse(
                parking_lot_id=parking_lot_id,
                total_spots=availability.total_spots,
                available_spots=availability.available_spots,
                has_availability=availability.available_spots > 0,
            )

    async def ReserveSpot(self, request, context):
        parking_lot_id = request.parking_lot_id
        with self.session_factory() as db:
            service = SpotService(
                spot_repository=SpotRepository(db),
                occupancy_service=OccupancyService(),
                event_bus=self.event_bus,
                cache=self.cache,
            )
            result = await service.reserve_first_available(parking_lot_id)
            if not result:
                return parking_spots_pb2.ReserveSpotResponse(success=False, spot_id="", message="No available spots")
            return parking_spots_pb2.ReserveSpotResponse(success=True, spot_id=result.spot_id, message=result.message)

    async def ReleaseSpot(self, request, context):
        with self.session_factory() as db:
            service = SpotService(
                spot_repository=SpotRepository(db),
                occupancy_service=OccupancyService(),
                event_bus=self.event_bus,
                cache=self.cache,
            )
            try:
                result = await service.release(request.spot_id)
            except HTTPException as exc:
                context.set_details(exc.detail)
                context.set_code(grpc.StatusCode.NOT_FOUND if exc.status_code == 404 else grpc.StatusCode.FAILED_PRECONDITION)
                return parking_spots_pb2.ReleaseSpotResponse(success=False, spot_id="", message=exc.detail)

            return parking_spots_pb2.ReleaseSpotResponse(success=True, spot_id=result.spot_id, message=result.message)


def create_grpc_server(
    session_factory: Callable[[], Session],
    event_bus: EventBus | None,
    cache: OccupancyCache | None,
) -> grpc.aio.Server:
    server = grpc.aio.server()
    parking_spots_pb2_grpc.add_ParkingSpotServiceServicer_to_server(
        ParkingSpotGrpcServicer(session_factory=session_factory, event_bus=event_bus, cache=cache),
        server,
    )
    return server


async def stop_server(server: grpc.aio.Server) -> None:
    await server.stop(grace=5)
    LOGGER.info("gRPC server stopped")
