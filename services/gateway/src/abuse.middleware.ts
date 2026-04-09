import { Request, Response, NextFunction } from 'express'
import axios from 'axios'
import { breakers } from './circuit-breaker'

/**
 * FUNCTIONAL: Middleware function
 *
 * Call the Abuse Service for each request
 * Protect calls with a Circuit Breaker
 * If Abuse Service is down → allow the request
 * (The website should keep running)
 */

const ABUSE_SERVICE = process.env.ABUSE_SERVICE_URL || 'http://localhost:3004'

export const abuseCheck = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown'

  try {
    const result = await breakers.abuseService.call(async () => {
      const response = await axios.post(
        `${ABUSE_SERVICE}/check`,
        { ip },
        { timeout: 2000 }  // 2 sec timeout
      )
      return response.data
    })

    if (!result.allowed) {
      res.status(result.status || 429).json({
        success: false,
        error: result.reason === 'BLACKLISTED'
          ? 'Your access is blocked'
          : 'Too many requests! Please wait a moment.',
        retryAfter: result.retryAfter
      })
      return
    }

    // Pass - continue
    next()

  } catch (err) {
    // Abuse service down? Continue without blocking traffic
    console.error('Abuse service unreachable — allowing request')
    next()
  }
}