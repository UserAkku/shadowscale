// src/redirect.service.ts

import axios from 'axios'
import redis from './redis-client'

/**
 * OOPS: Class — Redis state manage karna hai
 * DESIGN PATTERN: Cache-Aside Pattern
 * 
 * Cache-Aside matlab:
 * 1. Cache check karo
 * 2. Mila → return
 * 3. Nahi mila → DB se lo → Cache mein daalo → return
 */

// Result ka shape
interface ResolveResult {
  url: string
  source: 'CACHE' | 'DATABASE'
  responseTime: number
}

const CACHE_TTL: number = 3600 // 1 ghanta seconds mein
const URL_SERVICE = process.env.URL_SERVICE_URL || 'http://localhost:3001'

class RedirectService {

  async resolveURL(shortCode: string): Promise<ResolveResult | null> {
    const startTime = Date.now()
    const cacheKey: string = `url:${shortCode}`

    // ─── STEP 1: Redis check karo ───────────────────
    const cached: string | null = await redis.get(cacheKey)

    if (cached) {
      console.log(`✅ CACHE HIT: ${shortCode}`)
      return {
        url: cached,
        source: 'CACHE',
        responseTime: Date.now() - startTime
      }
    }

    // ─── STEP 2: Cache miss — URL Service se pucho ──
    console.log(`❌ CACHE MISS: ${shortCode} — URL Service se la raha hun`)

    try {
      const response = await axios.get(
        `${URL_SERVICE}/urls/${shortCode}`
      )

      if (!response.data?.data) return null

      const originalUrl: string = response.data.data.original_url

      // ─── STEP 3: Redis mein save karo ─────────────
      await redis.setex(cacheKey, CACHE_TTL, originalUrl)
      console.log(`💾 Cached: ${shortCode} → ${originalUrl}`)

      return {
        url: originalUrl,
        source: 'DATABASE',
        responseTime: Date.now() - startTime
      }

    } catch (err: any) {
      if (err.response?.status === 404) {
        return null  // URL exist hi nahi karta
      }
      throw err
    }
  }

  // Cache manually delete karo
  // Jab URL delete ho toh yeh call karo
  async invalidateCache(shortCode: string): Promise<void> {
    await redis.del(`url:${shortCode}`)
    console.log(`🗑️ Cache cleared: ${shortCode}`)
  }

  // Server start pe popular URLs cache mein daal do
  async warmUpCache(): Promise<void> {
    console.log('🔥 Cache warm up ho raha hai...')
    // Yahan popular URLs pre-load kar sakte ho
    // Abhi ke liye simple rakhte hain
    console.log('✅ Cache ready!')
  }
}

export default new RedirectService()