# Technical Specification

# Design System Component Usage Tracker

# Local-First + Optional Serverless Version

## 1. Document Overview

### 1.1 Purpose

This Technical Specification defines the technical implementation plan for **Design System Component Usage Tracker**.

The product is a local-first internal tool that tracks usage of components from a source UI Kit / design system Figma file across registered Figma consumer files.

This version is optimized for:

```txt
- local development / localhost usage
- personal or small internal Design Ops use
- no mandatory hosting
- optional cloud database using Supabase or Neon
- optional future serverless deployment
```

The system should be usable from the user’s local machine without needing a public production deployment.

---

## 2. Technical Goals

### 2.1 Primary Goals

The system must allow the user to:

1. Connect Figma access using a Personal Access Token.
2. Register one source UI Kit / design system Figma file.
3. Import source components from the source UI Kit.
4. Register consumer Figma files.
5. Scan registered files from localhost.
6. Detect source component instances in consumer files.
7. Count usage per component and per file.
8. Store current usage data.
9. Store historical scan snapshots.
10. Detect changes between scans.
11. Display component usage dashboard.
12. Display file-level usage dashboard.
13. Display scan history and basic insights.

---

### 2.2 Technical Direction

The product should be built as a **local-first dashboard with a backend API running locally**.

Recommended MVP architecture:

```txt
React Vite Frontend
        ↓
Local Express Backend
        ↓
Figma REST API
        ↓
Supabase Postgres / Neon Postgres
```

Optional future architecture:

```txt
React Vite Frontend
        ↓
Serverless API / Hosted Backend
        ↓
Figma REST API
        ↓
Supabase Postgres / Neon Postgres
```

---

## 3. Recommended Tech Stack

## 3.1 Frontend

```txt
React + Vite + TypeScript
```

Recommended libraries:

```txt
UI: shadcn/ui
Styling: Tailwind CSS
Routing: React Router
Server state: TanStack Query
Tables: TanStack Table
Forms: React Hook Form
Validation: Zod
Charts: Recharts
Icons: Lucide React
Toast: Sonner
```

Why React Vite:

```txt
- fast local dev
- good AI-code-agent support
- strong dashboard ecosystem
- works well with shadcn/ui
- suitable for data-heavy UI
```

---

## 3.2 Backend

Recommended MVP backend:

```txt
Node.js + Express + TypeScript
```

Why Express local backend:

```txt
- simple to run on localhost
- easier for long scan process than serverless function
- easier to keep Figma token backend-only
- avoids Vercel/serverless timeout issues during large scans
- easier to debug while building MVP
```

Alternative backend:

```txt
Hono + TypeScript
Fastify + TypeScript
```

MVP recommendation:

```txt
Use Express first.
Do not use serverless backend for scan-heavy MVP unless scan is split into small batch jobs.
```

---

## 3.3 Database

Recommended database options:

### Option A — Supabase Postgres

Best if user wants:

```txt
- easy dashboard UI
- managed Postgres
- simple setup
- possible future Auth
- possible future hosted app
```

### Option B — Neon Postgres

Best if user wants:

```txt
- serverless Postgres
- lightweight DB
- good Vercel compatibility
- simple Postgres connection string
```

### Option C — Local SQLite

Best if user wants:

```txt
- fully local/offline-ish MVP
- no external DB dependency
- simplest personal usage
```

But for this product, recommended MVP is:

```txt
Supabase Postgres or Neon Postgres
```

Reason:

```txt
- data is relational
- easy aggregation
- easy migration
- easy future hosting
- works with Prisma
```

---

## 3.4 ORM

Recommended:

```txt
Prisma ORM
```

Why:

```txt
- good schema definition
- easy migration
- works with PostgreSQL
- readable for AI coding agent
- good TypeScript support
```

---

## 3.5 Queue / Background Jobs

For MVP, do not use Redis/BullMQ yet.

Use database-backed scan jobs:

```txt
scan_batches
scan_jobs
```

Scan process:

```txt
User clicks Scan All
→ Backend creates scan_batch
→ Backend creates scan_jobs
→ Backend processes jobs sequentially
→ Backend updates scan job status in database
```

Why no Redis for MVP:

```txt
- fewer moving parts
- easier local setup
- enough for personal/internal small usage
- simpler for localhost-only app
```

Future upgrade:

```txt
Add BullMQ + Redis only if scan count grows large or scans need background processing after browser closes.
```

---

## 4. Runtime Modes

## 4.1 Mode A — Localhost Only

This is the recommended MVP mode.

```txt
Frontend: localhost:5173
Backend: localhost:4000
Database: Supabase / Neon cloud Postgres
Figma API: called from backend only
```

Command example:

```bash
pnpm dev
```

Runs:

```txt
Vite frontend
Express backend
```

Recommended ports:

```txt
Frontend: http://localhost:5173
Backend: http://localhost:4000
```

Pros:

```txt
- easiest to build
- easiest to debug
- no deployment needed
- scan can run longer than serverless function
- token stays in backend
```

Cons:

```txt
- app only works when local backend is running
- not accessible by other teammates unless hosted
```

---

## 4.2 Mode B — Localhost + Cloud Database

This is still local-first, but data is stored in Supabase/Neon.

```txt
Frontend: localhost
Backend: localhost
Database: Supabase / Neon
```

Pros:

```txt
- data persists even if local app restarts
- no need to install local Postgres
- easier future deployment
```

Cons:

```txt
- requires internet
- DB credentials must be managed carefully
```

This is the recommended practical setup.

---

## 4.3 Mode C — Optional Hosted Serverless

