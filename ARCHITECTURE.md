# Parqis - Načrt mikrostoritvene arhitekture

## 📋 Pregled sistema

Sistem Parqis je razdeljen na **3 mikrostoritve** in **spletni vmesnik**, pri čemer vsaka mikrostoritev uporablja različen tehnološki sklad in različne komunikacijske protokole.

---

## 🏗️ Arhitekturne komponente

### **MS1 - Rezervacijski servis** (Node.js/Express + TypeScript)

**Tehnološki sklad:**
- Framework: **Express.js** z TypeScript
- ORM: **Prisma**
- Baza podatkov: **PostgreSQL**
- Event Publishing: **Kafka Producer**

**Odgovornosti:**
- Upravljanje uporabniških rezervacij (ustvarjanje, urejanje, podaljševanje, preklic)
- Preverjanje razpoložljivosti parkirnih mest
- Izračun stroškov in časa parkiranja
- Zgodovina rezervacij uporabnika
- Upravljanje uporabniških računov
- **Avtentikacija in avtorizacija uporabnikov (JWT)**
- **Validacija vhodnih podatkov**

**Izpostavljeni API-ji:**
- **REST API** (port 3000):
  - `POST /api/auth/register` - registracija uporabnika
  - `POST /api/auth/login` - prijava (vrne JWT token)
  - `POST /api/auth/refresh` - osveži JWT token
  - `POST /api/reservations` - ustvari novo rezervacijo 🔒
  - `GET /api/reservations/:id` - pridobi rezervacijo 🔒
  - `PUT /api/reservations/:id/extend` - podaljšaj rezervacijo 🔒
  - `DELETE /api/reservations/:id` - prekliči rezervacijo 🔒
  - `GET /api/reservations/user/:userId` - zgodovina uporabnika 🔒
  - `GET /api/reservations/plate/:plateNumber` - preveri aktivno rezervacijo (internal/API key)
  - `POST /api/reservations/:id/complete` - zaključi parkiranje 🔒
  
  🔒 = Zahteva JWT token v Authorization header

**Objavljeni eventi (Kafka):**
- `reservation.created` - nova rezervacija ustvarjena
- `reservation.extended` - rezervacija podaljšana
- `reservation.cancelled` - rezervacija preklicana
- `reservation.completed` - parkiranje zaključeno

**Poslušani eventi:**
- `parking.started` - vozilo je vstopilo (MS3)
- `parking.violation` - odkrita kršitev (MS3)

**Varnost:**
- JWT avtentikacija (access token + refresh token)
- Bcrypt za hash gesel
- Rate limiting (express-rate-limit)
- Helmet.js za HTTP security headers
- CORS politika
- Input validacija (Joi/Zod)

**Logiranje:**
- Winston logger (JSON format)
- Log levels: error, warn, info, debug
- Request/Response logging (morgan middleware)
- Structured logs za Elasticsearch

**Testiranje:**
- Unit testi (Jest) - servisi, repozitoriji, utility funkcije
- Integration testi (Supertest) - API endpoints
- **API key avtentikacija za internal klice**

**Izpostavljeni API-ji:**
- **REST API** (port 8000):
  - `GET /api/parking-lots` - seznam parkirišč (public)
  - `GET /api/parking-lots/:id/spots` - mesta na parkirišču (public)
  - `GET /api/parking-lots/:id/availability` - trenutna zasedenost (public)
  - `POST /api/spots/:id/occupy` - označi mesto kot zasedeno 🔑
  - `POST /api/spots/:id/release` - sprosti mesto 🔑
  - `GET /api/stats/occupancy` - statistika zasedenosti 🔑
  
  🔑 = Zahteva API key (X-API-Key header)
  
- **gRPC API** (port 50051):
  - `CheckAvailability` - preveri razpoložljivost
  - `ReserveSpot` - rezerviraj mesto
  - `ReleaseSpot` - sprosti mesto
---

### **MS2 - Upravljanje parkirnih mest** (Python/FastAPI)

