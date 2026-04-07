class SnowflakeGenerator {
  private machineId: number
  private sequence: number
  private lastTimestamp: number

  constructor(machineId: number = 1) {
    this.machineId = machineId
    this.sequence = 0
    this.lastTimestamp = -1
  }

  generate(): bigint {
    let now: number = Date.now()

    if (now === this.lastTimestamp) {
      this.sequence++

      if (this.sequence > 999) {
        while (now <= this.lastTimestamp) {
          now = Date.now()
        }
        this.sequence = 0
      }
    } else {
      this.sequence = 0
    }

    this.lastTimestamp = now

    const id: bigint =
      BigInt(now) * 100000n +
      BigInt(this.machineId) * 1000n +
      BigInt(this.sequence)

    return id
  }
}

export default new SnowflakeGenerator(1)