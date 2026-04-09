

const CHARS: string =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'


export const encode = (num: bigint): string => {
  let n: bigint = num
  let result: string = ''

  if (n === 0n) return '0'

  while (n > 0n) {
    const remainder: number = Number(n % 62n)
    result = CHARS[remainder] + result
    n = n / 62n
  }

  return result.padStart(7, '0')
}

// short string → bigint wapas
export const decode = (str: string): bigint => {
  let result: bigint = 0n

  for (const char of str) {
    result = result * 62n + BigInt(CHARS.indexOf(char))
  }

  return result
}