**Tehnološki sklad:**
- Framework: **FastAPI**
- ORM: **SQLAlchemy**
- Baza podatkov: **PostgreSQL**
- Cache: **Redis** (za real-time zasedenost)
- Event Messaging: **Kafka Consumer/Producer**

**Odgovornosti:**
- Upravljanje inventarja parkirnih mest (mesta, lokacije, značilnosti)
- Real-time spremljanje zasedenosti
- Dodeljevanje mest ob rezervaciji
- Sproščanje mest po izteku
- Statistika in poročila o uporabi

**Izpostavljeni API-ji:**
- **REST API** (port 8000):
  - `GET /api/parking-lots` - seznam parkirišč
  - `GET /api/parking-lots/:id/spots` - mesta na parkirišču
  - `GET /api/parking-lots/:id/availability` - trenutna zasedenost
  - `POST /api/spots/:id/occupy` - označi mesto kot zasedeno
  - `POST /api/spots/:id/release` - sprosti mesto
  - `GET /api/stats/occupancy` - statistika zasedenosti

**Objavljeni eventi (Kafka):**
- `spot.reserved` - mesto rezervirano
- `spot.occupied` - vozilo je zasedlo mesto

**Varnost:**
- API key avtentikacija za internal endpoints
- Rate limiting
- CORS konfiguracija
- Pydantic modeli za input validacijo

**Logiranje:**
- Python logging modul (JSON formatter)
- Uvicorn access logs
- Structured logging za analitiko

**Testiranje:**
- Pytest - unit testi
- Pytest-asyncio - async testi
- Httpx za integration teste
- Mock Redis in Kafka
- Test coverage > 80%

**OpenAPI:**
- FastAPI avtomatsko generira OpenAPI 3.0
- Swagger UI na `/docs`
- ReDoc na `/redoc`
- `spot.released` - mesto sproščeno
- `spot.availability.changed` - sprememba razpoložljivosti

**Poslušani eventi:**
- `reservation.created` - rezervira mesto (MS1)
- **API key avtentikacija za simulator**

**Izpostavljeni API-ji:**
- **REST API** (port 8080):
  - `POST /api/validate/entry` - validacija vstopa (prima sliko) 🔑
  - `POST /api/validate/exit` - validacija izstopa (prima sliko) 🔑
  - `GET /api/validations/{id}` - podrobnosti validacije 🔑
  - `GET /api/violations` - seznam kršitev 🔑
  - `GET /actuator/health` - health check (public)
  
  🔑 = Zahteva API key (X-API-Key header)** (Java/Spring Boot)

**Tehnološki sklad:**
- Framework: **Spring Boot 3.x**
- gRPC: **Spring Boot gRPC Starter**
- Baza podatkov: **PostgreSQL** (log validacij)
- Event Messaging: **Spring Kafka**
- Image Processing: **OpenCV/Tesseract** (za simulacijo OCR)

**Odgovornosti:**
- Prejem slik registrskih tablic (iz simulatorja)
- OCR prepoznavanje registrskih številk
- Validacija aktivnih rezervacij (klic MS1)

**Varnost:**
- API key avtentikacija (Spring Security)
- JWT validacija za admin endpoints
- CORS konfiguracija
- Bean Validation za input
- Security headers

**Logiranje:**
- SLF4J + Logback
- JSON structured logging
- MDC (Mapped Diagnostic Context) za trace IDs
- Separate loggers za OCR, validation, events

**Testiranje:**
- JUnit 5 - unit testi
- Mockito - mocking
- Spring Boot Test - integration testi
- TestContainers - PostgreSQL in Kafka za integration teste
- RestAssured za REST API teste
- Test coverage > 80%

**OpenAPI:**
- SpringDoc OpenAPI (Swagger UI)
- Endpoint: `/swagger-ui.html`
- OpenAPI spec: `/v3/api-docs`
- Preverjanje razpoložljivosti mest (klic MS2)
- Nadzor vstopa/izstopa (odpiranje zapornic)
- Odkrivanje kršitev
- Evidentiranje dogodkov (vstopi, izstopi, kršitve)

