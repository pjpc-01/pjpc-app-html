// NFC/UID 标准化与匹配工具

export interface UIDVariants {
  original: string
  cleanHex?: string
  cleanHexLower?: string
  cleanHexNoSep?: string
  cleanHexNoSepLower?: string
  first4Hex?: string
  first4HexSep?: string
  first4Dec?: string
  first4DecPadded10?: string
  first4HexRev?: string
  first4HexRevSep?: string
  first4DecRev?: string
  first4DecRevPadded10?: string
  numeric?: string
}

// 归一化：去冒号、空格，大写
export function normalizeHexUid(input: string): string {
  return input.replace(/[^0-9A-Fa-f]/g, '').toUpperCase()
}

// 生成匹配用的多种变体
export function generateIdentifierVariants(input: string): UIDVariants & { all: string[] } {
  const trimmed = input.trim()
  const isDigits = /^\d+$/.test(trimmed)

  const variants: UIDVariants = { original: trimmed }

  try {
    // 如果是十进制（常见：前4字节的10位十进制）
    if (isDigits) {
      variants.numeric = trimmed

      // 尝试把十进制当作4字节/7字节HEX
      const hex = BigInt(trimmed).toString(16).toUpperCase()
      const hexSep = hex.match(/.{1,2}/g)?.join(':') || hex

      // 如果是4字节（8个hex），生成大小端两种
      if (hex.length === 8) {
        const first4Hex = hex
        variants.first4Hex = first4Hex
        variants.first4HexSep = hexSep
        variants.first4Dec = BigInt('0x' + first4Hex).toString()
        variants.first4DecPadded10 = variants.first4Dec.padStart(10, '0')

        const rev = (first4Hex.match(/.{1,2}/g) || []).reverse().join('')
        variants.first4HexRev = rev
        variants.first4HexRevSep = (rev.match(/.{1,2}/g) || []).join(':')
        variants.first4DecRev = BigInt('0x' + rev).toString()
        variants.first4DecRevPadded10 = variants.first4DecRev.padStart(10, '0')
      } else {
        // 可能是完整UID十进制（较长），保存其HEX形式
        const cleanHex = hex
        variants.cleanHex = hexSep
        variants.cleanHexNoSep = cleanHex
        variants.cleanHexLower = hexSep.toLowerCase()
        variants.cleanHexNoSepLower = cleanHex.toLowerCase()
      }
    } else {
      // 假定是HEX（带或不带冒号）
      const cleanHexNoSep = normalizeHexUid(trimmed)
      variants.cleanHexNoSep = cleanHexNoSep
      variants.cleanHexNoSepLower = cleanHexNoSep.toLowerCase()
      variants.cleanHex = (cleanHexNoSep.match(/.{1,2}/g) || []).join(':')
      variants.cleanHexLower = variants.cleanHex.toLowerCase()

      // 前4字节
      if (cleanHexNoSep.length >= 8) {
        const first4 = cleanHexNoSep.slice(0, 8)
        variants.first4Hex = first4
        variants.first4HexSep = (first4.match(/.{1,2}/g) || []).join(':')
        variants.first4Dec = BigInt('0x' + first4).toString()
        variants.first4DecPadded10 = variants.first4Dec.padStart(10, '0')

        const rev = (first4.match(/.{1,2}/g) || []).reverse().join('')
        variants.first4HexRev = rev
        variants.first4HexRevSep = (rev.match(/.{1,2}/g) || []).join(':')
        variants.first4DecRev = BigInt('0x' + rev).toString()
        variants.first4DecRevPadded10 = variants.first4DecRev.padStart(10, '0')
      }
    }
  } catch {
    // 忽略解析错误，尽力返回部分变体
  }

  const all = Array.from(new Set([
    variants.original,
    variants.cleanHex,
    variants.cleanHexLower,
    variants.cleanHexNoSep,
    variants.cleanHexNoSepLower,
    variants.first4Hex,
    variants.first4HexSep,
    variants.first4Dec,
    variants.first4DecPadded10,
    variants.first4HexRev,
    variants.first4HexRevSep,
    variants.first4DecRev,
    variants.first4DecRevPadded10,
    variants.numeric
  ].filter(Boolean) as string[]))

  return { ...variants, all }
}

// 判断两段标识是否等价（考虑补零与大小端）
export function isEquivalentIdentifier(a: string, b: string): boolean {
  const va = generateIdentifierVariants(a)
  const vb = generateIdentifierVariants(b)
  const setB = new Set(vb.all)
  return va.all.some(v => setB.has(v))
}


