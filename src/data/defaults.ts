import { currentPeriod } from '../lib/jalali'
import type { AppState, CostNature, CostType, ParkingScope, PartyRole, Unit } from '../types'

export const COST_NATURES: { value: CostNature; label: string; hint: string }[] = [
  { value: 'CURRENT', label: 'جاری / مصرفی', hint: 'معمولاً بر عهده استفاده‌کننده یا مستأجر' },
  { value: 'CAPITAL', label: 'اساسی / عمرانی', hint: 'معمولاً بر عهده مالک' },
]

export const COST_TYPES: { value: CostType; label: string; hint: string }[] = [
  { value: 'AREA', label: 'متراژی', hint: 'نسبت متراژ اختصاصی واحد به کل (اصل ماده ۴)' },
  { value: 'EQUAL', label: 'مساوی', hint: 'تقسیم یکسان بین واحدهای مشمول' },
  { value: 'PERSON', label: 'نفری', hint: 'بر اساس تعداد ساکنان دائم' },
  { value: 'UNIT', label: 'اختصاصی', hint: 'فقط همان واحد پرداخت می‌کند' },
]

export const PARKING_SCOPES: { value: ParkingScope; label: string; hint: string }[] = [
  { value: 'ALL', label: 'همه واحدها', hint: 'همه واحدها در تقسیم شرکت می‌کنند' },
  {
    value: 'WITH_PARKING',
    label: 'فقط دارای پارکینگ',
    hint: 'مطابق حق استفاده از پارکینگ (ماده ۴ — سهم متناسب)',
  },
  { value: 'WITHOUT_PARKING', label: 'فقط بدون پارکینگ', hint: 'واحدهایی که حق پارکینگ ندارند' },
]

export interface ExpenseCatalogItem {
  title: string
  type: CostType
  nature: CostNature
  parkingScope?: ParkingScope
}

export interface ExpenseCategoryGroup {
  label: string
  items: ExpenseCatalogItem[]
}

export const EXPENSE_CATALOG: ExpenseCategoryGroup[] = [
  {
    label: 'موتورخانه',
    items: [
      { title: 'گاز موتورخانه', type: 'AREA', nature: 'CURRENT' },
      { title: 'سرویس موتورخانه', type: 'AREA', nature: 'CURRENT' },
      { title: 'تعمیر اساسی موتورخانه', type: 'AREA', nature: 'CAPITAL' },
    ],
  },
  {
    label: 'بام و نما',
    items: [
      { title: 'ایزوگام بام', type: 'AREA', nature: 'CAPITAL' },
      { title: 'نم‌زدایی', type: 'AREA', nature: 'CAPITAL' },
      { title: 'روشنایی پشت‌بام', type: 'EQUAL', nature: 'CURRENT' },
    ],
  },
  {
    label: 'مشاعات',
    items: [
      { title: 'نظافت مشاعات', type: 'EQUAL', nature: 'CURRENT' },
      { title: 'روشنایی راه‌پله', type: 'EQUAL', nature: 'CURRENT' },
      { title: 'شست‌وشوی راه‌پله', type: 'EQUAL', nature: 'CURRENT' },
    ],
  },
  {
    label: 'آسانسور',
    items: [
      { title: 'سرویس آسانسور', type: 'EQUAL', nature: 'CURRENT' },
      { title: 'تعمیر آسانسور', type: 'EQUAL', nature: 'CAPITAL' },
    ],
  },
  {
    label: 'پارکینگ',
    items: [
      { title: 'نگهداری پارکینگ', type: 'EQUAL', nature: 'CURRENT', parkingScope: 'WITH_PARKING' },
      { title: 'روشنایی پارکینگ', type: 'EQUAL', nature: 'CURRENT', parkingScope: 'WITH_PARKING' },
      { title: 'نظافت پارکینگ', type: 'EQUAL', nature: 'CURRENT', parkingScope: 'WITH_PARKING' },
    ],
  },
  {
    label: 'آب و فاضلاب',
    items: [
      { title: 'آب مصرفی مشترک', type: 'PERSON', nature: 'CURRENT' },
      { title: 'تصفیه فاضلاب', type: 'AREA', nature: 'CURRENT' },
    ],
  },
  {
    label: 'برق و گاز',
    items: [
      { title: 'برق مشاعات', type: 'EQUAL', nature: 'CURRENT' },
      { title: 'گاز مشاعات', type: 'AREA', nature: 'CURRENT' },
    ],
  },
  {
    label: 'نظافت',
    items: [
      { title: 'نظافت ماهانه', type: 'EQUAL', nature: 'CURRENT' },
      { title: 'مواد شوینده', type: 'EQUAL', nature: 'CURRENT' },
    ],
  },
  {
    label: 'نگهبانی',
    items: [
      { title: 'حقوق نگهبان', type: 'EQUAL', nature: 'CURRENT' },
      { title: 'بیمه نگهبان', type: 'EQUAL', nature: 'CURRENT' },
    ],
  },
  {
    label: 'حق‌الزحمه',
    items: [{ title: 'حق‌الزحمه مدیر', type: 'EQUAL', nature: 'CURRENT' }],
  },
  {
    label: 'امور اداری',
    items: [
      { title: 'هزینه‌های اداری', type: 'EQUAL', nature: 'CURRENT' },
      { title: 'تمبر و مالیات', type: 'EQUAL', nature: 'CURRENT' },
    ],
  },
  {
    label: 'تعمیرات اساسی',
    items: [
      { title: 'تعمیرات اساسی ساختمان', type: 'AREA', nature: 'CAPITAL' },
      { title: 'تعویض لوله‌کشی', type: 'AREA', nature: 'CAPITAL' },
    ],
  },
  {
    label: 'کولر و سرمایش',
    items: [
      { title: 'تعمیر کولر واحد', type: 'UNIT', nature: 'CURRENT' },
      { title: 'سرویس کولر آبی', type: 'UNIT', nature: 'CURRENT' },
    ],
  },
  {
    label: 'سایر',
    items: [{ title: 'سایر هزینه‌ها', type: 'EQUAL', nature: 'CURRENT' }],
  },
]

