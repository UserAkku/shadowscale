// src/event-enricher.ts

import UAParser from 'ua-parser-js'

/**
 * FUNCTIONAL: Pure functions
 * Input → Output, koi side effect nahi
 * 
 * Raw click event aata hai
 * Enriched event jaata hai
 */

// Raw event — Redirect Service ne bheja
export interface RawClickEvent {
  shortCode: string
  ip: string
  userAgent: string
  referer: string
  timestamp: number
}

// Enriched event — extra info ke saath
export interface EnrichedClickEvent {
  shortCode: string
  ip: string
  country: string
  city: string
  device: string
  browser: string
  os: string
  referer: string
  timestamp: number
}

// ── GEO LOCATION ─────────────────────────────────

// In-memory cache taaki same IP ke liye baar baar API na maaro
const geoCache = new Map<string, { country: string; city: string; expiry: number }>()
const GEO_CACHE_TTL = 3600000 // 1 ghanta ms mein

/**
 * IP se country aur city nikalo
 * ip-api.com use karta hai — free, no API key, accurate
 * Cache karta hai taaki rate limit na lage (45 req/min)
 */
const getLocationFromIP = async (ip: string): Promise<{ country: string; city: string }> => {
  // Local/private IPs ke liye — seedha return
  if (
    !ip ||
    ip === 'unknown' ||
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.16.') ||
    ip.startsWith('172.17.') ||
    ip.startsWith('172.18.') ||
    ip.startsWith('172.19.') ||
    ip.startsWith('172.2') ||
    ip.startsWith('172.30.') ||
    ip.startsWith('172.31.')
  ) {
    return { country: 'Local', city: 'Local' }
  }

  // Cache check karo
  const cached = geoCache.get(ip)
  if (cached && cached.expiry > Date.now()) {
    return { country: cached.country, city: cached.city }
  }

  // ip-api.com se fetch karo (free tier: 45 req/min, no key needed)
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000) // 3 sec timeout

    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,city`,
      { signal: controller.signal }
    )
    clearTimeout(timeout)

    if (response.ok) {
      const data = await response.json()
      
      if (data.status === 'success') {
        const result = {
          country: data.country || 'Unknown',
          city: data.city || 'Unknown'
        }

        // Cache mein save karo
        geoCache.set(ip, {
          ...result,
          expiry: Date.now() + GEO_CACHE_TTL
        })

        // Cache cleanup — zyada bada na ho
        if (geoCache.size > 10000) {
          const now = Date.now()
          for (const [key, value] of geoCache) {
            if (value.expiry < now) geoCache.delete(key)
          }
        }

        return result
      }
    }
  } catch (err) {
    // API fail? Silent handle — "Unknown" return karo
    console.error(`Geo lookup failed for ${ip}:`, (err as Error).message)
  }

  return { country: 'Unknown', city: 'Unknown' }
}

// ── DEVICE INFO ───────────────────────────────────

// UserAgent se device info nikalo
const getDeviceInfo = (
  userAgent: string
): { device: string; browser: string; os: string } => {
  const parser = new UAParser(userAgent)
  const result = parser.getResult()

  return {
    device: result.device.type || 'Desktop',
    browser: result.browser.name || 'Unknown',
    os: result.os.name || 'Unknown'
  }
}

// ── ENRICHMENT ────────────────────────────────────

// Raw → Enriched (ab async hai kyunki geo lookup API call hai)
export const enrichEvent = async (raw: RawClickEvent): Promise<EnrichedClickEvent> => {
  const location = await getLocationFromIP(raw.ip)
  const deviceInfo = getDeviceInfo(raw.userAgent)

  return {
    shortCode: raw.shortCode,
    ip: raw.ip,
    country: location.country,
    city: location.city,
    device: deviceInfo.device,
    browser: deviceInfo.browser,
    os: deviceInfo.os,
    referer: raw.referer || 'Direct',
    timestamp: raw.timestamp
  }
}