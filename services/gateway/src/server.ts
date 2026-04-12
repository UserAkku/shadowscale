import 'dotenv/config'
import express, { Request, Response } from 'express'
import cors from 'cors'
import axios from 'axios'
import { verifyToken, generateToken } from './auth.middleware'
import { abuseCheck } from './abuse.middleware'
import { urlProxy, redirectProxy, analyticsProxy } from './proxy'
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

// ── AUTH ROUTES (Public) ─────────────────────────────


app.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body

  // Demo credentials
  if (email === 'demo@shadowscale.com' && password === 'demo123') {
    const token = generateToken({
      userId: 1,
      email,
      plan: 'free'
    })

    return res.json({
      success: true,
      token,
      user: { email, plan: 'free' }
    })
  }

  return res.status(401).json({
    success: false,
    error: 'Wrong credentials'
  })
})

// ── URL ROUTES (Protected) ───────────────────────────

app.use(
  '/api/urls',
  abuseCheck,       // Step 1: Abuse check
  verifyToken,      // Step 2: Auth check
  urlProxy          // Step 3: URL Service proxy
)

// ── REDIRECT ROUTES (Public) ─────────────────────────

app.use(
  '/r',
  abuseCheck,      
  redirectProxy
)

// ── ANALYTICS ROUTES (Protected) ────────────────────

app.use(
  '/api/analytics',
  verifyToken,
  analyticsProxy
)

// ── HEALTH CHECK ─────────────────────────────────────

app.get('/health', async (req: Request, res: Response) => {
  const checks = await Promise.allSettled([
    axios.get(`${SERVICES.url}/health`, { timeout: 2000 }),
    axios.get(`${SERVICES.redirect}/health`, { timeout: 2000 }),
    axios.get(`${SERVICES.analytics}/health`, { timeout: 2000 }),
    axios.get(`${SERVICES.abuse}/health`, { timeout: 2000 })
  ])

  const serviceNames = ['url', 'redirect', 'analytics', 'abuse']

  const services: Record<string, any> = {}
  checks.forEach((check, i) => {
    services[serviceNames[i]] = {
      status: check.status === 'fulfilled' ? 'UP ✅' : 'DOWN ❌',
      circuit: breakers[`${serviceNames[i]}Service` as keyof typeof breakers]
        ?.getStats().state || 'N/A'
    }
  })

  const allUp = checks.every(c => c.status === 'fulfilled')

  res.json({
    status: allUp ? 'OK' : 'DEGRADED',
    gateway: 'UP ✅',
    services,
    timestamp: new Date().toISOString()
  })
})

// ── CIRCUIT BREAKER STATUS ───────────────────────────

app.get('/circuit-status', (req: Request, res: Response) => {
  res.json({
    circuits: Object.entries(breakers).map(([name, breaker]) =>
      breaker.getStats()
    )
  })
})

const PORT = parseInt(process.env.PORT || '3000')
app.listen(PORT, () => {
  console.log(`🚀 Gateway running on port ${PORT}`)
  console.log(`
  Routes:
  POST /auth/login         → Login
  POST /api/urls           → Create URL (Auth required)
  GET  /r/:shortCode       → Redirect
  GET  /api/analytics/:code→ Analytics (Auth required)
  GET  /health             → System health
  GET  /circuit-status     → Circuit breakers
  `)
})