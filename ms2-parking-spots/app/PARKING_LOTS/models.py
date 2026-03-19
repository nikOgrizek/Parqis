from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.PLATFORM.database import Base


class ParkingLot(Base):
    __tablename__ = "parking_lots"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    location: Mapped[str] = mapped_column(String(256), nullable=False)

    spots = relationship("ParkingSpot", back_populates="parking_lot", cascade="all,delete-orphan")