This is optional future mode.

Possible architecture:

```txt
Frontend: Vercel / Netlify
API: Vercel Functions / Netlify Functions
Database: Supabase / Neon
```

Important limitation:

```txt
Serverless functions are not ideal for long-running scans.
```

If using serverless backend, scan should be split into small steps:

```txt
- one function call scans one file
- scan all creates jobs
- frontend or scheduled process triggers next job
- each job stays within function timeout
```

Recommended future hosted architecture if scan becomes heavy:

```txt
Frontend: Vercel
Backend API: Vercel Functions
Scanner Worker: Railway / Fly.io / Render background worker
Database: Supabase / Neon
```

---

## 5. High-Level Architecture

### 5.1 Local-First Architecture

```txt
+----------------------------+
| React Vite Frontend        |
| localhost:5173             |
+-------------+--------------+
              |
              | HTTP REST API
              v
+----------------------------+
| Local Express Backend      |
| localhost:4000             |
+-------------+--------------+
              |
              +-------------------------+
              |                         |
              v                         v
+----------------------------+    +----------------------------+
| Figma REST API Client      |    | Scanner Service            |
| Reads source & files       |    | Detection & aggregation    |
+-------------+--------------+    +-------------+--------------+
              |                                 |
              v                                 v
+----------------------------+    +----------------------------+
| Figma API                  |    | Supabase / Neon Postgres   |
+----------------------------+    +----------------------------+
```

---

### 5.2 Data Flow

```txt
Connect Figma token
→ Register source UI Kit
→ Import source components
→ Register consumer files
→ Run scan
→ Backend fetches Figma file JSON
→ Backend detects source component instances
→ Backend saves current usage
→ Backend saves snapshots
→ Backend detects changes
→ Frontend displays analytics
```

---

## 6. Repository Structure

Recommended monorepo:

```txt
design-system-usage-tracker/
├── apps/
│   ├── web/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── features/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   ├── pages/
│   │   │   └── styles/
│   │   ├── index.html
│   │   └── vite.config.ts
│   │
│   └── api/
│       ├── src/
│       │   ├── config/
│       │   ├── controllers/
│       │   ├── figma/
│       │   ├── middleware/
│       │   ├── routes/
│       │   ├── scanner/
│       │   ├── services/
│       │   ├── repositories/
│       │   ├── utils/
│       │   └── index.ts
│       └── tsconfig.json
│
├── packages/
│   ├── database/
│   │   ├── prisma/
│   │   └── src/
│   └── shared/
│       ├── schemas/
│       ├── types/
│       └── utils/
│
├── docs/
│   ├── PRD.md
│   ├── SRS.md
│   └── TECH_SPEC.md
│
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

Simpler alternative:

```txt
design-system-usage-tracker/
├── client/
├── server/
├── prisma/
├── docs/
└── package.json
```

For MVP, simpler is okay.

Recommended:

```txt
Use simpler structure first unless the app is expected to grow quickly.
```

---

## 7. Environment Variables

## 7.1 Backend Environment Variables

```env
NODE_ENV=development
PORT=4000

DATABASE_URL=postgresql://...

FIGMA_API_BASE_URL=https://api.figma.com

ENCRYPTION_SECRET=replace-with-strong-secret
APP_BASE_URL=http://localhost:5173
API_BASE_URL=http://localhost:4000
```

No Redis variable required for MVP.

Future optional:

```env
REDIS_URL=redis://...
```

---

## 7.2 Frontend Environment Variables

```env
VITE_API_BASE_URL=http://localhost:4000
```

---

## 7.3 Database Provider Setup

### Supabase

Use:

```txt
Supabase Project
→ Project Settings
→ Database
→ Connection string
→ DATABASE_URL
```

### Neon

Use:

```txt
Neon Project
→ Connection Details
→ PostgreSQL connection string
→ DATABASE_URL
```

---

## 8. Database Schema

## 8.1 Schema Principles

The schema must support:

```txt
- one source UI Kit in MVP
- many source components
- many registered consumer files
- many scan jobs
- current usage
- historical snapshots
- instance-level records
- change detection
```

---

## 8.2 Tables Overview

```txt
figma_connections
source_files
source_components
registered_files
scan_batches
scan_jobs
component_usage_current
usage_snapshots
usage_instances
usage_changes
app_settings
```

---

## 8.3 `figma_connections`

Stores Figma access token.

```sql
CREATE TABLE figma_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Default Figma Connection',
  encrypted_access_token TEXT NOT NULL,
  token_type TEXT NOT NULL DEFAULT 'personal_access_token',
  status TEXT NOT NULL DEFAULT 'connected',
  connected_user_name TEXT,
  connected_user_email TEXT,
  last_validated_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

Notes:

```txt
- Store encrypted token only.
- Never send token back to frontend.
- For local-only personal use, encryption is still recommended.
```

---

## 8.4 `source_files`

Stores source UI Kit / design system Figma files.

