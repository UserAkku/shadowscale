// src/server.ts

import 'dotenv/config'
import express, { Request, Response } from 'express'
import analyticsService from './analytics.service'
import './worker'  // Worker shuru karo

const app = express()
app.use(express.json())

// CORS
app.use((req: Request, res: Response, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  next()
})

/**
 * GET /analytics/:shortCode
 * Dashboard data lo
 */
app.get('/analytics/:shortCode', async (req: Request, res: Response) => {
  try {
    const shortCode = req.params.shortCode as string  // ← yeh add karo

    if (!shortCode) {
      return res.status(400).json({ error: 'shortCode required hai' })
    }

    const dashboard = await analyticsService.getDashboard(shortCode)
    res.json({ success: true, data: dashboard })

  } catch (err) {
    console.error('Analytics error:', err)
    res.status(500).json({ success: false, error: 'Analytics data nahi mila' })
  }
})

/**
 * GET /analytics/overall/stats
 * Poore system ka stats
 */
app.get('/analytics/overall/stats', async (req: Request, res: Response) => {
  try {
    const stats = await analyticsService.getOverallStats()
    res.json({ success: true, data: stats })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Stats nahi mila' })
  }
})

/**
 * GET /health
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'UP',
    service: 'analytics-service',
    timestamp: new Date().toISOString()
  })
})

const PORT: number = parseInt(process.env.PORT || '3003')
app.listen(PORT, () => {
  console.log(`🚀 Analytics Service running on port ${PORT}`)
})