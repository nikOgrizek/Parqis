from dataclasses import dataclass
from typing import Protocol


@dataclass
class SpotChangedEvent:
    event_type: str
    spot_id: str
    parking_lot_id: str
    status: str


class EventBus(Protocol):
    async def publish_spot_changed(self, event: SpotChangedEvent) -> None:
        ...
