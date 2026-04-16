# ShadowScale
Distributed URL shortener backend built with TypeScript, Express, PostgreSQL, Redis, and BullMQ.

This project is split into multiple backend services:

- `gateway`
- `url-service`
- `redirect-service`
- `analytics-service`
- `abuse-service`

The system supports:

- anonymous URL shortening
- signup and login
- claim-token based anonymous-to-account migration
- shard-based URL storage
- Redis-backed redirect caching
- async click analytics
- abuse protection with blacklist and rate limiting

## Architecture

```text
Client
  |
  v
Gateway Service (:3000)
  |----> Abuse Service (:3004)
  |----> URL Service (:3001)
  |----> Redirect Service (:3002)
  |----> Analytics Service (:3003)

URL Service ---------> PostgreSQL / Neon
Redirect Service ----> Redis
Redirect Service ----> BullMQ Queue (click-events)
Analytics Worker ----> Redis
Analytics Worker ----> PostgreSQL / Neon
Abuse Service -------> Redis
```

## Project Structure

```text
shadowscale/
├── database/
│   └── migrations/
│       └── 001_init.sql
├── services/
│   ├── gateway/
│   ├── url-service/
│   ├── redirect-service/
│   ├── analytics-service/
│   └── abuse-service/
└── README.md
```

## Services

### 1. Gateway Service

Path: `services/gateway`

Role:

- main API entry point
- auth endpoints
- JWT verification
- abuse checks for public routes
- forwards traffic to other services

Important files:

- `src/server.ts`
- `src/auth.service.ts`
- `src/auth.middleware.ts`
- `src/abuse.middleware.ts`
- `src/circuit-breaker.ts`
- `src/proxy.ts`

Main routes:

- `POST /auth/signup`
- `POST /auth/login`
- `POST /api/urls`
- `POST /api/urls/claim`
- `GET /api/urls/my`
- `DELETE /api/urls/:shortCode`
- `GET /api/analytics/:shortCode`
- `GET /health`
- `use /r` -> redirect proxy

### 2. URL Service

Path: `services/url-service`

Role:

- validates URL input
- generates IDs and short codes
- selects shard table
- stores URLs
- handles claim token flow
- fetches user URLs
- deletes owned URLs

Important files:

- `src/server.ts`
- `src/url.service.ts`
- `src/snowflake.ts`
- `src/base62.ts`
- `src/shard-router.ts`

Main routes:

- `POST /urls`
- `GET /urls/:shortCode`
- `POST /urls/claim`
- `GET /urls/user/:userId`
- `DELETE /urls/:shortCode`
- `GET /health`

### 3. Redirect Service

Path: `services/redirect-service`

Role:

- resolves short code
- checks Redis cache first
- calls URL service on cache miss
- publishes click events to BullMQ
- returns redirect response

Important files:

- `src/server.ts`
- `src/redirect.service.ts`
- `src/queue.ts`
- `src/redis-client.ts`

Main routes:

- `GET /:shortCode`
- `DELETE /cache/:shortCode`
- `GET /health`

### 4. Analytics Service

Path: `services/analytics-service`

Role:

- consumes click events from queue
- enriches IP and user-agent data
- updates real-time Redis counters
- stores click events in PostgreSQL
- serves analytics dashboard data

Important files:

- `src/server.ts`
- `src/analytics.service.ts`
- `src/worker.ts`
- `src/event-enricher.ts`
- `src/counter.ts`
- `src/db.ts`
- `src/redis-client.ts`

Main routes:

- `GET /analytics/:shortCode`
- `GET /analytics/overall/stats`
- `GET /health`

### 5. Abuse Service

Path: `services/abuse-service`

Role:

- checks blacklist
- rate limits public traffic
- tracks repeated violations
- auto-blacklists abusive IPs

Important files:

- `src/server.ts`
- `src/abuse.service.ts`
- `src/blacklist.ts`
- `src/token-bucket.ts`
- `src/bloom-filter.ts`
- `src/redis-client.ts`

Main routes:

- `POST /check`
- `POST /blacklist`
- `DELETE /blacklist/:ip`
- `GET /stats/:ip`
- `POST /reset/:ip`
- `GET /health`

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
6. Response returns:
   - `shortCode`
   - `shortUrl`
   - `savedInShard`
   - `claimToken`
7. Frontend stores claim token in localStorage under `shadowscale_claims`

### Flow 2: User Signs Up / Logs In

1. Frontend sends `POST /auth/signup` or `POST /auth/login`
2. Gateway uses `AuthService`
3. JWT token is returned
4. Frontend stores:
   - `shadowscale_token`
   - `shadowscale_user`
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