**Izpostavljeni API-ji:**
- **REST API** (port 8080):
  - `POST /api/validate/entry` - validacija vstopa (prima sliko)
  - `POST /api/validate/exit` - validacija izstopa (prima sliko)
  - `GET /api/validations/:id` - podrobnosti validacije
  - `GET /api/violations` - seznam kršitev
  
- **gRPC Service** (port 9090):
  - `ValidateReservation(plateNumber, parkingLotId, timestamp)` - hitra validacija rezervacije
  - `CheckExitWindow(plateNumber, timestamp)` - preveri izhodno okno
  - Uporablja **protobuf** za hitro, binarno komunikacijo

**Objavljeni eventi (Kafka):**
- `parking.started` - vozilo vstopilo
- `parking.completed` - vozilo izstopilo
- `parking.violation` - odkrita kršitev
- `validation.success` - uspešna validacija
- `validation.failed` - neuspešna validacija

**Klici drugih servisov:**
- **REST → MS1**: `GET /api/reservations/plate/:plateNumber` - preveri aktivno rezervacijo
- **gRPC → MS2**: preverjanje razpoložljivosti mest (hitrejše od REST)

---

### **Spletni vmesnik** (React/Next.js)

**Tehnološki sklad:**
- Framework: **Next.js 14** (React)
- State Management: **Zustand** ali **Redux Toolkit**
- UI komponente: **Tailwind CSS + shadcn/ui**
- Real-time: **WebSocket** (Socket.io client)

**Funkcionalnosti:**
- Pregled razpoložljivih parkirišč in mest
- Ustvarjanje novih rezervacij
- Upravljanje aktivnih rezervacij
- Podaljševanje in preklic rezervacij
- Real-time prikaz zasedenosti
- Plačilni vmesnik
- Zgodovina parkiranj
- Dashboard za upravljavce (zasedenost, statistika)

**Komunikacija:**
- **REST API klici** → MS1 (rezervacije)
- **WebSocket/SSE** → Event Gateway (real-time posodobitve)

---

## 🔄 Komunikacijski vzorci

### 1. **REST API** (Sinhron)
**Uporaba:**
- Spletni vmesnik → MS1 (CRUD operacije za rezervacije)
- MS3 → MS1 (preveri aktivno rezervacijo)
- Simulator → MS3 (pošlji sliko registrske tablice)
- Admin dashboard → MS2 (statistika)

**Prednosti:**
- Enostaven za uporabo
- Dober za query operacije
- Standardiziran (OpenAPI/Swagger)

---

### 2. **gRPC** (Sinhron, nizka latenca)
**Uporaba:**
- MS3 → MS2 (hitro preverjanje razpoložljivosti med validacijo)
- Kritične validacije v realnem času

**Prednosti:**
- Nizka latenca (binarni protokol)
- Type-safe (protobuf)
- Dvosmernega streaming (če potrebno)

**Primer protobuf definicije:**
```protobuf
service ParkingSpotService {
  rpc CheckAvailability(AvailabilityRequest) returns (AvailabilityResponse);
  rpc ReserveSpot(ReserveRequest) returns (ReserveResponse);
}

message AvailabilityRequest {
  string parking_lot_id = 1;
  string spot_type = 2;
}
```

---

### 3. **Event-Driven Architecture** (Asinhron)
**Message Broker:** **Apache Kafka**

**Uporaba:**
- Propagacija stanja med mikrostoritvami
- Razklopitev odvisnosti
- Eventually consistent podatki
- Real-time posodobitve za uporabnike

**Kafka Topics:**
- `reservations` - dogodki rezervacij (MS1 → MS2)
- `parking-events` - vstopi/izstopi (MS3 → MS1, MS2)
- `violations` - kršitve (MS3 → notification service)
- `spot-updates` - spremembe mest (MS2 → web UI)

