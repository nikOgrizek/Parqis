# MS3 - Validation Service (Spring Boot)

MS3 validates entry/exit requests and integrates with MS2 through gRPC and with the platform through Kafka events.

## Screaming Architecture

The service is organized by business capabilities:

- `VALIDATION` - API, application logic, persistence for validation and violations
- `INTEGRATIONS` - gRPC client and Kafka messaging
- `PLATFORM` - shared config and API key security

## REST Endpoints

- `POST /api/validate/entry` (X-API-Key)
- `POST /api/validate/exit` (X-API-Key)
- `GET /api/validations/{id}` (X-API-Key)
- `GET /api/violations` (X-API-Key)
- `GET /actuator/health` (public)

## gRPC and Event Messaging

- gRPC client to MS2: `CheckAvailability`
- Kafka producer topic: `parking-events`
- Kafka consumer topic: `reservations` (logs inbound reservation events)

## Local Run

```bash
mvn spring-boot:run
```

## Tests

```bash
mvn test
```

## Docker

```bash
docker build -t parqis-ms3-validation .
```
