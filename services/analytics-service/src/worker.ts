import { Worker, Job } from 'bullmq'
import db from './db'
import counter from './counter'
import { enrichEvent, RawClickEvent, EnrichedClickEvent } from './event-enricher'

class AnalyticsWorker {
  private worker: Worker
  private batch: EnrichedClickEvent[] = []
  private readonly BATCH_SIZE: number = 50

  constructor() {
    const redisUrl = process.env.REDIS_URL!
    const url = new URL(redisUrl)
    const isTLS = redisUrl.startsWith('rediss://')

    this.worker = new Worker(
      'click-events',
      async (job: Job) => { await this.processJob(job) },
      {
        connection: {
          host: url.hostname,
          port: parseInt(url.port),
          password: url.password,
          username: url.username,
          tls: isTLS ? {} : undefined
        }
      }
    )

    this.setupEvents()
    this.startBatchFlush()
    console.log('👂 Analytics Worker sun raha hai...')
  }

  private async processJob(job: Job): Promise<void> {
    const rawEvent = job.data as RawClickEvent
    console.log(`📥 Event mila: ${rawEvent.shortCode} (IP: ${rawEvent.ip})`)

    // enrichEvent ab async hai (API call for geo lookup)
    const enriched = await enrichEvent(rawEvent)

    console.log(`🌍 Geo: ${enriched.country} / ${enriched.city} | 📱 ${enriched.device} | 🌐 ${enriched.browser}`)

    await counter.increment(rawEvent.shortCode)
    this.batch.push(enriched)

    if (this.batch.length >= this.BATCH_SIZE) {
      await this.flushBatch()
    }
  }

  private async flushBatch(): Promise<void> {
    if (this.batch.length === 0) return
    const toSave = [...this.batch]
    this.batch = []
    console.log(`💾 ${toSave.length} events save ho rahe hain...`)
    try {
      const values = toSave.map((e, i) => {
        const base = i * 8
        return `($${base+1},$${base+2},$${base+3},$${base+4},$${base+5},$${base+6},$${base+7},$${base+8})`
      }).join(', ')

      const params = toSave.flatMap(e => [
        e.shortCode, e.ip, e.country, e.city,
        e.device, e.browser, e.referer,
        new Date(e.timestamp)
      ])

      await db.query(
        `INSERT INTO click_events
         (short_code, ip, country, city, device, browser, referer, created_at)
         VALUES ${values}`,
        params
      )
      console.log(`✅ ${toSave.length} events saved!`)
    } catch (err) {
      console.error('Batch save error:', err)
      // Failed events wapas batch mein daalo — retry ho jayega
      this.batch = [...toSave, ...this.batch]
    }
  }

  private startBatchFlush(): void {
    setInterval(async () => {
      if (this.batch.length > 0) {
        console.log(`⏰ Time-based flush: ${this.batch.length} events`)
        await this.flushBatch()
      }
    }, 10000) // 10 sec
  }

  private setupEvents(): void {
    this.worker.on('completed', (job: Job) => console.log(`✅ Job complete: ${job.id}`))
    this.worker.on('failed', (job: Job | undefined, err: Error) => console.error(`❌ Job failed: ${job?.id}`, err.message))
  }
}

export default new AnalyticsWorker()