**Event schema (JSON):**
```json
{
  "eventType": "reservation.created",
  "timestamp": "2026-03-10T14:30:00Z",
  "payload": {
    "reservationId": "uuid",
    "userId": "uuid",
    "plateNumber": "LJ-XY-123",
    "parkingLotId": "uuid",
    "spotId": "uuid",
    "startTime": "2026-03-10T15:00:00Z",
    "endTime": "2026-03-10T17:00:00Z"
  }
}
```

---

### 4. **WebSocket / Server-Sent Events**
**Uporaba:**
- Real-time posodobitve v spletnem vmesniku
- Event Gateway servis (Node.js) posluša Kafka in pošilja updates v browser

---

## 🔁 Tipični podatkovni tokovi

### **Tok 1: Ustvarjanje rezervacije**
```
1. Uporabnik (Web UI) → REST → MS1: POST /api/reservations
2. MS1 preveri razpoložljivost → REST → MS2: GET /api/parking-lots/:id/availability
3. MS1 ustvari rezervacijo v DB
4. MS1 objavi event → Kafka: reservation.created
5. MS2 posluša event → označi mesto kot rezervirano v Redis/DB
6. MS2 objavi event → Kafka: spot.reserved
7. Event Gateway → WebSocket → Web UI: posodobi prikaz zasedenosti
```

---

### **Tok 2: Vstop vozila na parkirišče**
```
1. Simulator → REST → MS3: POST /api/validate/entry + slika
2. MS3 izvede OCR → pridobi registrsko številko
3. MS3 → REST → MS1: GET /api/reservations/plate/LJ-XY-123
4. MS3 → gRPC → MS2: CheckAvailability(parkingLotId)
5. MS3 validira (ali je rezervacija aktivna, pravilno parkirišče, itd.)
6. ✅ Če OK:
   - MS3 objavi → Kafka: parking.started
   - MS3 vrne → Simulator: { "access": "granted", "barrierOpen": true }
   - MS1 posluša event → označi rezervacijo kot "active"
   - MS2 posluša event → označi mesto kot "occupied"
7. ❌ Če ERROR:
   - MS3 objavi → Kafka: parking.violation
   - MS3 vrne → Simulator: { "access": "denied", "reason": "No active reservation" }
```

---

### **Tok 3: Izstop vozila**
```
1. Simulator → REST → MS3: POST /api/validate/exit + slika
2. MS3 izvede OCR
3. MS3 → REST → MS1: GET /api/reservations/plate/LJ-XY-123
4. MS3 preveri izhodno okno (15 min po zaključku)
5. ✅ Če OK:
   - MS3 objavi → Kafka: parking.completed
   - MS2 posluša event → sprosti mesto (Redis/DB)
   - MS2 objavi → Kafka: spot.released
   - Web UI prejme update → poveča count prostih mest
6. ❌ Če prekorčeno:
   - MS3 objavi → Kafka: parking.violation (overtime)
```

---

## 🗄️ Baze podatkov

### MS1 (PostgreSQL)
**Tabele:**
- `users` - uporabniki
- `reservations` - rezervacije
- `payments` - plačila
- `vehicles` - vozila uporabnikov

### MS2 (PostgreSQL + Redis)
**PostgreSQL:**
- `parking_lots` - parkirišča
- `parking_spots` - parkirna mesta
- `spot_reservations` - povezava mesto-rezervacija
- `occupancy_history` - zgodovina zasedenosti

**Redis:**
- `spot:{id}:status` - real-time status mesta (free/reserved/occupied)
- `lot:{id}:available_count` - cache števila prostih mest

### MS3 (PostgreSQL)
**Tabele:**
- `validation_logs` - log vseh validacij
- `violations` - odkrite kršitve
- `entry_exit_events` - dogodki vstopa/izstopa

---

## 🎯 Simulator (Ločena aplikacija)

**Namen:** Simulacija kamer na vhodu/izhodu parkirišča

**Implementacija:** Enostavna Python/Node.js skripta

**Funkcionalnost:**
- Naloži nabor testnih slik registrskih tablic
- Periodično pošilja slike na:
  - `POST http://localhost:8080/api/validate/entry` (vstop)
  - `POST http://localhost:8080/api/validate/exit` (izstop)
