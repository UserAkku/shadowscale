// src/counter.ts

import redis from './redis-client'

/**
 * OOPS: Class — Redis state manage karna hai
 * 
 * Yeh real-time counters hain
 * Database se zyada fast
 * Dashboard pe turant dikhte hain
 */

class ClickCounter {

  // Total clicks badhao
  async increment(shortCode: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0] // "2024-03-01"
    const hour = new Date().getHours()                   // 0-23

    await Promise.all([
      // Total clicks
      redis.incr(`clicks:total:${shortCode}`),

      // Aaj ke clicks
      redis.incr(`clicks:daily:${shortCode}:${today}`),

      // Is ghante ke clicks
      redis.incr(`clicks:hourly:${shortCode}:${hour}`),

      // TTL set karo — purane data clean ho jaaye
      redis.expire(`clicks:daily:${shortCode}:${today}`, 86400 * 7), // 7 din
      redis.expire(`clicks:hourly:${shortCode}:${hour}`, 86400)       // 1 din
    ])
  }

  // Total clicks lo
  async getTotal(shortCode: string): Promise<number> {
    const val = await redis.get(`clicks:total:${shortCode}`)
    return parseInt(val || '0')
  }

  // Aaj ke clicks lo
  async getToday(shortCode: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0]
    const val = await redis.get(`clicks:daily:${shortCode}:${today}`)
    return parseInt(val || '0')
  }

  // Last 24 hours hourly data lo
  async getHourlyData(shortCode: string): Promise<{ hour: number; clicks: number }[]> {
    const hours = Array.from({ length: 24 }, (_, i) => i)

    const results = await Promise.all(
      hours.map(async (hour) => {
        const val = await redis.get(`clicks:hourly:${shortCode}:${hour}`)
        return {
          hour,
          clicks: parseInt(val || '0')
        }
      })
    )

    return results
  }
}

export default new ClickCounter()