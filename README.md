# 🌧️ YourForm — Premium Form Builder SaaS

YourForm is a highly polished, premium Typeform-style Form Builder SaaS. It features the **Minimalist Dark Teal Tech Theme**—a gorgeous, clean developer-focused visual style with flat glass panels, high-contrast borders, and robust solid color-palette presets.

Creators can build validation-strict forms, publish secure share links, collect submissions, and review aggregated response charts from one cohesive workspace.

---

## 🛠️ The Tech Stack

This project is built using a modern, end-to-end type-safe monorepo architecture:

### 1. Monorepo & Tooling
*   **[Turborepo](https://turbo.build/repo)**: High-performance build system orchestrating task execution across packages.
*   **[pnpm Workspaces](https://pnpm.io/workspaces)**: Blazing-fast package manager linking shared monorepo components.
*   **TypeScript**: 100% type-safe coding across both frontend, backend, and shared libraries.

### 2. Frontend (`apps/web`)
*   **[Next.js 16 (App Router)](https://nextjs.org/)**: React framework with Server Actions, running in dev mode on **Turbopack**.
*   **[tRPC Client](https://trpc.io/)**: Injects fully type-safe API requests, avoiding manual `fetch` calls.
*   **Tailwind CSS (v4) & Vanilla CSS**: Custom CSS tokens in `globals.css` creating a dark Vercel/Linear-inspired aesthetic.
*   **[Recharts](https://recharts.org/)**: Elegant interactive data charts on the creator analytics dashboards.
*   **React Hook Form & Zod**: Client-side form state and validation schemas.

### 3. Backend (`apps/api`)
*   **[Express.js](https://expressjs.com/)**: Standard HTTP server hosting tRPC and OpenAPI.
*   **[tRPC Server](https://trpc.io/)**: Injects type-safe routers, queries, and mutations directly into the Next.js app.
*   **[Scalar API Reference](https://scalar.com/)**: Located at `/docs`—an interactive OpenAPI testing documentation dashboard for tRPC REST wrappers.

### 4. Database & Logger (`packages/database`, `packages/logger`)
*   **PostgreSQL**: Cloud database hosted securely on **Supabase**.
*   **[Drizzle ORM](https://orm.drizzle.team/)**: Type-safe TypeScript ORM managing tables, relationships, and queries.
*   **Drizzle Studio**: Runs locally on `https://local.drizzle.studio` for instant data checking.
*   **Winston Logger**: Highly-scalable structured Winston logger shared across apps.

---

## 🎨 Visual Themes & Design
YourForm features a bespoke **Premium Minimalist Dark Teal Theme**:
*   **Base Palette**: Deep near-black background (`#0F0F0F`) with high-contrast, flat dark charcoal cards (`#232D3F`) and thin elegant slate borders.
*   **Accents**: Action buttons and focus borders use a crisp emerald teal (`#008170`) with darker forest green hover accents (`#005B41`).
*   **Dynamic Preset Palettes**: Individual forms can be morph-styled instantly with solid color presets:
    *   `Sakura` (Soft Ruby Rose)
    *   `Slate` (Cool Minimalist Gray)
    *   `Lantern` (Warm Amber Glow)
    *   `Aurora` (Sky Cyan)
    *   `Stadium` (Sports Emerald Mint)
    *   `Neon` (Royal Indigo)
    *   `Mist Valley` (Your custom Dark Teal theme)

---

## 📁 Directory Structure

```
Yourform/
├── apps/
│   ├── api/          # Express backend server with tRPC & Scalar docs
│   └── web/          # Next.js App Router frontend dashboard & forms
├── packages/
│   ├── database/     # Drizzle schemas, migrations, and absolute-path seed scripts
│   ├── logger/       # Winston-configured structured logger
│   ├── services/     # Shared template catalogs and core business logic
│   ├── trpc/         # Shared client/server routers and endpoints
│   └── typescript-config/
```

---

## 🏃‍♂️ Local Development Setup

Follow these steps to fire up the entire project locally:

### 1. Configure Environment Variables
Create a `.env` file at the root:
```env
DATABASE_URL="your-supabase-postgres-connection-string"
NEXT_PUBLIC_API_URL="http://localhost:8000/trpc"
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Run Migrations & Seed Templates
Generate database tables and populate them with the template catalog (contains 10 preset forms):
```bash
pnpm --filter @repo/database db:seed
```

### 4. Start Development Servers
```bash
pnpm dev
```
This runs the Next.js app (port 8080), Express backend (port 8000), and Drizzle Studio concurrently.

*   **Frontend**: [http://localhost:8080](http://localhost:8080)
*   **Backend API**: [http://localhost:8000](http://localhost:8000)
*   **Scalar API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
*   **Drizzle Studio**: [https://local.drizzle.studio](https://local.drizzle.studio)

**Default Demo Credentials:**
*   **Email**: `creator@yourform.com`
*   **Password**: `password123`

---

## 📡 Production Deployment

### 1. Backend Deployment (Render)
1.  Create a new **Web Service** pointing to your repository.
2.  Set the following settings:
    *   **Root Directory**: *(Leave blank)*
    *   **Build Command**: `pnpm install && pnpm exec turbo run build --filter=@repo/api...`
    *   **Start Command**: `node apps/api/dist/index.js`
3.  Add the **Environment Variables**:
    *   `DATABASE_URL`: *(Your Supabase connection string)*
    *   `NODE_ENV`: `production`
    *   `BASE_URL`: `https://your-api-service.onrender.com`

### 2. Frontend Deployment (Vercel)
1.  Import your repository into Vercel.
2.  Set the following configuration:
    *   **Framework**: Next.js
    *   **Root Directory**: `apps/web` (Turn **ON** the *"Keep other directories"* checkbox).
3.  Add the **Environment Variables**:
    *   `NEXT_PUBLIC_API_URL`: `https://your-api-service.onrender.com/trpc` *(Your live Render backend url)*
4.  Click **Deploy**!