- Prikaže odziv (ali je dostop odobren)
- Lahko tudi posluša Kafka events za feedback

**Primer:**
```python
import requests
import time

def simulate_entry(image_path, plate_number):
    with open(image_path, 'rb') as img:
        response = requests.post(
            'http://localhost:8080/api/validate/entry',
            files={'image': img},
            data={'plateNumber': plate_number}  # za testing brez OCR
        )
    print(f"Entry validation: {response.json()}")

# Simuliraj vstop na 30s
while True:
    simulate_entry('plates/lj-xy-123.jpg', 'LJ-XY-123')
    time.sleep(30)
```

---

## 🚀 Deployment in infrastruktura

### Lokalni razvoj (Docker Compose)
```yaml
services:
  # Event Broker
  kafka:
    image: confluentinc/cp-kafka:latest
  
  # Databases
  postgres-ms1:
    image: postgres:15
  postgres-ms2:
    image: postgres:15
  postgres-ms3:
    image: postgres:15
  redis:
    image: redis:7
  
  # Microservices
  ms1-reservations:
    build: ./ms1-reservations
    ports: ["3000:3000"]
  
  ms2-parking-spots:
    build: ./ms2-parking-spots
    ports: ["8000:8000"]
  
  ms3-validation:
    build: ./ms3-validation
    ports: ["8080:8080", "9090:9090"]
  
  # Web UI
  web-ui:
    build: ./web-ui
    ports: ["3001:3000"]
  
  # Event Gateway (WebSocket)
  event-gateway:
    build: ./event-gateway
    ports: ["4000:4000"]
``` (Podrobno)

### Avtentikacija in avtorizacija

**MS1 (Rezervacije):**
- **JWT Access Token** (expiry: 15 min)
  - Payload: `{ userId, email, role, iat, exp }`
  - Podpis: RS256 (asymmetric)
- **JWT Refresh Token** (expiry: 7 dni)
  - Shranjeno v HTTP-only cookie ali secure storage
- **Bcrypt** za hash gesel (cost factor: 12)
- Roles: `USER`, `ADMIN`, `OPERATOR`

**MS2 & MS3 (Internal):**
- **API Key** avtentikacija
  - Header: `X-API-Key: <secret>`
  - Validirano proti seznamu v ENV ali DB
  - Rate limiting per API key

**gRPC komunikacija:**
- **mTLS** (mutual TLS) za production
- Certifikati za MS2 in MS3
- Validacija certifikatov

**Kafka:**
- SASL/SCRAM-SHA-512 avtentikacija
- ACL pravice per topic per service
- SSL/TLS enkripcija v tranzitu

**Dodatno:**
- **CORS** politika - dovoljeni origin-i
- **Helmet.js** / Security Headers
- **Rate limiting** - 100 req/15min per IP
- **Input validation** - preprečevanje injection napadov
- **SQL injection protection** - ORM (Prisma, SQLAlchemy, JPA)
- **XSS protection** - sanitizacija outputa

---

## 📝 Logiranje (Podrobno)

### Log format (JSON)
```json
{
  "timestamp": "2026-03-10T14:30:45.123Z",
  "level": "info",
  "service": "ms1-reservations",
  "traceId": "abc-def-123",
  "spanId": "xyz-789",
  "message": "Reservation created",
  "userId": "user-123",
  "reservationId": "res-456",
  "duration": 45,
  "metadata": {
    "parkingLotId": "lot-1",
    "plateNumber": "LJ-XY-123"
  }
}
```

### Log levels
- **ERROR** - napake, izjeme (alarmiranje)
- **WARN** - opozorila (validacijske napake, prazni rezultati)
- **INFO** - pomembni eventi (nova rezervacija, uspešna validacija)
- **DEBUG** - detajli za razvoj (SQL queries, cache hits)

### CeImplementacijski načrt

### ✅ Naloga 1: MS1 - Rezervacijski servis (Node.js/Express)

