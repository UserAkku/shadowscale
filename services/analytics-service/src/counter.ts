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
      // Total clicks — kabhi expire nahi hota
      redis.incr(`clicks:total:${shortCode}`),

      // Aaj ke clicks
      redis.incr(`clicks:daily:${shortCode}:${today}`),

      // Is ghante ke clicks — DATE + HOUR dono include karo
      // Pehle sirf hour tha → alag din ke same hour ke data mix ho rahe the
      redis.incr(`clicks:hourly:${shortCode}:${today}:${hour}`),

      // TTL set karo — purane data clean ho jaaye
      redis.expire(`clicks:daily:${shortCode}:${today}`, 86400 * 7), // 7 din
      redis.expire(`clicks:hourly:${shortCode}:${today}:${hour}`, 86400 * 2)  // 2 din
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
    const now = new Date()
    const hours: { hour: number; date: string }[] = []

    // Last 24 hours ka data — current hour se peeche jaao
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 3600000)
      hours.push({
        hour: d.getHours(),
        date: d.toISOString().split('T')[0]
      })
    }

    const results = await Promise.all(
      hours.map(async ({ hour, date }) => {
        const val = await redis.get(`clicks:hourly:${shortCode}:${date}:${hour}`)
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