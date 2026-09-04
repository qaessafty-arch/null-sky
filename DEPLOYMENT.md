# FILE: DEPLOYMENT.md
# Production Deployment & Infrastructure Guide

## Stack Summary
- **Database**: PostgreSQL 15 Alpine (with `uuid-ossp` extension)
- **Caching & State**: Redis 7 Alpine
- **Message Broker & Queue**: BullMQ over Redis
- **Backend**: Node.js 20 Express + Socket.IO server
- **Frontend**: Vite React 18 SPA compiled into Nginx static assets
- **Reverse Proxy & SSL**: Nginx with HTTP/2 and WebSocket Upgrade support

---

## 1. Local Docker Compose Launch

Run the entire cluster with one command:
```bash
docker-compose up -d --build
```

Verify service health:
```bash
docker-compose ps
```

Services exposed:
- Web Application: `http://localhost:80`
- REST API / WebSocket: `http://localhost:3000`
- Redis: `localhost:6379`
- PostgreSQL: `localhost:5432`
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3002`

---

## 2. Database Migrations

Apply the database schema and indexes:
```bash
docker-compose exec postgres psql -U postgres -d chess_db -f /migrations/001_initial_schema.sql
docker-compose exec postgres psql -U postgres -d chess_db -f /seeds/001_initial_seeds.sql
```

---

## 3. Production Environment Checklist

1. Generate secure secrets:
   ```bash
   openssl rand -hex 64 # for JWT_SECRET
   openssl rand -hex 64 # for JWT_REFRESH_SECRET
   ```
2. Enable SSL termination via Let's Encrypt / Certbot on Nginx.
3. Configure PostgreSQL persistent volume storage and automated daily backups.
4. Scale backend Node.js containers horizontally behind Nginx using Redis Socket.IO adapter.