**Funkcionalnosti:**
- ✅ Auth endpoints (register, login, refresh token)
- ✅ CRUD rezervacije (create, read, update, delete)
- ✅ Preverjanje veljavnosti rezervacije po registrski številki
- ✅ Podaljševanje rezervacije
- ✅ Zaključevanje parkiranja

**Tehnične zahteve:**
- ✅ PostgreSQL baza (Prisma ORM)
- ✅ JWT avtentikacija (access + refresh token)
- ✅ Kafka producer (objavljanje eventov)
- ✅ Winston logger (JSON format)
- ✅ Jest unit + integration testi (coverage > 80%)
- ✅ Swagger/OpenAPI dokumentacija
- ✅ Dockerfile
- ✅ GitHub Actions workflow za teste

**Datotečna struktura:**
```
ms1-reservations/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   ├── kafka.ts
│   │   └── env.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   └── error.middleware.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   └── reservations.routes.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   └── reservations.controller.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── reservations.service.ts
│   │   └── kafka.service.ts
│   ├── repositories/
│   │   ├── user.repository.ts
│   │   └── reservation.repository.ts
│   ├── models/
│   │   └── dto/
│   ├── utils/
│   │   ├── jwt.util.ts
│   │   ├── password.util.ts
│   │   └── logger.ts
│   └── index.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   └── repositories/
│   ├── integration/
│   │   └── routes/
│   └── setup.ts
├── .github/
│   └── workflows/
│       └── test.yml
├── Dockerfile
├── .dockerignore
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

---

### 📋 Naslednje naloge

2. **MS2 - Upravljanje parkirnih mest (Python/FastAPI)**
   - Inventar parkirišč in mest
   - Redis za real-time cache
   - gRPC server
   - Kafka consumer/producer
   - Pytest testi

3. **MS3 - Validacija (Java/Spring Boot)**
   - REST endpoint za slike
   - OCR simulacija
   - gRPC client za MS2
   - REST client za MS1
   - Kafka producer
   - JUnit + Mockito testi

4. **Simulator**
   - Python CLI app
   - Pošiljanje testnih slik
   - Simulacija vstopov/izstopov

5. **Web UI (Next.js)**
   - Dashboard
   - Rezervacijski vmesnik
   - Real-time posodobitve

6. **Integration & E2E**
   - Docker Compose orchestration
   - End-to-end testiranje
   - Performance testing

## 🧪 Testiranje (Podrobno)

### MS1 (Node.js/Express + Jest)

**Unit testi:**
- `src/services/*.test.ts` - business logika
- `src/repositories/*.test.ts` - DB interakcije (mock Prisma)
- `src/utils/*.test.ts` - utility funkcije
- `src/middleware/*.test.ts` - JWT, validacija

**Integration testi:**
- `tests/integration/reservations.test.ts` - API endpoints (Supertest)
- TestContainers za PostgreSQL
- Mock Kafka producer

**E2E testi:**
- `tests/e2e/reservation-flow.test.ts` - celoten workflow

**Coverage cilj:** > 80%

**Ukaz:** `npm test` (GitHub Actions)

---

### MS2 (Python/FastAPI + Pytest)

**Unit testi:**
- `tests/unit/test_services.py`
- `tests/unit/test_repositories.py`
- Mock SQLAlchemy, Redis

**Integration testi:**
- `tests/integration/test_api.py` - Httpx TestClient
- `tests/integration/test_grpc.py` - gRPC test client

**Fixtures:**
- `conftest.py` - shared fixtures (DB, Redis)

**Coverage:** `pytest --cov=app --cov-report=html`

---

### MS3 (Java/Spring Boot + JUnit 5)

**Unit testi:**
- `ValidationServiceTest` - Mockito za dependencies
- `OCRServiceTest` - mock OCR engine
- `ReservationClientTest` - mock HTTP client

**Integration testi:**
- `@SpringBootTest` - polni application context
- TestContainers za PostgreSQL, Kafka
- `@WebMvcTest` za REST controllers

**gRPC testi:**
- `grpc-spring-boot-starter-test`
- In-process server za teste

**Coverage:** JaCoCo plugin (> 80%)

---

### GitHub Actions Workflow

**Primer `.github/workflows/test.yml`:**
```yaml
name: Run Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test-ms1:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: cd ms1-reservations && npm ci
      - run: cd ms1-reservations && npm test
      - run: cd ms1-reservations && npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./ms1-reservations/coverage/lcov.info

  test-ms2:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - run: cd ms2-parking-spots && pip install -r requirements.txt
      - run: cd ms2-parking-spots && pytest --cov --cov-report=xml
      - uses: codecov/codecov-action@v3

  test-ms3:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'
      - run: cd ms3-validation && ./mvnw test
      - run: cd ms3-validation && ./mvnw jacoco:report
```

---

## 🐳 Docker in Docker Compose

### Dockerfile primeri

**MS1 (Node.js):**
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

**MS2 (Python):**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**MS3 (Java):**
```dockerfile
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8080 9090
CMD ["java", "-jar", "app.jar"]
```

---

### docker-compose.yml (Complete)

```yaml
version: '3.8'

services:
  # Infrastructure
  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:29092,PLAINTEXT_HOST://localhost:9092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  postgres-ms1:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: reservations
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres-ms1-data:/var/lib/postgresql/data

  postgres-ms2:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: parking_spots
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5433:5432"
    volumes:
      - postgres-ms2-data:/var/lib/postgresql/data

  postgres-ms3:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: validation
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5434:5432"
    volumes:
      - postgres-ms3-data:/var/lib/postgresql/data

  # Microservices
  ms1-reservations:
    build:
      context: ./ms1-reservations
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://postgres:postgres@postgres-ms1:5432/reservations
      KAFKA_BROKERS: kafka:29092
      JWT_SECRET: your-super-secret-jwt-key-change-in-production
      JWT_REFRESH_SECRET: your-refresh-secret
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres-ms1
      - kafka
      - redis

  ms2-parking-spots:
    build:
      context: ./ms2-parking-spots
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
      - "50051:50051"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres-ms2:5432/parking_spots
      REDIS_URL: redis://redis:6379
      KAFKA_BROKERS: kafka:29092
      API_KEY: ms2-internal-api-key-change-me
    depends_on:
      - postgres-ms2
      - redis
      - kafka

  ms3-validation:
    build:
      context: ./ms3-validation
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
      - "9090:9090"
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres-ms3:5432/validation
      SPRING_DATASOURCE_USERNAME: postgres
      SPRING_DATASOURCE_PASSWORD: postgres
      SPRING_KAFKA_BOOTSTRAP_SERVERS: kafka:29092
      MS1_BASE_URL: http://ms1-reservations:3000
      MS2_GRPC_HOST: ms2-parking-spots
      MS2_GRPC_PORT: 50051
      API_KEY: ms3-simulator-api-key-change-me
    depends_on:
      - postgres-ms3
      - kafka
      - ms1-reservations
      - ms2-parking-spots

  # Web UI
  web-ui:
    build:
      context: ./web-ui
      dockerfile: Dockerfile
    ports:
      - "3001:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3000
      NEXT_PUBLIC_WS_URL: ws://localhost:4000

  # Event Gateway (WebSocket)
  event-gateway:
    build:
      context: ./event-gateway
      dockerfile: Dockerfile
    ports:
      - "4000:4000"
    environment:
      KAFKA_BROKERS: kafka:29092
      PORT: 4000
    depends_on:
      - kafka

volumes:
  postgres-ms1-data:
  postgres-ms2-data:
  postgres-ms3-data:
```

---

## 📊 OpenAPI / Swagger

### MS1 (Node.js/Express)

**Swagger setup:**
```typescript
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Parqis Reservations API',
      version: '1.0.0',
      description: 'API for managing parking reservations',
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Development' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```

**Route annotations:**
```typescript
/**
 * @openapi
 * /api/reservations:
 *   post:
 *     summary: Create new reservation
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               parkingLotId:
 *                 type: string
 *               plateNumber:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Reservation created
 *       401:
 *         description: Unauthorized
 */
