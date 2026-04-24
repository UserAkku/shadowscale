// src/server.ts

import 'dotenv/config'
import express, { Request, Response } from 'express'
import abuseService from './abuse.service'
import blacklist from './blacklist'
import tokenBucket from './token-bucket'

const app = express()
app.use(express.json())

// CORS
app.use((req: Request, res: Response, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  next()
})

/**
 * POST /check
 * Gateway yeh call karta hai har request pe
 * 
 * Body: { ip: "103.21.4.5" }
 * Response: { allowed: true/false, ... }
 */
app.post('/check', async (req: Request, res: Response) => {
  try {
    const { ip } = req.body

    if (!ip) {
      return res.status(400).json({
        success: false,
        error: 'IP required hai'
      })
    }

    const result = await abuseService.checkRequest(ip)

    // Console mein dikhao — demo ke liye
    console.log(`
    ━━━━━━━━━━━━━━━━━━━━━━━
    🔍 ABUSE CHECK
    IP: ${ip}
    Result: ${result.allowed ? '✅ ALLOWED' : '🚫 BLOCKED'}
    Reason: ${result.reason || 'none'}
    Tokens: ${result.tokensLeft ?? 'N/A'}
    ━━━━━━━━━━━━━━━━━━━━━━━
    `)

    return res.json({
      success: true,
      ...result
    })

  } catch (err) {
    console.error('Abuse check error:', err)
    // Error pe bhi allow karo
    // Abuse service down hone pe website nahi rukni chahiye
    return res.json({ allowed: true })
  }
})

/**
 * POST /blacklist
 * Manually IP blacklist karo
 */
app.post('/blacklist', async (req: Request, res: Response) => {
  try {
    const { ip, reason } = req.body

    if (!ip || !reason) {
      return res.status(400).json({
        error: 'ip aur reason dono chahiye'
      })
    }

    await blacklist.blacklistIP(ip, reason)

    return res.json({
      success: true,
      message: `${ip} blacklisted!`
    })

  } catch (err) {
    return res.status(500).json({ error: 'Blacklist nahi ho saka' })
  }
})

/**
 * DELETE /blacklist/:ip
 * IP ko blacklist se hatao
 */
app.delete('/blacklist/:ip', async (req: Request, res: Response) => {
  try {
    await blacklist.removeFromBlacklist(req.params.ip)
    return res.json({
      success: true,
      message: `${req.params.ip} removed!`
    })
  } catch (err) {
    return res.status(500).json({ error: 'Remove nahi hua' })
  }
})

/**
 * GET /stats/:ip
 * IP ka status dekho — demo ke liye
 */
app.get('/stats/:ip', async (req: Request, res: Response) => {
  try {
    const stats = await abuseService.getStats(req.params.ip)
    return res.json({ success: true, data: stats })
  } catch (err) {
    return res.status(500).json({ error: 'Stats nahi mila' })
  }
})

/**
 * POST /reset/:ip
 * IP ka rate limit reset karo
 */
app.post('/reset/:ip', async (req: Request, res: Response) => {
  await tokenBucket.resetBucket(req.params.ip)
  res.json({ success: true, message: 'Bucket reset!' })
})

/**
 * GET /health
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'UP',
    service: 'abuse-service',
    timestamp: new Date().toISOString()
  })
})

const PORT: number = parseInt(process.env.PORT || '3004')
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Abuse Service running on port ${PORT}`)
})