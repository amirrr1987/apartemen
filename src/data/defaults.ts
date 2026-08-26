import { currentPeriod } from '../lib/jalali'
import type { AppState, CostNature, CostType, PartyRole, Unit } from '../types'

export const UNITS: Unit[] = [
  { id: 1, name: 'واحد ۱', area: 57.5, residents: 1, owner: '', tenant: '', currentPayer: 'TENANT', capitalPayer: 'OWNER', notes: '' },
  { id: 2, name: 'واحد ۲', area: 43.95, residents: 1, owner: '', tenant: '', currentPayer: 'TENANT', capitalPayer: 'OWNER', notes: '' },
  { id: 3, name: 'واحد ۳', area: 67.12, residents: 1, owner: '', tenant: '', currentPayer: 'TENANT', capitalPayer: 'OWNER', notes: '' },
  { id: 4, name: 'واحد ۴', area: 43.95, residents: 1, owner: '', tenant: '', currentPayer: 'TENANT', capitalPayer: 'OWNER', notes: '' },
  { id: 5, name: 'واحد ۵', area: 67.12, residents: 1, owner: '', tenant: '', currentPayer: 'TENANT', capitalPayer: 'OWNER', notes: '' },
  { id: 6, name: 'واحد ۶', area: 43.95, residents: 1, owner: '', tenant: '', currentPayer: 'TENANT', capitalPayer: 'OWNER', notes: '' },
]

export const TOTAL_AREA = UNITS.reduce((sum, unit) => sum + unit.area, 0)

export const COST_NATURES: { value: CostNature; label: string; hint: string }[] = [
  { value: 'CURRENT', label: 'جاری / مصرفی', hint: 'معمولاً بر عهده استفاده‌کننده یا مستأجر' },
  { value: 'CAPITAL', label: 'اساسی / عمرانی', hint: 'معمولاً بر عهده مالک' },
]

export const COST_TYPES: {
  value: CostType
  label: string
  hint: string
  examples: { title: string; nature: CostNature }[]
}[] = [
  {
    value: 'AREA',
    label: 'متراژی',
    hint: 'نسبت متراژ واحد به کل ساختمان',
    examples: [
      { title: 'گاز موتورخانه', nature: 'CURRENT' },
      { title: 'سرویس جزئی موتورخانه', nature: 'CURRENT' },
      { title: 'تعمیر اساسی موتورخانه', nature: 'CAPITAL' },
      { title: 'ایزوگام بام', nature: 'CAPITAL' },
      { title: 'تعمیرات اساسی', nature: 'CAPITAL' },
    ],
  },
  {
    value: 'EQUAL',
    label: 'مساوی',
    hint: 'تقسیم یکسان بین ۶ واحد',
    examples: [
      { title: 'نظافت مشاعات', nature: 'CURRENT' },
      { title: 'روشنایی مشاعات', nature: 'CURRENT' },
      { title: 'آسانسور', nature: 'CURRENT' },
      { title: 'امور اداری', nature: 'CURRENT' },
      { title: 'حق‌الزحمه مدیر', nature: 'CURRENT' },
    ],
  },
  {
    value: 'WATER',
    label: 'آب ترکیبی',
    hint: '۳۰٪ مساوی + ۷۰٪ نفری',
    examples: [{ title: 'آب مصرفی بدون کنتور', nature: 'CURRENT' }],
  },
  {
    value: 'PERSON',
    label: 'نفری',
    hint: 'بر اساس تعداد ساکنان',
    examples: [{ title: 'هزینه وابسته به نفرات', nature: 'CURRENT' }],
  },
  {
    value: 'UNIT',
    label: 'اختصاصی',
    hint: 'فقط همان واحد پرداخت می‌کند',
    examples: [
      { title: 'برق کولر برآوردی', nature: 'CURRENT' },
      { title: 'تعمیر کولر', nature: 'CURRENT' },
      { title: 'خسارت واحد', nature: 'CAPITAL' },
    ],
  },
  {
    value: 'METER',
    label: 'کنتور',
    hint: 'بر اساس عدد کنتور هر واحد',
    examples: [
      { title: 'کنتور فرعی کولر', nature: 'CURRENT' },
      { title: 'کنتور آب مستقل', nature: 'CURRENT' },
    ],
  },
]

const CAPITAL_KEYS = ['اساسی', 'ایزوگام', 'نما', 'رایزر', 'تعویض لوله', 'تعویض دیگ', 'عمرانی']

export function inferNature(title: string, type: CostType): CostNature {
  if (CAPITAL_KEYS.some((key) => title.includes(key))) return 'CAPITAL'
  if (type === 'WATER' || type === 'EQUAL' || type === 'PERSON' || type === 'METER') return 'CURRENT'
  return 'CURRENT'
}

export function natureLabel(nature: CostNature): string {
  return nature === 'CAPITAL' ? 'اساسی' : 'جاری'
}

export function partyLabel(party: PartyRole): string {
  return party === 'OWNER' ? 'مالک' : 'مستأجر'
}

export function hasTenant(unit: Pick<Unit, 'tenant'>): boolean {
  return unit.tenant.trim().length > 0
}

export function occupantLabel(unit: Pick<Unit, 'owner' | 'tenant'>): string {
  if (hasTenant(unit)) return unit.tenant.trim() ? `مستأجر: ${unit.tenant}` : 'مستأجر'
  if (unit.owner.trim()) return `مالک: ${unit.owner}`
  return 'مالک‌نشین'
}

export function payerFor(unit: Unit, nature: CostNature): PartyRole {
  if (!hasTenant(unit)) return 'OWNER'
  return nature === 'CURRENT' ? unit.currentPayer : unit.capitalPayer
}

export function partyName(unit: Unit, party: PartyRole): string {
  if (party === 'TENANT') return unit.tenant.trim() || 'مستأجر'
  return unit.owner.trim() || 'مالک'
}

export function createDefaultState(): AppState {
  return {
    units: UNITS.map((unit) => ({ ...unit })),
    expenses: [],
    payments: [],
    settings: {
      buildingName: 'ساختمان',
      waterEqualPercent: 30,
      waterPersonPercent: 70,
      managerFee: 0,
    },
    currentPeriod: currentPeriod(),
  }
}
