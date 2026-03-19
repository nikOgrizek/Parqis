from pydantic import BaseModel


class SpotResponse(BaseModel):
    id: str
    parking_lot_id: str
    label: str
    spot_type: str
    is_reserved: bool
    is_occupied: bool

    model_config = {"from_attributes": True}


class SpotActionResponse(BaseModel):
    spot_id: str
    status: str
    message: str
