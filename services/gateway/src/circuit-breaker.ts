/**
 * Class with state (OPEN/CLOSED/HALF_OPEN)
 * DESIGN PATTERN: Circuit Breaker Pattern
 * Circuit breaker - service fails → block further calls
 * States:
 * CLOSED    → Normal, everything is working
 * OPEN      → Service is down, do not call
 * HALF_OPEN → Testing recovery
 */

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

interface CircuitStats {
  service: string
  state: CircuitState
  failures: number
  lastFailure: number | null
}

class CircuitBreaker {
  private state: CircuitState = 'CLOSED'
  private failures: number = 0
  private lastFailure: number | null = null
  private readonly serviceName: string
  private readonly threshold: number = 5      // 5 failures → OPEN
  private readonly timeout: number = 60000    // test again after 60 sec

  constructor(serviceName: string) {
    this.serviceName = serviceName
  }

  async call<T>(fn: () => Promise<T>): Promise<T> {

    // If OPEN, service recently failed
    if (this.state === 'OPEN') {
      const timePassed = Date.now() - (this.lastFailure || 0)

      // If cooldown passed, try a test request
      if (timePassed > this.timeout) {
        this.state = 'HALF_OPEN'
        console.log(`🟡 ${this.serviceName}: Testing...`)
      } else {
        // Keep circuit open
        throw new Error(`${this.serviceName} is DOWN`)
      }
    }

    try {
      const result = await fn()

      // Success - return to normal state
      if (this.state === 'HALF_OPEN') {
        console.log(`✅ ${this.serviceName}: Recovered!`)
      }
      this.failures = 0
      this.state = 'CLOSED'

      return result

    } catch (err) {
      this.failures++
      this.lastFailure = Date.now()

      console.log(
        `❌ ${this.serviceName} failed: ${this.failures}/${this.threshold}`
      )

      // Threshold crossed? Open the circuit
      if (this.failures >= this.threshold) {
        this.state = 'OPEN'
        console.log(`🔴 ${this.serviceName}: Circuit OPEN!`)
      }

      throw err
    }
  }

  getStats(): CircuitStats {
    return {
      service: this.serviceName,
      state: this.state,
      failures: this.failures,
      lastFailure: this.lastFailure
    }
  }
}

// Separate circuit breaker for each service
export const breakers = {
  urlService: new CircuitBreaker('URL Service'),
  redirectService: new CircuitBreaker('Redirect Service'),
  analyticsService: new CircuitBreaker('Analytics Service'),
  abuseService: new CircuitBreaker('Abuse Service')
}

export default CircuitBreaker