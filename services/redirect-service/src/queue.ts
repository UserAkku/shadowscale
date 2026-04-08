import { Queue } from 'bullmq'

class ClickQueue {
  private queue: Queue

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
    const isTLS = redisUrl.startsWith('rediss://')
    
    // URL se host aur port nikalo
    const url = new URL(redisUrl)

    this.queue = new Queue('click-events', {
      connection: {
        host: url.hostname,
        port: parseInt(url.port),
        password: url.password,
        username: url.username,
        tls: isTLS ? {} : undefined
      }
    })
    console.log('📬 Click queue ready!')
  }

  async publish(event: any): Promise<void> {
    try {
      await this.queue.add('click', event)
      console.log(`📤 Click event queued: ${event.shortCode}`)
    } catch (err) {
      console.error('Queue error:', err)
    }
  }
}

export default new ClickQueue()