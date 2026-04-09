// src/token-bucket.ts

import redis from './redis-client'

/**
 * OOPS: Class — Redis state manage karna hai
 * DESIGN PATTERN: Strategy Pattern
 * 
 * Token Bucket kya hai?
 * ─────────────────────
 * Socho ek bucket hai jisme tokens hain
 * 
 * ┌─────────────────────────┐
 * │  Bucket = 10 tokens     │
 * │  ● ● ● ● ● ● ● ● ● ●   │
 * └─────────────────────────┘
 * 
 * Har request → 1 token khatam
 * Bucket khali → BLOCK
 * Har minute → 10 tokens wapas
 * 
 * Normal user → Fine ✅
 * Bot (1000 req/sec) → 11th pe block 🚫
 */

interface BucketData {
  tokens: number
  lastRefill: number
}

interface RateLimitResult {
  allowed: boolean
  tokensLeft: number
  retryAfter?: number
}

class TokenBucket {
  private readonly CAPACITY: number = 10      // Max tokens
  private readonly REFILL_RATE: number = 10   // Tokens per minute
  private readonly TTL: number = 3600         // Redis key expire

  async checkLimit(ip: string): Promise<RateLimitResult> {
    const key: string = `ratelimit:${ip}`

    // Redis se current bucket state lo
    const data = await redis.hgetall(key)

    let tokens: number = this.CAPACITY
    let lastRefill: number = Date.now()

    if (data && data.tokens) {
      // Kitna time gaya pichle refill se?
      const timePassed: number = Date.now() - parseInt(data.lastRefill)
      const minutesPassed: number = timePassed / 60000

      // Proportional tokens add karo
      const tokensToAdd: number = minutesPassed * this.REFILL_RATE
      tokens = Math.min(
        this.CAPACITY,
        parseFloat(data.tokens) + tokensToAdd
      )
      lastRefill = Date.now()
    }

    // Tokens khatam?
    if (tokens < 1) {
      console.log(`🚫 Rate limit hit: ${ip}`)
      return {
        allowed: false,
        tokensLeft: 0,
        retryAfter: 60
      }
    }

    // Token consume karo
    await redis.hset(key, {
      tokens: (tokens - 1).toString(),
      lastRefill: lastRefill.toString()
    })
    await redis.expire(key, this.TTL)

    return {
      allowed: true,
      tokensLeft: Math.floor(tokens - 1)
    }
  }

  // IP ka bucket reset karo
  async resetBucket(ip: string): Promise<void> {
    await redis.del(`ratelimit:${ip}`)
    console.log(`🔄 Bucket reset: ${ip}`)
  }

  // Current bucket state dekho
  async getBucketState(ip: string): Promise<BucketData | null> {
    const data = await redis.hgetall(`ratelimit:${ip}`)
    if (!data || !data.tokens) return null

    return {
      tokens: parseFloat(data.tokens),
      lastRefill: parseInt(data.lastRefill)
    }
  }
}

export default new TokenBucket()