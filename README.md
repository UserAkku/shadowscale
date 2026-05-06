# ShadowScale

**Anonymous, Distributed URL Shortener** — Full-stack application with a microservices backend and a Next.js frontend.

Built with TypeScript, Express, PostgreSQL, Redis, BullMQ, Next.js 16, React 19, and Tailwind CSS 4.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Backend Services](#backend-services)
- [Frontend](#frontend)
- [User Flows](#user-flows)
- [Database Schema](#database-schema)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Deployment](#deployment)
- [API Quick Reference](#api-quick-reference)
- [Manual Testing](#manual-testing)
- [Internal Design Notes](#internal-design-notes)
- [Known Notes](#known-notes)
- [Future Improvements](#future-improvements)

---

## Features

- **Anonymous URL Shortening** — no signup required, shorten any URL instantly
- **User Authentication** — signup & login with JWT-based auth
- **Claim Token Flow** — anonymous links can be claimed into a user account after signup
- **Shard-Based Storage** — URLs distributed across 3 shard tables for horizontal scaling
- **Redis-Backed Caching** — fast redirects via cache-aside strategy
- **Async Click Analytics** — BullMQ-powered background processing with rich analytics dashboards
- **Abuse Protection** — blacklist, Bloom filter, token bucket rate limiting, auto-blacklisting
- **Rich Frontend** — Next.js App Router with interactive charts (Recharts), form validation (Zod + React Hook Form), and responsive UI

---

## Architecture

```text
┌──────────────────────┐
│    Frontend (Next.js) │  ← Vercel / Port 3005
│    React 19 + TW 4    │
└──────────┬───────────┘
           │ HTTPS / API calls
           ▼
┌──────────────────────┐
│   Gateway Service     │  ← Port 3000 (Render)
│   Auth + Routing      │
├───────┬───────┬───────┤
│       │       │       │
▼       ▼       ▼       ▼
URL    Redirect Analytics Abuse
:3001  :3002    :3003    :3004

URL Service ─────────► PostgreSQL / Neon
Redirect Service ────► Redis
Redirect Service ────► BullMQ Queue (click-events)
Analytics Worker ────► Redis + PostgreSQL
Abuse Service ───────► Redis (Bloom Filter + Token Bucket)
```

---

## Project Structure

```text
shadowscale/
├── frontend/                    # Next.js 16 Frontend
│   ├── app/
│   │   ├── layout.tsx           # Root layout (Inter font, providers)
│   │   ├── page.tsx             # Homepage — hero + shorten form
│   │   ├── globals.css          # TW4 theme + custom utilities
│   │   ├── robots.ts            # SEO robots config
│   │   ├── sitemap.ts           # SEO sitemap config
│   │   ├── auth/
│   │   │   └── page.tsx         # Login / Signup page
│   │   ├── dashboard/
│   │   │   ├── page.tsx         # Dashboard wrapper
│   │   │   └── DashboardClient.tsx  # Client-side dashboard logic
│   │   └── analytics/
│   │       └── [shortCode]/
│   │           ├── page.tsx     # Analytics page wrapper
│   │           └── AnalyticsClient.tsx  # Analytics dashboard + charts
│   ├── components/
│   │   ├── AuthProvider.tsx     # React Context for auth state
│   │   ├── ToastProvider.tsx    # Toast notification system
│   │   ├── Navbar.tsx           # Sticky navigation bar
│   │   ├── ShortenForm.tsx      # URL shortening form
│   │   ├── URLResultCard.tsx    # Short URL result display
│   │   ├── URLTable.tsx         # Dashboard URL table with actions
│   │   ├── AnalyticsCharts.tsx  # Recharts — line, bar, pie charts
│   │   └── ui/
│   │       ├── Button.tsx       # Reusable button component
│   │       ├── Card.tsx         # Card component
│   │       ├── CopyButton.tsx   # Copy-to-clipboard button
│   │       └── Input.tsx        # Styled input component
│   ├── hooks/
│   │   └── useClipboard.ts     # Clipboard hook
│   ├── lib/
│   │   ├── api.ts              # API client (fetch wrapper + auth)
│   │   ├── auth.ts             # Auth token/user localStorage helpers
│   │   ├── claims.ts           # Claim token localStorage helpers
│   │   ├── utils.ts            # General utilities (clsx/tw-merge)
│   │   └── validations.ts     # Zod schemas (URL, auth)
│   ├── next.config.ts          # Standalone output + rewrite for /r/:shortCode
│   ├── package.json
│   └── tsconfig.json
├── services/                    # Backend Microservices
│   ├── gateway/                 # API Gateway — auth, routing, abuse middleware
│   ├── url-service/             # URL CRUD, sharding, claim tokens
│   ├── redirect-service/        # Short code resolution, caching, click events
│   ├── analytics-service/       # Click event processing, analytics API
│   └── abuse-service/           # Rate limiting, blacklist, Bloom filter
├── database/
│   └── migrations/
│       └── 001_init.sql         # Database migration file
├── docs/
│   ├── Class-Diagram.png
│   ├── ERD.png
│   ├── Sequence Diagram.png
│   ├── ShadowScale_Project_Report.docx
│   ├── architecture-diagrams.html
│   └── class-diagramm.jpg
├── .gitignore
└── README.md
```

---

## Tech Stack

### Backend

| Layer         | Technology                          |
|---------------|-------------------------------------|
| Runtime       | Node.js + TypeScript                |
| Framework     | Express.js                          |
| Database      | PostgreSQL (Neon)                   |
| Cache / Queue | Redis + BullMQ                      |
| Auth          | JWT (jsonwebtoken + bcrypt)         |
| Architecture  | Microservices (5 independent services) |

### Frontend

| Layer         | Technology                          |
|---------------|-------------------------------------|
| Framework     | Next.js 16 (App Router, standalone output) |
| UI            | React 19 + Tailwind CSS 4          |
| Charts        | Recharts 3                          |
| Forms         | React Hook Form 7 + Zod 4          |
| Icons         | Lucide React                        |
| Font          | Inter (Google Fonts via next/font)  |
| Styling Utils | clsx + tailwind-merge               |
| Deployment    | Vercel                              |

---

## Backend Services

### 1. Gateway Service

**Path:** `services/gateway` · **Port:** `3000`

Role:
- Main API entry point
- Auth endpoints (signup/login)
- JWT verification middleware
- Abuse checks for public routes
- Circuit breaker pattern for service calls
- Forwards traffic to downstream services

Important files:
- `src/server.ts`
- `src/auth.service.ts`
- `src/auth.middleware.ts`
- `src/abuse.middleware.ts`
- `src/circuit-breaker.ts`
- `src/proxy.ts`

### 2. URL Service

**Path:** `services/url-service` · **Port:** `3001`

Role:
- Validates URL input
- Generates Snowflake IDs and Base62 short codes
- Selects shard table
- Stores URLs in PostgreSQL
- Handles claim token flow (anonymous → user migration)
- Fetches/deletes user-owned URLs

Important files:
- `src/server.ts`
- `src/url.service.ts`
- `src/snowflake.ts`
- `src/base62.ts`
- `src/shard-router.ts`

### 3. Redirect Service

**Path:** `services/redirect-service` · **Port:** `3002`

Role:
- Resolves short code to original URL
- Redis cache-aside for fast lookups
- Publishes click events to BullMQ
- Returns HTTP 302 redirect

Important files:
- `src/server.ts`
- `src/redirect.service.ts`
- `src/queue.ts`
- `src/redis-client.ts`

### 4. Analytics Service

**Path:** `services/analytics-service` · **Port:** `3003`

Role:
- Consumes click events from BullMQ queue
- Enriches IP and user-agent data (country, city, device, browser)
- Updates real-time Redis counters
- Stores click events in PostgreSQL
- Serves analytics dashboard data (hourly clicks, top countries, devices, browsers)

Important files:
- `src/server.ts`
- `src/analytics.service.ts`
- `src/worker.ts`
- `src/event-enricher.ts`
- `src/counter.ts`
- `src/db.ts`
- `src/redis-client.ts`

### 5. Abuse Service

**Path:** `services/abuse-service` · **Port:** `3004`

Role:
- Checks IP against blacklist
- Rate limits public traffic via token bucket
- Tracks repeated violations
- Auto-blacklists abusive IPs after threshold

Important files:
- `src/server.ts`
- `src/abuse.service.ts`
- `src/blacklist.ts`
- `src/token-bucket.ts`
- `src/bloom-filter.ts`
- `src/redis-client.ts`

---

## Frontend

### Pages

| Route                    | Description                                      |
|--------------------------|--------------------------------------------------|
| `/`                      | Homepage — hero section with URL shortening form  |
| `/auth`                  | Login / Signup form (toggle between modes)        |
| `/dashboard`             | Authenticated user dashboard — manage URLs        |
| `/analytics/[shortCode]` | Per-URL analytics dashboard with interactive charts |

### Key Components

| Component           | Description                                            |
|---------------------|--------------------------------------------------------|
| `Navbar`            | Sticky top navigation — brand, auth links, dashboard link |
| `ShortenForm`       | URL input form with Zod validation + claim token handling |
| `URLResultCard`     | Displays shortened URL result with copy button         |
| `URLTable`          | Dashboard table showing all user URLs with actions     |
| `AnalyticsCharts`   | Recharts visualizations — hourly line chart, device pie chart, country/browser bar charts |
| `AuthProvider`      | React Context providing auth state across the app      |
| `ToastProvider`     | Toast notification system for user feedback            |

### UI Components

| Component     | Description                              |
|---------------|------------------------------------------|
| `Button`      | Styled button with `default` and `outline` variants |
| `Card`        | Card container with header and content   |
| `CopyButton`  | One-click copy-to-clipboard button       |
| `Input`       | Styled text input with border-heavy theme |

### Design System

The frontend uses a **brutalist / industrial design language**:
- **Background:** `#e8e8e8` — warm light gray
- **Foreground:** `#000000` — pure black
- **Borders:** 2px solid black (`border-heavy` utility)
- **Typography:** Inter font, uppercase headings, tracking-tight
- **Interaction:** Black fill on hover, transition-colors

### Lib / Utilities

| File             | Purpose                                              |
|------------------|------------------------------------------------------|
| `lib/api.ts`     | Centralized fetch wrapper — auto-attaches JWT, handles 401 redirects |
| `lib/auth.ts`    | `getToken`, `setToken`, `getUser`, `setUser`, `clearAuth` — localStorage based |
| `lib/claims.ts`  | `getClaims`, `addClaim`, `removeClaim`, `clearClaims` — localStorage based |
| `lib/validations.ts` | Zod schemas for URL and auth form validation     |
| `lib/utils.ts`   | `cn()` utility — merges clsx + tailwind-merge        |

### SEO

- `robots.ts` — robots.txt configuration
- `sitemap.ts` — dynamic sitemap generation
- OpenGraph meta tags in root layout
- Semantic HTML with proper heading hierarchy

---

## User Flows

### Flow 1: Anonymous User

1. User hits homepage
2. Frontend sends `POST /api/urls` to gateway
3. Gateway runs abuse check
4. Gateway forwards request to URL service without `userId`
5. URL service:
   - validates URL
   - generates Snowflake ID
   - Base62 encodes short code
   - selects shard
   - generates `claimToken`
   - stores row with `user_id = null`
6. Response returns: `shortCode`, `shortUrl`, `savedInShard`, `claimToken`
7. Frontend stores claim token in localStorage under `shadowscale_claims`

### Flow 2: User Signs Up / Logs In

1. Frontend sends `POST /auth/signup` or `POST /auth/login`
2. Gateway uses `AuthService`
3. JWT token is returned
4. Frontend stores: `shadowscale_token`, `shadowscale_user`
5. Frontend loads dashboard and calls `GET /api/urls/my`
6. Gateway verifies JWT and asks URL service for user URLs
7. If local `claimToken`s exist, frontend calls `POST /api/urls/claim`
8. URL service finds matching anonymous rows and sets `user_id`

### Flow 3: Logged-in User Shortens URL

1. Frontend sends `POST /api/urls` with Authorization header
2. Gateway decodes JWT and sends `userId` to URL service
3. URL service stores row directly with `user_id`
4. Frontend reloads dashboard

### Flow 4: Redirect

1. User opens `/r/:shortCode`
2. Gateway runs abuse check
3. Gateway proxies request to redirect service
4. Redirect service:
   - checks Redis cache
   - if miss, fetches from URL service
   - caches original URL
   - publishes click event to BullMQ
   - returns HTTP 302
5. Analytics worker processes click event in background

### Flow 5: View Analytics (Frontend)

1. User clicks "Stats" button on a URL in dashboard
2. Frontend navigates to `/analytics/[shortCode]`
3. Auth guard checks if user is logged in (redirects to `/auth` if not)
4. Frontend calls `GET /api/analytics/:shortCode`
5. Analytics data is rendered with interactive Recharts visualizations:
   - Hourly clicks line chart (last 24h)
   - Device distribution pie chart
   - Top countries horizontal bar chart
   - Top browsers bar chart

---

## Database Schema

### `users`

| Column       | Type                  | Constraints              |
|--------------|-----------------------|--------------------------|
| `id`         | `SERIAL`              | `PRIMARY KEY`            |
| `email`      | `VARCHAR(255)`        | `UNIQUE NOT NULL`        |
| `password`   | `VARCHAR(255)`        | `NOT NULL`               |
| `created_at` | `TIMESTAMP`           | `DEFAULT NOW()`          |

### `urls_shard_0` / `urls_shard_1` / `urls_shard_2`

| Column         | Type             | Constraints                    |
|----------------|------------------|--------------------------------|
| `id`           | `VARCHAR(20)`    | `PRIMARY KEY`                  |
| `short_code`   | `VARCHAR(10)`    | `UNIQUE NOT NULL`              |
| `original_url` | `TEXT`           | `NOT NULL`                     |
| `click_count`  | `INTEGER`        | `DEFAULT 0`                    |
| `created_at`   | `TIMESTAMP`      | `DEFAULT NOW()`                |
| `user_id`      | `INTEGER`        | `REFERENCES users(id)`         |
| `claim_token`  | `VARCHAR(64)`    | `UNIQUE`                       |

### `click_events`

| Column       | Type             | Constraints           |
|--------------|------------------|-----------------------|
| `id`         | `SERIAL`         | `PRIMARY KEY`         |
| `short_code` | `VARCHAR(10)`    | `NOT NULL`            |
| `ip`         | `VARCHAR(50)`    |                       |
| `country`    | `VARCHAR(100)`   |                       |
| `city`       | `VARCHAR(100)`   |                       |
| `device`     | `VARCHAR(50)`    |                       |
| `browser`    | `VARCHAR(50)`    |                       |
| `referer`    | `VARCHAR(255)`   |                       |
| `created_at` | `TIMESTAMP`      | `DEFAULT NOW()`       |

### `blacklisted_ips`

| Column       | Type             | Constraints           |
|--------------|------------------|-----------------------|
| `id`         | `SERIAL`         | `PRIMARY KEY`         |
| `ip`         | `VARCHAR(50)`    | `UNIQUE NOT NULL`     |
| `reason`     | `VARCHAR(255)`   |                       |
| `created_at` | `TIMESTAMP`      | `DEFAULT NOW()`       |

### Suggested SQL

```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS urls_shard_0 (
  id VARCHAR(20) PRIMARY KEY,
  short_code VARCHAR(10) UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  user_id INTEGER REFERENCES users(id),
  claim_token VARCHAR(64) UNIQUE
);

CREATE TABLE IF NOT EXISTS urls_shard_1
  (LIKE urls_shard_0 INCLUDING ALL);

CREATE TABLE IF NOT EXISTS urls_shard_2
  (LIKE urls_shard_0 INCLUDING ALL);

CREATE TABLE IF NOT EXISTS click_events (
  id SERIAL PRIMARY KEY,
  short_code VARCHAR(10) NOT NULL,
  ip VARCHAR(50),
  country VARCHAR(100),
  city VARCHAR(100),
  device VARCHAR(50),
  browser VARCHAR(50),
  referer VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blacklisted_ips (
  id SERIAL PRIMARY KEY,
  ip VARCHAR(50) UNIQUE NOT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Environment Variables

No `.env` files are committed to the repo. Create them manually for each service.

### Frontend

```env
NEXT_PUBLIC_API_URL=https://shadowscale-gateway.onrender.com
```

> For local development, set `NEXT_PUBLIC_API_URL=http://localhost:3000`

### Gateway

```env
PORT=3000
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
URL_SERVICE_URL=http://localhost:3001
REDIRECT_SERVICE_URL=http://localhost:3002
ANALYTICS_SERVICE_URL=http://localhost:3003
ABUSE_SERVICE_URL=http://localhost:3004
```

### URL Service

```env
PORT=3001
DATABASE_URL=postgresql://...
BASE_URL=http://localhost:3000
```

### Redirect Service

```env
PORT=3002
REDIS_URL=redis://localhost:6379
URL_SERVICE_URL=http://localhost:3001
```

### Analytics Service

```env
PORT=3003
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
```

### Abuse Service

```env
PORT=3004
REDIS_URL=redis://localhost:6379
```

---

## Local Development

### Prerequisites

- Node.js (v18+)
- npm
- PostgreSQL (or Neon DB)
- Redis

### Install Dependencies

```bash
# Frontend
cd frontend && npm install

# Backend services
cd services/gateway && npm install
cd ../url-service && npm install
cd ../redirect-service && npm install
cd ../analytics-service && npm install
cd ../abuse-service && npm install
```

### Start Order

Recommended startup sequence:

1. **Redis** — ensure Redis is running
2. **PostgreSQL** — ensure database is ready with schema applied
3. **url-service** — `cd services/url-service && npm run dev`
4. **redirect-service** — `cd services/redirect-service && npm run dev`
5. **analytics-service** — `cd services/analytics-service && npm run dev`
6. **abuse-service** — `cd services/abuse-service && npm run dev`
7. **gateway** — `cd services/gateway && npm run dev`
8. **frontend** — `cd frontend && npm run dev`

### Ports

| Service           | Default Port |
|-------------------|-------------|
| Gateway           | `3000`      |
| URL Service       | `3001`      |
| Redirect Service  | `3002`      |
| Analytics Service | `3003`      |
| Abuse Service     | `3004`      |
| Frontend (Next.js)| `3005` (or as assigned) |

### Build Commands

Each backend service supports:

```bash
npm run build
npm run start
```

Frontend:

```bash
npm run build   # produces standalone output
npm run start   # serves production build
```

---

## Deployment

### Backend — Render

All 5 backend services are deployed on [Render](https://render.com) as individual Web Services.

- Gateway: `https://shadowscale-gateway.onrender.com`
- Other services are internal and called by Gateway

### Frontend — Vercel

The Next.js frontend is deployed on [Vercel](https://vercel.com) with:

- `output: "standalone"` in `next.config.ts`
- `NEXT_PUBLIC_API_URL` environment variable pointing to the Gateway URL
- URL rewrites for `/r/:shortCode` → Gateway redirect endpoint

---

## API Quick Reference

### Auth

```http
POST /auth/signup    # { email, password } → { token, user }
POST /auth/login     # { email, password } → { token, user }
```

### URL Management

```http
POST   /api/urls             # { originalUrl } → { shortCode, shortUrl, claimToken }
POST   /api/urls/claim       # { claimToken }  → claims anonymous URL to user  [Auth required]
GET    /api/urls/my           # → { urls[] }                                    [Auth required]
DELETE /api/urls/:shortCode   # → deletes owned URL                             [Auth required]
```

### Redirect

```http
GET /r/:shortCode    # → HTTP 302 redirect to original URL
```

### Analytics

```http
GET /api/analytics/:shortCode    # → { totalClicks, todayClicks, hourlyData, devices, topCountries, browsers }  [Auth required]
GET /analytics/overall/stats     # → overall stats
```

### Abuse / Ops (Internal)

```http
POST   /check          # abuse check for IP
POST   /blacklist      # add IP to blacklist
DELETE /blacklist/:ip   # remove IP from blacklist
GET    /stats/:ip       # get abuse stats for IP
POST   /reset/:ip       # reset violations for IP
```

### Health Checks

```http
GET /health    # available on all services (ports 3000-3004)
```

---

## Manual Testing

### Health Checks

```bash
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health
```

### Anonymous Create

```bash
curl -X POST http://localhost:3000/api/urls \
  -H "Content-Type: application/json" \
  -d '{"originalUrl":"https://example.com"}'
```

### Signup

```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'
```

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'
```

### Logged-in Create

```bash
curl -X POST http://localhost:3000/api/urls \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"originalUrl":"https://openai.com"}'
```

### My URLs

```bash
curl http://localhost:3000/api/urls/my \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Claim Anonymous URL

```bash
curl -X POST http://localhost:3000/api/urls/claim \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"claimToken":"YOUR_CLAIM_TOKEN"}'
```

### Redirect

```bash
curl -i http://localhost:3000/r/SHORTCODE
```

### Analytics

```bash
curl http://localhost:3000/api/analytics/SHORTCODE \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Internal Design Notes

### Sharding

URLs are stored in three shard tables: `urls_shard_0`, `urls_shard_1`, `urls_shard_2`.

Shard selection: `shortCode[0].charCodeAt(0) % 3`

### Claim Token Logic

Anonymous URLs return a `claimToken`. The frontend stores these in localStorage. After signup/login, the dashboard automatically claims all stored tokens via `POST /api/urls/claim`, migrating anonymous links into the user's account.

### Redirect Caching

Cache-aside strategy:
1. Check Redis
2. On miss → fetch from URL service
3. Save in Redis
4. Redirect (HTTP 302)

### Analytics Pipeline

Redirect stays fast — analytics is fully async:
1. Redirect service publishes click event to BullMQ
2. Analytics worker consumes event
3. Event is enriched (IP → country/city, UA → device/browser)
4. Redis counters updated in real-time
5. Event stored in PostgreSQL for historical data

### Abuse Protection

Multi-layer defense:
1. Bloom filter pre-check (probabilistic, fast)
2. Redis blacklist confirm (deterministic)
3. Token bucket rate limiting
4. Violation counter tracking
5. Auto-blacklist if threshold exceeded

### Frontend Auth Flow

- JWT stored in `localStorage` as `shadowscale_token`
- User info stored as `shadowscale_user`
- `AuthProvider` (React Context) provides `isLoggedIn`, `login()`, `logout()` to entire app
- API client auto-attaches `Authorization: Bearer <token>` header
- On 401 response → auto-logout + redirect to `/auth`

### Frontend Analytics Lazy Loading

`AnalyticsCharts` component is loaded via `next/dynamic` with `ssr: false` to keep initial bundle size small and avoid server-side rendering of Recharts.

---

## Known Notes

- `database/migrations/001_init.sql` is currently empty — apply schema manually
- Runtime blacklist relies on Redis + Bloom filter (not the `blacklisted_ips` table at runtime)
- Analytics worker expects `click_events.city` column
- Gateway auth flow does not use a `plan` column
- Frontend redirect rewrite in `next.config.ts` defaults to production Gateway URL

---

## Future Improvements

- Fill proper SQL migration files
- Add `docker-compose` for the entire stack (all services + Redis + PostgreSQL)
- Add shared `.env.example` files per service
- Add integration tests
- Add Swagger/OpenAPI docs per service
- Add worker retry and dead-letter queue handling
- Add link expiry / custom short codes
- Add QR code generation for short links
- Add dark mode toggle on frontend

---

## Documentation

Additional project documentation is available in the `docs/` directory:

- `ERD.png` — Entity Relationship Diagram
- `Class-Diagram.png` / `class-diagramm.jpg` — Class diagrams
- `Sequence Diagram.png` — Sequence diagram for core flows
- `architecture-diagrams.html` — Interactive architecture visualizations
- `ShadowScale_Project_Report.docx` — Detailed project report

---

## License

This project is for educational and portfolio purposes.