```sql
CREATE TABLE source_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  figma_file_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  figma_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  last_component_refresh_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

MVP rule:

```txt
Only one active source file.
```

Future:

```txt
Support multiple source files.
```

---

## 8.5 `source_components`

Stores components imported from the source UI Kit.

```sql
CREATE TABLE source_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_file_id UUID NOT NULL REFERENCES source_files(id) ON DELETE CASCADE,

  component_key TEXT,
  component_node_id TEXT NOT NULL,
  component_name TEXT NOT NULL,
  component_set_name TEXT,
  page_name TEXT,
  description TEXT,

  status TEXT NOT NULL DEFAULT 'active',
  first_imported_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_seen_in_source_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(source_file_id, component_node_id)
);
```

Important:

```txt
Do not rely on component_name as primary identity.
Use component_key when available.
Use component_node_id as fallback.
```

---

## 8.6 `registered_files`

Stores consumer files selected by the user.

```sql
CREATE TABLE registered_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  figma_file_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  figma_url TEXT NOT NULL,

  status TEXT NOT NULL DEFAULT 'not_scanned',
  tracking_enabled BOOLEAN NOT NULL DEFAULT TRUE,

  last_scan_job_id UUID,
  last_scan_status TEXT,
  last_scan_attempt_at TIMESTAMP,
  last_successful_scan_at TIMESTAMP,

  total_instances INTEGER NOT NULL DEFAULT 0,
  unique_components_used INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

Statuses:

```txt
not_scanned
healthy
zero_usage
low_adoption
failed
stale
disabled
access_failed
```

---

## 8.7 `scan_batches`

Represents a scan-all session.

```sql
CREATE TABLE scan_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  status TEXT NOT NULL DEFAULT 'pending',
  total_files INTEGER NOT NULL DEFAULT 0,
  completed_files INTEGER NOT NULL DEFAULT 0,
  failed_files INTEGER NOT NULL DEFAULT 0,

  started_at TIMESTAMP,
  finished_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

Statuses:

```txt
pending
running
success
partial_success
failed
paused
cancelled
```

---

## 8.8 `scan_jobs`

Represents scanning one registered file.

```sql
CREATE TABLE scan_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  batch_id UUID REFERENCES scan_batches(id) ON DELETE SET NULL,
  registered_file_id UUID NOT NULL REFERENCES registered_files(id) ON DELETE CASCADE,

  status TEXT NOT NULL DEFAULT 'pending',

  started_at TIMESTAMP,
  finished_at TIMESTAMP,
  duration_ms INTEGER,

  error_code TEXT,
  error_message TEXT,
  retry_after_seconds INTEGER,

  total_instances INTEGER NOT NULL DEFAULT 0,
  unique_components_used INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

Statuses:

```txt
pending
running
success
failed
paused
rate_limited
cancelled
```

---

## 8.9 `component_usage_current`

Stores latest successful usage per component per file.

```sql
CREATE TABLE component_usage_current (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  source_component_id UUID NOT NULL REFERENCES source_components(id) ON DELETE CASCADE,
  registered_file_id UUID NOT NULL REFERENCES registered_files(id) ON DELETE CASCADE,

  instance_count INTEGER NOT NULL DEFAULT 0,
  page_count INTEGER NOT NULL DEFAULT 0,
  frame_count INTEGER NOT NULL DEFAULT 0,

  last_seen_at TIMESTAMP,
  last_scanned_at TIMESTAMP NOT NULL,
  last_scan_job_id UUID REFERENCES scan_jobs(id) ON DELETE SET NULL,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(source_component_id, registered_file_id)
);
```

Important behavior:

```txt
Failed scan must not overwrite this table.
Only update current usage after successful scan.
```

---

## 8.10 `usage_snapshots`

Stores historical usage per scan.

```sql
CREATE TABLE usage_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  scan_job_id UUID NOT NULL REFERENCES scan_jobs(id) ON DELETE CASCADE,
  source_component_id UUID NOT NULL REFERENCES source_components(id) ON DELETE CASCADE,
  registered_file_id UUID NOT NULL REFERENCES registered_files(id) ON DELETE CASCADE,

  instance_count INTEGER NOT NULL DEFAULT 0,
  page_count INTEGER NOT NULL DEFAULT 0,
  frame_count INTEGER NOT NULL DEFAULT 0,

  scanned_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

Indexes:

```sql
CREATE INDEX idx_usage_snapshots_component ON usage_snapshots(source_component_id);
CREATE INDEX idx_usage_snapshots_file ON usage_snapshots(registered_file_id);
CREATE INDEX idx_usage_snapshots_scanned_at ON usage_snapshots(scanned_at);
```

---

## 8.11 `usage_instances`

Stores exact detected instance nodes.

```sql
CREATE TABLE usage_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  source_component_id UUID NOT NULL REFERENCES source_components(id) ON DELETE CASCADE,
  registered_file_id UUID NOT NULL REFERENCES registered_files(id) ON DELETE CASCADE,

  instance_node_id TEXT NOT NULL,
  instance_name TEXT,

  page_name TEXT,
  frame_name TEXT,
  figma_node_url TEXT,

  first_seen_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMP NOT NULL DEFAULT NOW(),
  missing_detected_at TIMESTAMP,

  status TEXT NOT NULL DEFAULT 'active',

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(source_component_id, registered_file_id, instance_node_id)
);
```

Statuses:

```txt
active
missing
removed
```

---

## 8.12 `usage_changes`

Stores changes between latest and previous scans.

```sql
CREATE TABLE usage_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  scan_job_id UUID NOT NULL REFERENCES scan_jobs(id) ON DELETE CASCADE,
  source_component_id UUID NOT NULL REFERENCES source_components(id) ON DELETE CASCADE,
  registered_file_id UUID NOT NULL REFERENCES registered_files(id) ON DELETE CASCADE,

  change_type TEXT NOT NULL,
  previous_count INTEGER NOT NULL DEFAULT 0,
  current_count INTEGER NOT NULL DEFAULT 0,
  difference INTEGER NOT NULL DEFAULT 0,

  detected_at TIMESTAMP NOT NULL DEFAULT NOW(),

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

Change types:

```txt
newly_used
increased
decreased
removed
no_change
```

Store only non-`no_change` rows.

