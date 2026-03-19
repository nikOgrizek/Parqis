# Parqis - Parking Management System

Sistema za upravljanje parkirnih mest z mikrostoritveno arhitekturo.

## 📋 Pregled

Parqis je digitalni sistem za upravljanje parkirišč, ki omogoča rezervacijo parkirnih mest, avtomatsko validacijo vstopov/izstopov prek prepoznave registrskih oznak in sledenje zasedenosti v realnem času.

**Namen sistema:**
- Zmanjšati zasedenost brez nadzora
- Poenostaviti nakup/rezervacijo parkiranja
- Omogočiti avtomatsko preverjanje veljavnosti
- Izboljšati pregled nad uporabo parkirišč

## 🏗️ Arhitektura

Sistem sestavljajo **3 mikrostoritve**:
- **MS1 - Rezervacije** (Node.js/Express) - upravljanje rezervacij in uporabnikov ✅
- **MS2 - Parkirna mesta** (Python/FastAPI) - upravljanje inventarja mest ✅
- **MS3 - Validacija** (Java/Spring Boot) - validacija vstopov/izstopov ⏳

**Komunikacija:**
- REST API za synchronous komunikacijo
- gRPC za low-latency klice
- Kafka za event-driven arhitekturo

**Tehnologije:**
- PostgreSQL (baza podatkov)
- Apache Kafka (event streaming)
- Redis (cache)
- Docker & Docker Compose

Podrobna arhitektura: [ARCHITECTURE.md](ARCHITECTURE.md)

## 🚀 Quick Start

### Predpogoji
- Docker Desktop
- Git

### Zagon s Docker Compose
```bash
# Clone repository
git clone <your-repo>
cd Parqis

# Start vse servise
docker-compose up -d

# Preveri status
docker-compose ps

# Poglej loge
docker-compose logs -f ms1-reservations
```

**Dostop:**
- MS1 API: http://localhost:3000
- MS2 API: http://localhost:8000
- Swagger UI: http://localhost:3000/api-docs
- Health check: http://localhost:3000/api/health

Podrobna navodila: [DOCKER.md](DOCKER.md)

### Lokalni razvoj (brez Dockerja)
```bash
# Start PostgreSQL in Kafka
docker-compose up -d postgres-ms1 kafka redis

# MS1 setup
cd ms1-reservations
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

## 📚 Dokumentacija

- [Arhitekturni načrt](ARCHITECTURE.md) - Celotna mikrostoritvena arhitektura
- [Docker Setup](DOCKER.md) - Navodila za Docker Compose
- [MS1 README](ms1-reservations/README.md) - Dokumentacija MS1
- [Dodatni opisi](DodatniOpis.md) - Podrobni podatkovni tokovi

## 🧪 Testiranje

```bash
# Testi za MS1 (lokalno)
cd ms1-reservations
npm test

# Ali v Docker
docker-compose exec ms1-reservations npm test

# CI/CD testi se avtomatsko zaženejo ob push na GitHub
```

## 🛠️ Status implementacije

### ✅ MS1 - Rezervacijski servis (COMPLETED)
- ✅ Avtentikacija (JWT access + refresh tokens)
- ✅ CRUD operacije za rezervacije
- ✅ Kafka event publishing (reservation.created, etc.)
- ✅ Winston logging (JSON format)
- ✅ Unit + Integration testi (>80% coverage)
- ✅ Swagger/OpenAPI dokumentacija
- ✅ Dockerfile (multi-stage build)
- ✅ GitHub Actions CI/CD
- ✅ Docker Compose setup

### ✅ MS2 - Parkirna mesta (COMPLETED)
- ✅ Screaming architecture po domenah (`PARKING_LOTS`, `SPOT_ALLOCATION`, `OCCUPANCY`)
- ✅ REST API za parkirišča, mesta in zasedenost
- ✅ API key zaščita za interne endpoint-e
- ✅ gRPC servis (`CheckAvailability`, `ReserveSpot`, `ReleaseSpot`)
- ✅ Kafka consumer/producer za event messaging
- ✅ Structured JSON logiranje
- ✅ Unit testi (pytest)
- ✅ Dockerfile in docker-compose integracija

### ⏳ MS3 - Validacija (PLANNED)
- OCR prepoznavanje registrskih oznak
- Validacija rezervacij
- gRPC client za MS2
- REST client za MS1

### ⏳ Web UI (PLANNED)
- Next.js aplikacija
- Real-time dashboard
- Rezervacijski vmesnik

## 📖 API Endpoints

### MS1 - Rezervacije (http://localhost:3000)

**Avtentikacija:**
```
POST   /api/auth/register    - Registracija uporabnika
POST   /api/auth/login       - Prijava
POST   /api/auth/refresh     - Refresh access token
POST   /api/auth/logout      - Odjava
```

**Rezervacije:**
```
POST   /api/reservations              - Nova rezervacija 🔒
GET    /api/reservations/:id          - Pridobi rezervacijo 🔒
GET    /api/reservations/user/:userId - Uporabnikove rezervacije 🔒
PUT    /api/reservations/:id/extend   - Podaljšaj rezervacijo 🔒
DELETE /api/reservations/:id          - Prekliči rezervacijo 🔒
```

**Internal API:**
```
GET  /api/reservations/plate/:plateNumber  - Pridobi aktivno rezervacijo 🔑
POST /api/reservations/:id/complete        - Zaključi parkiranje 🔑
```

🔒 = Zahteva JWT token  
🔑 = Zahteva API key

**Swagger dokumentacija:** http://localhost:3000/api-docs

## 🔐 Varnost

- JWT avtentikacija (access + refresh tokens)
- Bcrypt password hashing (cost factor: 12)
- Rate limiting (100 req/15min)
- Input validation (Joi schemas)
- API key authentication za internal servise
- CORS, Helmet.js security headers

## 📊 CI/CD

GitHub Actions workflow avtomatsko izvede ob push:
- ✅ ESLint code linting
- ✅ Prisma schema validation
- ✅ Unit tests
- ✅ Integration tests
- ✅ Coverage report (Codecov)
- ✅ TypeScript build
- ✅ Docker image build

Workflow: [.github/workflows/ms1-test.yml](.github/workflows/ms1-test.yml)

## 🎯 Git Push za teste

```bash
# Inicializiraj git repository (če še ni)
git init
git add .
git commit -m "feat: MS1 implementation with tests"

