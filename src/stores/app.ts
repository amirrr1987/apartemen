import { computed, reactive, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useDebounceFn } from '@vueuse/core'
import { monthSummaries, monthTotals, splitExpense } from '../lib/calc'
import { createDefaultState, createEmptyUnit, catalogCategoryLabels, hasTenant, inferCategory, inferNature, inferParkingScope, partyLabel, parkingLabel } from '../data/defaults'
import { isDbConfigured, loadAppState, saveAppState } from '../lib/db'
import { newId } from '../lib/format'
import { currentPeriod } from '../lib/jalali'
import type { AppState, CostNature, CostType, Expense, ParkingScope, PartyRole, Unit } from '../types'

const STORAGE_KEY = 'aparteman-v2'

function migrateCostType(type: string): CostType {
  if (type === 'WATER') return 'PERSON'
  if (type === 'METER') return 'UNIT'
  return type as CostType
}

function normalizeUnit(unit: Partial<Unit>): Unit {
  const id = Number(unit.id) || 1
  return {
    ...createEmptyUnit(id, unit.name),
    ...unit,
    id,
    tenant: unit.tenant ?? '',
    hasParking: unit.hasParking ?? false,
    currentPayer: unit.currentPayer ?? 'TENANT',
    capitalPayer: unit.capitalPayer ?? 'OWNER',
  }
}

function normalizeExpense(expense: Partial<Expense> & Pick<Expense, 'id' | 'title' | 'amount' | 'period' | 'createdAt'>): Expense {
  const type = migrateCostType(String(expense.type ?? 'AREA'))
  return {
    id: expense.id,
    category: expense.category?.trim() || inferCategory(expense.title),
    title: expense.title,
    amount: expense.amount,
    type,
    nature: expense.nature ?? inferNature(expense.title, type),
    period: expense.period,
    unitId: expense.unitId,
    parkingScope: expense.parkingScope ?? inferParkingScope(expense.title),
    notes: expense.notes ?? '',
    createdAt: expense.createdAt,
  }
}

function normalizeState(parsed: Partial<AppState>): AppState {
  const fallback = createDefaultState()
  const legacySettings = parsed.settings as Partial<AppState['settings']> & {
    waterEqualPercent?: number
  }
  const setupComplete =
    parsed.settings?.setupComplete ??
    Boolean(parsed.units?.length && legacySettings?.buildingName && legacySettings.buildingName !== 'ساختمان')

  return {
    ...fallback,
    ...parsed,
    units: (parsed.units ?? []).map((unit) => normalizeUnit(unit)),
    expenses: (parsed.expenses ?? []).map((expense) => normalizeExpense(expense as Expense)),
    payments: parsed.payments ?? [],
    settings: {
      buildingName: parsed.settings?.buildingName ?? fallback.settings.buildingName,
      managerFee: parsed.settings?.managerFee ?? fallback.settings.managerFee,
      setupComplete,
      expenseCategories: parsed.settings?.expenseCategories ?? fallback.settings.expenseCategories,
    },
    currentPeriod: parsed.currentPeriod || currentPeriod(),
  }
}

function loadLocalState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createDefaultState()
    return normalizeState(JSON.parse(raw) as Partial<AppState>)
  } catch {
    return createDefaultState()
  }
}