---

## 8.13 `app_settings`

Stores app configuration.

```sql
CREATE TABLE app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  low_usage_instance_threshold INTEGER NOT NULL DEFAULT 5,
  stale_file_days_threshold INTEGER NOT NULL DEFAULT 14,
  scan_delay_ms INTEGER NOT NULL DEFAULT 7000,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

`scan_delay_ms` helps avoid aggressive API calls during scan.

---

## 9. Prisma Models

Use Prisma as the ORM.

Example simplified model style:

```prisma
model SourceFile {
  id                     String   @id @default(uuid())
  figmaFileKey           String   @unique
  name                   String
  figmaUrl               String
  status                 String   @default("active")
  lastComponentRefreshAt DateTime?
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt

  components             SourceComponent[]
}
```

Recommended Prisma naming:

```txt
Use camelCase in Prisma.
Map to snake_case database names if desired.
```

---

## 10. Figma API Integration

## 10.1 Authentication

MVP uses:

```txt
Personal Access Token
```

Backend should call Figma API.

Frontend must not call Figma API directly.

HTTP header:

```txt
Authorization: Bearer <token>
```

---

## 10.2 Required Access

The connected Figma token must be able to read:

```txt
- source UI Kit file
- registered consumer files
- file content
```

Recommended permission/scope:

```txt
file_content:read
```

---

## 10.3 Figma API Client

Create:

```txt
server/src/figma/figma-client.ts
```

Responsibilities:

```txt
- call Figma REST API
- attach token securely
- normalize errors
- detect rate limit
- return typed responses
```

Interface:

```ts
export interface FigmaClient {
  getFile(fileKey: string): Promise<FigmaFileResponse>;
  getFileMeta(fileKey: string): Promise<FigmaFileMetaResponse>;
  validateToken(): Promise<boolean>;
}
```

---

## 10.4 Figma Endpoints Used

### Get file

```txt
GET /v1/files/:file_key
```

Used for:

```txt
- import source UI Kit components
- scan consumer files
- read node tree and component metadata
```

### Get file metadata

```txt
GET /v1/files/:file_key/meta
```

Used for:

```txt
- validate file access
- get file name
- lightweight check before full scan
```

---

## 10.5 Figma File URL Parser

Support:

```txt
https://www.figma.com/design/{file_key}/{file_name}
https://www.figma.com/file/{file_key}/{file_name}
https://figma.com/design/{file_key}/{file_name}
https://figma.com/file/{file_key}/{file_name}
```

Function:

```ts
function extractFigmaFileKey(url: string): string | null;
```

Rules:

```txt
- return file key if valid
- ignore query params
- support design and file path
- return null for invalid URL
```

---

## 11. Component Import Logic

## 11.1 Source Component Import

Algorithm:

```txt
Fetch source UI Kit file JSON
→ Traverse document tree
→ Find COMPONENT nodes
→ Preserve page and component set context
→ Store components in source_components
```

Pseudo-code:

```ts
function importSourceComponents(figmaFile: FigmaFile): SourceComponentInput[] {
  const result: SourceComponentInput[] = [];

  traverse(figmaFile.document, {
    onNode(node, context) {
      if (node.type === "COMPONENT") {
        result.push({
          componentNodeId: node.id,
          componentName: node.name,
          componentSetName: context.parentComponentSetName,
          pageName: context.pageName,
        });
      }
    },
  });

  return result;
}
```

---

## 11.2 Component Identity Rules

Priority:

```txt
1. component_key if available
2. source_file_key + component_node_id
3. never use component_name as identity
```

Component name is only for:

```txt
- display
- search
- sorting
- debugging
```

---

## 12. Consumer File Scan Logic

## 12.1 Scan Flow

```txt
Fetch registered file JSON
→ Load source component map
→ Traverse consumer file tree
→ Find INSTANCE nodes
→ Resolve source component
→ Store detected instance
→ Aggregate by component
→ Save snapshot
→ Update current usage
→ Detect changes
```

---

## 12.2 Instance Detection

Pseudo-code:

```ts
function detectSourceInstances(input: {
  figmaFile: FigmaFileResponse;
  registeredFile: RegisteredFile;
  sourceComponentMap: SourceComponentMap;
}): DetectedInstance[] {
  const detected: DetectedInstance[] = [];

  traverse(input.figmaFile.document, {
    onNode(node, context) {
      if (node.type !== "INSTANCE") return;

      const sourceComponent = resolveSourceComponent({
        instanceNode: node,
        consumerFileComponents: input.figmaFile.components,
        sourceComponentMap: input.sourceComponentMap,
      });

      if (!sourceComponent) return;

      detected.push({
        sourceComponentId: sourceComponent.id,
        registeredFileId: input.registeredFile.id,
        instanceNodeId: node.id,
        instanceName: node.name,
        pageName: context.pageName,
        frameName: context.frameName,
        figmaNodeUrl: toFigmaNodeUrl(
          input.registeredFile.figmaFileKey,
          node.id,
        ),
      });
    },
  });

  return detected;
}
```

---

## 12.3 Component Resolution

Pseudo-code:

```ts
function resolveSourceComponent(input: {
  instanceNode: FigmaNode;
  consumerFileComponents: Record<string, FigmaComponentMeta>;
  sourceComponentMap: SourceComponentMap;
}): SourceComponent | null {
  const componentId = input.instanceNode.componentId;

  if (!componentId) return null;

  const componentMeta = input.consumerFileComponents?.[componentId];

  if (componentMeta?.key) {
    const byKey = input.sourceComponentMap.byKey.get(componentMeta.key);
    if (byKey) return byKey;
  }

  const byNodeId = input.sourceComponentMap.byNodeId.get(componentId);
  if (byNodeId) return byNodeId;

  return null;
}
```

---

## 12.4 Aggregation

Input:

```ts
type DetectedInstance = {
  sourceComponentId: string;
  registeredFileId: string;
  instanceNodeId: string;
  instanceName?: string;
  pageName?: string;
  frameName?: string;
  figmaNodeUrl?: string;
};
```

Output:

```ts
type AggregatedUsage = {
  sourceComponentId: string;
  registeredFileId: string;
  instanceCount: number;
  pageCount: number;
  frameCount: number;
};
```

Aggregation rule:

```txt
Group detected instances by sourceComponentId.
Count total instances.
Count unique pageName.
Count unique frameName.
```

---

## 12.5 Figma Node URL

Function:

```ts
function toFigmaNodeUrl(fileKey: string, nodeId: string): string {
  const encodedNodeId = nodeId.replace(":", "-");
  return `https://www.figma.com/design/${fileKey}?node-id=${encodedNodeId}`;
}
```

---

## 13. Scan Execution

## 13.1 MVP Scan Mode

MVP scan mode:

```txt
Sequential local backend scan
```

No Redis. No external worker. No serverless background job.

Flow:

```txt
User clicks Scan All
→ Backend creates scan batch
→ Backend creates scan jobs
→ Backend processes each file one by one
→ Backend saves result after each file
→ Frontend polls scan status
```

---

## 13.2 Scan All Pseudo-code

```ts
async function scanAllRegisteredFiles() {
  const batch = await createScanBatch();

  const files = await getActiveRegisteredFiles();

  await updateBatch(batch.id, {
    status: "running",
    totalFiles: files.length,
    startedAt: new Date(),
  });

  for (const file of files) {
    const job = await createScanJob({
      batchId: batch.id,
      registeredFileId: file.id,
    });

    try {
      await scanSingleFile(job.id, file.id);
      await incrementBatchCompleted(batch.id);
    } catch (error) {
      await markScanJobFailed(job.id, error);
      await incrementBatchFailed(batch.id);
    }

    await sleep(getConfiguredScanDelayMs());
  }

  await finalizeScanBatch(batch.id);
}
```

---

## 13.3 Single File Scan Pseudo-code

```ts
async function scanSingleFile(scanJobId: string, registeredFileId: string) {
  await markJobRunning(scanJobId);

  const file = await getRegisteredFile(registeredFileId);
  const sourceComponents = await getActiveSourceComponents();
  const sourceComponentMap = buildSourceComponentMap(sourceComponents);

  const figmaFile = await figmaClient.getFile(file.figmaFileKey);

  const detectedInstances = detectSourceInstances({
    figmaFile,
    registeredFile: file,
    sourceComponentMap,
  });

  const aggregatedUsage = aggregateUsage(detectedInstances);

  await saveSuccessfulScanResult({
    scanJobId,
    registeredFileId,
    detectedInstances,
    aggregatedUsage,
  });

  await detectUsageChanges({
    scanJobId,
    registeredFileId,
    currentUsage: aggregatedUsage,
  });

  await updateRegisteredFileSummary({
    registeredFileId,
    scanJobId,
    aggregatedUsage,
  });

  await markJobSuccess(scanJobId);
}
```

---

## 13.4 Scan Status Polling

Frontend should poll:

```txt
GET /api/scans/batches/:batchId
GET /api/scans?batchId=:batchId
```

Polling interval:

```txt
2–5 seconds
```

Stop polling when:

```txt
batch.status is success / partial_success / failed / cancelled
```

---

## 14. Save Scan Result Logic

## 14.1 Save Order

For a successful scan:

```txt
1. Save usage_snapshots
2. Replace component_usage_current for the scanned file
3. Upsert usage_instances
4. Mark missing old instances
5. Create usage_changes
6. Update registered_files summary
7. Mark scan_job success
```

---

## 14.2 Current Usage Replacement

Important rule:

```txt
Only replace current usage after scan succeeds.
```

Process:

```txt
Begin transaction
→ Delete component_usage_current rows for registered_file_id
→ Insert latest aggregated usage rows
→ Commit
```

If scan fails:

```txt
Do not delete old current usage.
```

---

## 14.3 Snapshot Strategy

Recommended MVP:

```txt
Store snapshots only for components detected in the scan.
```

Change detection must treat missing component as count `0`.

---

## 14.4 Instance Upsert

For each detected instance:

```txt
If instance exists:
  update last_seen_at, name, page, frame, status active

