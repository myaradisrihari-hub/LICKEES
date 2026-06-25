# 🍦 Lickees — Juice & Ice Cream Business Manager

A modern, mobile-first web app to run a sugarcane juice & ice cream shop with **minimum daily data entry**. Built for speed: daily work takes under 2 minutes. No login — open the app and start working (single-owner).

Green & white theme · rounded cards · large buttons · clean SaaS-style dashboard.

## ✨ Features

- **Dashboard** — today & monthly revenue / expenses / profit, average revenue per day, inventory value, wastage loss, plus charts (Revenue vs Expenses, Monthly Profit Trend, Top Selling Ice Creams).
- **Daily Entry** — cash + online revenue and unlimited free-form expenses (amount + reason). Profit auto-calculated. Always defaults to today.
- **Inventory** — items with just *name* + *pieces per box* (no brand). Live remaining pieces, boxes left, and inventory value.
- **Stock Purchase** — record boxes purchased + amount. Stock updates automatically.
- **Empty Box Tracking** — never count individual ice creams. Log empty boxes → `sold pieces = empty boxes × pieces per box`.
- **Wastage** — log melted / damaged / expired pieces and see the loss value.
- **Reports** — monthly revenue/expenses/profit, average daily income, highest sales day, top sellers, wastage report, previous-month comparison. Export to **PDF / Excel / CSV**.
- **Smart Order Planner** — the core feature. Capacity-aware supplier order sheet that distributes boxes so all items finish around the same time (fast sellers get more, slow sellers get fewer), never exceeding fridge capacity.
- All tables support **search, sorting, pagination**.

## 🧱 Tech Stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** (Radix)
- **Supabase** (Postgres, Auth, Row Level Security)
- **Recharts** for charts
- **TanStack Table** for data tables
- **jsPDF / SheetJS** for exports

## 🚀 Getting Started

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a project, then open **Project Settings → API** and copy:

- Project URL
- `anon` public key

### 2. Configure environment

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

### 3. Apply the database schema

Open the Supabase **SQL Editor** and run, in order:

1. `supabase/migrations/0001_init.sql` — tables, triggers, grants
2. `supabase/migrations/0002_views.sql` — analytics views (stock & P&L)

> Already had the older auth-based schema? Also run `0003_remove_auth.sql` to convert it to the open single-owner model.
>
> Or, with the Supabase CLI: `supabase db push`.

### 4. Install & run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — there is no login, you go straight to the dashboard.

## 🗄️ Database Tables

| Table | Purpose |
| --- | --- |
| `app_settings` | Shop name, **fridge capacity** (boxes), currency |
| `daily_revenue` | One row per day: cash + online |
| `expenses` | Free-form expenses (amount + reason) |
| `inventory_items` | Name + pieces per box |
| `stock_purchases` | Boxes purchased + amount |
| `empty_boxes` | Empty boxes → derived sold pieces |
| `damaged_stock` | Melted / Damaged / Expired wastage |

Two views power analytics:

- `item_stock` — purchased, sold, damaged, **remaining pieces**, avg cost per piece, inventory value.
- `daily_pnl` — per-day revenue, expenses, profit.

There is no authentication: the app runs as a single shop owner and all rows share one fixed owner id.

## 🧠 How the Smart Order Planner works

1. Computes each item's **average daily sales** from the last 30 days of empty-box logs.
2. Calculates **boxes currently occupying** the fridge and the **free space** left up to your capacity.
3. Greedily allocates available boxes one at a time to whichever item would otherwise run out soonest — equalising projected finish dates.
4. Items with no recent sales get no boxes (avoids dead stock). The total never exceeds fridge capacity.
5. Produces a ready-to-send **supplier order sheet** you can export to PDF/Excel/CSV.

You can change the fridge capacity live on the planner page to explore scenarios; the default comes from **Settings**.

## 📁 Project Structure

```
src/
├── app/
│   ├── (dashboard)/        # protected app (sidebar layout)
│   │   ├── page.tsx        # dashboard
│   │   ├── daily/          # daily entry
│   │   ├── inventory/      # items + stock
│   │   ├── purchases/      # stock purchases
│   │   ├── empty-boxes/    # sales via empty boxes
│   │   ├── wastage/        # melted/damaged
│   │   ├── reports/        # monthly analytics + export
│   │   ├── planner/        # smart order planner
│   │   └── settings/       # shop + fridge capacity
│   └── layout.tsx
├── components/             # reusable UI (data-table, charts, stat-card, …)
│   └── ui/                 # shadcn primitives
└── lib/
    ├── supabase/           # browser / server clients + owner helper
    ├── analytics.ts        # planner algorithm (pure, testable)
    ├── data.ts             # server-side report/dashboard fetchers
    ├── export.ts           # PDF / Excel / CSV
    ├── format.ts           # currency & date helpers
    └── types.ts            # database types
supabase/migrations/        # SQL schema & views
```

## 📜 Scripts

```bash
npm run dev      # start dev server
npm run build    # production build
npm run start    # run production build
npm run lint     # eslint
```

---

Built to keep your daily workload tiny. Add revenue, drop in a couple of expenses, log empty boxes when they finish — that's it.
