// src/server.ts

import 'dotenv/config'
import express, { Request, Response } from 'express'
import cors from 'cors'
import axios from 'axios'
import { createProxyMiddleware } from 'http-proxy-middleware'
import jwt from 'jsonwebtoken'
import authService from './auth.service'
import { abuseCheck } from './abuse.middleware'
import { breakers } from './circuit-breaker'

const app = express()
app.use(express.json())
app.use(cors())

const SERVICES = {
  url: process.env.URL_SERVICE_URL || 'http://localhost:3001',
  redirect: process.env.REDIRECT_SERVICE_URL || 'http://localhost:3002',
  analytics: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3003',
  abuse: process.env.ABUSE_SERVICE_URL || 'http://localhost:3004'
}

// JWT middleware
const verifyToken = (req: Request, res: Response, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Token nahi hai' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ error: 'Token invalid' })
  }
}

// ── AUTH ROUTES ──────────────────────────────────

// Signup
app.post('/auth/signup', async (req: Request, res: Response) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email aur password chahiye' })
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password 6+ characters ka hona chahiye' })
  }

  const result = await authService.signup(email, password)

  if (!result.success) {
    return res.status(400).json({ error: result.error })
  }

  return res.json({
    success: true,
    token: result.token,
    user: result.user
  })
})

// Login
app.post('/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email aur password chahiye' })
  }

  const result = await authService.login(email, password)

  if (!result.success) {
    return res.status(401).json({ error: result.error })
  }

  return res.json({
    success: true,
    token: result.token,
    user: result.user
  })
})

// ── URL ROUTES ───────────────────────────────────

// URL banao — PUBLIC (koi bhi)
app.post('/api/urls', abuseCheck, async (req: Request, res: Response) => {
  try {
    // Agar token hai toh userId pass karo
    let userId: number | undefined

    const token = req.headers.authorization?.replace('Bearer ', '')
    if (token) {
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'secret'
        ) as any
        userId = decoded.userId
      } catch {
        // Token invalid — anonymous treat karo
      }
    }

    const response = await axios.post(`${SERVICES.url}/urls`, {
      ...req.body,
      userId
    })

    return res.json(response.data)

  } catch (err: any) {
    return res.status(err.response?.status || 500).json(
      err.response?.data || { error: 'Server error' }
    )
  }
})

// Claim URL — login ke baad
app.post('/api/urls/claim', verifyToken, async (req: Request, res: Response) => {
  try {
    const response = await axios.post(`${SERVICES.url}/urls/claim`, {
      claimToken: req.body.claimToken,
      userId: (req as any).user.userId
    })
    return res.json(response.data)
  } catch (err: any) {
    return res.status(err.response?.status || 500).json(
      err.response?.data || { error: 'Server error' }
    )
  }
})

// Mere saare URLs
app.get('/api/urls/my', verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId
    const response = await axios.get(`${SERVICES.url}/urls/user/${userId}`)
    return res.json(response.data)
  } catch (err: any) {
    return res.status(err.response?.status || 500).json(
      err.response?.data || { error: 'Server error' }
    )
  }
})

// URL delete karo
app.delete('/api/urls/:shortCode', verifyToken, async (req: Request, res: Response) => {
  try {
    const response = await axios.delete(
      `${SERVICES.url}/urls/${req.params.shortCode}`,
      { data: { userId: (req as any).user.userId } }
    )
    return res.json(response.data)
  } catch (err: any) {
    return res.status(err.response?.status || 500).json(
      err.response?.data || { error: 'Server error' }
    )
  }
})

// ── REDIRECT ROUTE (PUBLIC) ──────────────────────

app.use('/r', abuseCheck, createProxyMiddleware({
  target: SERVICES.redirect,
  changeOrigin: true,
  pathRewrite: { '^/r': '' }
}))

// ── ANALYTICS ROUTES ─────────────────────────────

// Analytics — PUBLIC (claim token se)
app.get('/api/analytics/:shortCode', abuseCheck, async (req: Request, res: Response) => {
  try {
    const response = await axios.get(
      `${SERVICES.analytics}/analytics/${req.params.shortCode}`
    )
    return res.json(response.data)
  } catch (err: any) {
    return res.status(err.response?.status || 500).json({ error: 'Analytics nahi mila' })
  }
})

// ── HEALTH CHECK ─────────────────────────────────

app.get('/health', async (req: Request, res: Response) => {
  const checks = await Promise.allSettled([
    axios.get(`${SERVICES.url}/health`, { timeout: 2000 }),
    axios.get(`${SERVICES.redirect}/health`, { timeout: 2000 }),
    axios.get(`${SERVICES.analytics}/health`, { timeout: 2000 }),
    axios.get(`${SERVICES.abuse}/health`, { timeout: 2000 })
  ])

  const names = ['url', 'redirect', 'analytics', 'abuse']
  const services: Record<string, string> = {}

  checks.forEach((check, i) => {
    services[names[i]] = check.status === 'fulfilled' ? 'UP ✅' : 'DOWN ❌'
  })

  res.json({
    status: checks.every(c => c.status === 'fulfilled') ? 'OK' : 'DEGRADED',
    services
  })
})

// Express mein user type add karo
declare global {
  namespace Express {
    interface Request { user?: any }
  }
}

const PORT = parseInt(process.env.PORT || '3000')
app.listen(PORT, () => {
  console.log(`🚀 Gateway running on port ${PORT}`)
})