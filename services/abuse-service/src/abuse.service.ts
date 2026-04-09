// src/abuse.service.ts

import redis from './redis-client'
import tokenBucket from './token-bucket'
import blacklist from './blacklist'

/**
 * OOPS: Class — sab checks ek jagah
 * DESIGN PATTERN: Chain of Responsibility
 * 
 * Har check ek link hai chain mein:
 * Blacklist check → Rate limit check → Pass
 * 
 * Koi bhi check fail → Chain rok do
 */

interface AbuseCheckResult {
  allowed: boolean
  reason?: string
  status?: number
  retryAfter?: number
  tokensLeft?: number
}

class AbuseService {
  private readonly MAX_VIOLATIONS: number = 20  // Kitne violations pe blacklist

  async checkRequest(ip: string): Promise<AbuseCheckResult> {

    // ── CHECK 1: Blacklist ──────────────────────────
    // Sabse pehle — agar blacklist mein hai
    // toh aage check karne ki zaroorat nahi
    const isBlocked = await blacklist.isBlacklisted(ip)

    if (isBlocked) {
      console.log(`🚫 BLOCKED (Blacklist): ${ip}`)
      return {
        allowed: false,
        reason: 'BLACKLISTED',
        status: 403
      }
    }

    // ── CHECK 2: Rate Limit ─────────────────────────
    const rateResult = await tokenBucket.checkLimit(ip)

    if (!rateResult.allowed) {
      // Violation count badhao
      const violations = await this.incrementViolations(ip)

      console.log(`⚠️ Rate limit hit: ${ip} (Violations: ${violations})`)

      // Bahut zyada violations? Auto blacklist
      if (violations >= this.MAX_VIOLATIONS) {
        await blacklist.blacklistIP(
          ip,
          `Auto-blacklisted: ${violations} violations`
        )
      }

      return {
        allowed: false,
        reason: 'RATE_LIMITED',
        status: 429,
        retryAfter: rateResult.retryAfter
      }
    }

    // ── PASS ────────────────────────────────────────
    return {
      allowed: true,
      tokensLeft: rateResult.tokensLeft
    }
  }

  // Violation count badhao
  private async incrementViolations(ip: string): Promise<number> {
    const key = `violations:${ip}`
    const count = await redis.incr(key)
    await redis.expire(key, 3600)  // 1 ghante ke baad reset
    return count
  }

  // Stats — demo ke liye
  async getStats(ip: string): Promise<any> {
    const [
      isBlocked,
      bucketState,
      violations
    ] = await Promise.all([
      blacklist.isBlacklisted(ip),
      tokenBucket.getBucketState(ip),
      redis.get(`violations:${ip}`)
    ])

    return {
      ip,
      isBlocked,
      tokensLeft: bucketState?.tokens || 10,
      violations: parseInt(violations || '0'),
      bloomFilterStats: bloomFilter.getStats()
    }
  }
}

// bloom filter import
import bloomFilter from './bloom-filter'

export default new AbuseService()