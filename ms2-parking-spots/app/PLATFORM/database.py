from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.PLATFORM.config import settings


class Base(DeclarativeBase):
    pass


def _normalize_database_url(database_url: str) -> str:
    # SQLAlchemy defaults to psycopg2 for postgresql://, but this project ships psycopg (v3).
    if database_url.startswith("postgresql://"):
        return database_url.replace("postgresql://", "postgresql+psycopg://", 1)
    return database_url


engine = create_engine(_normalize_database_url(settings.database_url), future=True, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False, class_=Session)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
