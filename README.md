# Design System Component Usage Tracker

A local-first Design Ops dashboard that tracks design system component usage across registered Figma consumer files. Connect a Figma source UI Kit, register consumer files, scan them for component instances, and monitor adoption trends.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite + TypeScript |
| Styling | Tailwind CSS 4 + shadcn/ui |
| State | TanStack Query |
| Charts | Recharts |
| Backend | Node.js + Express + TypeScript |
| ORM | Prisma |
| Database | Supabase Postgres |

---

## Project Structure

```
figma-library-analytic/
├── client/                          # React Vite frontend
│   └── src/
│       ├── components/
│       │   ├── ui/                  # shadcn/ui primitives
│       │   └── dashboard/           # Dashboard widgets & layout
│       ├── hooks/
│       │   ├── useTracker.ts        # All data hooks (queries + mutations)
│       │   └── useDashboard.ts      # Dashboard layout persistence
│       ├── lib/
│       │   ├── api.ts               # HTTP client
│       │   ├── types.ts             # Shared TypeScript types
│       │   ├── utils.ts             # cn(), parseFigmaComponentName()
│       │   ├── dashboard-types.ts   # Widget layout types
│       │   ├── widget-registry.ts   # Widget component registry
│       │   └── init-widgets.ts      # Register all 16 dashboard widgets
│       └── pages/
│           ├── OverviewPage.tsx     # Dynamic dashboard
│           ├── ComponentsPage.tsx   # Component inventory + detail drawer
│           ├── FilesPage.tsx        # 3-panel file workspace
│           ├── ScansPage.tsx        # Scan batch monitoring
│           ├── InsightsPage.tsx     # Governance & cleanup
│           └── SettingsPage.tsx     # Figma connection & thresholds
│
├── server/                          # Express backend
│   ├── prisma/
│   │   └── schema.prisma            # Database models
│   └── src/
│       ├── index.ts                 # Entry point
│       ├── config/                  # Environment & Prisma client
│       ├── figma/                   # Figma REST API client
│       ├── scanner/                 # Tree traversal, detection, change detection
│       ├── services/                # Business logic layer
│       ├── routes/                  # REST API routes
│       ├── middleware/              # Error handling
│       └── utils/                   # Encryption, URL parsing, errors
│
├── PRD.md                           # Product Requirements
├── SRS.md                           # Software Requirements
├── TECH-SPEC.md                     # Technical Specification
└── README.md
```

---

## Setup

### 1. Environment

Root `.env`:

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
```

Server `.env` (`server/.env`):

```env
PORT=4000
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
ENCRYPTION_SECRET=your-32-char-secret
FIGMA_API_BASE_URL=https://api.figma.com
```

Client `.env` (`client/.env`):

```env
VITE_API_BASE_URL=http://localhost:4000
```

### 2. Database

```bash
cd server
npm install
npx prisma db push
```

### 3. Run

```bash
# Terminal 1 — Backend
cd server && npm run dev    # http://localhost:4000

# Terminal 2 — Frontend
cd client && npm run dev    # http://localhost:5173
```

Or from root:

```bash
npm run dev:server & npm run dev:client
```

---

## API Endpoints

### Figma Connection
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/figma/connect` | Save & validate PAT (encrypted backend-only) |
| GET | `/api/figma/status` | Connection status |
| DELETE | `/api/figma/disconnect` | Remove token |

### Source UI Kit
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/source-file` | Register source UI Kit file |
| GET | `/api/source-file` | Get active source file |
| POST | `/api/source-file/refresh-components` | Refresh component inventory |

### Registered Files
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/registered-files` | Add consumer files |
| GET | `/api/registered-files` | List registered files |
| PATCH | `/api/registered-files/:id` | Toggle tracking |
| DELETE | `/api/registered-files/:id` | Remove file |

### Scans
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/scans` | Scan all active files |
| POST | `/api/scans/file/:id` | Scan single file |
| GET | `/api/scans` | List scan jobs |
| GET | `/api/scans/batches` | List scan batches |
| GET | `/api/scans/batches/:id` | Get batch status |
| POST | `/api/scans/:id/retry` | Retry failed scan |

### Components
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/components` | List components with usage |
| GET | `/api/components/:id` | Component detail + trend |
| GET | `/api/components/:id/files` | Files using component |
| GET | `/api/components/:id/instances` | Component instances |
| GET | `/api/components/:id/trend` | Usage trend |

### Files
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/files/:id` | File detail + components |
| GET | `/api/files/:id/components` | Components used in file |
| GET | `/api/files/:id/instances` | Instance placements in file |

### Insights
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/insights/summary` | Overview metrics |
| GET | `/api/insights/unused-components` | Zero-usage components |
| GET | `/api/insights/low-usage-components` | Below threshold |
| GET | `/api/insights/recent-changes` | Usage deltas |
| GET | `/api/insights/adoption-trend` | Snapshot trend data |
| GET | `/api/insights/stale-files` | Outdated scan data |
| GET | `/api/insights/failed-scans` | Failed scan jobs |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/widgets` | Available widget metadata |
| GET | `/api/dashboard/layout` | Saved layout config |
| PUT | `/api/dashboard/layout` | Save layout |
| POST | `/api/dashboard/layout/reset` | Reset to default |

---

## Architecture

### Token Security
- Figma PAT sent once via `POST /api/figma/connect`
- Encrypted with AES-256-GCM before storage
- Decrypted only for Figma API calls
- Never returned to frontend, never logged

### Scanner
- Sequential database-backed scan jobs (no Redis/BullMQ)
- Configurable delay between files (`scanDelayMs`, default 7000ms)
- Component matching: by `component_key` first, `node_id` fallback
- **Direct vs nested tracking**: only direct instances count in analytics; nested instances (components inside other components) are stored separately with `usageDepth: 'nested'` and parent references
- Change detection: `newly_used`, `increased`, `decreased`, `removed` per scan

### Response Format
```json
{ "data": { ... }, "meta": { ... } }
```
```json
{ "error": { "code": "FIGMA_TOKEN_INVALID", "message": "..." } }
```

### Database Models
`figma_connections`, `source_files`, `source_components`, `registered_files`, `scan_batches`, `scan_jobs`, `component_usage_current`, `usage_snapshots`, `usage_instances`, `usage_changes`, `app_settings`, `dashboard_preferences`, `activity_logs`

---

## Dashboard

The Overview page uses a dynamic widget system with 16 available widgets:

**Default layout:**
1. Summary Metrics — total instances, components, files, last scan
2. Direct Instances Trend — area chart over scan history
3. Recent Usage Changes — latest component usage deltas
4. Top Used Components — ranked by adoption
5. Files Needing Attention — failed, stale, zero-usage files
6. Governance Health — unused, low-usage, stale file counts

Layout is persisted to `dashboard_preferences` table with localStorage fallback. Click "Customize Dashboard" to add, remove, reorder, and resize widgets.

---

## Key Pages

| Page | Purpose |
|------|---------|
| **Overview** | Dynamic widget dashboard |
| **Components** | Source component inventory with detail drawer |
| **Consumer Files** | 3-panel workspace: file list → detail → scan results |
| **Scan Jobs** | Batch monitoring, durations, retry |
| **Insights & Health** | Unused components, low usage, stale files |
| **Settings** | Figma connection, source UI Kit, thresholds |
