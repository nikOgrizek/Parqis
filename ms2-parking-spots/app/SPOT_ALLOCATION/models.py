from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.PLATFORM.database import Base


class ParkingSpot(Base):
    __tablename__ = "parking_spots"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    parking_lot_id: Mapped[str] = mapped_column(ForeignKey("parking_lots.id", ondelete="CASCADE"), nullable=False)
    label: Mapped[str] = mapped_column(String(32), nullable=False)
    spot_type: Mapped[str] = mapped_column(String(32), default="standard", nullable=False)
    is_reserved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_occupied: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    parking_lot = relationship("ParkingLot", back_populates="spots")