## Database Schema

Current logical schema based on code and Neon screenshots:

### `users`

- `id SERIAL PRIMARY KEY`
- `email VARCHAR(255) UNIQUE NOT NULL`
- `password VARCHAR(255) NOT NULL`
- `created_at TIMESTAMP DEFAULT NOW()`

### `urls_shard_0`

- `id VARCHAR(20) PRIMARY KEY`
- `short_code VARCHAR(10) UNIQUE NOT NULL`
- `original_url TEXT NOT NULL`
- `click_count INTEGER DEFAULT 0`
- `created_at TIMESTAMP DEFAULT NOW()`
- `user_id INTEGER REFERENCES users(id)`
- `claim_token VARCHAR(64) UNIQUE`

### `urls_shard_1`

Same as `urls_shard_0`

### `urls_shard_2`

Same as `urls_shard_0`

### `click_events`

- `id SERIAL PRIMARY KEY`
- `short_code VARCHAR(10) NOT NULL`
- `ip VARCHAR(50)`
- `country VARCHAR(100)`
- `city VARCHAR(100)`
- `device VARCHAR(50)`
- `browser VARCHAR(50)`
- `referer VARCHAR(255)`
- `created_at TIMESTAMP DEFAULT NOW()`

### `blacklisted_ips`

- `id SERIAL PRIMARY KEY`
- `ip VARCHAR(50) UNIQUE NOT NULL`
- `reason VARCHAR(255)`
- `created_at TIMESTAMP DEFAULT NOW()`

## Suggested SQL

The current migration file is empty, so you should apply schema manually or fill the migration file.

Recommended base schema:

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

## Environment Variables

No `.env` files are currently present in the repo. Create them manually for each service.

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

## Local Development

### Prerequisites

- Node.js
- npm
- PostgreSQL / Neon DB
- Redis

### Install Dependencies

Install per service:

```bash
cd services/gateway && npm install
cd ../url-service && npm install
cd ../redirect-service && npm install
cd ../analytics-service && npm install
cd ../abuse-service && npm install
```

### Start Order

Recommended run order:

1. Redis
2. PostgreSQL / Neon schema ready
3. `url-service`
4. `redirect-service`
5. `analytics-service`
6. `abuse-service`
7. `gateway`

### Start Commands

```bash
cd services/url-service && npm run dev
cd services/redirect-service && npm run dev
cd services/analytics-service && npm run dev
cd services/abuse-service && npm run dev
cd services/gateway && npm run dev
```

## Build Commands

Each service supports:

```bash
npm run build
npm run start
```

## API Quick Reference

### Auth

```http
POST /auth/signup
POST /auth/login
```

### URL Management

```http
POST   /api/urls
POST   /api/urls/claim
GET    /api/urls/my
DELETE /api/urls/:shortCode
```

### Redirect

```http
GET /r/:shortCode
```

### Analytics

```http
GET /api/analytics/:shortCode
GET /analytics/overall/stats
```

### Abuse / Ops

```http
POST   /check
POST   /blacklist
DELETE /blacklist/:ip
GET    /stats/:ip
POST   /reset/:ip
```

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
curl http://localhost:3000/api/analytics/SHORTCODE
```

## Internal Design Notes

### Sharding

URLs are stored in three shard tables:

- `urls_shard_0`
- `urls_shard_1`
- `urls_shard_2`

Shard selection is done by:

- taking the first character of the short code
- converting to char code
- applying modulo `3`

### Claim Token Logic

Anonymous URLs return `claimToken`.

That token allows the frontend to later associate anonymous links with a logged-in user account.

### Redirect Caching

Redirect service uses cache-aside strategy:

1. check Redis
2. if miss, ask URL service
3. save in Redis
4. redirect

### Analytics Design

Redirect should stay fast, so analytics is async:

1. redirect service publishes click event
2. BullMQ queues event
3. analytics worker consumes event
4. Redis counters updated
5. event written to PostgreSQL

### Abuse Protection

Abuse flow:

1. blacklist check
2. Bloom filter pre-check
3. Redis blacklist confirm
4. token bucket rate limit
5. violations tracking
6. auto-blacklist if threshold exceeded

## Known Notes

- `database/migrations/001_init.sql` is currently empty
- runtime blacklist currently relies on Redis + Bloom filter
- `blacklisted_ips` exists in schema, but is not the main runtime source
- analytics worker expects `click_events.city`
- gateway auth flow no longer uses a `plan` column

## Future Improvements

- fill proper SQL migration files
- add docker-compose for all services
- add shared env examples
- add integration tests
- add API docs per service
- add worker retry and dead-letter queue handling

