# BioPropose — Code Guide

Practical guide for developers working on the codebase. Covers recurring patterns, step-by-step recipes for common changes, and conventions to follow.

---

## Table of Contents

1. [Patterns at a Glance](#1-patterns-at-a-glance)
2. [BAL Controller Pattern](#2-bal-controller-pattern)
3. [BAL Service Pattern](#3-bal-service-pattern)
4. [Validation with Zod](#4-validation-with-zod)
5. [Error Handling](#5-error-handling)
6. [Audit Logging](#6-audit-logging)
7. [DAL Route Handler Pattern](#7-dal-route-handler-pattern)
8. [DAL Client — Calling the DAL from the BAL](#8-dal-client--calling-the-dal-from-the-bal)
9. [Adding a New Feature End-to-End](#9-adding-a-new-feature-end-to-end)
10. [AI Service — Extending Context](#10-ai-service--extending-context)
11. [Vector Sync — RAG Indexing](#11-vector-sync--rag-indexing)
12. [Frontend — React Query Hooks](#12-frontend--react-query-hooks)
13. [Frontend — API Service Layer](#13-frontend--api-service-layer)
14. [Frontend — State Management](#14-frontend--state-management)
15. [TypeScript Conventions](#15-typescript-conventions)
16. [Environment & Config Validation](#16-environment--config-validation)

---

## 1. Patterns at a Glance

```
Browser (React)
    │  axios /api/*
    ▼
BAL Route  →  Controller  →  Service  →  dal.client.ts  →  HTTP →  DAL Route  →  TypeORM
    │               │             │                                                   │
  Zod schema    AppError      auditService                                        MySQL
  parse         throw           .log()
```

**Golden rules:**
- Every BAL handler validates input with Zod before touching business logic.
- Every BAL service method throws `AppError` for known failures, plain `Error` for unexpected ones.
- Every state-changing BAL operation calls `auditService.log()` (fire-and-forget `.catch()`).
- All database access from the BAL goes through `dal.client.ts` — never import `AppDataSource` in `apps/api`.
- DAL routes are thin CRUD only — no business rules live there.

---

## 2. BAL Controller Pattern

Controllers are thin wrappers. They parse the request, call the service, and return the result. All errors bubble to the global `errorHandler` via `next(err)`.

```typescript
// apps/api/src/controllers/widget.controller.ts

import { Request, Response, NextFunction } from 'express';
import { widgetService } from '../services/widget.service';
import { createWidgetSchema } from '../validators/widget.validators';

export const widgetController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await widgetService.list(req.params.proposalId);
      res.json(items);
    } catch (err) { next(err); }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Validate — throws ZodError on bad input (caught by errorHandler → 400)
      const dto = createWidgetSchema.parse(req.body);
      // 2. Delegate to service
      const created = await widgetService.create(req.params.proposalId, dto);
      res.status(201).json(created);
    } catch (err) { next(err); }
  },
};
```

**Rules:**
- No business logic in controllers — just parse → delegate → respond.
- Always wrap in `try/catch` and forward to `next(err)`.
- Use `req.params.proposalId` for nested routes (Express merges params when `mergeParams: true` is set on the router).

---

## 3. BAL Service Pattern

Services own business rules. They call `dal.client.ts` for data, throw `AppError` for expected failures, and call `auditService.log()` for every mutation.

```typescript
// apps/api/src/services/widget.service.ts

import { dal } from '../clients/dal.client';
import { AppError } from '../middleware/errorHandler';
import { auditService } from './audit.service';
import { AuditAction } from '@biopropose/shared-types';
import type { CreateWidgetDto } from '../validators/widget.validators';

export class WidgetService {
  async list(proposalId: string) {
    // Verify the proposal exists first (throws 404 if not)
    await dal.getProposalById(proposalId);
    return dal.getWidgets(proposalId);
  }

  async create(proposalId: string, dto: CreateWidgetDto) {
    const proposal = await dal.getProposalById(proposalId);

    // Business rule check → throw AppError for known failures
    if (proposal.status === 'Closed') {
      throw new AppError(400, 'Cannot add widgets to a closed proposal', 'PROPOSAL_CLOSED');
    }

    const widget = await dal.createWidget({ proposalId, ...dto });

    // Audit — fire-and-forget; never let audit failure block the response
    auditService.log({
      proposalId,
      userEmail:  dto.createdBy,
      userName:   dto.createdBy,
      action:     AuditAction.UPDATED,
      details:    `Widget "${widget.name}" added`,
    }).catch((err) => logger.warn({ err }, '[Audit] log failed'));

    return widget;
  }
}

export const widgetService = new WidgetService();
```

**Rules:**
- Export a singleton instance (`export const widgetService = new WidgetService()`).
- Use `AppError(statusCode, message, code)` for business errors.
- `AuditAction` enum lives in `@biopropose/shared-types` — add new values there when needed.
- Never call `AppDataSource` or TypeORM directly from services.

---

## 4. Validation with Zod

All DTOs are Zod schemas defined in `apps/api/src/validators/`. The schema is the single source of truth — the TypeScript type is inferred from it.

```typescript
// apps/api/src/validators/widget.validators.ts

import { z } from 'zod';

export const createWidgetSchema = z.object({
  name:        z.string().min(1).max(255),
  value:       z.number().positive(),
  // null/undefined from DB → coerce to undefined so the prompt builder gets a clean value
  description: z.string().nullish().transform((v) => v ?? undefined),
  createdBy:   z.string().email(),
});

export type CreateWidgetDto = z.infer<typeof createWidgetSchema>;
```

**In the controller:**
```typescript
const dto = createWidgetSchema.parse(req.body);
// If validation fails, ZodError is thrown → errorHandler returns 400 with field errors
```

**Rules:**
- Always use `z.infer<typeof schema>` for DTO types — never write them manually.
- Use `.nullish().transform((v) => v ?? undefined)` for DB nullable fields so the business layer sees `string | undefined`, not `string | null | undefined`.
- For enums shared with the frontend, use `z.nativeEnum(MyEnum)` where `MyEnum` is from `@biopropose/shared-types`.

---

## 5. Error Handling

### AppError — expected business errors

```typescript
import { AppError } from '../middleware/errorHandler';

// 404 — not found
throw new AppError(404, 'Proposal not found', 'NOT_FOUND');

// 400 — bad request / business rule violation
throw new AppError(400, 'Stage advancement not allowed: sections incomplete', 'STAGE_ERROR');

// 403 — forbidden
throw new AppError(403, 'This section is locked', 'SECTION_LOCKED');

// 409 — conflict
throw new AppError(409, `Proposal code '${code}' already exists`, 'DUPLICATE_CODE');
```

The `errorHandler` middleware catches `AppError` and returns:
```json
{ "success": false, "error": "...", "code": "...", "requestId": "..." }
```

### DAL errors

The `DalClient.request()` method maps DAL HTTP errors back to `AppError` using the status code and `code` field from the DAL response body. So DAL 404s propagate naturally to the caller.

### Unexpected errors

Any non-`AppError`, non-`ZodError` exception → `errorHandler` logs it, reports to Sentry, and returns a generic 500. Never throw plain strings — always throw `Error` or `AppError`.

---

## 6. Audit Logging

Every create/update/delete/stage-change must produce an audit log entry. Use `auditService.log()` — it is fire-and-forget (returns a Promise, call `.catch()` on it).

```typescript
import { auditService } from './audit.service';
import { AuditAction } from '@biopropose/shared-types';

// Minimal usage
auditService.log({
  proposalId: id,
  userEmail:  dto.updatedBy,
  userName:   dto.updatedBy,
  action:     AuditAction.UPDATED,
  details:    `Field "name" changed from "${old.name}" to "${dto.name}"`,
}).catch((err) => logger.warn({ err }, '[Audit] log failed'));

// With diff payload
auditService.log({
  proposalId,
  userEmail:  dto.updatedBy,
  userName:   dto.updatedBy,
  action:     AuditAction.STAGE_ADVANCED,
  details:    `Stage: Draft Creation → Technical Review`,
  changes:    { from: 1, to: 2 },     // stored as JSON
  snapshot:   { ...proposalData },    // full-state snapshot (optional)
}).catch((err) => logger.warn({ err }, '[Audit] log failed'));
```

**Available `AuditAction` values** (`packages/shared-types/src/index.ts`):
`CREATED`, `UPDATED`, `STAGE_ADVANCED`, `SECTION_COMPLETED`, `SECTION_LOCKED`, `SECTION_UNLOCKED`, `COMMENTED`, `COMMENT_UPDATED`, `COMMENT_DELETED`, `EXPORTED`, `DELETED`, `AMENDED`, `REOPENED`, `CLONED`, `REVISED`, `PM_REVIEW_COMPLETE`, `MANAGEMENT_REVIEW_COMPLETE`, `COST_UPDATED`, `TIMELINE_UPDATED`, `AI_DRAFT_GENERATED`

Add new values to the enum when new actions are needed — never use free-form strings.

---

## 7. DAL Route Handler Pattern

DAL routes are thin: validate params, call TypeORM repository, return JSON. No Zod, no business logic.

```typescript
// apps/dal/src/routes/widgets.routes.ts

import { Router, Request, Response } from 'express';
import { AppDataSource } from '@biopropose/database';
import { WidgetEntity } from '@biopropose/database';

const router = Router();

// GET /widgets/by-proposal/:proposalId
router.get('/by-proposal/:proposalId', async (req: Request, res: Response) => {
  try {
    const widgets = await AppDataSource.getRepository(WidgetEntity).find({
      where:  { proposalId: req.params.proposalId },
      order:  { sortOrder: 'ASC' },
    });
    res.json(widgets);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message, code: 'DB_ERROR' });
  }
});

// POST /widgets
router.post('/', async (req: Request, res: Response) => {
  try {
    const repo   = AppDataSource.getRepository(WidgetEntity);
    const entity = repo.create(req.body as Partial<WidgetEntity>);
    const saved  = await repo.save(entity);
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message, code: 'DB_ERROR' });
  }
});

export default router;
```

**Register in `apps/dal/src/app.ts`:**
```typescript
import widgetsRouter from './routes/widgets.routes';
app.use('/widgets', widgetsRouter);
```

**Rules:**
- Every route wraps in `try/catch` and returns `{ message, code: 'DB_ERROR' }` on error.
- Use `AppDataSource.getRepository(Entity)` — never inject or import a custom repository class.
- For atomic operations, use `AppDataSource.transaction(async (manager) => { ... })`.
- Return 201 for POST/create, 204 for DELETE, 200 for GET/PATCH/PUT.

### Atomic transaction example (pessimistic lock)

```typescript
router.post('/:id/reserve-slot', async (req: Request, res: Response) => {
  try {
    const slot = await AppDataSource.transaction(async (manager) => {
      // Lock the row to prevent concurrent access
      await manager.getRepository(ProposalEntity)
        .createQueryBuilder('p')
        .setLock('pessimistic_write')
        .where('p.id = :id', { id: req.params.id })
        .getOne();

      const count = await manager.getRepository(SlotEntity)
        .count({ where: { proposalId: req.params.id } });

      return count + 1;
    });
    res.json({ slot });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message, code: 'DB_ERROR' });
  }
});
```

---

## 8. DAL Client — Calling the DAL from the BAL

All BAL data access goes through `apps/api/src/clients/dal.client.ts`. Adding a new operation is three steps:

### Step 1 — Add the DAL route (in `apps/dal`)

```typescript
// apps/dal/src/routes/widgets.routes.ts
router.get('/by-proposal/:proposalId', async (req, res) => { ... });
```

### Step 2 — Add a typed method to `DalClient`

```typescript
// apps/api/src/clients/dal.client.ts (add inside class DalClient)

getWidgets(proposalId: string): Promise<WidgetRow[]> {
  return this.get(`/widgets/by-proposal/${proposalId}`);
}

createWidget(data: Partial<WidgetRow>): Promise<WidgetRow> {
  return this.post('/widgets', data);
}

updateWidget(id: string, data: Partial<WidgetRow>): Promise<WidgetRow> {
  return this.patch(`/widgets/${id}`, data);
}

deleteWidget(id: string): Promise<void> {
  return this.del(`/widgets/${id}`);
}
```

### Step 3 — Use it in a BAL service

```typescript
// apps/api/src/services/widget.service.ts
const widgets = await dal.getWidgets(proposalId);
```

**DAL client HTTP helpers** (private methods available inside `DalClient`):
| Method | Usage |
|--------|-------|
| `this.get<T>(path)` | GET request |
| `this.post<T>(path, body)` | POST request |
| `this.patch<T>(path, body)` | PATCH request |
| `this.put<T>(path, body)` | PUT request |
| `this.del<T>(path)` | DELETE request |

The client automatically:
- Adds the `x-dal-api-key` header
- Throws `AppError(503, ...)` when the DAL is unreachable
- Propagates DAL error `{ message, code }` as `AppError` with the DAL's status code

---

## 9. Adding a New Feature End-to-End

This recipe adds a "risk assessment" entity to proposals. Follow these steps in order.

### 9.1 — Add the shared type

```typescript
// packages/shared-types/src/index.ts

export interface RiskAssessment extends AuditFields {
  id: string;
  proposalId: string;
  riskLevel: 'low' | 'medium' | 'high';
  notes: string;
}
```

### 9.2 — Add the TypeORM entity

```typescript
// packages/database/src/entities/RiskAssessment.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('risk_assessments')
export class RiskAssessmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'proposal_id', type: 'varchar', length: 36 })
  proposalId!: string;

  @Column({ type: 'varchar', length: 10 })
  riskLevel!: 'low' | 'medium' | 'high';

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'created_by', type: 'varchar', length: 255, nullable: true })
  createdBy?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
```

Register the entity in `packages/database/src/data-source.ts`:
```typescript
import { RiskAssessmentEntity } from './entities/RiskAssessment.entity';
// Add to the `entities` array
const entities = [ ..., RiskAssessmentEntity ];
```

Export it from `packages/database/src/index.ts`:
```typescript
export { RiskAssessmentEntity } from './entities/RiskAssessment.entity';
```

### 9.3 — Write a migration

```typescript
// packages/database/src/migrations/1750000000000-AddRiskAssessment.ts

import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class AddRiskAssessment1750000000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: 'risk_assessments',
      columns: [
        { name: 'id',          type: 'varchar', length: '36',  isPrimary: true },
        { name: 'proposal_id', type: 'varchar', length: '36',  isNullable: false },
        { name: 'risk_level',  type: 'varchar', length: '10',  isNullable: false },
        { name: 'notes',       type: 'text',                   isNullable: true },
        { name: 'created_by',  type: 'varchar', length: '255', isNullable: true },
        { name: 'created_at',  type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at',  type: 'datetime', default: 'CURRENT_TIMESTAMP',
          onUpdate: 'CURRENT_TIMESTAMP' },
      ],
      foreignKeys: [{
        columnNames: ['proposal_id'],
        referencedTableName: 'proposals',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }],
    }), true);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('risk_assessments');
  }
}
```

Run: `npm run db:migrate -w @biopropose/database`

### 9.4 — Add DAL routes

```typescript
// apps/dal/src/routes/risk.routes.ts
// (GET /risk/by-proposal/:id, POST /risk, PATCH /risk/:id, DELETE /risk/:id)
```

Register in `apps/dal/src/app.ts`:
```typescript
import riskRouter from './routes/risk.routes';
app.use('/risk', riskRouter);
```

### 9.5 — Add DAL client methods

```typescript
// apps/api/src/clients/dal.client.ts
getRisks(proposalId: string): Promise<RiskAssessmentRow[]> {
  return this.get(`/risk/by-proposal/${proposalId}`);
}
createRisk(data: Partial<RiskAssessmentRow>): Promise<RiskAssessmentRow> {
  return this.post('/risk', data);
}
```

### 9.6 — Add BAL validator + service + controller + route

```typescript
// apps/api/src/validators/risk.validators.ts
export const createRiskSchema = z.object({
  riskLevel: z.enum(['low', 'medium', 'high']),
  notes:     z.string().max(2000).optional(),
  createdBy: z.string().min(1),
});
export type CreateRiskDto = z.infer<typeof createRiskSchema>;
```

```typescript
// apps/api/src/services/risk.service.ts
export class RiskService {
  async list(proposalId: string) { return dal.getRisks(proposalId); }
  async create(proposalId: string, dto: CreateRiskDto) {
    const risk = await dal.createRisk({ proposalId, ...dto });
    auditService.log({ proposalId, userEmail: dto.createdBy, userName: dto.createdBy,
      action: AuditAction.UPDATED, details: `Risk "${dto.riskLevel}" added` }).catch(() => {});
    return risk;
  }
}
export const riskService = new RiskService();
```

```typescript
// apps/api/src/routes/risk.routes.ts
import { Router } from 'express';
import { riskController } from '../controllers/risk.controller';
const router = Router({ mergeParams: true }); // mergeParams to inherit :proposalId
router.get('/',  riskController.list);
router.post('/', riskController.create);
export default router;
```

Register in `apps/api/src/app.ts`:
```typescript
import riskRouter from './routes/risk.routes';
app.use('/api/proposals/:proposalId/risk', riskRouter);
```

### 9.7 — Add frontend API method and React Query hook

```typescript
// apps/web/src/services/api.ts
export const riskApi = {
  list:   (proposalId: string) =>
    api.get<RiskAssessment[]>(`/proposals/${proposalId}/risk`).then(r => r.data),
  create: (proposalId: string, dto: unknown) =>
    api.post<RiskAssessment>(`/proposals/${proposalId}/risk`, dto).then(r => r.data),
};
```

```typescript
// apps/web/src/hooks/useRisk.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { riskApi } from '../services/api';

export function useRisks(proposalId: string) {
  return useQuery({
    queryKey: ['risk', proposalId],
    queryFn:  () => riskApi.list(proposalId),
  });
}

export function useCreateRisk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ proposalId, dto }: { proposalId: string; dto: unknown }) =>
      riskApi.create(proposalId, dto),
    onSuccess: (_data, { proposalId }) => {
      qc.invalidateQueries({ queryKey: ['risk', proposalId] });
    },
  });
}
```

---

## 10. AI Service — Extending Context

The AI draft prompt is assembled in `apps/api/src/services/ai.service.ts`. Context is built in `buildUserMessage()` from four data sources fetched in parallel.

### Current context order in the user message

```
1. CURRENT PROPOSAL CONTEXT    (from DTO — name, client, businessUnit, templateType, description)
2. TEMPLATE STRUCTURE          (fetched from DAL — template section list)
3. SIBLING SECTIONS            (fetched from DAL — other drafted sections of this proposal)
4. REFERENCE EXAMPLES          (RAG from Qdrant — top-5 similar past sections)
5. EXISTING CONTENT            (optional — current editor content for revision)
6. USER INSTRUCTIONS           (optional — free-text user input)
7. TASK + STRUCTURAL GUIDANCE  (section-specific formatting rules)
```

### Adding a new context block

1. Write a fetch function that gracefully degrades:

```typescript
async function fetchClientProfileBlock(client: string): Promise<string> {
  try {
    // e.g. fetch from SFDC or a clients table
    const profile = await someExternalCall(client);
    if (!profile) return '';
    return `\n── CLIENT PROFILE ──\n${profile.summary}\n`;
  } catch {
    return ''; // always degrade gracefully
  }
}
```

2. Add it to the `Promise.all` in both `generateDraft` and `streamDraft`:

```typescript
const [historical, siblingBlock, templateBlock, clientBlock] = await Promise.all([
  getHistoricalExamples({ ... }),
  dto.proposalId ? fetchSiblingContextBlock(dto.proposalId, dto.sectionKey) : Promise.resolve(''),
  dto.proposalContext.templateType ? fetchTemplateContextBlock(dto.proposalContext.templateType) : Promise.resolve(''),
  dto.proposalContext.client ? fetchClientProfileBlock(dto.proposalContext.client) : Promise.resolve(''),
]);
```

3. Pass it to `buildUserMessage()` and insert it in the prompt string.

### Adding a new template domain

Add an entry to `TEMPLATE_DOMAINS` in `ai.service.ts`:

```typescript
'My New Template Type': {
  shortLabel:  'My Domain',
  domain:      'specific scientific expertise description...',
  regulations: 'ICH X, FDA Y, EMA Z',
},
```

The key must exactly match the `templateType` string stored in proposals and templates.

### Adding per-section structural guidance

Add to `SECTION_GUIDANCE`:

```typescript
[SectionKey.FLOWCHART]: `
Structure as a textual flowchart description:
- Overall process flow (top-to-bottom)
- Key decision points
- Parallel tracks where applicable`,
```

---

## 11. Vector Sync — RAG Indexing

Every time a section is saved, `syncProposalToQdrant(proposalId)` is called (non-blocking). It:
1. Fetches all sections from the DAL
2. Converts TipTap JSON → plain text via `tipTapToText()`
3. Embeds each section with Ollama `nomic-embed-text`
4. Upserts into Qdrant (deterministic point ID = `sha256(proposalId:sectionKey)`)

### Point payload schema (what's stored in Qdrant)

```typescript
interface QdrantPayload {
  proposalId:   string;
  proposalName: string;
  proposalCode: string;
  sectionKey:   string;
  client:       string;
  businessUnit: string;
  templateType: string;
  status:       string;
  plainText:    string;   // truncated to 3000 chars
  historical:   boolean;  // true = proposal is in SENT status (used by RAG filter)
  updatedAt:    string;
}
```

To add a new field to the Qdrant payload:
1. Add it to `QdrantPayload` interface in `apps/api/src/clients/qdrant.client.ts`
2. Populate it in both `syncAllToQdrant()` and `syncProposalToQdrant()` in `vectorSync.service.ts`
3. If you want to filter on it in RAG, update `getHistoricalExamples()` in `historicalContext.service.ts`

### TipTap → plain text

```typescript
import { tipTapToText } from './vectorSync.service';

const plainText = tipTapToText(section.content as unknown);
// returns a flat string with whitespace collapsed
```

---

## 12. Frontend — React Query Hooks

All server state lives in React Query. Hooks follow a consistent pattern in `apps/web/src/hooks/`.

### Read hook

```typescript
// apps/web/src/hooks/useWidgets.ts
import { useQuery } from '@tanstack/react-query';
import { widgetsApi } from '../services/api';

export function useWidgets(proposalId: string) {
  return useQuery({
    queryKey: ['widgets', proposalId],
    queryFn:  () => widgetsApi.list(proposalId),
    staleTime: 30_000,       // 30s before background refetch
    enabled:  !!proposalId,  // don't fetch until proposalId is known
  });
}
```

### Mutation hook

```typescript
export function useCreateWidget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ proposalId, dto }: { proposalId: string; dto: unknown }) =>
      widgetsApi.create(proposalId, dto),
    onSuccess: (_data, { proposalId }) => {
      // Invalidate the list query so it refetches
      queryClient.invalidateQueries({ queryKey: ['widgets', proposalId] });
      toast.success('Widget created');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create widget');
    },
  });
}
```

### Using in a component

```tsx
function WidgetList({ proposalId }: { proposalId: string }) {
  const { data: widgets, isLoading, isError } = useWidgets(proposalId);
  const createWidget = useCreateWidget();

  if (isLoading) return <Spinner />;
  if (isError)   return <p>Failed to load widgets</p>;

  return (
    <>
      {widgets?.map(w => <WidgetRow key={w.id} widget={w} />)}
      <button onClick={() => createWidget.mutate({ proposalId, dto: { name: 'New', createdBy: user.email } })}>
        Add
      </button>
    </>
  );
}
```

---

## 13. Frontend — API Service Layer

The axios instance in `apps/web/src/services/api.ts` is the single point of contact with the BAL. The response interceptor extracts the human-readable error message from the API response body so `err.message` contains the actual server error text.

```typescript
// Add a new domain to api.ts

export const widgetsApi = {
  list: (proposalId: string) =>
    api.get<Widget[]>(`/proposals/${proposalId}/widgets`).then(r => r.data),

  create: (proposalId: string, dto: unknown) =>
    api.post<Widget>(`/proposals/${proposalId}/widgets`, dto).then(r => r.data),

  update: (proposalId: string, widgetId: string, dto: unknown) =>
    api.put<Widget>(`/proposals/${proposalId}/widgets/${widgetId}`, dto).then(r => r.data),

  delete: (proposalId: string, widgetId: string) =>
    api.delete(`/proposals/${proposalId}/widgets/${widgetId}`),
};
```

**Rules:**
- Always `.then(r => r.data)` to unwrap the axios response wrapper.
- Use `unknown` for request body types when the type is defined on the backend — avoids importing backend-only types into the frontend bundle.
- The error interceptor turns `err.response.data.error` into `err.message`, so `toast.error(err.message)` always shows a readable message.

---

## 14. Frontend — State Management

### Zustand stores

Two stores live in `apps/web/src/stores/`:

**`authStore`** — current user identity (set at login, cleared at logout):
```typescript
const user = useAuthStore((s) => s.user);
// { name, email, role }
```

**`proposalStore`** — active proposal/section in the editor:
```typescript
const { proposal, activeSection, setSidebarOpen } = useProposalStore((s) => ({
  proposal:       s.currentProposal,
  activeSection:  s.activeSectionKey,
  setSidebarOpen: s.setSidebarOpen,
}));
```

Use Zustand selectors (pass a selector function, not the whole store) to prevent unnecessary re-renders when unrelated state changes.

### When to use React Query vs Zustand

| Data type | Use |
|-----------|-----|
| Server data (proposals, sections, costs) | React Query |
| UI state (sidebar open, active tab) | Zustand |
| Session identity | Zustand (`authStore`) |
| Form state | Local `useState` |

---

## 15. TypeScript Conventions

### Import type for type-only imports

```typescript
import type { ProposalEntity } from '@biopropose/database';
import type { AiDraftDto } from '../validators/cost.validators';
```

Use `import type` whenever the import is only used as a type. This eliminates the import from the compiled JS output.

### Never use `any` — use `unknown` or a specific type

```typescript
// Bad
function process(data: any) { ... }

// Good
function process(data: unknown) {
  if (typeof data !== 'object' || !data) return;
  const node = data as { type: string; content?: unknown[] };
  ...
}
```

### DTO types come from Zod schemas

```typescript
// packages/shared-types or apps/api/src/validators
export type CreateProposalDto = z.infer<typeof createProposalSchema>;
```

Never write DTO types manually — they must match the Zod schema automatically.

### Entities and DB types

- `@biopropose/database` exports entity classes — import types from there in the BAL
- `@biopropose/shared-types` exports plain interfaces — import from there in both BAL and web
- Never import entity classes into the web frontend

### Async/await, not .then() chains (in backend code)

```typescript
// BAL services — use async/await
const proposal = await dal.getProposalById(id);
const sections = await dal.getSections(id);

// Frontend api.ts wrappers — use .then(r => r.data) to unwrap axios
api.get<Proposal[]>('/proposals').then(r => r.data)
```

### Null coalescing for DB nullable fields

```typescript
const label = proposal.templateType ?? 'General';
const text   = section.content ?? {};
```

---

## 16. Environment & Config Validation

The BAL validates all environment variables at startup using a Zod schema in `apps/api/src/config/env.ts`. If any required variable is missing or wrong type, the process exits immediately with a descriptive error.

```typescript
// Adding a new env var to the BAL:
const envSchema = z.object({
  // ... existing vars ...
  MY_NEW_KEY: z.string().min(1),                    // required string
  MY_OPTIONAL: z.string().optional(),               // optional
  MY_NUMBER: z.coerce.number().default(3000),        // coerce from string, with default
  MY_ENUM: z.enum(['a', 'b', 'c']).default('a'),    // enum with default
});

export const env = parsed.data;
// Use: env.MY_NEW_KEY  (fully typed, never undefined unless marked optional)
```

Then add it to `docker-compose.yml` under the `api` service environment:
```yaml
MY_NEW_KEY: ${MY_NEW_KEY}
```

And to `.env.example`:
```env
MY_NEW_KEY=your-value-here
```

**Never** read `process.env.MY_VAR` directly in service files — always use `env.MY_VAR` from `config/env.ts`.

---

*See `ARCHITECTURE.md` for deployment, network topology, and scaling documentation.*
