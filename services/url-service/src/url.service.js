// src/url.service.js

const { Pool } = require('pg')
const snowflake = require('./snowflake')
const { encode } = require('./base62')
const { getShardTable } = require('./shard-router')

class URLService {
  constructor() {

    this.db = new Pool({
      connectionString: process.env.DATABASE_URL
    })
  }

 
  async createShortURL(originalUrl) {

    if (!this.isValidURL(originalUrl)) {
      throw new Error('INVALID_URL')
    }


    const id = snowflake.generate()


    const shortCode = encode(id)


    const shardTable = getShardTable(shortCode)


    await this.db.query(
      `INSERT INTO ${shardTable} 
       (id, short_code, original_url) 
       VALUES ($1, $2, $3)`,
      [id.toString(), shortCode, originalUrl]
    )

    console.log(`✅ URL saved in ${shardTable}: ${shortCode}`)


    return {
      shortCode,
      originalUrl,
      shardTable 
    }
  }


  async getURL(shortCode) {
    const shardTable = getShardTable(shortCode)

    console.log(`🔍 Looking in ${shardTable} for ${shortCode}`)

    const result = await this.db.query(
      `SELECT * FROM ${shardTable} 
       WHERE short_code = $1`,
      [shortCode]
    )

    if (result.rows.length === 0) {
      return null
    }


    await this.db.query(
      `UPDATE ${shardTable} 
       SET click_count = click_count + 1
       WHERE short_code = $1`,
      [shortCode]
    )

    return result.rows[0]
  }

  isValidURL(url) {
    try {
      new URL(url)  
      return true
    } catch {
      return false
    }
  }
}


module.exports = new URLService()