// src/bloom-filter.ts

/**
 * OOPS: Class — state hai (bit array)
 * 
 * Bloom Filter kya hai?
 * ─────────────────────
 * Ek smart data structure
 * Bolta hai: "Yeh IP blacklist mein HAI ya NAHI"
 * Bina actually DB query kiye!
 * 
 * Kaise kaam karta hai:
 * IP → 3 hash functions → 3 positions → check karo
 * 
 * Teeno 1 hain → "Shayad blacklist mein hai"
 * Koi 0 hai   → "Pakka nahi hai" ✅
 * 
 * Speed: O(1) — 0.001ms
 * Normal DB query: 5-10ms
 */

class BloomFilter {
  private bits: Uint8Array      // Bit array
  private size: number          // Array size
  private hashCount: number     // Kitne hash functions

  constructor(size: number = 100000, hashCount: number = 3) {
    this.size = size
    this.hashCount = hashCount
    this.bits = new Uint8Array(size)  // Sab 0 se shuru
  }

  // IP ko blacklist mein add karo
  add(ip: string): void {
    const positions = this.getPositions(ip)
    positions.forEach(pos => {
      this.bits[pos] = 1
    })
    console.log(`🚫 Bloom filter mein add: ${ip}`)
  }

  // IP blacklist mein hai?
  // Fast check — DB query nahi
  mightContain(ip: string): boolean {
    const positions = this.getPositions(ip)
    return positions.every(pos => this.bits[pos] === 1)
  }

  // 3 alag hash positions nikalo
  private getPositions(ip: string): number[] {
    return [
      this.hash(ip + 'salt1') % this.size,
      this.hash(ip + 'salt2') % this.size,
      this.hash(ip + 'salt3') % this.size
    ]
  }

  // Simple hash function
  private hash(str: string): number {
    let h: number = 0
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(31, h) + str.charCodeAt(i)
      h = h & h  // 32 bit convert
    }
    return Math.abs(h)
  }

  // Stats — demo ke liye
  getStats(): { size: number; bitsSet: number; fillRatio: string } {
    const bitsSet = this.bits.reduce((sum, bit) => sum + bit, 0)
    return {
      size: this.size,
      bitsSet,
      fillRatio: ((bitsSet / this.size) * 100).toFixed(2) + '%'
    }
  }
}

// Singleton — ek hi instance
export default new BloomFilter()