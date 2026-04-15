import 'dotenv/config'
import express, { Request, Response } from 'express'
import urlService from './url.service'

const app = express()
app.use(express.json())

app.use((req: Request, res: Response, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  res.header('Access-Control-Allow-Methods', 'GET,POST,DELETE')
  next()
})

// URL banao — anonymous bhi, logged in bhi
app.post('/urls', async (req: Request, res: Response) => {
  try {
    const { originalUrl, userId } = req.body

    if (!originalUrl) {
      return res.status(400).json({
        success: false,
        error: 'originalUrl required hai'
      })
    }

    const result = await urlService.createShortURL(
      originalUrl,
      userId ? parseInt(userId) : undefined
    )

    return res.status(201).json({
      success: true,
      shortCode: result.shortCode,
      shortUrl: `${process.env.BASE_URL}/r/${result.shortCode}`,
      originalUrl: result.originalUrl,
      savedInShard: result.shardTable,
      claimToken: result.claimToken  // ← Frontend save kar le
    })

  } catch (err: any) {
    if (err.message === 'INVALID_URL') {
      return res.status(400).json({
        success: false,
        error: 'Valid URL daalo (https:// se start karo)'
      })
    }
    return res.status(500).json({ success: false, error: 'Server error' })
  }
})

// URL info lo
app.get('/urls/:shortCode', async (req: Request, res: Response) => {
  try {
    const url = await urlService.getURL(req.params.shortCode as string)
    if (!url) return res.status(404).json({ error: 'URL nahi mila' })
    return res.json({ success: true, data: url })
  } catch (err) {
    return res.status(500).json({ error: 'Server error' })
  }
})

// Claim karo — login ke baad
app.post('/urls/claim', async (req: Request, res: Response) => {
  try {
    const { claimToken, userId } = req.body

    if (!claimToken || !userId) {
      return res.status(400).json({
        error: 'claimToken aur userId dono chahiye'
      })
    }

    const result = await urlService.claimURL(
      claimToken,
      parseInt(userId)
    )

    if (!result.success) {
      return res.status(404).json({
        error: 'Token invalid hai ya already claimed hai'
      })
    }

    return res.json({
      success: true,
      message: 'URL claimed!',
      shortCode: result.shortCode
    })

  } catch (err) {
    return res.status(500).json({ error: 'Server error' })
  }
})

// User ke saare URLs
app.get('/urls/user/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId as string)
    const urls = await urlService.getUserURLs(userId)

    return res.json({
      success: true,
      total: urls.length,
      urls
    })

  } catch (err) {
    return res.status(500).json({ error: 'Server error' })
  }
})

// URL delete karo
app.delete('/urls/:shortCode', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body
    const shortCode = req.params.shortCode as string

    if (!userId) {
      return res.status(400).json({ error: 'userId required hai' })
    }

    const deleted = await urlService.deleteURL(shortCode, parseInt(userId))

    if (!deleted) {
      return res.status(403).json({
        error: 'URL nahi mila ya tumhara nahi hai'
      })
    }

    return res.json({ success: true, message: 'URL deleted!' })

  } catch (err) {
    return res.status(500).json({ error: 'Server error' })
  }
})

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'UP', service: 'url-service' })
})

const PORT = parseInt(process.env.PORT || '3001')
app.listen(PORT, () => {
  console.log(`🚀 URL Service running on port ${PORT}`)
})