import { Pool, QueryResult } from 'pg'
import crypto from 'crypto'
import snowflake from './snowflake'
import { encode } from './base62'
import { getShardTable } from './shard-router'

interface URLRecord {
  id: string
  short_code: string
  original_url: string
  click_count: number
  user_id: number | null
  claim_token: string
  created_at: Date
}

interface CreateURLResult {
  shortCode: string
  originalUrl: string
  shardTable: string
  claimToken: string  // ← naya
}

class URLService {
  private db: Pool

  constructor() {
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })
  }

  // Claim token generate karo
  // FUNCTIONAL: Pure function
  private generateClaimToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  async createShortURL(
    originalUrl: string,
    userId?: number  // Optional — login hai toh pass karo
  ): Promise<CreateURLResult> {

    if (!this.isValidURL(originalUrl)) {
      throw new Error('INVALID_URL')
    }

    const id = snowflake.generate()
    const shortCode = encode(id)
    const shardTable = getShardTable(shortCode)
    const claimToken = this.generateClaimToken()

    await this.db.query(
      `INSERT INTO ${shardTable} 
       (id, short_code, original_url, user_id, claim_token) 
       VALUES ($1, $2, $3, $4, $5)`,
      [id.toString(), shortCode, originalUrl, userId || null, claimToken]
    )

    console.log(`✅ URL saved in ${shardTable}: ${shortCode}`)

    return { shortCode, originalUrl, shardTable, claimToken }
  }

  async getURL(shortCode: string): Promise<URLRecord | null> {
    const shardTable = getShardTable(shortCode)

    const result = await this.db.query<URLRecord>(
      `SELECT * FROM ${shardTable} WHERE short_code = $1`,
      [shortCode]
    )

    if (result.rows.length === 0) return null

    await this.db.query(
      `UPDATE ${shardTable} 
       SET click_count = click_count + 1
       WHERE short_code = $1`,
      [shortCode]
    )

    return result.rows[0]
  }

  // Claim token se URL apne naam karo
  async claimURL(
    claimToken: string,
    userId: number
  ): Promise<{ success: boolean; shortCode?: string }> {

    // Teeno shards mein dhundo
    for (let i = 0; i < 3; i++) {
      const table = `urls_shard_${i}`

      const result = await this.db.query(
        `UPDATE ${table}
         SET user_id = $1
         WHERE claim_token = $2
         AND user_id IS NULL
         RETURNING short_code`,
        [userId, claimToken]
      )

      if (result.rows.length > 0) {
        console.log(`✅ URL claimed: ${result.rows[0].short_code} → user ${userId}`)
        return { success: true, shortCode: result.rows[0].short_code }
      }
    }

    return { success: false }
  }

  // User ke saare URLs nikalo
  async getUserURLs(userId: number): Promise<URLRecord[]> {

    // Teeno shards mein dhundo parallel
    const [s0, s1, s2] = await Promise.all([
      this.db.query<URLRecord>(
        `SELECT * FROM urls_shard_0 
         WHERE user_id = $1 
         ORDER BY created_at DESC`,
        [userId]
      ),
      this.db.query<URLRecord>(
        `SELECT * FROM urls_shard_1 
         WHERE user_id = $1 
         ORDER BY created_at DESC`,
        [userId]
      ),
      this.db.query<URLRecord>(
        `SELECT * FROM urls_shard_2 
         WHERE user_id = $1 
         ORDER BY created_at DESC`,
        [userId]
      )
    ])

    // Teeno combine karo, time se sort karo
    return [...s0.rows, ...s1.rows, ...s2.rows]
      .sort((a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
      )
  }

  // URL delete karo (sirf owner kar sakta hai)
  async deleteURL(
    shortCode: string,
    userId: number
  ): Promise<boolean> {
    const shardTable = getShardTable(shortCode)

    const result = await this.db.query(
      `DELETE FROM ${shardTable}
       WHERE short_code = $1
       AND user_id = $2
       RETURNING id`,
      [shortCode, userId]
    )

    if (result.rows.length > 0) {
      console.log(`🗑️ URL deleted: ${shortCode}`)
      return true
    }

    return false  // Ya toh exist nahi ya owner nahi
  }

  private isValidURL(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }
}

export default new URLService()