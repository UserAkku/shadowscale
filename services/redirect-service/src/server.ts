// src/server.ts

import 'dotenv/config'
import express, { Request, Response } from 'express'
import redirectService from './redirect.service'
import clickQueue from './queue'

const app = express()
app.use(express.json())

// CORS
app.use((req: Request, res: Response, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  next()
})

/**
 * GET /health
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'UP',
    service: 'redirect-service',
    timestamp: new Date().toISOString()
  })
})

/**
 * GET /:shortCode
 * 
 * Yahi main route hai
 * Koi bhi short link click kare → yahan aata hai
 */
app.get('/:shortCode', async (req: Request<{ shortCode: string }>, res: Response) => {
  const { shortCode } = req.params

  // Short code valid hai? (sirf letters aur numbers)
  if (!/^[a-zA-Z0-9]+$/.test(shortCode)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid short code'
    })
  }

  try {
    const result = await redirectService.resolveURL(shortCode)

    if (!result) {
      return res.status(404).send(`
        <h2>❌ Link nahi mila!</h2>
        <p>Yeh link exist nahi karta ya expire ho gaya।</p>
      `)
    }

    // Background mein analytics event bhejo
    // User ko wait nahi karwate iske liye
    clickQueue.publish({
      shortCode,
      ip: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      referer: req.headers['referer'] || 'Direct',
      timestamp: Date.now()
    })

    // Console mein dikhao — demo ke liye useful
    console.log(`
    ━━━━━━━━━━━━━━━━━━━━━━━━
    🔀 REDIRECT
    Code: ${shortCode}
    URL:  ${result.url}
    From: ${result.source}
    Time: ${result.responseTime}ms
    ━━━━━━━━━━━━━━━━━━━━━━━━
    `)

    // User ko redirect karo
    return res.redirect(302, result.url)

  } catch (err) {
    console.error('Redirect error:', err)
    return res.status(500).send('Kuch toot gaya, dobara try karo')
  }
})

/**
 * DELETE /cache/:shortCode
 * Cache manually clear karo
 */
app.delete('/cache/:shortCode', async (req: Request<{ shortCode: string }>, res: Response) => {
  await redirectService.invalidateCache(req.params.shortCode)
  res.json({ success: true, message: 'Cache cleared' })
})



// Cache warm up karo server start pe
redirectService.warmUpCache()

const PORT: number = parseInt(process.env.PORT || '3002')
app.listen(PORT, () => {
  console.log(`🚀 Redirect Service running on port ${PORT}`)
})