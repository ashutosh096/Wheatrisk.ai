# WheatRisk.ai — Uttar Pradesh Dashboard

A senior-quality agricultural risk intelligence dashboard for 75 Uttar Pradesh districts. Built for lenders, agri-finance teams, and crop risk analysts who need district-level wheat risk insights on one screen.

---

## Screenshots

The dashboard has three panels:
- **Left** — dark sidebar: season/year selector, growth stage, state/district filter, and layer switcher
- **Center** — Leaflet map of UP districts, colored by risk category (Wheat Risk / Drought / Heat), India context in the background
- **Right** — summary stat cards, distribution donut chart, and per-district deep-dive (Risk DNA radar + crop health trajectory + lender recommendations)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v4 |
| Map | Leaflet + react-leaflet |
| Charts | Recharts |
| API client | TanStack Query (React Query) + Orval-generated hooks |
| Backend | Node.js 24 + Express 5 |
| DB (optional) | PostgreSQL + Drizzle ORM |
| Monorepo | pnpm workspaces |
| API spec | OpenAPI 3.1 → code generation via Orval |

---

## Project Structure

```
wheatrisk/
├── artifacts/
│   ├── wheatrisk/           ← React + Vite frontend
│   │   └── src/
│   │       ├── App.tsx
│   │       ├── components/
│   │       │   ├── Navbar.tsx
│   │       │   ├── FilterSidebar.tsx
│   │       │   ├── MapPanel.tsx
│   │       │   ├── RightPanel.tsx
│   │       │   ├── DistrictCard.tsx
│   │       │   └── BottomLegend.tsx
│   │       └── lib/
│   │           ├── colorUtils.ts      ← risk category → color mapping
│   │           └── districtNormalizer.ts ← GeoJSON name → API name
│   └── api-server/          ← Express API server
│       └── src/
│           ├── routes/
│           │   ├── districts.ts       ← /api/districts, /api/districts/detail, /api/districts/distribution
│           │   └── filters.ts         ← /api/filters/seasons, /api/filters/growth-stages
│           └── data/
│               └── sampleData.ts      ← 75 UP districts demo data (REPLACE with real data)
├── lib/
│   ├── api-spec/
│   │   └── openapi.yaml       ← Single source of truth for all API types
│   ├── api-client-react/      ← Generated TanStack Query hooks (from Orval)
│   └── api-zod/               ← Generated Zod schemas (from Orval)
└── package.json
```

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 20 (LTS) |
| pnpm | ≥ 9 |

Install pnpm if you don't have it:
```bash
npm install -g pnpm@latest
```

---

## Clone & Run Locally

### 1. Clone / unzip the project

If you received a zip file:
```bash
unzip WheatRisk_Dashboard_Updated.zip -d WheatRisk_Dashboard
cd WheatRisk_Dashboard
```

If you're cloning from a Git repository:
```bash
git clone https://github.com/<your-org>/wheatrisk-dashboard.git
cd wheatrisk-dashboard
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set environment variables

Create a `.env` file in the project root (optional — only needed for real database):
```env
# Only required if you connect a real PostgreSQL database
DATABASE_URL=postgresql://user:password@localhost:5432/wheatrisk
```

The demo runs without any database — all data comes from `sampleData.ts`.

### 4. Run the API server

Open a terminal and start the backend:
```bash
PORT=5000 BASE_PATH=/api pnpm --filter @workspace/api-server run dev
```

You should see:
```
API server listening on port 5000
```

### 5. Run the frontend

Open a **second terminal** and start the frontend:
```bash
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/wheatrisk run dev
```

Open your browser at: **http://localhost:3000**

> **Note:** The frontend calls `/api/...` which is proxied to port 5000 when both run on localhost.
> On Replit the shared proxy handles this automatically.

---

## API Endpoints

All endpoints are prefixed with `/api`.

| Method | Path | Description |
|---|---|---|
| GET | `/api/healthz` | Health check |
| GET | `/api/districts?season=&growth_stage=&layer=` | All 75 UP districts with risk data |
| GET | `/api/districts/detail?district=&season=&growth_stage=` | Full detail for one district |
| GET | `/api/districts/distribution?season=&growth_stage=&layer=` | Category distribution counts |
| GET | `/api/filters/seasons` | Available seasons list |
| GET | `/api/filters/growth-stages` | Growth stage definitions |

Example:
```bash
curl "http://localhost:5000/api/districts/detail?district=Agra&season=2025-26&growth_stage=flowering"
```

---

## Replacing Demo Data with Real Data

All mock data lives in one file:

```
artifacts/api-server/src/data/sampleData.ts
```

### Option A — Direct data replacement (simplest)

Edit `sampleData.ts`. The `buildDistrictData` function generates synthetic values.  
Replace the `getAllDistrictsData` and `getDistrictData` functions to read from your own source:

```typescript
// Example: read from a JSON file of real IMD data
import realData from "./real_imd_data.json";

