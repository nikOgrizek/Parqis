# MS2 - Parking Spots Service (FastAPI)

MS2 manages parking lot inventory, spot allocation, occupancy, and integrations (Kafka + gRPC).

## Screaming Architecture

The structure is organized by business domains, not technical layers:

- `app/PARKING_LOTS` - parking lot domain
- `app/SPOT_ALLOCATION` - reserve/occupy/release workflows
- `app/OCCUPANCY` - occupancy calculations
- `app/INTEGRATIONS` - Kafka and gRPC integration
- `app/PLATFORM` - shared platform concerns (config, DB, security, logging)

## REST API

- `GET /api/parking-lots`
- `GET /api/parking-lots/{id}/spots`
- `GET /api/parking-lots/{id}/availability`
- `POST /api/spots/{id}/occupy` (X-API-Key)
- `POST /api/spots/{id}/release` (X-API-Key)
- `GET /api/stats/occupancy` (X-API-Key)
- `GET /api/health`

## gRPC

Service: `parqis.ms2.ParkingSpotService`

- `CheckAvailability`
- `ReserveSpot`
- `ReleaseSpot`

Proto contract: `app/INTEGRATIONS/proto/parking_spots.proto`

Generated protobuf/gRPC stubs are in `app/INTEGRATIONS/proto_generated` and are used directly by the runtime server implementation.

## Kafka Event Messaging

- Consumer topic: `reservations`
  - `reservation.created` -> reserves the first available spot
  - `reservation.cancelled`, `reservation.completed` -> releases a spot when `spotId` is provided
- Producer topic: `spot-updates`
  - `spot.reserved`, `spot.occupied`, `spot.released`

## Local Run

```bash
python -m venv .venv
# Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Tests

```bash
pytest
```

## Docker

```bash
docker build -t parqis-ms2 .
docker run -p 8000:8000 -p 50051:50051 parqis-ms2
```