If instance does not exist:
  create with first_seen_at and last_seen_at
```

After scan:

```txt
Any previously active instance in the same file that is not found should be marked missing.
```

---

## 15. Change Detection

## 15.1 Previous Scan Selection

Compare current successful scan with:

```txt
Most recent previous successful scan for the same registered file.
```

Ignore:

```txt
failed scans
cancelled scans
rate-limited incomplete scans
```

---

## 15.2 Change Detection Logic

Pseudo-code:

```ts
function getChangeType(previousCount: number, currentCount: number) {
  if (previousCount === 0 && currentCount > 0) return "newly_used";
  if (previousCount > 0 && currentCount === 0) return "removed";
  if (currentCount > previousCount) return "increased";
  if (currentCount < previousCount) return "decreased";
  return "no_change";
}
```

Store only:

```txt
newly_used
removed
increased
decreased
```

Do not store:

```txt
no_change
```

---

## 15.3 Change Record

For each persisted change:

```txt
source_component_id
registered_file_id
scan_job_id
change_type
previous_count
current_count
difference
detected_at
```

---

## 16. API Design

## 16.1 API Base

Local backend base URL:

```txt
http://localhost:4000/api
```

Frontend environment:

```env
VITE_API_BASE_URL=http://localhost:4000
```

---

## 16.2 API Response Format

Success:

```ts
type ApiResponse<T> = {
  data: T;
  meta?: Record<string, unknown>;
};
```

Error:

```ts
type ApiError = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};
```

---

## 16.3 Figma Connection API

### POST `/api/figma/connect`

Request:

```json
{
  "accessToken": "figd_..."
}
```

Response:

```json
{
  "data": {
    "status": "connected",
    "lastValidatedAt": "2026-06-03T10:00:00Z"
  }
}
```

---

### GET `/api/figma/status`

Response:

```json
{
  "data": {
    "connected": true,
    "status": "connected",
    "lastValidatedAt": "2026-06-03T10:00:00Z"
  }
}
```

---

### DELETE `/api/figma/disconnect`

Response:

```json
{
  "data": {
    "status": "disconnected"
  }
}
```

---

## 16.4 Source File API

### POST `/api/source-file`

Request:

```json
{
  "figmaUrl": "https://www.figma.com/design/abc123/My-UI-Kit"
}
```

Response:

```json
{
  "data": {
    "id": "uuid",
    "figmaFileKey": "abc123",
    "name": "My UI Kit",
    "status": "active"
  }
}
```

---

### GET `/api/source-file`

Response:

```json
{
  "data": {
    "id": "uuid",
    "figmaFileKey": "abc123",
    "name": "My UI Kit",
    "lastComponentRefreshAt": "2026-06-03T10:00:00Z"
  }
}
```

---

### POST `/api/source-file/refresh-components`

Response:

```json
{
  "data": {
    "sourceFileId": "uuid",
    "componentsImported": 428,
    "refreshedAt": "2026-06-03T10:00:00Z"
  }
}
```

---

## 16.5 Registered Files API

### POST `/api/registered-files`

Request:

```json
{
  "figmaUrls": [
    "https://www.figma.com/design/fileA/Checkout",
    "https://www.figma.com/design/fileB/Profile"
  ]
}
```

Response:

```json
{
  "data": {
    "added": [
      {
        "id": "uuid",
        "name": "Checkout",
        "figmaFileKey": "fileA",
        "status": "not_scanned"
      }
    ],
    "duplicates": [],
    "failed": []
  }
}
```

---

### GET `/api/registered-files`

Query params:

```txt
search
status
trackingEnabled
page
limit
sort
```

---

### PATCH `/api/registered-files/:id`

Request:

```json
{
  "trackingEnabled": false
}
```

---

### DELETE `/api/registered-files/:id`

Response:

```json
{
  "data": {
    "removed": true
  }
}
```

---

## 16.6 Scan API

### POST `/api/scans`

Run scan all.

Request:

```json
{
  "mode": "all"
}
```

Response:

```json
{
  "data": {
    "batchId": "uuid",
    "status": "pending",
    "totalFiles": 10
  }
}
```

---

### POST `/api/scans/file/:registeredFileId`

Run scan for one file.

Response:

```json
{
  "data": {
    "scanJobId": "uuid",
    "status": "pending"
  }
}
```

---

### GET `/api/scans`

List scan jobs.

Query params:

```txt
status
fileId
batchId
page
limit
```

---

### GET `/api/scans/batches/:batchId`

Get scan batch status.

Response:

```json
{
  "data": {
    "id": "uuid",
    "status": "running",
    "totalFiles": 10,
    "completedFiles": 4,
    "failedFiles": 0
  }
}
```

---

### POST `/api/scans/:scanJobId/retry`

Retry failed scan.

Response:

```json
{
  "data": {
    "scanJobId": "new-uuid",
    "status": "pending"
  }
}
```

---

## 16.7 Component API

### GET `/api/components`

Query params:

```txt
search
status
page
limit
sort
```

Response item:

```json
{
  "id": "uuid",
  "name": "Button / Primary",
  "componentSetName": "Button",
  "totalInstances": 842,
  "filesUsed": 18,
  "status": "active",
  "lastSeenAt": "2026-06-03T10:00:00Z"
}
```

---

### GET `/api/components/:id`

Get component detail.

---

### GET `/api/components/:id/files`

Get files using component.

---

### GET `/api/components/:id/instances`

Get component instances.

---

### GET `/api/components/:id/trend`

Get component trend.

---

## 16.8 File Usage API

### GET `/api/files/:id`

Get registered file detail.

---

### GET `/api/files/:id/components`

Get components used in selected file.

---

## 16.9 Insights API

### GET `/api/insights/summary`

Response:

```json
{
  "data": {
    "totalComponents": 428,
    "registeredFiles": 32,
    "totalInstances": 12840,
    "unusedComponents": 47,
    "lowUsageComponents": 18,
    "failedScans": 2,
    "lastSuccessfulScanAt": "2026-06-03T10:00:00Z"
  }
}
```

---

### GET `/api/insights/unused-components`

---

### GET `/api/insights/low-usage-components`

---

### GET `/api/insights/recent-changes`

---

## 17. Rate Limit Handling

## 17.1 MVP Strategy

Because the app is local-first, use conservative sequential scanning.

Default:

```txt
scan_delay_ms = 7000
```

This means:

```txt
around 8–9 file scans per minute
```

This helps avoid aggressive Figma API usage.

---

## 17.2 Rate Limit Detection

If Figma returns:

```txt
HTTP 429 Too Many Requests
```

Backend should:

```txt
1. Read Retry-After header if available
2. Mark scan_job as rate_limited
3. Store retry_after_seconds
4. Wait and retry if possible
5. Preserve already completed scan results
```

---

## 17.3 Retry Strategy

Recommended:

```txt
Max retries: 3
Backoff: exponential
Respect Retry-After for 429
```

Pseudo-code:

```ts
async function withRetry<T>(fn: () => Promise<T>) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (isRateLimitError(error)) {
        await sleep(error.retryAfterSeconds * 1000);
        continue;
      }

      if (isTransientError(error)) {
        await sleep(1000 * attempt * attempt);
        continue;
      }

      throw error;
    }
  }

  throw new Error("MAX_RETRY_EXCEEDED");
}
```

---

## 18. Security Design

## 18.1 Token Storage

Even for localhost, token should be encrypted before saving.

Recommended:

```txt
AES-256-GCM
```

Store:

```txt
encrypted_access_token
```

Never store:

```txt
plain access token
```

---

## 18.2 Token Handling Rules

Rules:

```txt
- token is entered in frontend once
- token is sent to backend via POST /api/figma/connect
- backend validates token
- backend encrypts token
- backend stores encrypted token
- backend decrypts token only when calling Figma API
- frontend never receives token again
- token is never logged
```

---

## 18.3 Localhost Security Note

For personal localhost use, authentication can be skipped.

But if app is hosted publicly, add authentication.

Recommended future options:

```txt
Supabase Auth
Clerk
Auth.js
Basic password protection
```

MVP rule:

```txt
If localhost-only: no login required.
If hosted: login required.
```

---

## 19. Frontend Architecture

## 19.1 Routes

```txt
/
 /onboarding
 /overview
 /components
 /components/:componentId
 /files
 /files/:fileId
 /scans
 /insights
 /settings