function saveLocalState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export const useAppStore = defineStore('app', () => {
  const ready = ref(false)
  const syncing = ref(false)
  const dbError = ref<string | null>(null)
  const state = reactive(loadLocalState()) as AppState

  const persistLocal = useDebounceFn(() => {
    saveLocalState(JSON.parse(JSON.stringify(state)) as AppState)
  }, 300)

  const persistRemote = useDebounceFn(async () => {
    if (!isDbConfigured()) return
    syncing.value = true
    dbError.value = null
    try {
      await saveAppState(JSON.parse(JSON.stringify(state)) as AppState)
    } catch (error) {
      dbError.value = error instanceof Error ? error.message : 'خطا در ذخیره در پایگاه داده'
    } finally {
      syncing.value = false
    }
  }, 800)

  async function init() {
    if (!isDbConfigured()) {
      ready.value = true
      return
    }

    try {
      const remote = await loadAppState()
      if (remote) {
        applyState(remote)
      } else {
        const local = loadLocalState()
        const hasLocalData =
          local.settings.setupComplete ||
          local.expenses.length > 0 ||
          local.payments.length > 0 ||
          local.units.length > 0
        await saveAppState(hasLocalData ? local : createDefaultState())
        if (hasLocalData) applyState(local)
      }
      dbError.value = null
    } catch (error) {
      dbError.value = error instanceof Error ? error.message : 'خطا در بارگذاری از پایگاه داده'
    } finally {
      ready.value = true
    }
  }

  function applyState(next: AppState) {
    const normalized = normalizeState(next)
    state.units = normalized.units
    state.expenses = normalized.expenses
    state.payments = normalized.payments
    state.settings = normalized.settings
    state.currentPeriod = normalized.currentPeriod
  }

  watch(
    state,
    () => {
      void persistLocal()
      void persistRemote()
    },
    { deep: true },
  )

  const summaries = computed(() => monthSummaries(state))
  const totals = computed(() => monthTotals(summaries.value))
  const periodExpenses = computed(() =>
    state.expenses
      .filter((expense) => expense.period === state.currentPeriod)
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  )
  const periodPayments = computed(() =>
    state.payments
      .filter((payment) => payment.period === state.currentPeriod)
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  )

  const needsSetup = computed(() => !state.settings.setupComplete)

  function completeSetup(input: {
    buildingName: string
    units: Unit[]
    managerFee?: number
  }) {
    state.settings.buildingName = input.buildingName.trim()
    state.settings.managerFee = Math.round(input.managerFee ?? 0)
    state.settings.setupComplete = true
    state.units = input.units.map((unit) => normalizeUnit(unit))
  }

  function addUnit() {
    const id = state.units.reduce((max, unit) => Math.max(max, unit.id), 0) + 1
    state.units.push(createEmptyUnit(id))
    return id
  }

  function removeUnit(id: number) {
    if (state.units.length <= 1) return false
    state.units = state.units.filter((unit) => unit.id !== id)
    state.expenses = state.expenses.filter((expense) => expense.unitId !== id)
    state.payments = state.payments.filter((payment) => payment.unitId !== id)
    return true
  }

  const expenseCategories = computed(() =>
    catalogCategoryLabels([
      ...state.settings.expenseCategories,
      ...state.expenses.map((expense) => expense.category),
    ]),
  )

  function rememberCategory(category: string) {
    const trimmed = category.trim()
    if (!trimmed || state.settings.expenseCategories.includes(trimmed)) return
    if (catalogCategoryLabels().includes(trimmed)) return
    state.settings.expenseCategories.push(trimmed)
  }

  function setPeriod(period: string) {
    state.currentPeriod = period
  }

  function addExpense(input: {
    category: string
    title: string
    amount: number
    type: CostType
    nature: CostNature
    unitId?: number
    parkingScope?: ParkingScope
    notes?: string
  }): Expense {
    const category = input.category.trim() || inferCategory(input.title)
    rememberCategory(category)
    const expense: Expense = {
      id: newId(),
      category,
      title: input.title.trim(),
      amount: Math.round(input.amount),
      type: input.type,
      nature: input.nature,
      period: state.currentPeriod,
      unitId: input.unitId,
      parkingScope: input.parkingScope ?? (input.type === 'UNIT' ? 'ALL' : inferParkingScope(input.title)),
      notes: input.notes?.trim() ?? '',
      createdAt: new Date().toISOString(),
    }
    state.expenses.push(expense)
    return expense
  }

  function updateExpense(
    id: string,
    input: {
      category: string
      title: string
      amount: number
      type: CostType
      nature: CostNature
      unitId?: number
      parkingScope?: ParkingScope
      notes?: string
    },
  ) {
    const expense = state.expenses.find((item) => item.id === id)
    if (!expense) return
    const category = input.category.trim() || inferCategory(input.title)
    rememberCategory(category)
    expense.category = category
    expense.title = input.title.trim()
    expense.amount = Math.round(input.amount)
    expense.type = input.type
    expense.nature = input.nature
    expense.unitId = input.type === 'UNIT' ? input.unitId : undefined
    expense.parkingScope =
      input.type === 'UNIT' ? 'ALL' : (input.parkingScope ?? inferParkingScope(expense.title))
    expense.notes = input.notes?.trim() ?? ''
  }

  function removeExpense(id: string) {
    state.expenses = state.expenses.filter((expense) => expense.id !== id)
  }

  function previewSplit(expense: Pick<Expense, 'amount' | 'type' | 'unitId' | 'parkingScope' | 'nature' | 'category' | 'title'>) {
    return splitExpense(
      {
        id: 'preview',
        category: expense.category ?? inferCategory(expense.title ?? ''),
        title: expense.title ?? '',
        amount: expense.amount,
        type: expense.type,
        nature: expense.nature,
        period: state.currentPeriod,
        unitId: expense.unitId,
        parkingScope: expense.parkingScope ?? 'ALL',
        notes: '',
        createdAt: '',
      },
      state.units,
    )
  }

  function unitPayments(unitId: number) {
    return state.payments
      .filter((payment) => payment.unitId === unitId && payment.period === state.currentPeriod)
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  function addPayment(input: { unitId: number; amount: number; party?: PartyRole }) {
    const amount = Math.round(input.amount)
    if (amount <= 0) return
    state.payments.push({
      id: newId(),
      unitId: input.unitId,
      period: state.currentPeriod,
      amount,
      party: input.party,
      createdAt: new Date().toISOString(),
    })
  }

  function updatePayment(id: string, input: { amount: number; party?: PartyRole }) {
    const payment = state.payments.find((item) => item.id === id)
    if (!payment) return
    payment.amount = Math.round(input.amount)
    payment.party = input.party
  }

  function removePayment(id: string) {
    state.payments = state.payments.filter((payment) => payment.id !== id)
  }

  function markPaid(unitId: number, party?: PartyRole) {
    const row = summaries.value.find((item) => item.unit.id === unitId)
    if (!row) return
    if (party) {
      const remaining = party === 'OWNER' ? row.ownerRemaining : row.tenantRemaining
      if (remaining > 0) addPayment({ unitId, amount: remaining, party })
      return
    }
    const ownerRemaining = row.ownerRemaining
    const tenantRemaining = row.tenantRemaining
    const remaining = row.remaining
    if (ownerRemaining > 0) addPayment({ unitId, amount: ownerRemaining, party: 'OWNER' })
    if (tenantRemaining > 0) addPayment({ unitId, amount: tenantRemaining, party: 'TENANT' })
    if (ownerRemaining <= 0 && tenantRemaining <= 0 && remaining > 0) {
      addPayment({ unitId, amount: remaining })
    }
  }

  function markUnpaid(unitId: number, party?: PartyRole) {
    state.payments = state.payments.filter(
      (payment) =>
        !(
          payment.unitId === unitId &&
          payment.period === state.currentPeriod &&
          (party ? payment.party === party || payment.party == null : true)
        ),
    )
  }

  function addManagerFee() {
    const amount = Math.round(state.settings.managerFee)
    if (amount <= 0) return false
    const exists = state.expenses.some(
      (expense) =>
        expense.period === state.currentPeriod &&
        expense.type === 'EQUAL' &&
        expense.title.includes('حق‌الزحمه مدیر'),
    )
    if (exists) return false
    addExpense({
      category: 'حق‌الزحمه',
      title: 'حق‌الزحمه مدیر',
      amount,
      type: 'EQUAL',
      nature: 'CURRENT',
      notes: 'ثبت‌شده از تنظیمات؛ پرداخت فقط با تصویب مجمع معتبر است.',
    })
    return true
  }

  function exportBackup(): string {
    return JSON.stringify(state, null, 2)
  }

  function importBackup(raw: string) {
    applyState(normalizeState(JSON.parse(raw) as Partial<AppState>))
  }

  function resetAll() {
    applyState(createDefaultState())
  }

  function csvCell(value: string | number): string {
    const text = String(value)
    return /["\n,]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }

  function downloadCsv() {
    const rows = summaries.value
    const header = [
      'واحد',
      'مالک',
      'مستأجر',
      'مسئول پرداخت هزینه جاری',
      'مسئول پرداخت هزینه اساسی',
      'پارکینگ',
      'متراژ',
      'سهم متراژ',
      'ساکنان',
      'جاری',
      'اساسی',
      'سهم مالک',
      'سهم مستأجر',
      'پرداخت‌شده',
      'مانده',
    ]
    const lines = [
      header.join(','),
      ...rows.map((row) =>
        [
          row.unit.name,
          row.unit.owner,
          row.unit.tenant,
          hasTenant(row.unit) ? partyLabel(row.unit.currentPayer) : 'مالک',
          partyLabel(row.unit.capitalPayer),
          parkingLabel(row.unit),
          row.unit.area,
          (row.areaShare * 100).toFixed(2),
          row.unit.residents,
          Math.round(row.currentCharge),
          Math.round(row.capitalCharge),
          Math.round(row.ownerCharge),
          Math.round(row.tenantCharge),
          Math.round(row.paid),
          Math.round(row.remaining),
        ]
          .map(csvCell)
          .join(','),
      ),
    ]
    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `charge-${state.currentPeriod}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return {
    ready,
    syncing,
    dbError,
    needsSetup,
    expenseCategories,
    state,
    init,
    completeSetup,
    addUnit,
    removeUnit,
    summaries,
    totals,
    periodExpenses,
    periodPayments,
    setPeriod,
    addExpense,
    updateExpense,
    removeExpense,
    previewSplit,
    unitPayments,
    addPayment,
    updatePayment,
    removePayment,
    markPaid,
    markUnpaid,
    addManagerFee,
    exportBackup,
    importBackup,
    resetAll,
    downloadCsv,
  }
})
