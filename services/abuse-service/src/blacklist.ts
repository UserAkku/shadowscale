// src/blacklist.ts

import redis from './redis-client'
import bloomFilter from './bloom-filter'

/**
 * OOPS: Class — blacklist state manage karna hai
 * 
 * 2 layer system:
 * Layer 1: Bloom Filter (0.001ms) — fast check
 * Layer 2: Redis (1ms)            — actual check
 * 
 * Bloom filter false positive de sakta hai
 * Redis actual confirm karta hai
 */

interface BlacklistEntry {
  ip: string
  reason: string
  addedAt: number
}

class BlacklistManager {
  private readonly TTL: number = 86400  // 24 ghante

  // IP blacklist mein daalo
  async blacklistIP(ip: string, reason: string): Promise<void> {
    const entry: BlacklistEntry = {
      ip,
      reason,
      addedAt: Date.now()
    }

    // Layer 1: Bloom filter mein add karo
    bloomFilter.add(ip)

    // Layer 2: Redis mein save karo
    await redis.setex(
      `blacklist:${ip}`,
      this.TTL,
      JSON.stringify(entry)
    )

    console.log(`🚫 IP Blacklisted: ${ip} — Reason: ${reason}`)
  }

  // IP blacklist mein hai?
  async isBlacklisted(ip: string): Promise<boolean> {
    // Layer 1: Bloom filter — 0.001ms
    // Agar bloom filter bolta nahi hai
    // toh pakka nahi hai
    if (!bloomFilter.mightContain(ip)) {
      return false
    }

    // Layer 2: Redis confirm karo — 1ms
    const data = await redis.get(`blacklist:${ip}`)
    return data !== null
  }

  // IP blacklist se hatao
  async removeFromBlacklist(ip: string): Promise<void> {
    await redis.del(`blacklist:${ip}`)
    // Note: Bloom filter se remove nahi hota
    // Yeh bloom filter ki limitation hai
    console.log(`✅ IP removed from blacklist: ${ip}`)
  }

  // Blacklist entry dekho
  async getEntry(ip: string): Promise<BlacklistEntry | null> {
    const data = await redis.get(`blacklist:${ip}`)
    if (!data) return null
    return JSON.parse(data)
  }
}

export default new BlacklistManager()