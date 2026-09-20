import { addMonths, format, getDaysInMonth, getMonth, getYear, setMonth, setYear, startOfMonth } from 'date-fns-jalali'

export function parsePeriod(period: string): { year: number; month: number } {
  const [year = 1400, month = 1] = period.split('-').map(Number)
  return { year, month }
}

export function toPeriod(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

export function periodToDate(period: string): Date {
  const { year, month } = parsePeriod(period)
  return startOfMonth(setMonth(setYear(new Date(), year), month - 1))
}

export function currentPeriod(): string {
  const now = new Date()
  return toPeriod(getYear(now), getMonth(now) + 1)
}

export function periodLabel(period: string): string {
  return format(periodToDate(period), 'MMMM yyyy')
}

export function daysInPeriod(period: string): number {
  return Math.max(1, getDaysInMonth(periodToDate(period)))
}

export function shiftPeriod(period: string, delta: number): string {
  const next = addMonths(periodToDate(period), delta)
  return toPeriod(getYear(next), getMonth(next) + 1)
}

export function formatFaDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return format(date, 'd MMMM yyyy')
}