```

### MS2 (Python/FastAPI)

FastAPI avtomatsko generira OpenAPI:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- OpenAPI JSON: `http://localhost:8000/openapi.json`

### MS3 (Java/Spring Boot)

**Maven dependency:**
```xml
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.2.0</version>
</dependency>
```

**Configuration:**
```java
@Configuration
public class OpenApiConfig {
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("Parqis Validation API")
                .version("1.0.0")
                .description("API for validating parking entries/exits"))
            .addSecurityItem(new SecurityRequirement().addList("apiKey"))
            .components(new Components()
                .addSecuritySchemes("apiKey", 
                    new SecurityScheme()
                        .type(SecurityScheme.Type.APIKEY)
                        .in(SecurityScheme.In.HEADER)
                        .name("X-API-Key")));
    }
}
```

Swagger UI: `http://localhost:8080/swagger-ui.html`
- Service mesh (Istio) za observability

---

## 📊 Monitoring in observability

**Stack:**
- **Prometheus** - metrike
- **Grafana** - dashboardi
- **Jaeger/Zipkin** - distributed tracing
- **ELK Stack** - centralizirani logi

**Ključne metrike:**
- Število rezervacij/uro
- Latenca validacije
- Throughput Kafka eventov
- Zasedenost parkirišč (%)
- Število kršitev
- API response times

