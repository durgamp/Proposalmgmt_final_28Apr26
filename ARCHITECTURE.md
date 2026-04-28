# BioPropose — Architecture & Code Guide

BioPropose is a GxP-compliant, biologics proposal management platform built as an **npm monorepo** with a strict **4-tier distributed architecture**: Presentation (PAL) → Business Logic (BAL) → Data Access (DAL) → Database. Every tier runs as an independent Docker container and communicates exclusively through versioned REST APIs.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Monorepo Structure](#2-monorepo-structure)
3. [Tier Descriptions](#3-tier-descriptions)
4. [Network Topology & Security](#4-network-topology--security)
5. [Docker Deployment](#5-docker-deployment)
6. [DAL Internal API Reference](#6-dal-internal-api-reference)
7. [BAL Public API Reference](#7-bal-public-api-reference)
8. [Data Model](#8-data-model)
9. [5-Stage Workflow](#9-5-stage-workflow)
10. [AI Draft Generation](#10-ai-draft-generation)
11. [Real-time Collaboration](#11-real-time-collaboration)
12. [Technology Stack](#12-technology-stack)
13. [Configuration Reference](#13-configuration-reference)
14. [Development Setup](#14-development-setup)
15. [Production Deployment](#15-production-deployment)
16. [Scaling Guide](#16-scaling-guide)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│  BROWSER                                                            │
│  React 18 SPA (TipTap, Yjs, React Query, Zustand)                  │
└──────────────┬──────────────────────────────┬───────────────────────┘
               │ HTTP/REST (/api/*)            │ WebSocket (/ws/*)
               ▼                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  PAL — Presentation Access Layer                                 │
│  apps/web  |  nginx:1.27  |  Port 80                            │
│  • Serves static React build                                     │
│  • Reverse-proxies /api/* → BAL :3000                           │
│  • Reverse-proxies /ws/*  → BAL :3001 (WebSocket upgrade)       │
└──────────────────────┬───────────────────────────────────────────┘
                       │ pub-net (Docker bridge)
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│  BAL — Business Access Layer                                     │
│  apps/api  |  Express 4 + TypeScript  |  Port 3000/3001         │
│  • Business rules, validation (Zod), stage gating               │
│  • AI orchestration (Claude / Ollama) + RAG (Qdrant)            │
│  • PDF/Word export (Puppeteer/Chromium)                         │
│  • Yjs WebSocket server (real-time collaboration)               │
│  • Calls DAL for ALL data operations — never touches DB         │
└──────────────────────┬───────────────────────────────────────────┘
                       │ app-net (Docker internal — no internet)
                       │ Header: x-dal-api-key
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│  DAL — Data Access Layer                                         │
│  apps/dal  |  Express 4 + TypeORM  |  Port 5000 (internal only) │
│  • Owns ALL database credentials                                 │
│  • Thin CRUD + query layer (no business logic)                  │
│  • Pessimistic write locks for atomic amendments                 │
│  • Reachable only from BAL via internal Docker network          │
└──────────────────────┬───────────────────────────────────────────┘
                       │ db-net (Docker internal — no internet)
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│  DATABASE                                                        │
│  MySQL 8.0  |  Port 3306 (internal only, 3307 dev only)         │
│  • 9 tables: proposals, sections, costs, timelines,             │
│    comments, templates, audit_logs, exported_files              │
│  • Persistent volume: mysql_data                                │
│  • Reachable only from DAL and migration runner                 │
└──────────────────────────────────────────────────────────────────┘

                    External Services (host network)
                    ┌───────────┐  ┌────────────┐  ┌──────────┐
                    │  Ollama   │  │   Qdrant   │  │ Anthropic│
                    │ :11434    │  │  :32768    │  │  Claude  │
                    │(embeddings│  │ (vector DB │  │   API    │
                    │ + LLM)    │  │  for RAG)  │  │          │
                    └───────────┘  └────────────┘  └──────────┘
```

---

## 2. Monorepo Structure

```
biopropose/
├── apps/
│   ├── web/                        # PAL — React SPA
│   │   ├── src/
│   │   │   ├── components/         # UI: editor, cost, proposals, analytics
│   │   │   │   └── editor/         # TipTap + AI panel + collaboration
│   │   │   ├── pages/              # Route-level page components
│   │   │   ├── hooks/              # React Query hooks (useSections, etc.)
│   │   │   ├── services/api.ts     # Typed axios client (all HTTP calls)
│   │   │   └── stores/             # Zustand: authStore, proposalStore
│   │   ├── nginx.conf              # Reverse proxy + SSE + WS support
│   │   └── Dockerfile              # 2-stage: node builder → nginx runner
│   │
│   ├── api/                        # BAL — Business Logic (Express)
│   │   ├── src/
│   │   │   ├── clients/
│   │   │   │   ├── dal.client.ts   # HTTP client to DAL (all DB calls)
│   │   │   │   └── qdrant.client.ts# Vector DB client
│   │   │   ├── config/             # env.ts (Zod-validated), logger, sentry
│   │   │   ├── controllers/        # Thin route handlers (delegate to services)
│   │   │   ├── middleware/         # errorHandler, requestId, requestLogger
│   │   │   ├── routes/             # Express routers per domain
│   │   │   ├── services/
│   │   │   │   ├── ai.service.ts           # LLM orchestration + context
│   │   │   │   ├── proposal.service.ts     # Stage gating, amendments
│   │   │   │   ├── section.service.ts      # Section CRUD + locking
│   │   │   │   ├── export.service.ts       # PDF/Word generation
│   │   │   │   ├── vectorSync.service.ts   # Qdrant sync (RAG indexing)
│   │   │   │   ├── historicalContext.service.ts  # RAG retrieval
│   │   │   │   ├── analytics.service.ts    # KPI aggregation
│   │   │   │   ├── audit.service.ts        # Immutable audit log
│   │   │   │   ├── email.service.ts        # Nodemailer dispatch
│   │   │   │   ├── sfdc.service.ts         # Salesforce lookup
│   │   │   │   └── providers/
│   │   │   │       ├── claude.provider.ts  # Anthropic SDK
│   │   │   │       └── ollama.provider.ts  # Local Ollama HTTP
│   │   │   ├── validators/         # Zod schemas (AiDraftDto, etc.)
│   │   │   ├── ws/server.ts        # Yjs WebSocket server
│   │   │   ├── app.ts              # Express setup (CORS, helmet, rate-limit)
│   │   │   └── index.ts            # Bootstrap (no DB init — BAL is DB-free)
│   │   └── Dockerfile              # 3-stage + Chromium for Puppeteer
│   │
│   └── dal/                        # DAL — Data Access (Express + TypeORM)
│       ├── src/
│       │   ├── middleware/
│       │   │   └── apiKey.ts       # x-dal-api-key enforcement
│       │   ├── routes/             # proposals, sections, costs, comments,
│       │   │                       # templates, audit-logs, analytics, exports
│       │   ├── app.ts              # Express setup (API key on ALL routes)
│       │   └── index.ts            # Bootstrap (initializes AppDataSource)
│       └── Dockerfile              # 3-stage: deps → builder → runner
│
├── packages/
│   ├── shared-types/               # Shared enums + TypeScript interfaces
│   │   └── src/index.ts            # ProposalStatus, SectionKey, AuditAction…
│   │
│   └── database/                   # TypeORM entities + migrations + seed
│       └── src/
│           ├── entities/           # 9 entity classes (all with audit fields)
│           ├── migrations/         # Versioned schema changes
│           ├── data-source.ts      # AppDataSource (MySQL/Postgres/MSSQL)
│           ├── migrate.ts          # Migration runner (used by Docker service)
│           └── seed.ts             # 11 default proposal templates
│
├── docker-compose.yml              # Complete 5-service orchestration
├── package.json                    # npm workspaces root
├── tsconfig.base.json              # Shared TypeScript config
└── ARCHITECTURE.md                 # This file
```

---

## 3. Tier Descriptions

### PAL — `apps/web` (Presentation Access Layer)

The PAL is a **React 18 Single-Page Application** compiled by Vite and served by **nginx**. It has no server-side rendering. In production, the Docker container is a pure nginx static file server with a reverse-proxy configuration:

- All `/api/*` requests are forwarded to the BAL (with SSE/streaming support and `proxy_buffering off`)
- All `/ws/*` WebSocket upgrades are forwarded to the BAL's Yjs server
- SPA routing: all non-asset paths fall through to `index.html`

The PAL never communicates with the DAL or the database directly. It only calls the BAL's public REST API.

**Key design choices:**
- **TanStack React Query** manages all server state with 30s stale-time and background refetching
- **Zustand** stores hold session identity (`authStore`) and UI state (`proposalStore`)
- **Yjs + y-websocket** enables conflict-free concurrent editing of proposal sections
- **TipTap** is the rich text editor; section content is stored and transferred as TipTap ProseMirror JSON

### BAL — `apps/api` (Business Access Layer)

The BAL is an **Express 4 + TypeScript** application that owns all business logic. It has **no database credentials** — all data operations go through the DAL's REST API via `apps/api/src/clients/dal.client.ts`.

Responsibilities:
- Input validation (Zod schemas in `validators/`)
- Business rules: stage advancement gating, amendment reservation, clone logic
- AI draft generation: builds prompts with stateful context (sibling sections + template structure + RAG examples), calls Claude or Ollama
- PDF/Word export via headless Chromium (Puppeteer)
- Qdrant vector sync for RAG (fired after every section save, non-blocking)
- Rate limiting: 300 req/min general, 20 req/min AI, 10 req/min exports
- Correlation IDs on every request for distributed tracing

**Security applied at the BAL:**
- Helmet headers (CSP, HSTS, X-Frame-Options, noSniff)
- CORS: strict allowlist in production, any `localhost:*` in dev
- Request timeouts: 30s general, 3min AI stream, 5min exports

### DAL — `apps/dal` (Data Access Layer)

The DAL is an **Express 4 + TypeORM** application that is the **sole owner of database credentials**. It listens on port 5000 and is only reachable on the internal Docker `app-net` network — never exposed to the public internet.

Every request must carry the `x-dal-api-key` header. Missing or wrong key → 401. Unconfigured key → 503. This prevents any service that isn't the BAL from calling the DAL.

Responsibilities:
- Thin CRUD layer (no business logic, no Zod validation)
- TypeORM repositories for all 9 entities
- Pessimistic write locks for concurrent amendment reservation
- Full-text search via SQL LIKE on proposal name/client/code
- Atomic timeline replacement (stages + activities in a single transaction)

### Database — MySQL 8.0

MySQL runs on the internal `db-net` network, reachable only by the DAL and the migration runner. It is never exposed to `app-net` or `pub-net`. A named Docker volume (`mysql_data`) persists data across container restarts.

The schema is managed exclusively through TypeORM migrations in `packages/database/src/migrations/`. A dedicated one-shot `migrate` Docker service runs migrations at startup before the DAL is allowed to start.

---

## 4. Network Topology & Security

```
Internet / Browser
        │
        ▼ :80
┌──────────────┐
│   pub-net    │  ← only web and api containers are attached
│  (bridge)    │
└──────┬───────┘
       │  api:3000 (REST), api:3001 (WS)
       ▼
┌──────────────┐
│   app-net    │  ← internal bridge, no internet route
│  (internal)  │  ← only api and dal containers are attached
└──────┬───────┘
       │  dal:5000  +  Header: x-dal-api-key
       ▼
┌──────────────┐
│   db-net     │  ← internal bridge, no internet route
│  (internal)  │  ← only mysql, dal, migrate containers
└──────┬───────┘
       │  mysql:3306
       ▼
   MySQL 8.0
```

**Threat model enforcement by Docker networking:**

| Attacker position | Can reach MySQL? | Can reach DAL? | Can reach BAL? |
|-------------------|------------------|----------------|----------------|
| Public internet   | No               | No             | Yes (port 80 via nginx) |
| Web container     | No               | No             | Yes (pub-net)  |
| BAL container     | No               | Yes (app-net + API key) | — |
| DAL container     | Yes (db-net)     | —              | No             |
| MySQL container   | —                | No             | No             |

Even if the web container is compromised, the attacker cannot reach the DAL or MySQL — the network routes simply do not exist.

---

## 5. Docker Deployment

### Services

| Service     | Image          | Port (host→container) | Networks              | Restarts       |
|-------------|----------------|------------------------|-----------------------|----------------|
| `mysql`     | mysql:8.0      | 3307→3306 (dev only)   | db-net                | unless-stopped |
| `migrate`   | api image      | —                      | db-net                | no (one-shot)  |
| `dal`       | dal image      | internal only          | db-net + app-net      | unless-stopped |
| `api`       | api image      | 4000→3000, 4001→3001   | app-net + pub-net     | unless-stopped |
| `web`       | web image      | 80→80                  | pub-net               | unless-stopped |

### Startup order (enforced by `depends_on` + health checks)

```
mysql (healthy)
    └─▶ migrate (runs migrations, exits 0)
            └─▶ dal (healthy — HTTP /health must return 200)
                    └─▶ api (healthy — HTTP /health must return 200)
                            └─▶ web
```

### Build stages

All three application images use **multi-stage Dockerfiles** to produce lean production images:

1. **deps stage** — Install only the packages needed for this service
2. **builder stage** — Compile TypeScript → JavaScript
3. **runner stage** — Copy compiled `dist/` only, reinstall `--omit=dev`

The `api` runner additionally installs `chromium`, `nss`, `freetype`, `harfbuzz`, and font packages for Puppeteer PDF generation.

### Running locally

```bash
# Copy and edit environment
cp .env.example .env          # set DB_PASSWORD, DAL_API_KEY, ANTHROPIC_API_KEY

# First run (builds all images, runs migrations, seeds)
docker compose up --build

# Subsequent runs
docker compose up -d

# View logs
docker compose logs -f api
docker compose logs -f dal

# Run database seed (after first migration)
docker compose exec dal node packages/database/dist/seed.js
```

---

## 6. DAL Internal API Reference

All endpoints require header: `x-dal-api-key: <secret>`

Base URL (internal): `http://dal:5000`

### Health
```
GET  /health                              → { status: "ok" }
```

### Proposals
```
GET    /proposals?search=&status=&stage=&sortBy=&sortOrder=&page=&limit=
POST   /proposals                          Body: ProposalRow fields
GET    /proposals/by-code/:code
GET    /proposals/historical/sent          → [{id, client, businessUnit, templateType}]
POST   /proposals/historical/sections      Body: { proposalIds: string[] }
GET    /proposals/:id                      → Proposal + sections + exportedFiles relations
PATCH  /proposals/:id                      Body: Partial<ProposalRow>
POST   /proposals/:id/reserve-revision     → { revisionNumber: number }
                                           (pessimistic lock, atomic counter)
```

### Sections
```
GET    /sections/by-proposal/:proposalId   → SectionRow[] ordered by sortOrder
GET    /sections/by-proposal/:proposalId/key/:sectionKey
PATCH  /sections/by-proposal/:proposalId/key/:sectionKey
POST   /sections/batch                     Body: Partial<SectionRow>[]  → bulk create
PUT    /sections/batch                     Body: Partial<SectionRow>[]  → bulk update
```

### Costs & Timeline
```
GET    /costs/by-proposal/:proposalId
PUT    /costs/by-proposal/:proposalId      Body: CostItemRow[]  (atomic replace)
GET    /costs/stages/by-proposal/:proposalId
GET    /costs/activities/by-proposal/:proposalId
PUT    /costs/timeline/by-proposal/:proposalId
       Body: { stages: StageRow[], activities: ActivityRow[] }  (atomic replace)
```

### Comments
```
GET    /comments/by-proposal/:proposalId?sectionKey=
POST   /comments/by-proposal/:proposalId
GET    /comments/by-proposal/:proposalId/:commentId
PATCH  /comments/by-proposal/:proposalId/:commentId
DELETE /comments/by-proposal/:proposalId/:commentId
```

### Templates
```
GET    /templates
POST   /templates
GET    /templates/:id
PUT    /templates/:id
DELETE /templates/:id
```

### Audit Logs
```
GET    /audit-logs?page=&limit=
POST   /audit-logs
GET    /audit-logs/by-proposal/:proposalId?page=&limit=
```

### Analytics
```
GET    /analytics/kpis?year=&month=&templateType=&proposalManager=
GET    /analytics/stages
GET    /analytics/templates
GET    /analytics/trends?year=
GET    /analytics/costs
GET    /analytics/activity?limit=
```

### Exports
```
GET    /exports/by-proposal/:proposalId
POST   /exports
```

---

## 7. BAL Public API Reference

Base URL: `http://localhost:4000` (direct) or `/api` (via nginx on port 80)

Rate limits: general 300 req/min, AI 20 req/min, exports 10 req/min, SFDC 30 req/min.

### Health
```
GET  /health                              → { status: "ok", timestamp }
```

### Proposals
```
GET    /api/proposals                        ?search=&status=&stage=&sortBy=&sortOrder=&page=&limit=
POST   /api/proposals                        Body: CreateProposalDto
GET    /api/proposals/:id
PUT    /api/proposals/:id                    Body: UpdateProposalDto
DELETE /api/proposals/:id                    Body: { deletedBy }
POST   /api/proposals/:id/advance-stage      Body: { targetStage, reviewType?, updatedBy }
POST   /api/proposals/:id/amendment          Body: AmendmentDto
POST   /api/proposals/:id/reopen             Body: ReopenDto  (mode: clone|revise|new)
```

### Sections
```
GET    /api/proposals/:id/sections
GET    /api/proposals/:id/sections/:sectionKey
PUT    /api/proposals/:id/sections/:sectionKey    Body: UpdateSectionDto
```

### Comments
```
GET    /api/proposals/:id/sections/:key/comments
POST   /api/proposals/:id/sections/:key/comments     Body: CreateCommentDto
PUT    /api/proposals/:id/sections/:key/comments/:commentId
DELETE /api/proposals/:id/sections/:key/comments/:commentId    Body: { userEmail }
```

### Costs & Timeline
```
GET    /api/proposals/:id/costs
POST   /api/proposals/:id/costs              Body: BulkSaveCostsDto
GET    /api/proposals/:id/costs/summary
GET    /api/proposals/:id/costs/timeline
POST   /api/proposals/:id/costs/timeline     Body: BulkSaveStagesDto
```

### Audit
```
GET    /api/proposals/:id/audit?page=&limit=
```

### Exports
```
GET    /api/proposals/:id/exports
POST   /api/proposals/:id/exports/pdf        Body: ExportDto → binary PDF stream
POST   /api/proposals/:id/exports/word       Body: ExportDto → binary DOCX stream
```

### Templates
```
GET    /api/templates
POST   /api/templates
GET    /api/templates/:id
PUT    /api/templates/:id
DELETE /api/templates/:id
```

### Analytics
```
GET    /api/analytics/kpis
GET    /api/analytics/stage-distribution
GET    /api/analytics/template-distribution
GET    /api/analytics/monthly-trends?year=
GET    /api/analytics/cost-summary
GET    /api/analytics/recent-activity?limit=
```

### AI
```
GET    /api/ai/health                        → { available, provider, model }
POST   /api/ai/draft                         Body: AiDraftDto → { content, model }
POST   /api/ai/stream                        Body: AiDraftDto → SSE text/event-stream
POST   /api/ai/sync                          Trigger full Qdrant re-index (background)
GET    /api/ai/sync/status
POST   /api/ai/search                        Body: { query, sectionKey?, limit?, excludeProposalId? }
```

### Salesforce
```
POST   /api/sfdc/lookup                      Body: { searchTerm } → opportunity list
```

---

## 8. Data Model

### Entity Relationships

```
templates            proposals
    │                    │
    │ (category match)   ├──── proposal_sections   (1:many, cascade delete)
    │                    ├──── cost_items           (1:many, cascade delete)
    │                    ├──── project_stages       (1:many, cascade delete)
    │                    │        └── project_activities  (1:many)
    │                    ├──── comments             (1:many, cascade delete)
    │                    ├──── audit_logs           (1:many, nullable proposalId)
    │                    └──── exported_files       (1:many, cascade delete)
    │
    └── (used at proposal creation to pre-populate section content)
```

### Key Entities

**proposals** — The central entity. Key fields:
- `proposalCode` — unique human-readable identifier (e.g. `PROP-2025-001`)
- `method` — `template | clone | scratch | amendment`
- `currentStage` — 1–5 (see Stage Workflow section)
- `status` — `Draft | Review | Sent | Closed`
- `assignedStakeholders` — JSON array of email strings stored as TEXT
- `isAmendment`, `parentProposalId`, `revisionNumber` — amendment tracking

**proposal_sections** — Rich-text content per section:
- `contentJson` — TipTap ProseMirror JSON stored as TEXT
- `sectionKey` — `ceo-letter | executive-summary | scope-of-work | flowchart | project-details | terms-conditions | amendment-details`
- `isComplete`, `isLocked` — gating and protection flags

**templates** — Reusable proposal structures:
- `sectionsJson` — JSON array of `{ sectionKey, title, defaultContent, sortOrder }`
- `category` — matches `proposal.templateType` for context lookup
- Default 11 templates seeded across two business units (Biologics US, Biologics India)

**audit_logs** — Append-only (no `updatedAt` column):
- Records every state change with `userEmail`, `action`, `details`, optional `changes` diff, and `snapshot`
- Actions: CREATED, UPDATED, STAGE_ADVANCED, SECTION_COMPLETED, SECTION_LOCKED, SECTION_UNLOCKED, AI_DRAFT_GENERATED, AMENDED, …

---

## 9. 5-Stage Workflow

```
Stage 1: Draft Creation
  → All sections must be marked isComplete
  → Unlock: manual by Proposal Manager
  ↓
Stage 2: Technical Review
  → Manual advancement
  ↓
Stage 3: PM Review
  → Manual advancement
  ↓
Stage 4: Management Review        ← Parallel gate
  → pmReviewComplete = true
  → managementReviewComplete = true
  → BOTH must be true → auto-advance to Stage 5
  ↓
Stage 5: Client Submission
  → All sections locked (isLocked = true)
  → Proposal status → Sent
  → Can create Amendment (clones content, adds amendment-details section)
  → Can Revise (unlocks, moves back to Stage 4)
```

Stage advancement is validated in `apps/api/src/utils/stageAdvancement.ts`. The BAL enforces these rules; the DAL has no knowledge of them.

**Amendments** use a pessimistic write lock on the source proposal row to atomically reserve the next revision number, ensuring no two concurrent amendment creations get the same revision.

---

## 10. AI Draft Generation

### Context hierarchy (most important → least)

When a user clicks "Generate Draft" for a section, the BAL builds a two-part prompt:

**System message** (injected into the LLM's system role):
- Role definition: "senior scientific writer, CRO/CDMO expert"
- Domain knowledge: scientific terminology, regulatory references for the specific `templateType` (15 domain profiles in `TEMPLATE_DOMAINS`)
- Structural guidance: section-specific formatting rules (CEO letter tone, SOW phase structure, T&C numbering, etc.)

**User message** (built in `buildUserMessage()`):
```
1. CURRENT PROPOSAL CONTEXT
   name, client, businessUnit, templateType, description

2. TEMPLATE STRUCTURE (fetched server-side from DAL)
   List of all sections defined in the matching template
   → gives LLM structural awareness of the full document

3. CURRENT PROPOSAL — ALREADY DRAFTED SECTIONS (fetched server-side from DAL)
   Plain-text preview of every other section already written in this proposal
   → ensures consistent voice, client references, technical assumptions

4. REFERENCE EXAMPLES (RAG — fetched from Qdrant vector DB)
   Top-5 semantically similar sections from past proposals of the same templateType
   → provides stylistic and structural templates from real proposals

5. EXISTING CONTENT TO IMPROVE (optional)
   Current editor content, if the user wants revision rather than fresh generation

6. USER INSTRUCTIONS (optional)
   Free-text instruction from the user (max 1000 chars)

7. TASK + STRUCTURAL GUIDANCE
   Per-section formatting rules
```

All three fetches (historical RAG, sibling sections, template structure) run in **parallel** via `Promise.all` and degrade gracefully on failure (empty string → prompt proceeds without that block).

### RAG pipeline

```
Section saved
    │
    ▼ syncProposalToQdrant() [non-blocking, fires after every save]
    │
    ├─ Fetch proposal + sections from DAL
    ├─ Convert TipTap JSON → plain text (tipTapToText)
    ├─ Embed with Ollama nomic-embed-text (768-dim vectors)
    └─ Upsert into Qdrant (deterministic point ID = sha256(proposalId:sectionKey))

Draft requested
    │
    ▼ getHistoricalExamples()
    │
    ├─ If Qdrant reachable: vector search (cosine) filtered by templateType
    │   Returns top-5 similar sections from SENT proposals
    └─ If Qdrant unreachable: keyword fallback via DAL historical endpoints
```

### AI provider switching

No rebuild required. Set `AI_PROVIDER=claude` and `ANTHROPIC_API_KEY` in `.env`:

| Provider | Config | Used for |
|----------|--------|----------|
| `ollama` | `OLLAMA_BASE_URL`, `OLLAMA_MODEL` | Local inference (default) |
| `claude` | `ANTHROPIC_API_KEY`, `CLAUDE_MODEL` | Anthropic Claude API |

Both providers use the `IAiProvider` interface and support both streaming (SSE) and non-streaming modes.

---

## 11. Real-time Collaboration

The BAL runs a **Yjs y-websocket server** on `PORT+1` (default: 3001) alongside the REST API.

```
Editor opens proposal section
    │
    ▼ new WebsocketProvider(WS_URL, `${proposalId}-${sectionKey}`, ydoc)
    │
    ├─ TipTap Collaboration extension binds ydoc ↔ ProseMirror
    ├─ CollaborationCursor extension syncs cursor positions + user names
    └─ y-websocket server broadcasts CRDT updates to all connected clients
         (Yjs merges concurrent edits with guaranteed convergence)

Session end
    └─ ydoc cleaned up 30s after last client disconnects
```

**Startup seed:** When a section loads, the DB snapshot is pre-seeded into the Yjs document (via `buildYdoc(initialContent)` in `SectionEditor.tsx`) so the editor shows current content before the first WS sync arrives.

---

## 12. Technology Stack

| Tier | Runtime | Key Packages |
|------|---------|--------------|
| PAL (web) | nginx 1.27, Node 20 (build) | React 18, Vite, TipTap, Yjs, TanStack Query, Zustand, Tailwind, Recharts, Axios |
| BAL (api) | Node 20 | Express 4, TypeScript 5, Zod, @anthropic-ai/sdk, Puppeteer, Nodemailer, ws, y-websocket, Helmet, compression, express-rate-limit |
| DAL (dal) | Node 20 | Express 4, TypeScript 5, TypeORM 0.3, mysql2 |
| Database | MySQL 8.0 | mysql_native_password auth |
| Shared | Node 20 | `@biopropose/shared-types`, `@biopropose/database` |
| External AI | — | Ollama (local), Anthropic Claude API |
| Vector DB | — | Qdrant (Docker on host) |
| Embeddings | — | nomic-embed-text via Ollama |

---

## 13. Configuration Reference

All configuration is via environment variables. The BAL validates them at startup with Zod — missing required values or wrong types cause an immediate `process.exit(1)`.

### Core

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | `development` / `production` |
| `PORT` | `3000` | BAL HTTP port |
| `CORS_ORIGIN` | `http://localhost:5173` | Comma-separated allowed origins |

### DAL Connection (BAL)

| Variable | Default | Description |
|----------|---------|-------------|
| `DAL_URL` | `http://dal:5000` | Internal DAL base URL |
| `DAL_API_KEY` | *(required)* | Shared secret; min 8 chars |
| `DAL_PORT` | `5000` | Port the DAL listens on |

### Database (DAL only)

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_TYPE` | `mysql` | `mysql` / `postgres` / `mssql` |
| `DB_HOST` | `localhost` | DB hostname |
| `DB_PORT` | `3306` | DB port |
| `DB_USER` | `root` | DB username |
| `DB_PASSWORD` | *(empty)* | DB password |
| `DB_NAME` | `biopropose` | DB name |
| `DB_SSL` | `false` | Enable SSL for DB connection |
| `DB_POOL_MAX` | `20` | Max connection pool size |
| `DB_POOL_MIN` | `5` | Min connection pool size |

### AI Provider

| Variable | Default | Description |
|----------|---------|-------------|
| `AI_PROVIDER` | `ollama` | `ollama` or `claude` |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama API URL |
| `OLLAMA_MODEL` | `qwen3.5:4b` | LLM model name |
| `OLLAMA_EMBED_MODEL` | `nomic-embed-text` | Embedding model |
| `OLLAMA_TIMEOUT` | `120000` | Generation timeout (ms) |
| `ANTHROPIC_API_KEY` | *(optional)* | Anthropic API key (claude provider) |
| `CLAUDE_MODEL` | `claude-sonnet-4-6` | Claude model ID |
| `QDRANT_URL` | `http://localhost:32768` | Qdrant vector DB URL |

### Email

| Variable | Default | Description |
|----------|---------|-------------|
| `EMAIL_TRANSPORT` | `console` | `smtp` / `sendgrid` / `ses` / `console` |
| `EMAIL_FROM` | `noreply@biopropose.com` | Sender address |
| `SMTP_HOST` | *(optional)* | SMTP server |
| `SMTP_PORT` | `587` | SMTP port |
| `SMTP_USER` | *(optional)* | SMTP username |
| `SMTP_PASS` | *(optional)* | SMTP password |
| `SENDGRID_API_KEY` | *(optional)* | SendGrid key |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION` | *(optional)* | AWS SES |

### Storage & Export

| Variable | Default | Description |
|----------|---------|-------------|
| `STORAGE_TYPE` | `local` | `local` or `s3` |
| `STORAGE_LOCAL_PATH` | `./uploads` | Local upload path |
| `AWS_S3_BUCKET` | *(optional)* | S3 bucket for file storage |
| `EXPORT_DIR` | `./exports` | Directory for generated files |
| `EXPORT_TIMEOUT` | `30000` | Export timeout (ms) |

### Logging & Monitoring

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `info` | `trace/debug/info/warn/error/fatal` |
| `LOG_FORMAT` | `pretty` | `pretty` (dev) or `json` (prod) |
| `SENTRY_DSN` | *(optional)* | Sentry error tracking URL |

### Salesforce Integration

| Variable | Default | Description |
|----------|---------|-------------|
| `SFDC_LOGIN_URL` | `https://login.salesforce.com` | OAuth2 endpoint |
| `SFDC_CLIENT_ID` | *(optional)* | Connected app client ID |
| `SFDC_CLIENT_SECRET` | *(optional)* | Connected app secret |
| `SFDC_USERNAME` | *(optional)* | Service account username |
| `SFDC_PASSWORD` | *(optional)* | Service account password |
| `SFDC_API_VERSION` | `v59.0` | Salesforce API version |
| `SFDC_OPP_SEARCH_FIELD` | `Name` | Opportunity field to search |

### Frontend Build Args

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:4000` | API base URL (baked into build) |
| `VITE_WS_URL` | `ws://localhost:4001` | WebSocket URL (baked into build) |
| `VITE_WS_URL` for nginx routing | `ws://your-host/ws` | Use this when going through nginx |

---

## 14. Development Setup

### Prerequisites

- Node.js 20+
- Docker Desktop
- (Optional) Ollama with `nomic-embed-text` and a chat model
- (Optional) Qdrant running on port 32768

### Local development (without Docker)

```bash
# Install all workspace dependencies
npm install

# Start MySQL via Docker (dev only)
docker run -d --name biopropose-mysql \
  -e MYSQL_ALLOW_EMPTY_PASSWORD=yes \
  -e MYSQL_DATABASE=biopropose \
  -p 3306:3306 mysql:8.0

# Start DAL
npm run dev -w dal

# In a second terminal — start BAL API
npm run dev -w api

# In a third terminal — start Frontend
npm run dev -w web

# Run migrations (first time)
npm run db:migrate -w @biopropose/database

# Seed templates
npm run db:seed -w @biopropose/database
```

### Full Docker stack

```bash
cp .env.example .env
# Edit .env: set DAL_API_KEY to a random string, set ANTHROPIC_API_KEY if using Claude

docker compose up --build        # first time
docker compose up -d             # subsequent
docker compose down              # stop
docker compose down -v           # stop + delete volumes (fresh DB)
```

### Rebuilding after code changes

```bash
docker compose build api         # rebuild BAL only
docker compose build dal         # rebuild DAL only
docker compose up -d --no-deps api  # restart BAL without restarting dependents
```

---

## 15. Production Deployment

### Single-server checklist

1. Set a strong random `DAL_API_KEY` (32+ chars)
2. Set `DB_PASSWORD` for MySQL
3. Set `NODE_ENV=production`
4. Set `CORS_ORIGIN` to your domain (e.g. `https://biopropose.yourcompany.com`)
5. Set `VITE_API_URL=https://biopropose.yourcompany.com` and `VITE_WS_URL=wss://biopropose.yourcompany.com/ws` so nginx handles all traffic through TLS
6. Remove the MySQL `ports:` mapping (`3307:3306`) from `docker-compose.yml` — the DB should never be exposed on a prod server
7. Set `LOG_FORMAT=json` for structured log shipping
8. Set `SENTRY_DSN` if you have error monitoring
9. Mount `exports_data` volume to backed-up storage

### TLS / HTTPS

Add a **reverse-proxy container** (nginx, Traefik, or Caddy) in front of the `web` container to handle TLS termination. The web container serves HTTP on port 80 internally; the reverse proxy terminates HTTPS and forwards to it. Update `CORS_ORIGIN`, `VITE_API_URL`, and `VITE_WS_URL` accordingly.

### Database backup

```bash
# Manual backup
docker exec biopropose-mysql \
  mysqldump -u root biopropose > backup-$(date +%Y%m%d).sql

# Restore
docker exec -i biopropose-mysql \
  mysql -u root biopropose < backup-20250428.sql
```

---

## 16. Scaling Guide

### Stateless services (BAL, DAL)

The BAL and DAL are stateless — they hold no in-memory state beyond in-flight requests. You can run multiple replicas behind a load balancer.

**Caveat:** The Yjs WebSocket server in the BAL is stateful (in-memory Yjs documents). For multi-replica BAL, move real-time collaboration to a dedicated y-websocket service or a hosted provider, and route WebSocket connections to it via sticky sessions or a separate hostname.

### Scaling with Docker Swarm

```yaml
# In docker-compose.yml, add to api service:
deploy:
  replicas: 3
  update_config:
    parallelism: 1
    delay: 10s
  restart_policy:
    condition: on-failure

# In docker-compose.yml, add to dal service:
deploy:
  replicas: 2
```

Then deploy with:
```bash
docker swarm init
docker stack deploy -c docker-compose.yml biopropose
```

### DAL connection pooling

The DAL's MySQL pool (`DB_POOL_MAX=20`) is per-replica. With 2 DAL replicas, MySQL sees up to 40 connections. Adjust `DB_POOL_MAX` and MySQL's `max_connections` accordingly.

### Horizontal scaling considerations

| Tier | Stateless? | Scale method |
|------|-----------|--------------|
| PAL (web) | Yes | Multiple replicas behind L7 LB |
| BAL API (REST) | Yes | Multiple replicas behind L7 LB |
| BAL WebSocket | No | Sticky sessions or dedicated WS service |
| DAL | Yes | Multiple replicas behind internal L4 LB |
| MySQL | No | Read replicas + connection pooler (PgBouncer-style) |

---

*Last updated: 2026-04-28*
