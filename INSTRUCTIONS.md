# Running federated-frontend Locally

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 18 LTS or 20 LTS | https://nodejs.org |
| npm | Bundled with Node.js | — |
| fedinet-go backend | Running on `:8080` | See [`fedinet-go/INSTRUCTIONS.md`](../fedinet-go/INSTRUCTIONS.md) |

> The frontend is a Next.js 16 App Router app. It proxies API calls to the Go backend — **the backend must be running first**.

---

## How to Run

### Step 1 — Install dependencies (first time only)

```bash
cd federated-frontend
npm install
```

### Step 2 — Create the environment file

Create a file called `.env.local` inside the `federated-frontend/` folder. This file is gitignored — you manage it yourself and must never commit it.

```bash
# federated-frontend/.env.local

# Single-server setup (most common)
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080

# If running both federation servers, also add:
# NEXT_PUBLIC_BACKEND_URL_B=http://localhost:9080
```

> If `.env.local` is missing, API calls will fail with network errors.

### Step 3 — Start the dev server

```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

The dev server supports hot-reload — changes to source files are reflected immediately without restarting.

---

## Available Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start the development server on `:3000` with hot-reload |
| `npm run build` | Compile a production build into `.next/` |
| `npm run start` | Serve the compiled production build (run `build` first) |
| `npm run lint` | Run ESLint across the codebase |
| `npm test` | Run Jest unit tests |

---

## Running a Production Build Locally

```bash
npm run build
npm run start
```

Serves on **http://localhost:3000** (no hot-reload).

---

## Running Tests

```bash
npm test
```

Runs all Jest tests found in `**/*.test.{ts,tsx}` files.

```bash
npm test -- --watch          # re-run on every file change
npm test -- --coverage       # generate coverage report
npm test -- path/to/file     # run a specific test file
```

---

## Folder Structure (quick reference)

```
federated-frontend/
  app/
    api/              # Next.js API route handlers (proxy to Go backend)
    components/       # Shared UI components (PostCard, Sidebar, FollowButton …)
    context/          # AuthContext, CacheContext (localStorage SWR)
    types/            # TypeScript interfaces
    utils/            # Shared utilities
    feed/             # Home feed page  → /feed
    explore/          # Discover page   → /explore
    profile/          # User profile    → /profile/[username]
    compose/          # New post        → /compose
    messages/         # DMs             → /messages
    notifications/    # Activity        → /notifications
    search/           # Search results  → /search
    login/            # Login           → /login
    register/         # Registration    → /register
    recover/          # Account recovery→ /recover
  public/             # Static assets
```

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_BACKEND_URL` | Yes | — | Base URL for Server A Go backend |
| `NEXT_PUBLIC_BACKEND_URL_B` | No | — | Base URL for Server B (federation only) |

All `NEXT_PUBLIC_*` variables are embedded at build time and visible in the browser.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Module not found` errors | Run `npm install` again — `node_modules/` may be missing or outdated. |
| API calls return `ECONNREFUSED` | The Go backend is not running. Start it first (see Step 0). |
| `NEXT_PUBLIC_BACKEND_URL is not defined` | `.env.local` is missing or has a typo. Re-check Step 2. |
| Port 3000 already in use | Kill the process using port 3000 or set a custom port: `PORT=3001 npm run dev` |
| Changes not showing (production) | You are running `npm start`. Re-run `npm run build` then `npm start`, or switch to `npm run dev`. |
| TypeScript errors at startup | Run `npm run lint` to see details. Errors don't block the dev server but will block `npm run build`. |
