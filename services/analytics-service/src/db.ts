// src/db.ts

import { Pool } from 'pg'

/**
 * OOPS: Singleton Pattern
 * Database connection ek baar banta hai
 */
class Database {
  private static instance: Pool

  static getInstance(): Pool {
    if (!Database.instance) {
      Database.instance = new Pool({
        connectionString: process.env.DATABASE_URL
      })

      Database.instance.on('connect', () => {
        console.log('✅ Database connected!')
      })

      Database.instance.on('error', (err: Error) => {
        console.error('❌ Database error:', err.message)
      })
    }

    return Database.instance
  }
}

export default Database.getInstance()