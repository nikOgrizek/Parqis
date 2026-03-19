import json
import logging
from datetime import datetime, timezone

from app.PLATFORM.config import settings


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "service": settings.app_name,
            "message": record.getMessage(),
            "logger": record.name,
        }
        return json.dumps(payload)


def configure_logging() -> None:
    root = logging.getLogger()
    root.setLevel(settings.log_level.upper())

    for handler in list(root.handlers):
        root.removeHandler(handler)

    stream_handler = logging.StreamHandler()
    stream_handler.setFormatter(JsonFormatter())
    root.addHandler(stream_handler)