# Dodaj remote (svoj GitHub repo)
git remote add origin https://github.com/YOUR_USERNAME/parqis.git

# Push na main/master branch
git push -u origin main
```

**GitHub Actions workflow se bo avtomatsko zagnal!** 🚀

Preveri rezultate na: `https://github.com/YOUR_USERNAME/parqis/actions`

## 📦 Struktura projekta

```
Parqis/
├── ms1-reservations/        # MS1 - Node.js/Express
│   ├── src/                 # Source code
│   ├── tests/               # Unit + Integration tests
│   ├── prisma/              # Database schema
│   ├── Dockerfile           # Multi-stage build
│   └── README.md
├── .github/
│   └── workflows/
│       └── ms1-test.yml     # CI/CD pipeline
├── docker-compose.yml       # Orchestration
├── ARCHITECTURE.md          # Arhitekturni načrt
├── DOCKER.md               # Docker navodila
├── DodatniOpis.md          # Podrobni opisi
└── README.md               # Ta dokument
```

## 🤝 Contributing

1. Fork repository
2. Ustvari feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit spremembe (`git commit -m 'feat: Add AmazingFeature'`)
4. Push na branch (`git push origin feature/AmazingFeature`)
5. Odpri Pull Request
6. GitHub Actions bo avtomatsko zagnal teste

## 📝 Konvencije

- **Commit messages:** Conventional Commits format
  - `feat:` - nova funkcionalnost
  - `fix:` - popravek bug-a
  - `test:` - dodajanje testov
  - `docs:` - dokumentacija
  - `chore:` - maintenance

## 📄 License

MIT

## 👥 Authors

IT Arhitekture - MAG 2. Semester, FERI

---

## Kako deluje v praksi?

### 1️⃣ Uporabnik želi parkirati
Uporabnik prek spletne strani ali aplikacije:
- vidi razpoložljiva parkirna mesta,
- izbere parkirišče,
- vnese registrsko številko,
- določi čas parkiranja,
- potrdi rezervacijo.

Po potrditvi ima vozilo **aktivno parkirno dovoljenje** za izbran čas.

---

### 2️⃣ Vozilo prispe na parkirišče
Na vhodu ali znotraj parkirišča kamera zazna registrsko številko vozila.

Sistem samodejno preveri:
- ali ima vozilo aktivno parkiranje,
- ali je parkiranje še veljavno,
- ali je izbrano pravilno parkirišče.

Če je vse v redu, sistem **evidentira prihod**.

---

### 3️⃣ Če parkiranje ni veljavno
Če sistem zazna, da:
- parkiranje ne obstaja,
- je poteklo,
- ali je izbrano napačno parkirišče,

se sproži postopek obravnave:
- zabeleži se kršitev,
- lahko se generira opozorilo ali kazen,
- upravljavec parkirišča prejme obvestilo.

---

### 4️⃣ Samodejno upravljanje mest
Sistem v realnem času spremlja:
- zasedena in prosta mesta,
- aktivne rezervacije,
- statistiko uporabe.

Ko rezervacija poteče, se mesto **samodejno sprosti** in postane na voljo drugim uporabnikom.

---

## Prednosti sistema
- ✔ manj ročnega nadzora  
- ✔ manj zlorab parkirišč  
- ✔ večja pretočnost  
- ✔ avtomatizirano preverjanje  
- ✔ boljši pregled nad zasedenostjo  

---

## Primer realne situacije
Predstavljajte si mestno parkirišče v centru.

Namesto da uporabniki iščejo parkomat:
- parkiranje uredijo vnaprej,
- kamera ob prihodu preveri registrsko številko,
- redar prejme obvestilo samo ob kršitvi.

Celoten proces poteka **avtomatsko**, brez papirnih listkov in fizičnih kartic.
