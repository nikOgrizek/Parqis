# Parqis - Docker Compose Setup 🐳

## Quick Start

### 1. Clone repository
```bash
git clone <your-repo-url>
cd Parqis
```

### 2. Configure environment (optional)
```bash
cp .env.docker.example .env.docker
# Edit .env.docker with your secrets
```

### 3. Start all services
```bash
docker-compose up -d
```

### 4. Check service status
```bash
docker-compose ps
```

### 5. View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f ms1-reservations
```

### 6. Run database migrations (manual fallback)
```bash
docker-compose exec ms1-reservations npx prisma migrate deploy
```

Note: `ms1-reservations` now runs `prisma migrate deploy` automatically when the container starts.

### 7. Access services

| Service | URL |
|---------|-----|
| MS1 API | http://localhost:3000 |
| MS1 Swagger | http://localhost:3000/api-docs |
| MS1 Health | http://localhost:3000/api/health |
| Kafka UI (debug) | http://localhost:8080 |
| PostgreSQL | localhost:5432 |
| Kafka | localhost:9092 |
| Redis | localhost:6379 |

## Available Commands

```bash
# Start all services
docker-compose up -d

# Start with Kafka UI (debug mode)
docker-compose --profile debug up -d

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data!)
docker-compose down -v

# Rebuild services
docker-compose up -d --build

# View logs
docker-compose logs -f [service-name]

# Execute command in container
docker-compose exec ms1-reservations sh

# Check service health
docker-compose ps
```

## Services Overview

### Infrastructure
- **PostgreSQL** (port 5432): Database for MS1
- **Kafka** (port 9092): Message broker for events
- **Zookeeper** (port 2181): Kafka coordination
- **Redis** (port 6379): Caching layer

### Microservices
- **MS1-Reservations** (port 3000): Reservation management service

### Debug Tools
- **Kafka UI** (port 8080): Kafka management interface (use `--profile debug`)

## Development Workflow

### Local Development (without Docker)
```bash
cd ms1-reservations
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

### Test with Docker Compose
```bash
# Start infrastructure only
docker-compose up -d postgres-ms1 kafka redis

# Run MS1 locally
cd ms1-reservations
npm run dev
```

## Testing

### Run tests in Docker
```bash
docker-compose exec ms1-reservations npm test
```

### Run tests locally
```bash
cd ms1-reservations
npm test
```

## Troubleshooting

### Service won't start
```bash
# Check logs
docker-compose logs [service-name]

# Check health
docker-compose ps

# Restart service
docker-compose restart [service-name]
```

### Database connection issues
```bash
# Check PostgreSQL is running
docker-compose ps postgres-ms1

# Check PostgreSQL logs
docker-compose logs postgres-ms1

# Recreate database
docker-compose down
docker-compose up -d postgres-ms1
```

### Kafka connection issues
```bash
# Check Kafka is running
docker-compose ps kafka

# View Kafka logs
docker-compose logs kafka

# Restart Kafka
docker-compose restart zookeeper kafka
```

### Clean start (removes all data!)
```bash
docker-compose down -v
docker-compose up -d
```

## Production Considerations

⚠️ **Before deploying to production:**

1. Change all default passwords and secrets in `.env.docker`
2. Use managed databases (PostgreSQL RDS, etc.)
3. Use managed Kafka (Confluent Cloud, AWS MSK, etc.)
4. Enable SSL/TLS for all connections
5. Set up proper backup strategies
6. Configure resource limits in docker-compose.yml
7. Use docker secrets instead of environment variables
8. Enable monitoring and alerting
9. Use a reverse proxy (nginx, traefik)
10. Implement proper logging aggregation

## Monitoring

### Check container resources
```bash
docker stats
```

### View specific service metrics
```bash
docker stats ms1-reservations
```

## Maintenance

### Backup Database
```bash
docker-compose exec postgres-ms1 pg_dump -U postgres reservations > backup.sql
```

### Restore Database
```bash
cat backup.sql | docker-compose exec -T postgres-ms1 psql -U postgres reservations
```

### Update services
```bash
docker-compose pull
docker-compose up -d
```

## Network

All services are connected via `parqis-network` bridge network.

Internal service communication:
- MS1 → PostgreSQL: `postgres-ms1:5432`
- MS1 → Kafka: `kafka:29092`
- MS1 → Redis: `redis:6379`

## Volumes

Persistent data is stored in Docker volumes:
- `postgres-ms1-data`: PostgreSQL database
- `redis-data`: Redis cache

## License

MIT
