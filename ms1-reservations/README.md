# MS1 - Parqis Reservations Microservice

## 📋 Overview

Microservice for managing parking reservations in the Parqis system. Built with Node.js, Express, TypeScript, Prisma, and PostgreSQL.

## 🚀 Features

- **User Authentication**: JWT-based authentication with access and refresh tokens
- **Reservation Management**: Create, view, extend, and cancel parking reservations
- **Real-time Events**: Kafka integration for event-driven architecture
- **API Documentation**: Swagger/OpenAPI documentation
- **Comprehensive Testing**: Unit and integration tests with >80% coverage
- **Security**: Helmet, CORS, rate limiting, input validation
- **Logging**: Structured JSON logging with Winston
- **Docker Support**: Multi-stage Dockerfile for production deployment

## 🛠️ Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 15+
- **ORM**: Prisma
- **Message Broker**: Apache Kafka
- **Testing**: Jest, Supertest
- **Documentation**: Swagger/OpenAPI 3.0

## 📦 Installation

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Kafka (optional for development)

### Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Start development server
npm run dev
```

## 🔧 Configuration

Key environment variables (see `.env.example`):

```env
DATABASE_URL=postgresql://user:password@localhost:5432/reservations
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
KAFKA_BROKERS=localhost:9092
```

## 📚 API Documentation

Once the server is running, visit:

- Swagger UI: `http://localhost:3000/api-docs`
- Health check: `http://localhost:3000/api/health`

### Main Endpoints

**Authentication:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

**Reservations:**
- `POST /api/reservations` - Create reservation 🔒
- `GET /api/reservations/:id` - Get reservation 🔒
- `GET /api/reservations/user/:userId` - Get user reservations 🔒
- `PUT /api/reservations/:id/extend` - Extend reservation 🔒
- `DELETE /api/reservations/:id` - Cancel reservation 🔒

**Internal APIs:**
- `GET /api/reservations/plate/:plateNumber` - Get active reservation by plate 🔑
- `POST /api/reservations/:id/complete` - Complete reservation 🔑

🔒 = Requires JWT token  
🔑 = Requires API key

## 🧪 Testing

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 🐳 Docker

### Build

```bash
docker build -t parqis-ms1-reservations .
```

### Run

```bash
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:password@host:5432/reservations \
  -e JWT_SECRET=your-secret \
  -e KAFKA_BROKERS=kafka:9092 \
  --name ms1-reservations \
  parqis-ms1-reservations
```

## 🔄 CI/CD

GitHub Actions workflow runs on every push:

1. Install dependencies
2. Run linting
3. Run unit tests
4. Run integration tests
5. Generate coverage report
6. Build application
7. Test Docker build

## 📊 Kafka Events

**Published Events:**
- `reservation.created` - New reservation created
- `reservation.extended` - Reservation time extended
- `reservation.cancelled` - Reservation cancelled
- `reservation.completed` - Parking completed

**Consumed Events:**
- `parking.started` - Vehicle entered (from MS3)
- `parking.violation` - Violation detected (from MS3)

## 🏗️ Project Structure

```
ms1-reservations/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   ├── models/          # DTOs and types
│   ├── repositories/    # Database layer
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utilities
│   └── index.ts         # App entry point
├── tests/
│   ├── unit/            # Unit tests
│   ├── integration/     # Integration tests
│   └── setup.ts         # Test configuration
├── prisma/
│   └── schema.prisma    # Database schema
├── Dockerfile
├── package.json
└── README.md
```

## 🔐 Security

- JWT tokens with RS256 signing
- Bcrypt password hashing (cost factor: 12)
- Rate limiting (100 requests per 15 minutes)
- Helmet.js security headers
- CORS configuration
- Input validation with Joi
- API key authentication for internal endpoints

## 📝 Logging

Structured JSON logs with Winston:

```json
{
  "timestamp": "2026-03-10T14:30:45.123Z",
  "level": "info",
  "service": "ms1-reservations",
  "message": "Reservation created",
  "reservationId": "res-123"
}
```

Logs are written to:
- Console (development)
- `logs/combined.log` (all logs)
- `logs/error.log` (errors only)

## 🤝 Contributing

1. Create feature branch
2. Write tests
3. Ensure tests pass
4. Submit pull request

## 📄 License

MIT

## 👥 Authors

IT Arhitekture - MAG 2. Semester
