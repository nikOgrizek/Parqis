from pydantic import BaseModel


class ParkingLotResponse(BaseModel):
    id: str
    name: str
    location: str

    model_config = {"from_attributes": True}
