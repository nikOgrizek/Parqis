from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "ms2-parking-spots"
    app_env: str = "development"
    app_port: int = 8000
    grpc_host: str = "0.0.0.0"
    grpc_port: int = 50051

    database_url: str = "sqlite:///./ms2.db"
    redis_url: str = "redis://localhost:6379/0"
    api_key: str = "ms2-internal-api-key-change-me"

    kafka_bootstrap_servers: str = "localhost:9092"
    kafka_client_id: str = "ms2-parking-spots"
    kafka_group_id: str = "ms2-parking-spots-group"
    kafka_reservations_topic: str = "reservations"
    kafka_spot_updates_topic: str = "spot-updates"

    log_level: str = "INFO"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)


settings = Settings()
