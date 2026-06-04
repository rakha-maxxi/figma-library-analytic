# Design System Component Usage Tracker

A local-first Design System Component Usage Tracker for Design Ops. Helps trace components from a source UI Kit Figma file across registered Figma consumer files, detect adoption, log historical scan snapshots, and surface governance metrics.

---

## 🚀 Tech Stack

- **Frontend**: React (v19) + Vite + TypeScript
- **Styling**: Tailwind CSS (v4) + shadcn/ui (`@base-ui/react` + `nova` preset)
- **State Management**: TanStack Query (React Query)
- **Data Visualizations**: Recharts & TanStack Table
- **Database & Client**: Supabase Postgres & Prisma ORM

---

## 📂 Project Structure

```txt
figma-library-analytic/
├── client/                     # React Vite frontend application
│   ├── src/
│   │   ├── components/         # Reusable layouts and UI components
│   │   ├── hooks/              # API and Mock DB integration hooks
│   │   ├── lib/                # Database simulators (mockDb.ts)
│   │   ├── pages/              # Onboarding, Overview, Components, Files, Scans, Insights
│   │   └── index.css           # Global custom theme styles
│   └── package.json
│
├── .env.example                # Config template file
├── PRD.md                      # Product Requirements Document
├── SRS.md                      # Software Requirements Specification
├── TECH-SPEC.md                # System Architecture Technical Specification
└── README.md                   # Setup Guide & Documentation
```

---

## ⚙️ Setup & Installation

### 1. Environment Configuration
Duplicate the configuration template in the root directory:
```bash
cp .env.example .env
```
Fill in the values in your `.env`:
- **`VITE_SUPABASE_URL`** & **`VITE_SUPABASE_PUBLISHABLE_KEY`**: Client keys from your Supabase Project Settings.
- **`DATABASE_URL`** & **`DIRECT_URL`**: Transaction/session Postgres connection strings. 
  > [!IMPORTANT]
  > If your database password contains special characters (like `@`, `[`, or `]`), they **must** be URL-encoded (e.g., `@` becomes `%40`, `[` becomes `%5B`, and `]` becomes `%5D`).

### 2. Frontend Installation & Local Dev
Navigate to the `client` directory, install packages, and launch the development environment:
```bash
cd client
npm install
npm run dev
```

The application will launch on **[http://localhost:5173/](http://localhost:5173/)**.

---

## 🔄 Scanning Workflow Simulator
For the MVP frontend, the application incorporates a local database queue and background scanning simulator in `client/src/lib/mockDb.ts`. 

1. **PAT Authorization**: Enter your token on settings/onboarding.
2. **Library Registry**: Hook up a source library (e.g., UI Kit).
3. **Consumer Registry**: Register Figma file URLs you want to crawl.
4. **Queue Scan**: Start a crawl batches scan to sequentially process and detect component changes, generating snapshot entries directly in `localStorage` mirroring future Prisma server models.
