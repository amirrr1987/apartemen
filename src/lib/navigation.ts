import type { RouteRecordNameGeneric } from 'vue-router'

export interface NavItem {
  to: string
  name: string
  icon: string
  iconActive: string
  label: string
  description?: string
}

/** کارهای روزانه — منوی پایین (حداکثر ۵ آیتم) */
export const primaryNav: NavItem[] = [
  { to: '/', name: 'home', icon: 'house', iconActive: 'house-fill', label: 'خانه' },
  { to: '/expenses', name: 'expenses', icon: 'receipt', iconActive: 'receipt', label: 'هزینه‌ها' },
  { to: '/payments', name: 'payments', icon: 'wallet2', iconActive: 'wallet-fill', label: 'پرداخت‌ها' },
  { to: '/report', name: 'report', icon: 'bar-chart', iconActive: 'bar-chart-fill', label: 'گزارش' },
]

/** صفحات ثانویه — drawer همبرگری */
export const drawerNav: NavItem[] = [
  {
    to: '/units',
    name: 'units',
    icon: 'buildings',
    iconActive: 'buildings-fill',
    label: 'واحدها',
    description: 'لیست واحدها، ساکنان و مهمان همان ماه',
  },
  {
    to: '/settings',
    name: 'settings',
    icon: 'gear',
    iconActive: 'gear-fill',
    label: 'تنظیمات',
    description: 'ساختمان، پشتیبان‌گیری و دسته‌بندی',
  },
  {
    to: '/guide',
    name: 'guide',
    icon: 'question-circle',
    iconActive: 'question-circle-fill',
    label: 'راهنما',
    description: 'قوانین شارژ و نحوه استفاده',
  },
]

export function isNavActive(routeName: RouteRecordNameGeneric | null | undefined, name: string): boolean {
  const current = String(routeName ?? '')
  if (name === 'home') return current === 'home'
  if (name === 'expenses') return current.startsWith('expense')
  if (name === 'payments') return current === 'payments' || current === 'unit'
  if (name === 'report') return current === 'report'
  if (name === 'units') return current === 'units' || current === 'unit'
  return current === name
}

export function isDrawerNavActive(routeName: RouteRecordNameGeneric | null | undefined): boolean {
  return drawerNav.some((item) => isNavActive(routeName, item.name))
}
