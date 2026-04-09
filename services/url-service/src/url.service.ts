

import { Pool, QueryResult } from 'pg'
import snowflake from './snowflake'
import { encode } from './base62'
import { getShardTable } from './shard-router'


interface URLRecord {
  id: string
  short_code: string
  original_url: string
  click_count: number
  created_at: Date
}

interface CreateURLResult {
  shortCode: string
  originalUrl: string
  shardTable: string
}

class URLService {
  private db: Pool

  constructor() {
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL
    })
  }

  async createShortURL(originalUrl: string): Promise<CreateURLResult> {
    // Step 1: Validate
    if (!this.isValidURL(originalUrl)) {
      throw new Error('INVALID_URL')
    }

    // Step 2: Unique ID
    const id: bigint = snowflake.generate()

    // Step 3: Short code
    const shortCode: string = encode(id)

    // Step 4: Shard decide
    const shardTable: string = getShardTable(shortCode)

    // Step 5: DB mein save
    await this.db.query(
      `INSERT INTO ${shardTable} 
       (id, short_code, original_url) 
       VALUES ($1, $2, $3)`,
      [id.toString(), shortCode, originalUrl]
    )

    console.log(`✅ Saved in ${shardTable}: ${shortCode}`)

    return { shortCode, originalUrl, shardTable }
  }

  async getURL(shortCode: string): Promise<URLRecord | null> {
    const shardTable: string = getShardTable(shortCode)

    const result: QueryResult<URLRecord> = await this.db.query(
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