export const DEFAULT_EXPENSE_CATEGORIES = EXPENSE_CATALOG.map((group) => group.label)

const CAPITAL_KEYS = ['اساسی', 'ایزوگام', 'نما', 'رایزر', 'تعویض لوله', 'تعویض دیگ', 'عمرانی']

export function catalogCategoryLabels(extra: string[] = []): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const label of [...DEFAULT_EXPENSE_CATEGORIES, ...extra]) {
    const trimmed = label.trim()
    if (!trimmed || seen.has(trimmed)) continue
    seen.add(trimmed)
    result.push(trimmed)
  }
  return result
}

export function inferCategory(title: string): string {
  for (const group of EXPENSE_CATALOG) {
    if (group.items.some((item) => item.title === title)) return group.label
  }
  for (const group of EXPENSE_CATALOG) {
    if (group.items.some((item) => title.includes(item.title) || item.title.includes(title))) {
      return group.label
    }
  }
  return 'سایر'
}

export function catalogItemsForCategory(category: string): ExpenseCatalogItem[] {
  return EXPENSE_CATALOG.find((group) => group.label === category)?.items ?? []
}

export function inferNature(title: string, type: CostType): CostNature {
  if (CAPITAL_KEYS.some((key) => title.includes(key))) return 'CAPITAL'
  if (type === 'EQUAL' || type === 'PERSON') return 'CURRENT'
  return 'CURRENT'
}

export function inferParkingScope(title: string): ParkingScope {
  if (/پارکینگ|پارک\b|موتور\s*سیکلت|موتورسیکلت/i.test(title)) return 'WITH_PARKING'
  return 'ALL'
}

export function natureLabel(nature: CostNature): string {
  return nature === 'CAPITAL' ? 'اساسی' : 'جاری'
}

export function parkingScopeLabel(scope: ParkingScope): string {
  return PARKING_SCOPES.find((item) => item.value === scope)?.label ?? scope
}

export function partyLabel(party: PartyRole): string {
  return party === 'OWNER' ? 'مالک' : 'مستأجر'
}

export function hasTenant(unit: Pick<Unit, 'tenant'>): boolean {
  return unit.tenant.trim().length > 0
}

export function parkingLabel(unit: Pick<Unit, 'hasParking'>): string {
  return unit.hasParking ? 'دارای پارکینگ' : 'بدون پارکینگ'
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

export function createEmptyUnit(id: number, name?: string): Unit {
  return {
    id,
    name: name ?? `واحد ${id.toLocaleString('fa-IR')}`,
    area: 0,
    residents: 1,
    hasParking: false,
    owner: '',
    tenant: '',
    currentPayer: 'TENANT',
    capitalPayer: 'OWNER',
    notes: '',
  }
}

export function createDefaultState(): AppState {
  return {
    units: [],
    expenses: [],
    payments: [],
    settings: {
      buildingName: '',
      managerFee: 0,
      setupComplete: false,
      expenseCategories: [],
    },
    currentPeriod: currentPeriod(),
  }
}
