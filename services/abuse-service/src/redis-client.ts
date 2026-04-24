// src/redis-client.ts

import Redis from 'ioredis'

/**
 * OOPS: Singleton Pattern
 * Ek hi Redis connection pura app mein
 */
class RedisClient {
  private static instance: Redis

  static getInstance(): Redis {
    if (!RedisClient.instance) {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
      RedisClient.instance = new Redis(redisUrl, {
        tls: redisUrl.startsWith('rediss://') ? {} : undefined
      })

      RedisClient.instance.on('connect', () => {
        console.log('✅ Redis connected!')
      })

      RedisClient.instance.on('error', (err: Error) => {
        console.error('❌ Redis error:', err.message)
      })
    }

    return RedisClient.instance
  }
}

export default RedisClient.getInstance()