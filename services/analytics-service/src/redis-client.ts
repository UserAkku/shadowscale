import Redis from 'ioredis'

class RedisClient {
  private static instance: Redis

  static getInstance(): Redis {
    if (!RedisClient.instance) {
      const redisUrl = process.env.REDIS_URL!
      const isTLS = redisUrl.startsWith('rediss://')

      RedisClient.instance = new Redis(redisUrl, {
        tls: isTLS ? {} : undefined,
        maxRetriesPerRequest: null  // BullMQ ke liye required
      })

      RedisClient.instance.on('connect', () => console.log('✅ Redis connected!'))
      RedisClient.instance.on('error', (err: Error) => console.error('❌ Redis error:', err.message))
    }
    return RedisClient.instance
  }
}

export default RedisClient.getInstance()