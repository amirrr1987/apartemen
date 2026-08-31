export type CostType = 'AREA' | 'EQUAL' | 'PERSON' | 'UNIT'
export type CostNature = 'CURRENT' | 'CAPITAL'
export type PartyRole = 'OWNER' | 'TENANT'
export type ParkingScope = 'ALL' | 'WITH_PARKING' | 'WITHOUT_PARKING'
export type TabId = 'home' | 'expenses' | 'payments' | 'report' | 'settings' | 'guide'

export interface Unit {
  id: number
  name: string
  area: number
  residents: number
  hasParking: boolean
  owner: string
  tenant: string
  currentPayer: PartyRole
  capitalPayer: PartyRole
  notes: string
}

export interface Expense {
  id: string
  category: string
  title: string
  amount: number
  type: CostType
  nature: CostNature
  period: string
  unitId?: number
  parkingScope: ParkingScope
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
  managerFee: number
  setupComplete: boolean
  expenseCategories: string[]
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
