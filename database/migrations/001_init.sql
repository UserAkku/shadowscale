-- ================================================
-- ShadowScale Database Schema
-- Run this once to set up the entire database
-- ================================================


-- ── USERS TABLE ──────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  email      VARCHAR(255) UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,
  plan       VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMP DEFAULT NOW()
);


-- ── URL TABLES (3 Shards) ────────────────────────
-- Sharding logic:
-- short_code.charCodeAt(0) % 3 = 0 → shard_0
-- short_code.charCodeAt(0) % 3 = 1 → shard_1
-- short_code.charCodeAt(0) % 3 = 2 → shard_2

CREATE TABLE IF NOT EXISTS urls_shard_0 (
  id            VARCHAR(20) PRIMARY KEY,
  short_code    VARCHAR(10) UNIQUE NOT NULL,
  original_url  TEXT NOT NULL,
  user_id       INTEGER REFERENCES users(id),
  claim_token   VARCHAR(64) UNIQUE,
  click_count   INTEGER DEFAULT 0,
  expires_at    TIMESTAMP,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS urls_shard_1 (
  id            VARCHAR(20) PRIMARY KEY,
  short_code    VARCHAR(10) UNIQUE NOT NULL,
  original_url  TEXT NOT NULL,
  user_id       INTEGER REFERENCES users(id),
  claim_token   VARCHAR(64) UNIQUE,
  click_count   INTEGER DEFAULT 0,
  expires_at    TIMESTAMP,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS urls_shard_2 (
  id            VARCHAR(20) PRIMARY KEY,
  short_code    VARCHAR(10) UNIQUE NOT NULL,
  original_url  TEXT NOT NULL,
  user_id       INTEGER REFERENCES users(id),
  claim_token   VARCHAR(64) UNIQUE,
  click_count   INTEGER DEFAULT 0,
  expires_at    TIMESTAMP,
  created_at    TIMESTAMP DEFAULT NOW()
);


-- ── CLICK EVENTS TABLE ───────────────────────────
CREATE TABLE IF NOT EXISTS click_events (
  id         SERIAL PRIMARY KEY,
  short_code VARCHAR(10) NOT NULL,
  ip         VARCHAR(50),
  country    VARCHAR(100) DEFAULT 'Unknown',
  city       VARCHAR(100) DEFAULT 'Unknown',
  device     VARCHAR(50)  DEFAULT 'Desktop',
  browser    VARCHAR(50)  DEFAULT 'Unknown',
  referer    VARCHAR(255) DEFAULT 'Direct',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Fast queries ke liye indexes
CREATE INDEX IF NOT EXISTS idx_clicks_short_code
  ON click_events(short_code);

CREATE INDEX IF NOT EXISTS idx_clicks_created_at
  ON click_events(created_at);


-- ── BLACKLISTED IPS TABLE ────────────────────────
CREATE TABLE IF NOT EXISTS blacklisted_ips (
  id         SERIAL PRIMARY KEY,
  ip         VARCHAR(50) UNIQUE NOT NULL,
  reason     VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
