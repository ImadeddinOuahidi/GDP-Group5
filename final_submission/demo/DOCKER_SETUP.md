# ADR System - Docker Setup

This document explains how to run the ADR (Adverse Drug Reaction) system using Docker Compose.

## Architecture

The system consists of the following services:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Docker Compose                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────────────┐  │
│  │ Frontend │───▶│ Backend  │───▶│ MongoDB  │    │  MinIO (S3)      │  │
│  │  :3000   │    │  :5000   │    │  :27017  │    │  :9000/:9001     │  │
│  └──────────┘    └────┬─────┘    └──────────┘    └──────────────────┘  │
│                       │                                                  │
│                       │ Publish Event                                    │
│                       ▼                                                  │
│                 ┌──────────┐                                            │
│                 │ RabbitMQ │                                            │
│                 │  :5672   │                                            │
│                 └────┬─────┘                                            │
│                       │ Consume                                          │
│                       ▼                                                  │
│                 ┌──────────┐                                            │
│                 │ Consumer │──────▶ Gemini AI                           │
│                 │ Service  │                                            │
│                 └──────────┘                                            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | React application |
| Backend | 5000 | Express.js API server |
| MongoDB | 27017 | Database |
| RabbitMQ | 5672, 15672 | Message queue (15672 = Management UI) |
| MinIO | 9000, 9001 | S3-compatible storage (9001 = Console) |
| Consumer | - | AI processing service (no external port) |

## Prerequisites

- Docker and Docker Compose installed
- (Optional) Gemini API key for AI features

## Quick Start

1. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Configure Gemini API key (optional):**
   Edit `.env` and add your Gemini API key:
   ```
   GEMINI_API_KEY=your-api-key-here
   ```

3. **Start all services:**
   ```bash
   docker-compose up -d
   ```

4. **Check service status:**
   ```bash
   docker-compose ps
   ```

5. **View logs:**
   ```bash
   # All services
   docker-compose logs -f

   # Specific service
   docker-compose logs -f backend
   docker-compose logs -f consumer
   ```

## Accessing Services

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| API Documentation | http://localhost:5000/api-docs |
| RabbitMQ Management | http://localhost:15672 (adr_user/adr_pass123) |
| MinIO Console | http://localhost:9001 (minioadmin/minioadmin123) |

## Event Flow

1. **User submits a side effect report** via Frontend
2. **Backend saves report to MongoDB** and publishes `report.created` event to RabbitMQ
3. **Consumer service picks up the event** from RabbitMQ
4. **Consumer fetches report data** from MongoDB and any attached files from MinIO
5. **Consumer sends data to Gemini AI** for severity analysis
6. **Consumer updates report** with AI analysis results in MongoDB

## Development

### Running individual services:

```bash
# Start only infrastructure (MongoDB, RabbitMQ, MinIO)
docker-compose up -d mongodb rabbitmq minio minio-init

# Run backend locally
cd backend && npm run dev

# Run frontend locally
cd frontend && npm start

# Run consumer locally
cd consumer && npm start
```

### Rebuilding after code changes:

```bash
docker-compose up -d --build
```

### Stopping services:

```bash
docker-compose down

# Remove volumes too (deletes all data)
docker-compose down -v
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | development | Environment mode |
| `MONGO_ROOT_USER` | admin | MongoDB admin username |
| `MONGO_ROOT_PASSWORD` | admin123 | MongoDB admin password |
| `MONGO_DB_NAME` | adr_system | Database name |
| `RABBITMQ_USER` | adr_user | RabbitMQ username |
| `RABBITMQ_PASS` | adr_pass123 | RabbitMQ password |
| `MINIO_ROOT_USER` | minioadmin | MinIO admin username |
| `MINIO_ROOT_PASSWORD` | minioadmin123 | MinIO admin password |
| `JWT_SECRET` | (random) | JWT signing secret |
| `GEMINI_API_KEY` | (required) | Google Gemini API key |

## Gemini AI Integration

The Consumer service uses Google's Gemini AI to:

1. **Analyze severity** of reported side effects
2. **Identify risk factors** and body systems affected
3. **Generate recommendations** for medical review
4. **Process attached images** for visual symptom analysis

To enable AI features:
1. Get an API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add it to your `.env` file as `GEMINI_API_KEY`

Without an API key, the system will use rule-based fallback analysis.

## Troubleshooting

### Services not starting:
```bash
# Check logs for errors
docker-compose logs

# Restart specific service
docker-compose restart backend
```

### RabbitMQ connection issues:
```bash
# Wait for RabbitMQ to be fully ready
docker-compose logs rabbitmq | grep "Server startup complete"
```

### MongoDB connection issues:
```bash
# Check MongoDB is healthy
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"
```

### Clearing all data:
```bash
docker-compose down -v
docker-compose up -d
```
