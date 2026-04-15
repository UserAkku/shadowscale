import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

/*
 * FUNCTIONAL: middleware function
 */

interface JWTPayload {
  userId: number
  email: string
  iat: number
  exp: number
}

// Attach user to request
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload
    }
  }
}

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Token is missing - please log in first'
    })
    return
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret'
    ) as JWTPayload

    req.user = decoded
    next()

  } catch (err) {
    res.status(401).json({
      success: false,
      error: 'Token is invalid or has expired'
    })
  }
}

// Create token - used during login
export const generateToken = (payload: {
  userId: number
  email: string
}): string => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
    expiresIn: '7d'
  })
}
