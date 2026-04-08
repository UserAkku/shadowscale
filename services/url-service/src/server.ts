// src/server.ts

import 'dotenv/config'
import express, { Request, Response } from 'express'
import urlService from './url.service'

const app = express()
app.use(express.json())

// CORS
app.use((req: Request, res: Response, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  next()
})


app.post('/urls', async (req: Request, res: Response) => {
  try {
    const { originalUrl } = req.body

    if (!originalUrl) {
      return res.status(400).json({
        success: false,
        error: 'originalUrl required hai bhai'
      })
    }

    const result = await urlService.createShortURL(originalUrl)

    return res.status(201).json({
      success: true,
      shortCode: result.shortCode,
      shortUrl: `${process.env.BASE_URL}/${result.shortCode}`,
      originalUrl: result.originalUrl,
      savedInShard: result.shardTable
    })

  } catch (err: any) {
    if (err.message === 'INVALID_URL') {
      return res.status(400).json({
        success: false,
        error: 'Valid URL daalo (https:// se start karo)'
      })
    }
    return res.status(500).json({
      success: false,
      error: 'Server mein kuch gadbad ho gayi'
    })
  }
})

app.get('/urls/:shortCode', async (req: Request, res: Response) => {
  try {
    const shortCode = Array.isArray(req.params.shortCode) ? req.params.shortCode[0] : req.params.shortCode
    const url = await urlService.getURL(shortCode)

    if (!url) {
      return res.status(404).json({
        success: false,
        error: 'URL nahi mila'
      })
    }

    return res.json({ success: true, data: url })

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Server mein kuch gadbad ho gayi'
    })
  }
})

// GET /health
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'UP',
    service: 'url-service',
    timestamp: new Date().toISOString()
  })
})

const PORT: number = parseInt(process.env.PORT || '3001')
app.listen(PORT, () => {
  console.log(`🚀 URL Service running on port ${PORT}`)
})