```

---

## 19.2 App Layout

```txt
AppShell
├── Sidebar
├── TopBar
├── MainContent
└── ToastProvider
```

Sidebar:

```txt
Overview
Components
Files
Scans
Insights
Settings
```

---

## 19.3 Feature Modules

```txt
features/
├── onboarding/
├── figma-connection/
├── source-file/
├── components/
├── registered-files/
├── scans/
├── insights/
└── settings/
```

---

## 19.4 UI Component Library

Use shadcn/ui components:

```txt
Button
Input
Textarea
Card
Table
Badge
Tabs
Dialog
Sheet
Dropdown Menu
Command
Popover
Toast / Sonner
Skeleton
Alert
Tooltip
Separator
```

---

## 19.5 UI Style

Direction:

```txt
Figma Library Analytics × Linear
```

Visual character:

```txt
clean
compact
data-first
neutral
precise
table-heavy
fast-feeling
```

Avoid:

```txt
overly colorful SaaS dashboard
too many decorative charts
landing-page style UI
```

---

## 20. Backend Architecture

## 20.1 Backend Modules

```txt
server/src/
├── config/
├── routes/
├── controllers/
├── services/
├── repositories/
├── figma/
├── scanner/
├── middleware/
├── utils/
└── index.ts
```

---

## 20.2 Services

```txt
FigmaConnectionService
SourceFileService
SourceComponentService
RegisteredFileService
ScanService
ScannerService
UsageService
ChangeDetectionService
InsightService
SettingsService
```

---

## 20.3 Repositories

```txt
FigmaConnectionRepository
SourceFileRepository
SourceComponentRepository
RegisteredFileRepository
ScanJobRepository
UsageCurrentRepository
UsageSnapshotRepository
UsageInstanceRepository
UsageChangeRepository
SettingsRepository
```

---

## 21. Error Codes

Recommended error codes:

```txt
INVALID_FIGMA_URL
FIGMA_TOKEN_INVALID
FIGMA_ACCESS_DENIED
FIGMA_FILE_NOT_FOUND
FIGMA_RATE_LIMITED
FIGMA_API_ERROR
SOURCE_FILE_NOT_CONFIGURED
NO_COMPONENTS_FOUND
REGISTERED_FILE_NOT_FOUND
SCAN_ALREADY_RUNNING
SCAN_FAILED
MAX_RETRY_EXCEEDED
DATABASE_ERROR
UNKNOWN_ERROR
```

---

## 22. Testing Strategy

## 22.1 Unit Tests

Test:

```txt
Figma URL parser
node ID URL encoder
component map builder
tree traversal
instance detection
aggregation logic
change detection logic
status calculation
threshold calculation
```

---

## 22.2 Integration Tests

Test:

```txt
register source file
import components
add registered files
scan file with mocked Figma response
save snapshots
update current usage
detect changes
retry failed scan
```

---

## 22.3 Mock Figma Fixtures

Create fixtures:

```txt
fixtures/
├── source-ui-kit-basic.json
├── consumer-file-with-instances.json
├── consumer-file-zero-usage.json
├── consumer-file-renamed-components.json
├── consumer-file-large.json
└── figma-rate-limit-error.json
```

---

## 23. Local Development Plan

## 23.1 Install

```bash
pnpm install
```

---

## 23.2 Setup Environment

Create:

```txt
server/.env
client/.env
```

Backend:

```env
DATABASE_URL=postgresql://...
ENCRYPTION_SECRET=replace-with-strong-secret
FIGMA_API_BASE_URL=https://api.figma.com
PORT=4000
```

Frontend:

```env
VITE_API_BASE_URL=http://localhost:4000
```

---

## 23.3 Run Database Migration

```bash
pnpm prisma migrate dev
```

---

## 23.4 Run App

```bash
pnpm dev
```

This should run:

```txt
frontend on localhost:5173
backend on localhost:4000
```

---

## 23.5 First Use Flow

```txt
Open localhost:5173
→ Connect Figma token
→ Register source UI Kit
→ Import components
→ Register consumer files
→ Run first scan
→ View dashboard
```

---

## 24. Optional Hosting Plan

If user later wants hosting:

### Option A — Simple Hosted Backend

```txt
Frontend: Vercel
Backend: Railway / Render
Database: Supabase / Neon
```

Recommended for scan-heavy use.

Pros:

```txt
- long-running scan easier than serverless
- backend can process sequential scans
- less serverless timeout risk
```

---

### Option B — Serverless API

```txt
Frontend: Vercel
API: Vercel Functions
Database: Supabase / Neon
```

Only recommended if:

```txt
- scan is split per file
- each scan job is small
- no long-running batch scan in one function
```

Serverless scan pattern:

```txt
POST /api/scans creates jobs
POST /api/scans/file/:id scans one file
frontend polls and triggers next file
or scheduled function processes small batch
```

---

### Option C — Hybrid

```txt
Frontend: Vercel
API: Vercel Functions
Scanner Worker: Railway / Render
Database: Supabase / Neon
```

Best future architecture if product grows.

---

## 25. MVP Implementation Phases

### Phase 1 — Foundation

Build:

```txt
React Vite app
Express backend
Prisma setup
Supabase/Neon database connection
Figma token connect
source UI Kit registration
registered file CRUD
```

---

### Phase 2 — Component Import

Build:

```txt
Figma file fetch
source component traversal
component inventory save
component table
```

---

### Phase 3 — Scanner

Build:

```txt
scan batch
scan jobs
single file scan
instance detection
usage aggregation
current usage update
snapshot save
scan history
```

---

### Phase 4 — Dashboard

Build:

```txt
overview metrics
components page
component detail
files page
file detail
scans page
```

---

### Phase 5 — Change Detection & Insights

Build:

```txt
previous vs current comparison
usage_changes
recent changes
unused components
low usage components
stale files
failed scans
```

---

### Phase 6 — Polish

Build:

```txt
loading states
empty states
error states
toasts
scan progress polling
status badges
table filters
detail drawer
```

---

## 26. Technical Risks

### Risk 1 — Serverless timeout if hosted

Cause:

```txt
Large scans may exceed serverless function limits.
```

Mitigation:

```txt
Use local backend for MVP.
If hosted, use dedicated backend or split scan per file.
```

---

### Risk 2 — Large Figma file JSON

Cause:

```txt
Large design files may produce large API response.
```

Mitigation:

```txt
Scan sequentially.
Process in backend only.
Avoid frontend scanning.
Store only necessary fields.
```

---

### Risk 3 — Figma rate limit

Cause:

```txt
Too many file reads.
```

Mitigation:

```txt
Sequential scan.
scan_delay_ms setting.
Retry-After handling.
Manual scan first.
Scheduled scan later.
```

---

### Risk 4 — Token exposure

Cause:

```txt
Token handled in frontend or logs.
```

Mitigation:

```txt
Backend-only token usage.
Encrypted storage.
Never log token.
Never return token to frontend.
```

---

### Risk 5 — Stale data

Cause:

```txt
Scan result is snapshot-based.
```

Mitigation:

```txt
Show last scanned timestamp.
Show stale badge.
Support manual rescan.
```

---

## 27. AI Coding Agent Prompt

Use this prompt for implementation:

```txt
Build a local-first Design System Component Usage Tracker.

