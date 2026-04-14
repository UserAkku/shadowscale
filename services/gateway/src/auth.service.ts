// src/auth.service.ts

import { Pool } from 'pg'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

interface User {
  id: number
  email: string
  plan: string
}

interface AuthResult {
  success: boolean
  token?: string
  user?: User
  error?: string
}

class AuthService {
  private db: Pool

  constructor() {
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })
  }

  async signup(email: string, password: string): Promise<AuthResult> {
    try {
      // Email already exist karta hai?
      const existing = await this.db.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      )

      if (existing.rows.length > 0) {
        return { success: false, error: 'Email already registered hai' }
      }

      // Password hash karo
      const hashedPassword = await bcrypt.hash(password, 10)

      // User banao
      const result = await this.db.query(
        `INSERT INTO users (email, password, plan)
         VALUES ($1, $2, 'free')
         RETURNING id, email, plan`,
        [email, hashedPassword]
      )

      const user = result.rows[0]
      const token = this.generateToken(user)

      console.log(`✅ New user: ${email}`)

      return { success: true, token, user }

    } catch (err) {
      console.error('Signup error:', err)
      return { success: false, error: 'Signup nahi hua' }
    }
  }

  async login(email: string, password: string): Promise<AuthResult> {
    try {
      const result = await this.db.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      )

      if (result.rows.length === 0) {
        return { success: false, error: 'Email nahi mila' }
      }

      const user = result.rows[0]

      // Password check karo
      const isValid = await bcrypt.compare(password, user.password)

      if (!isValid) {
        return { success: false, error: 'Wrong password' }
      }

      const token = this.generateToken(user)

      return {
        success: true,
        token,
        user: { id: user.id, email: user.email, plan: user.plan }
      }

    } catch (err) {
      console.error('Login error:', err)
      return { success: false, error: 'Login nahi hua' }
    }
  }

  private generateToken(user: User): string {
    return jwt.sign(
      { userId: user.id, email: user.email, plan: user.plan },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    )
  }
}

export default new AuthService()