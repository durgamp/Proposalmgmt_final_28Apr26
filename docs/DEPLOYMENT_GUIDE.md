# BioPropose — Deployment Guide

This guide covers every deployment scenario: local development, single-server Docker Compose, and production multi-server setups.  
All four tiers — **PAL (web)**, **BAL (api)**, **DAL (dal)**, **MySQL** — run as independent containers and communicate exclusively through versioned REST APIs.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Repository Layout](#2-repository-layout)
3. [Local Development (without Docker)](#3-local-development-without-docker)
4. [Docker Compose — Single Server](#4-docker-compose--single-server)
5. [Environment Variables Reference](#5-environment-variables-reference)
6. [AI Provider Configuration](#6-ai-provider-configuration)
7. [Health Checks](#7-health-checks)
8. [Database Migrations](#8-database-migrations)
9. [Backup and Restore](#9-backup-and-restore)
10. [Production Checklist](#10-production-checklist)
11. [Multi-Server / Cloud Deployment](#11-multi-server--cloud-deployment)
12. [Upgrading](#12-upgrading)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Prerequisites

### Required on every deployment host

| Tool | Minimum version | Purpose |
|------|----------------|---------|
| Docker | 24.x | Container runtime |
| Docker Compose | v2.20+ (`docker compose` plugin) | Orchestration |
| Git | any | Clone repo |

### Required for local dev (outside Docker)

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20 LTS | BAL, DAL, web dev server |
| npm | 10+ | Package manager (workspaces) |

### External services (run on the host, accessed via `host.docker.internal`)

| Service | How to run | Default port | Purpose |
|---------|-----------|-------------|---------|
| **Ollama** | `curl -fsSL https://ollama.com/install.sh \| sh` | 11434 | Local LLM + embeddings |
| **Qdrant** | `docker run -d -p 6333:6333 qdrant/qdrant` | 6333 | Vector DB for RAG |

> Qdrant and Ollama run **outside** the Docker Compose stack so they survive container rebuilds.  
> Skip Qdrant if you don't use the AI deep-search feature.

---

## 2. Repository Layout

```
ProposalManagement/
├── apps/
│   ├── api/          BAL — Express 4, TypeScript, AI, PDF export (port 3000/3001)
│   ├── dal/          DAL — Express 4, TypeORM, MySQL CRUD (port 5000, internal only)
│   └── web/          PAL — React 18, Vite, nginx (port 80)
├── packages/
│   ├── database/     TypeORM entities, migrations, seed scripts
│   └── shared-types/ Shared TypeScript types (no runtime code)
├── docs/             This guide and other documentation
├── backups/          Local SQL dumps (git-ignored)
├── docker-compose.yml
├── .env.example      Template — copy to .env and fill in values
├── ARCHITECTURE.md   System design reference
└── CODE_GUIDE.md     Developer patterns reference
```

---

## 3. Local Development (without Docker)

Use this mode for fast iteration — the web dev server hot-reloads on every save.

### 3.1 — Start MySQL

```bash
# Start only the MySQL container from the Compose stack
docker compose up -d mysql
```

MySQL will be reachable at `localhost:3307`.

### 3.2 — Configure environment

```bash
cp .env.example .env
```

Edit `.env` with these values for local dev:

```dotenv
DAL_URL=http://localhost:5000
DAL_API_KEY=local-dev-secret
DAL_PORT=5000

DB_HOST=localhost
DB_PORT=3307
DB_USER=root
DB_PASSWORD=
DB_NAME=biopropose

NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173

AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen3:4b
OLLAMA_EMBED_MODEL=nomic-embed-text

QDRANT_URL=http://localhost:6333
```

### 3.3 — Install dependencies

```bash
npm install          # installs all workspaces from root
```

### 3.4 — Run database migrations

```bash
npm run migration:run -w @biopropose/database
```

### 3.5 — Seed reference data (optional)

```bash
npm run seed -w @biopropose/database
```

### 3.6 — Start all services in separate terminals

```bash
# Terminal 1 — DAL
npm run dev -w dal

# Terminal 2 — BAL (API)
npm run dev -w api

# Terminal 3 — Web (Vite dev server)
npm run dev -w web
```

| Service | URL |
|---------|-----|
| Web UI | http://localhost:5173 |
| BAL API | http://localhost:3000 |
| DAL (internal) | http://localhost:5000 |
| MySQL | localhost:3307 |

### 3.7 — Pull Ollama models (first time)

```bash
ollama pull qwen3:4b
ollama pull nomic-embed-text
```

---

## 4. Docker Compose — Single Server

This is the standard deployment. All four tiers run in isolated networks with health-check gating.

### 4.1 — Clone and configure

```bash
git clone https://github.com/durgamp/Proposalmgmt_final_28Apr26.git biopropose
cd biopropose
cp .env.example .env
```

Open `.env` and fill in every required value (see [Section 5](#5-environment-variables-reference)).

### 4.2 — Generate a strong DAL API key

```bash
# Linux/macOS
openssl rand -hex 32

# Windows PowerShell
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

Set the result as `DAL_API_KEY` in `.env`. The same value must appear in **both** the `dal` and `api` service sections — it is the shared secret that authenticates every BAL→DAL call.

### 4.3 — Start Qdrant and Ollama on the host

```bash
# Qdrant
docker run -d --name qdrant -p 6333:6333 -v qdrant_storage:/qdrant/storage qdrant/qdrant

# Ollama (Linux)
curl -fsSL https://ollama.com/install.sh | sh
ollama serve &
ollama pull qwen3:4b
ollama pull nomic-embed-text
```

### 4.4 — Build and start the stack

```bash
docker compose up --build -d
```

Startup order enforced by health-check `depends_on`:

```
mysql (healthy) → migrate (exits 0) → dal (healthy) → api (healthy) → web
```

First build takes 3–5 minutes (downloads base images, compiles TypeScript).

### 4.5 — Verify the stack

```bash
docker compose ps            # all services should show "healthy" or "exited (0)"
docker compose logs -f api   # watch BAL logs
docker compose logs -f dal   # watch DAL logs
```

Open http://localhost — the BioPropose login page should load.

### 4.6 — Manage the stack

```bash
# Stop without removing data
docker compose stop

# Stop and remove containers (data volumes survive)
docker compose down

# Stop and remove containers AND all data (destructive!)
docker compose down -v

# Rebuild after a code change
docker compose up --build -d

# View logs for a specific service
docker compose logs -f api
docker compose logs -f dal
docker compose logs -f mysql
```

### 4.7 — Port mapping summary

| External port | Internal | Service |
|--------------|----------|---------|
| 80 | 80 | PAL nginx (web UI) |
| 4000 | 3000 | BAL REST API |
| 4001 | 3001 | BAL Yjs WebSocket |
| 3307 | 3306 | MySQL (dev only — remove in prod) |

> `DAL port 5000` is **never** exposed externally. It is reachable only on the internal `app-net` Docker network.

---

## 5. Environment Variables Reference

Copy `.env.example` to `.env`. All variables with `:-` defaults are optional.

### DAL connection (BAL reads these)

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `DAL_URL` | Yes | `http://dal:5000` | BAL→DAL base URL (use service name in Compose) |
| `DAL_API_KEY` | Yes | `<random 32-byte hex>` | Shared secret; DAL rejects requests without it |

### DAL service (DAL reads these)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DAL_PORT` | No | `5000` | Port the DAL listens on |
| `DB_TYPE` | Yes | `mysql` | Database type |
| `DB_HOST` | Yes | `mysql` | Hostname (service name in Compose) |
| `DB_PORT` | Yes | `3306` | Database port |
| `DB_USER` | Yes | `root` | Database user |
| `DB_PASSWORD` | No | `` | Database password (blank = no password) |
| `DB_NAME` | Yes | `biopropose` | Database name |
| `DB_SSL` | No | `false` | Enable TLS to DB |
| `DB_POOL_MAX` | No | `20` | Max connection pool size |
| `DB_POOL_MIN` | No | `5` | Min connection pool size |

### BAL service (API reads these)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `production` | Runtime mode |
| `PORT` | No | `3000` | BAL HTTP port |
| `CORS_ORIGIN` | No | `http://localhost` | Allowed CORS origin |

### AI provider

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AI_PROVIDER` | No | `ollama` | `ollama` or `claude` |
| `OLLAMA_BASE_URL` | If Ollama | `http://host.docker.internal:11434` | Ollama API URL |
| `OLLAMA_MODEL` | If Ollama | `qwen3:4b` | LLM model name |
| `OLLAMA_EMBED_MODEL` | If Ollama | `nomic-embed-text` | Embedding model |
| `OLLAMA_TIMEOUT` | No | `120000` | Request timeout (ms) |
| `ANTHROPIC_API_KEY` | If Claude | — | Anthropic API key |
| `CLAUDE_MODEL` | If Claude | `claude-sonnet-4-6` | Claude model ID |

### Vector DB

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `QDRANT_URL` | No | `http://host.docker.internal:32768` | Qdrant HTTP API URL |

### Export

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EXPORT_DIR` | No | `/app/exports` | Path for generated files |
| `EXPORT_TIMEOUT` | No | `30000` | Puppeteer timeout (ms) |
| `PUPPETEER_HEADLESS` | No | `true` | Run Chrome headless |

### Email

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EMAIL_TRANSPORT` | No | `console` | `console`, `smtp`, `sendgrid`, or `ses` |
| `EMAIL_FROM` | No | `noreply@biopropose.local` | Sender address |
| `SMTP_HOST` | If SMTP | — | SMTP server hostname |
| `SMTP_PORT` | If SMTP | `587` | SMTP port |
| `SMTP_USER` | If SMTP | — | SMTP username |
| `SMTP_PASS` | If SMTP | — | SMTP password |
| `SENDGRID_API_KEY` | If SendGrid | — | SendGrid API key |

### AWS (SES email or S3 storage)

| Variable | Required | Description |
|----------|----------|-------------|
| `AWS_ACCESS_KEY_ID` | If SES/S3 | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | If SES/S3 | AWS secret key |
| `AWS_REGION` | If SES/S3 | AWS region (e.g. `us-east-1`) |
| `AWS_S3_BUCKET` | If S3 storage | S3 bucket name |

### Storage

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `STORAGE_TYPE` | No | `local` | `local` or `s3` |

### Logging & monitoring

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LOG_LEVEL` | No | `info` | `debug`, `info`, `warn`, `error` |
| `LOG_FORMAT` | No | `json` | `json` (prod) or `pretty` (dev) |
| `SENTRY_DSN` | No | — | Sentry DSN — leave blank to disable |

### Salesforce integration

| Variable | Required | Description |
|----------|----------|-------------|
| `SFDC_CLIENT_ID` | Enables feature | Connected App consumer key — feature disabled when absent |
| `SFDC_CLIENT_SECRET` | If SFDC | Connected App consumer secret |
| `SFDC_USERNAME` | If SFDC | Salesforce username |
| `SFDC_PASSWORD` | If SFDC | Salesforce password |
| `SFDC_LOGIN_URL` | No | `https://login.salesforce.com` |
| `SFDC_API_VERSION` | No | `v59.0` |
| `SFDC_OPP_SEARCH_FIELD` | No | `Name` |

### Frontend (Vite build-time args)

These are passed as Docker build args, not runtime env vars. Set them in `.env` — Docker Compose passes them to the web image build automatically.

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:4000` | Browser-visible BAL API URL |
| `VITE_WS_URL` | `ws://localhost:4001` | Browser-visible WebSocket URL |

---

## 6. AI Provider Configuration

Switch between providers with a single env var — no code changes or image rebuild required (the containers just restart).

### Option A — Ollama (default, local, free)

```dotenv
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://host.docker.internal:11434
OLLAMA_MODEL=qwen3:4b
OLLAMA_EMBED_MODEL=nomic-embed-text
OLLAMA_TIMEOUT=120000
```

Pull the models before starting the stack:

```bash
ollama pull qwen3:4b
ollama pull nomic-embed-text
```

Recommended models by hardware:

| GPU VRAM | Draft model | Notes |
|----------|-------------|-------|
| 4 GB | `qwen3:1.7b` | Minimum viable |
| 8 GB | `qwen3:4b` | Recommended default |
| 16 GB | `qwen3:8b` | Higher quality |
| 24 GB+ | `qwen3:14b` | Best quality |

### Option B — Claude (Anthropic API, highest quality)

```dotenv
AI_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-your-key-here
CLAUDE_MODEL=claude-sonnet-4-6
```

To switch a running stack:

```bash
# Edit .env, then restart only the api service
docker compose up -d api
```

---

## 7. Health Checks

Every service exposes a `/health` endpoint. Docker Compose polls them and will restart unhealthy containers.

| Service | Health endpoint | Check interval |
|---------|----------------|---------------|
| DAL | `GET http://dal:5000/health` (requires `x-dal-api-key` header) | 20s |
| BAL | `GET http://localhost:3000/health` | 30s |
| Web | `wget http://127.0.0.1:80` | 30s |
| MySQL | `mysqladmin ping` | 10s |

### Manual health check

```bash
# BAL
curl http://localhost:4000/health

# DAL (replace KEY with your DAL_API_KEY value)
curl -H "x-dal-api-key: KEY" http://localhost:5000/health

# Web
curl -I http://localhost
```

Expected response from BAL:

```json
{ "status": "ok", "uptime": 3421.5 }
```

---

## 8. Database Migrations

Migrations run automatically in the `migrate` one-shot service before the DAL starts. They are idempotent — re-running them is safe.

### Running migrations manually

```bash
# Inside Docker network
docker compose run --rm migrate

# Outside Docker (local dev)
npm run migration:run -w @biopropose/database
```

### Generating a new migration

```bash
# Local dev only
npm run migration:generate -w @biopropose/database -- --name=AddMyNewColumn
```

The generated file appears in `packages/database/src/migrations/`. Commit it — the `migrate` service will run it on next deployment.

### Seeding reference data

```bash
# Seed proposal templates and sample data
npm run seed -w @biopropose/database
```

---

## 9. Backup and Restore

### Create a backup

```bash
# Docker Compose stack
docker exec biopropose-mysql mysqldump \
  -u root \
  --no-tablespaces \
  --single-transaction \
  --routines \
  --triggers \
  biopropose > backups/biopropose-$(date +%Y%m%d-%H%M%S).sql

echo "Backup size: $(du -h backups/*.sql | tail -1)"
```

### Restore from backup

```bash
# Stop the api and dal containers first to prevent writes during restore
docker compose stop api dal

docker exec -i biopropose-mysql mysql -u root biopropose < backups/biopropose-YYYYMMDD-HHMMSS.sql

# Restart services
docker compose start dal api
```

### Automated daily backups (cron)

Add to host crontab (`crontab -e`):

```cron
0 2 * * * cd /opt/biopropose && docker exec biopropose-mysql mysqldump -u root --no-tablespaces --single-transaction biopropose > backups/biopropose-$(date +\%Y\%m\%d).sql && find backups/ -name '*.sql' -mtime +30 -delete
```

This runs at 02:00 daily and prunes backups older than 30 days.

---

## 10. Production Checklist

Complete every item before going live.

### Security

- [ ] Generate a strong `DAL_API_KEY` (`openssl rand -hex 32`) — never use the example value
- [ ] Set a strong `DB_PASSWORD` — never deploy with an empty password
- [ ] Remove the MySQL external port mapping (`3307:3306`) from `docker-compose.yml`
- [ ] Set `CORS_ORIGIN` to your actual frontend domain (not `*`)
- [ ] Set `NODE_ENV=production` for all services
- [ ] Enable `DB_SSL=true` if MySQL is on a separate host
- [ ] Store all secrets in a secrets manager (AWS Secrets Manager, HashiCorp Vault, Docker secrets) — never commit `.env`
- [ ] Rotate `ANTHROPIC_API_KEY` after any suspected exposure

### Reliability

- [ ] Configure a real `EMAIL_TRANSPORT` (smtp / sendgrid / ses) — `console` drops all emails
- [ ] Set `SENTRY_DSN` for error tracking
- [ ] Set `LOG_FORMAT=json` and ship logs to a centralised log aggregator (CloudWatch, Datadog, Loki)
- [ ] Configure automated daily backups (see [Section 9](#9-backup-and-restore))
- [ ] Set up a health-check monitor (UptimeRobot, Pingdom) against `GET /health`

### Performance

- [ ] Tune `DB_POOL_MAX` / `DB_POOL_MIN` to match your DB server capacity
- [ ] Set `EXPORT_TIMEOUT` high enough for large proposals (default 30 s)
- [ ] For >20 concurrent users, move Qdrant to a dedicated host

### Infrastructure

- [ ] Place a TLS-terminating reverse proxy (nginx, Caddy, ALB) in front of port 80
- [ ] Set `VITE_API_URL` and `VITE_WS_URL` to your actual public HTTPS/WSS URLs at build time
- [ ] Persistent volumes (`mysql_data`, `exports_data`) are stored on a host path or cloud volume — confirm they survive VM reboots

---

## 11. Multi-Server / Cloud Deployment

For high-availability deployments, each tier runs on separate infrastructure.

### Network diagram

```
Internet
   │ HTTPS :443
   ▼
[Load Balancer / CDN]
   │
   ├── /            → [PAL — nginx, 2+ replicas, stateless]
   │
   └── /api/*       → [BAL — Node.js, 2+ replicas, stateless]
        │
        └── [DAL — internal only, 1-2 replicas]
              │
              └── [MySQL — RDS / Aurora, or self-hosted with replication]
```

### Recommended AWS architecture

| Tier | Service | Notes |
|------|---------|-------|
| PAL | CloudFront + S3, or ECS Fargate | Serve Vite dist; no backend needed |
| BAL | ECS Fargate (2+ tasks, `--cpu 512 --memory 1024`) | Stateless; scale horizontally |
| DAL | ECS Fargate (2 tasks) or single EC2 in private subnet | Private subnet, no internet route |
| MySQL | RDS MySQL 8.0 (`db.t3.medium` minimum), Multi-AZ | Enable automated backups |
| Qdrant | EC2 `r6i.large` or Qdrant Cloud | Requires persistent storage |
| Ollama | EC2 `g4dn.xlarge` (GPU) or skip in favour of Claude | Expensive; Claude API is simpler |

### Key configuration differences vs single-server

1. **DAL URL**: set `DAL_URL` to the DAL's internal ECS service discovery DNS, e.g. `http://dal.biopropose.internal:5000`
2. **DB host**: set `DB_HOST` to the RDS endpoint, `DB_SSL=true`
3. **Qdrant**: set `QDRANT_URL` to the Qdrant host's private IP
4. **Ollama**: set `OLLAMA_BASE_URL` to the GPU host's private IP, or switch to `AI_PROVIDER=claude`
5. **Exports volume**: use `STORAGE_TYPE=s3` with an S3 bucket; the local `exports_data` volume is per-container and loses files on restart
6. **Session stickiness**: Yjs WebSocket sessions require sticky routing. Configure ALB with `stickiness.type=lb_cookie` for port 4001/3001

### Kubernetes (Helm)

A Helm chart is not bundled, but the Docker images are self-contained. Use these resource requests as a starting point:

```yaml
# BAL
resources:
  requests: { cpu: "250m", memory: "512Mi" }
  limits:   { cpu: "1000m", memory: "1Gi" }

# DAL
resources:
  requests: { cpu: "100m", memory: "256Mi" }
  limits:   { cpu: "500m", memory: "512Mi" }
```

Configure a `NetworkPolicy` to restrict DAL to BAL-only ingress (mirrors the Docker `app-net` isolation).

---

## 12. Upgrading

### Standard upgrade (Docker Compose)

```bash
# 1. Pull latest code
git pull origin main

# 2. Rebuild images
docker compose build --no-cache

# 3. Stop the stack
docker compose down

# 4. Take a backup before migrating
docker exec biopropose-mysql mysqldump -u root --single-transaction biopropose > backups/pre-upgrade-$(date +%Y%m%d).sql

# 5. Start — the migrate service runs automatically before the DAL starts
docker compose up -d

# 6. Verify
docker compose ps
curl http://localhost:4000/health
```

### Zero-downtime upgrade (blue-green)

1. Build the new images and tag them (e.g. `biopropose-api:v2`)
2. Stand up a second Compose stack on a different port range (`-p biopropose-v2`)
3. Run migrations against the same DB from the new migrate container
4. Switch the load balancer to route traffic to v2
5. Stop the v1 stack once v2 is verified healthy

### Rolling back

```bash
# Roll back to a previous git tag
git checkout v1.2.3
docker compose up --build -d
```

If the new migration is destructive, restore from the pre-upgrade backup (see [Section 9](#9-backup-and-restore)) before rolling back the code.

---

## 13. Troubleshooting

### Container not starting

```bash
# Check all service statuses
docker compose ps

# View logs for a specific service
docker compose logs --tail=100 api
docker compose logs --tail=100 dal
docker compose logs --tail=100 mysql
```

### `migrate` service keeps restarting

The migration service exits with code 0 on success and non-zero on failure. If it keeps exiting non-zero:

```bash
docker compose logs migrate
```

Common causes:
- MySQL is not yet healthy — wait for the `mysql` container to show `(healthy)` before retrying
- Migration SQL error — check the log for the failing statement

### DAL health check failing

```bash
docker compose logs dal
# Look for: "DAL listening on port 5000" — if absent, the process crashed
```

The DAL health check passes `x-dal-api-key` inline. If the key is wrong the check returns 401 and Docker marks the container unhealthy. Verify `DAL_API_KEY` matches in both `.env` sections.

### API returns `503 DAL unavailable`

The BAL could not reach the DAL. Check:

1. `docker compose ps dal` — is it healthy?
2. `DAL_URL` in `.env` matches the service name (`http://dal:5000` in Compose, or the actual host in multi-server)
3. `DAL_API_KEY` on BAL matches `DAL_API_KEY` on DAL

### AI generation returns empty / error

```bash
docker compose logs api | grep AI
```

- `AI_PROVIDER=ollama` — confirm Ollama is running on the host: `curl http://localhost:11434/api/tags`
- Model not pulled: `ollama pull qwen3:4b && ollama pull nomic-embed-text`
- `AI_PROVIDER=claude` — verify `ANTHROPIC_API_KEY` is set and valid

### PDF export fails

```bash
docker compose logs api | grep -i puppet
```

The BAL container includes Chromium (`/usr/bin/chromium-browser`). If export fails:
- Increase `EXPORT_TIMEOUT` (default 30 000 ms)
- Ensure the container has at least 512 MB RAM (`--memory` in deploy resources)
- The container must run with `seccomp=unconfined` or the default Docker profile — the `--no-sandbox` Chromium flag is set automatically

### MySQL connection refused

Verify MySQL is healthy before the DAL tries to connect:

```bash
docker compose ps mysql           # should show (healthy)
docker exec biopropose-mysql mysqladmin ping -h localhost
```

If MySQL shows `(starting)`, the DAL will keep retrying. Wait 30–60 seconds on first boot (InnoDB initialises the buffer pool).

### Web UI shows blank page / API errors

Check that `VITE_API_URL` was set correctly **at build time**:

```bash
docker compose build --build-arg VITE_API_URL=http://your-server:4000 web
```

Vite bakes the URL into the static bundle. Changing the env var after the build has no effect — you must rebuild.

### View all running container resource usage

```bash
docker stats --no-stream
```

---

*Last updated: 2026-04-28 | BioPropose v2*