Use React + Vite + TypeScript for the frontend. Use shadcn/ui + Tailwind CSS for UI, TanStack Query for API state, TanStack Table for tables, Recharts for simple trends, React Hook Form and Zod for forms and validation.

Use Node.js + Express + TypeScript for the backend. Use Prisma ORM with PostgreSQL. The database should be Supabase Postgres or Neon Postgres through DATABASE_URL.

The app should run locally with:
- frontend on localhost:5173
- backend on localhost:4000

Do not require hosting for MVP.

The app must allow a Design Ops user to:
1. connect Figma Personal Access Token,
2. register one source UI Kit Figma file,
3. import source components,
4. register consumer Figma files,
5. run scan all,
6. scan one file,
7. detect source component instances,
8. save current usage,
9. save usage snapshots,
10. detect changes between scans,
11. display component usage dashboard,
12. display file usage dashboard,
13. display scan history,
14. display unused and low usage components.

Keep Figma token backend-only. Encrypt the token before saving. Never expose it to frontend after connect.

Use a sequential local scanner, not Redis/BullMQ. Store scan_batches and scan_jobs in PostgreSQL. Process scans one file at a time with a configurable delay to avoid Figma API rate limit.

The UI should be clean, compact, table-heavy, and inspired by Figma Library Analytics and Linear.
```

---

## 28. Summary

This version of the system should be built as a **local-first MVP**.

Recommended implementation:

```txt
React Vite frontend
+ local Express backend
+ Supabase/Neon Postgres
+ Prisma
+ sequential scanner
```

Avoid for MVP:

```txt
Redis
BullMQ
serverless-only scanning
OAuth
multi-user auth
real-time tracking
automatic workspace discovery
```

The core workflow remains:

```txt
Connect Figma
→ Register source UI Kit
→ Import components
→ Register consumer files
→ Scan files locally
→ Detect component instances
→ Save snapshots
→ Detect changes
→ Show dashboard
```

This approach is easier to build, easier to debug, and safer for long-running scans than a pure serverless backend.
