export type CostType = 'AREA' | 'EQUAL' | 'PERSON' | 'WATER' | 'UNIT' | 'METER'
export type CostNature = 'CURRENT' | 'CAPITAL'
export type PartyRole = 'OWNER' | 'TENANT'
export type TabId = 'home' | 'expenses' | 'payments' | 'report' | 'settings' | 'guide'

export interface Unit {
  id: number
  name: string
  area: number
  residents: number
  owner: string
  tenant: string
  currentPayer: PartyRole
  capitalPayer: PartyRole
  notes: string
}

export interface Expense {
  id: string
  title: string
  amount: number
  type: CostType
  nature: CostNature
  period: string
  unitId?: number
  meters?: Record<number, number>
  notes: string
  createdAt: string
}

export interface Payment {
  id: string
  unitId: number
  period: string
  amount: number
  party?: PartyRole
  createdAt: string
}

export interface Settings {
  buildingName: string
  waterEqualPercent: number
  waterPersonPercent: number
  managerFee: number
}

export interface AppState {
  units: Unit[]
  expenses: Expense[]
  payments: Payment[]
  settings: Settings
  currentPeriod: string
}

export interface UnitMonthSummary {
  unit: Unit
  areaShare: number
  charge: number
  currentCharge: number
  capitalCharge: number
  ownerCharge: number
  tenantCharge: number
  paid: number
  ownerPaid: number
  tenantPaid: number
  remaining: number
  ownerRemaining: number
  tenantRemaining: number
  breakdown: { expense: Expense; share: number; payer: PartyRole }[]
}
