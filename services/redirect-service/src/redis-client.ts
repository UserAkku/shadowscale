import Redis from 'ioredis'

class RedisClient {
  private static instance: Redis

  static getInstance(): Redis {
    if (!RedisClient.instance) {
      RedisClient.instance = new Redis(
        process.env.REDIS_URL || 'redis://localhost:6379',
        {
          tls: process.env.REDIS_URL?.startsWith('rediss://') 
            ? {} 
            : undefined
        }
      )

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