---

## 🔐 Varnost

- **API Gateway** (Kong/Ambassador) za autentikacijo/avtorizacijo
- **JWT tokeni** za REST API-je
- **mTLS** za gRPC komunikacijo
- **Kafka ACLs** za topic permissions
- **HTTPS/TLS** za vso javno komunikacijo
- **Rate limiting** za zaščito pred DDoS

---

## 🎯 Prednosti te arhitekture

✅ **Tehnološka raznolikost** - vsak tim lahko uporablja najboljši tool za svoj problem  
✅ **Skalabilnost** - vsak servis se lahko skalira neodvisno  
✅ **Odpornost** - odpoved enega servisa ne ustavi celotnega sistema  
✅ **Decoupling** - event-driven komunikacija omogoča loose coupling  
✅ **Hitrost** - gRPC za kritične klice, REST za standardne operacije  
✅ **Real-time** - WebSocket za takojšnje posodobitve UI  
✅ **Razširljivost** - enostavno dodajanje novih servisov (npr. billing, notifications)

---

## 📁 Struktura projektne mape

```
Parqis/
├── ms1-reservations/          # Node.js/Express
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   └── Dockerfile
├── ms2-parking-spots/         # Python/FastAPI
│   ├── app/
│   ├── requirements.txt
│   └── Dockerfile
├── ms3-validation/            # Java/Spring Boot
│   ├── src/main/java/
│   ├── pom.xml
│   └── Dockerfile
├── web-ui/                    # Next.js
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── event-gateway/             # Node.js WebSocket server
│   ├── src/
│   └── package.json
├── simulator/                 # Python simulator
│   ├── simulator.py
│   └── test-plates/
├── proto/                     # Shared protobuf definitions
│   └── parking.proto
├── docker-compose.yml
├── kubernetes/
│   ├── kafka/
│   ├── services/
│   └── ingress/
├── docs/
│   └── api/
├── ARCHITECTURE.md           # Ta dokument
├── README.md
└── DodatniOpis.md
```

---

## 🏁 Naslednji koraki

1. ✅ **Definirati API kontakte** (OpenAPI specs, protobuf)
2. ✅ **Setup Docker Compose** za lokalni razvoj
3. ✅ **Implementirati MS1** (rezervacijski servis)
4. ✅ **Implementirati MS2** (upravljanje mest)
5. ✅ **Implementirati MS3** (validacija)
6. ✅ **Razviti simulator** za testiranje
7. ✅ **Zgraditi Web UI**
8. ✅ **Integrirati Kafka** za event-driven komunikacijo
9. ✅ **Setup monitoring**
10. ✅ **End-to-end testiranje**

---

**Avtor:** IT Arhitekture - MAG 2. Semester  
**Datum:** 10.3.2026  
**Verzija:** 1.0
