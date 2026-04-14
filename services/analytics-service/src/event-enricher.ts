// src/event-enricher.ts

import geoip from 'geoip-lite'
import UAParser from 'ua-parser-js'

/**
 * FUNCTIONAL: Pure functions
 * Input → Output, koi side effect nahi
 * 
 * Raw click event aata hai
 * Enriched event jaata hai
 */

// Raw event — Member 2 ne bheja
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

// IP se country aur city nikalo
const getLocationFromIP = (ip: string): { country: string; city: string } => {
  // Local/private IPs ke liye
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168')) {
    return { country: 'Local', city: 'Local' }
  }

  const geo = geoip.lookup(ip)

  return {
    country: geo?.country || 'Unknown',
    city: geo?.city || 'Unknown'
  }
}

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

// Raw → Enriched
// FUNCTIONAL: Pure function
export const enrichEvent = (raw: RawClickEvent): EnrichedClickEvent => {
  const location = getLocationFromIP(raw.ip)
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