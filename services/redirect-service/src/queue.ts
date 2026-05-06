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
        tls: isTLS ? {} : undefined,
        maxRetriesPerRequest: 1
      },
      defaultJobOptions: {
        removeOnComplete: true,   // Complete hone pe Redis se hatao — space bachao
        removeOnFail: 100,        // Sirf last 100 failed jobs rakho
        attempts: 2               // Max 2 retry — zyada retry = zyada Redis calls
      }
    })
    console.log('📬 Click queue ready!')
  }

  async publish(event: any): Promise<void> {
    try {
      await this.queue.add('click', event)
      console.log(`📤 Click event queued: ${event.shortCode}`)
    } catch (err) {
      // Queue fail? Silently skip — redirect nahi rukna chahiye
      console.error('⚠️ Queue error (skipping):', (err as Error).message)
    }
  }
}

export default new ClickQueue()