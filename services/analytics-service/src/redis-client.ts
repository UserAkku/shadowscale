import Redis from 'ioredis'

class RedisClient {
  private static instance: Redis

  static getInstance(): Redis {
    if (!RedisClient.instance) {
      const redisUrl = process.env.REDIS_URL!

      RedisClient.instance = new Redis(redisUrl, {
        tls: {}  // Upstash hamesha TLS use karta hai
      })

      RedisClient.instance.on('connect', () => console.log('✅ Redis connected!'))
      RedisClient.instance.on('error', (err: Error) => console.error('❌ Redis error:', err.message))
    }
    return RedisClient.instance
  }
}

export default RedisClient.getInstance()