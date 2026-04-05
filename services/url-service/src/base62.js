const CHARS = 
  '0123456789' +          
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz' 



const encode = (num) => {
  let n = BigInt(num)
  let result = ''

  if (n === 0n) return '0'

  while (n > 0n) {
    const remainder = Number(n % 62n)
    result = CHARS[remainder] + result
    n = n / 62n
  }


  return result.padStart(7, '0')
}


const decode = (str) => {
  let result = 0n

  for (const char of str) {
    result = result * 62n + BigInt(CHARS.indexOf(char))
  }

  return result
}

module.exports = { encode, decode }