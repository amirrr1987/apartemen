import { addCommas, digitsEnToFa, digitsFaToEn, numberToWords } from '@persian-tools/persian-tools'

export function toFaDigits(value: string | number): string {
  return digitsEnToFa(String(value))
}

export function parseAmount(raw: string): number {
  const normalized = digitsFaToEn(raw)
    .replace(/[,٬\s]/g, '')
    .replace(/[^\d.]/g, '')
  const n = Number(normalized)
  return Number.isFinite(n) ? n : 0
}

export function formatToman(n: number): string {
  const rounded = Math.round(n)
  const formatted = digitsEnToFa(addCommas(String(Math.abs(rounded))))
  return rounded < 0 ? `−${formatted}` : formatted
}

export function formatMeter(n: number): string {
  return digitsEnToFa(n.toLocaleString('en-US', { maximumFractionDigits: 2 }))
}

export function formatPercent(n: number): string {
  return `${digitsEnToFa(n.toLocaleString('en-US', { maximumFractionDigits: 2 }))}٪`
}

export function amountInWords(n: number): string {
  const rounded = Math.round(Math.abs(n))
  if (rounded <= 0) return ''
  try {
    const words = numberToWords(rounded)
    return typeof words === 'string' && words ? `${words} تومان` : ''
  } catch {
    return ''
  }
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}
