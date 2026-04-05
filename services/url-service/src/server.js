
require('dotenv').config()
const express = require('express')
const urlService = require('./url.service')

const app = express()
app.use(express.json())


app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  next()
})


app.post('/urls', async (req, res) => {
  try {
    const { originalUrl } = req.body

    if (!originalUrl) {
      return res.status(400).json({
        success: false,
        error: 'originalUrl required hai bhai'
      })
    }

    const result = await urlService.createShortURL(originalUrl)

    res.status(201).json({
      success: true,
      shortCode: result.shortCode,
      shortUrl: `${process.env.BASE_URL}/${result.shortCode}`,
      originalUrl: result.originalUrl,
      savedInShard: result.shardTable  
    })

  } catch (err) {
    if (err.message === 'INVALID_URL') {
      return res.status(400).json({
        success: false,
        error: 'Valid URL daalo bhai (https:// se start karo)'
      })
    }

    console.error('Error:', err)
    res.status(500).json({
      success: false,
      error: 'Server mein kuch gadbad ho gayi'
    })
  }
})

app.get('/urls/:shortCode', async (req, res) => {
  try {
    const url = await urlService.getURL(req.params.shortCode)

    if (!url) {
      return res.status(404).json({
        success: false,
        error: 'URL nahi mila'
      })
    }

    res.json({
      success: true,
      data: url
    })

  } catch (err) {
    console.error('Error:', err)
    res.status(500).json({
      success: false,
      error: 'Server mein kuch gadbad ho gayi'
    })
  }
})


app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'url-service',
    timestamp: new Date().toISOString()
  })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`🚀 URL Service running on port ${PORT}`)
})