export function getDistrictData(district: string, season: string, growthStage: string): DistrictRisk | null {
  return realData.find(d =>
    d.district.toLowerCase() === district.toLowerCase() &&
    d.season === season &&
    d.growth_stage === growthStage
  ) ?? null;
}
```

### Option B — PostgreSQL backend (production)

1. Add your `DATABASE_URL` to `.env`
2. Define tables in `lib/db/src/schema/index.ts` using Drizzle ORM:
   ```typescript
   export const districtRisk = pgTable("district_risk", {
     id: serial("id").primaryKey(),
     district: varchar("district", { length: 100 }).notNull(),
     season: varchar("season", { length: 20 }).notNull(),
     growth_stage: varchar("growth_stage", { length: 50 }).notNull(),
     risk_level: varchar("risk_level", { length: 20 }).notNull(),
     mean_chi: numeric("mean_chi").notNull(),
     // ... other columns
   });
   ```
3. Run migrations:
   ```bash
   pnpm --filter @workspace/db run push
   ```
4. Update `artifacts/api-server/src/routes/districts.ts` to query the database instead of importing from `sampleData.ts`.

### Option C — Connect an external REST/GraphQL API

Edit `lib/api-spec/openapi.yaml` to match your API's endpoints, then regenerate client code:
```bash
pnpm --filter @workspace/api-spec run codegen
```
This regenerates the React Query hooks in `lib/api-client-react/src/generated/`.

---

## Map Data Source

The UP district GeoJSON is fetched at runtime from:
```
https://raw.githubusercontent.com/udit-001/india-maps-data/main/geojson/states/uttar-pradesh.geojson
```

The India state outlines (for context background) are fetched from:
```
https://raw.githubusercontent.com/geohacker/india/master/state/india_state.geojson
```

To use offline / self-hosted GeoJSON:
1. Download both files and place them in `artifacts/wheatrisk/public/`
2. In `MapPanel.tsx`, change the fetch URLs to `/up-districts.geojson` and `/india-states.geojson`

---

## Regenerating API Types

If you modify `lib/api-spec/openapi.yaml`, regenerate all client code:
```bash
pnpm --filter @workspace/api-spec run codegen
```

This updates:
- `lib/api-client-react/src/generated/api.ts` — React Query hooks
- `lib/api-client-react/src/generated/api.schemas.ts` — TypeScript interfaces
- `lib/api-zod/src/generated/` — Zod validators

---

## Building for Production

```bash
# Build the frontend (outputs to artifacts/wheatrisk/dist/public/)
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/wheatrisk run build

# Build the API server (outputs to artifacts/api-server/dist/)
pnpm --filter @workspace/api-server run build
```

Serve the built frontend as static files from Express:
```typescript
// In artifacts/api-server/src/app.ts
app.use(express.static(path.join(__dirname, "../../wheatrisk/dist/public")));
```

---

## Customising the Dashboard

### Add a new risk layer
1. Add a new key to `LAYER_COLORS` and `LAYER_THRESHOLDS` in `artifacts/wheatrisk/src/lib/colorUtils.ts`
2. Add the corresponding data field in `sampleData.ts`
3. Update the OpenAPI spec in `lib/api-spec/openapi.yaml`
4. Run `pnpm --filter @workspace/api-spec run codegen`

### Change the branding
- Logo / name: `artifacts/wheatrisk/src/components/Navbar.tsx`
- Color scheme: CSS variables in `artifacts/wheatrisk/src/index.css`
- District mapping corrections: `artifacts/wheatrisk/src/lib/districtNormalizer.ts`

### Add authentication
- Follow the Replit Auth or Clerk setup guides
- Protect the API routes in `artifacts/api-server/src/routes/index.ts`

---

## FAQ

**Q: The map shows a blank white area or no districts.**  
A: The GeoJSON is fetched from GitHub on first load. Check network connectivity. If offline, use the self-hosted GeoJSON option above.

**Q: Districts on the map don't match the API data.**  
A: District name spellings differ between GeoJSON sources and IMD data. Add a mapping in `artifacts/wheatrisk/src/lib/districtNormalizer.ts`.

**Q: I see "Demo Data" in the sidebar — how do I connect real data?**  
A: Follow "Replacing Demo Data" above. The "Connect API →" button in the sidebar is a hook you can wire to a settings modal.

**Q: Can I deploy this to production?**  
A: Yes. On Replit, click "Publish" after building. For other hosts, build both packages and deploy the Express server with the static frontend embedded.

---

## License

MIT — free to use, modify, and distribute.
