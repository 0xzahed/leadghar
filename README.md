# LeadGhar — never lose a lead

Lead pipeline dashboard: 5-stage kanban (new → contacted → quoted → won/lost),
due follow-up reminders, notes and pipeline value in ৳. Built for agencies
and freelancers who live on client leads.

## Run it

```bash
npm install
cp .env.example .env   # optional — MongoDB persistence
npm run dev            # http://localhost:3000
```

Without `MONGODB_URI` data lives in `.data/` (gitignored file store).

## Features (built feature-by-feature)

- **F1** — leads pipeline model (stages, notes, follow-ups) + CRUD/move APIs
- **F2** — due follow-ups engine + pipeline value + demo seed
- **F3** — kanban dashboard UI (notes, stage moves, follow-up dates)
- **F4** — verified build + live tests (due list, won move revalues pipeline)

## Notes

- `cacheComponents: false` + `dynamic = "force-dynamic"` so every number is live.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind v4 · Mongoose (optional)
