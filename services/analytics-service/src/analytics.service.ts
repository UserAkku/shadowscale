// src/analytics.service.ts

import db from './db'
import counter from './counter'

/**
 * OOPS: Class — multiple methods, db state
 * Yeh dashboard ke liye data nikalta hai
 */

interface CountryData {
  country: string
  count: number
}

interface DeviceData {
  device: string
  count: number
}

interface HourlyData {
  hour: number
  clicks: number
}

interface AnalyticsDashboard {
  shortCode: string
  totalClicks: number
  todayClicks: number
  topCountries: CountryData[]
  devices: DeviceData[]
  browsers: DeviceData[]
  hourlyData: HourlyData[]
}

class AnalyticsService {

  async getDashboard(shortCode: string): Promise<AnalyticsDashboard> {

    // Sab ek saath lo — zyada fast
    const [
      totalClicks,
      todayClicks,
      topCountries,
      devices,
      browsers,
      hourlyData
    ] = await Promise.all([

      // Redis se — instant
      counter.getTotal(shortCode),
      counter.getToday(shortCode),

      // DB se — top 5 countries
      db.query<CountryData>(`
        SELECT country, COUNT(*) as count
        FROM click_events
        WHERE short_code = $1
        GROUP BY country
        ORDER BY count DESC
        LIMIT 5
      `, [shortCode]),

      // Device breakdown
      db.query<DeviceData>(`
        SELECT device, COUNT(*) as count
        FROM click_events
        WHERE short_code = $1
        GROUP BY device
        ORDER BY count DESC
      `, [shortCode]),

      // Browser breakdown
      db.query<DeviceData>(`
        SELECT browser, COUNT(*) as count
        FROM click_events
        WHERE short_code = $1
        GROUP BY browser
        ORDER BY count DESC
        LIMIT 5
      `, [shortCode]),

      // Hourly data — Redis se fast
      counter.getHourlyData(shortCode)
    ])

    return {
      shortCode,
      totalClicks,
      todayClicks,
      topCountries: topCountries.rows,
      devices: devices.rows,
      browsers: browsers.rows,
      hourlyData
    }
  }

  // Sabka overall stats
  async getOverallStats(): Promise<any> {
    const result = await db.query(`
      SELECT 
        COUNT(DISTINCT short_code) as total_links,
        COUNT(*) as total_clicks,
        COUNT(DISTINCT ip) as unique_visitors
      FROM click_events
    `)

    return result.rows[0]
  }
}

export default new AnalyticsService()