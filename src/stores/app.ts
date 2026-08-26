import { computed, reactive, watch } from 'vue'
import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import { monthSummaries, monthTotals, splitExpense } from '../lib/calc'
import { createDefaultState, hasTenant, inferNature, partyLabel } from '../data/defaults'
import { newId } from '../lib/format'
import { currentPeriod } from '../lib/jalali'
import type { AppState, CostNature, CostType, Expense, PartyRole, Unit } from '../types'

const STORAGE_KEY = 'aparteman-v1'

function normalizeUnit(unit: Partial<Unit>, fallback: Unit): Unit {
  return {
    ...fallback,
    ...unit,
    tenant: unit.tenant ?? '',
    currentPayer: unit.currentPayer ?? 'TENANT',
    capitalPayer: unit.capitalPayer ?? 'OWNER',
  }
}

function normalizeExpense(expense: Expense): Expense {
  return {
    ...expense,
    nature: expense.nature ?? inferNature(expense.title, expense.type),
  }
}

function normalizeState(parsed: Partial<AppState>): AppState {
  const fallback = createDefaultState()
  const sourceUnits = parsed.units?.length ? parsed.units : fallback.units
  return {
    ...fallback,
    ...parsed,
    units: sourceUnits.map((unit, index) =>
      normalizeUnit(unit, fallback.units[index] ?? fallback.units[0]!),
    ),
    expenses: (parsed.expenses ?? []).map(normalizeExpense),
    payments: parsed.payments ?? [],
    settings: { ...fallback.settings, ...parsed.settings },
    currentPeriod: parsed.currentPeriod || currentPeriod(),
  }
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createDefaultState()
    return normalizeState(JSON.parse(raw) as Partial<AppState>)
  } catch {
    return createDefaultState()
  }
}

export const useAppStore = defineStore('app', () => {
  const persisted = useLocalStorage(STORAGE_KEY, loadState(), {
    deep: true,
    serializer: {
      read: (raw) => normalizeState(JSON.parse(raw) as Partial<AppState>),
      write: (value) => JSON.stringify(value),
    },
  })
  const state = reactive(persisted.value) as AppState

  watch(
    state,
    (value) => {
      persisted.value = JSON.parse(JSON.stringify(value)) as AppState
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

  function setPeriod(period: string) {
    state.currentPeriod = period
  }

  function addExpense(input: {
    title: string
    amount: number
    type: CostType
    nature: CostNature
    unitId?: number
    meters?: Record<number, number>
    notes?: string
  }): Expense {
    const expense: Expense = {
      id: newId(),
      title: input.title.trim(),
      amount: Math.round(input.amount),
      type: input.type,
      nature: input.nature,
      period: state.currentPeriod,
      unitId: input.unitId,
      meters: input.meters,
      notes: input.notes?.trim() ?? '',
      createdAt: new Date().toISOString(),
    }
    state.expenses.push(expense)
    return expense
  }

  function updateExpense(
    id: string,
    input: {
      title: string
      amount: number
      type: CostType
      nature: CostNature
      unitId?: number
      meters?: Record<number, number>
      notes?: string
    },
  ) {
    const expense = state.expenses.find((item) => item.id === id)
    if (!expense) return
    expense.title = input.title.trim()
    expense.amount = Math.round(input.amount)
    expense.type = input.type
    expense.nature = input.nature
    expense.unitId = input.type === 'UNIT' ? input.unitId : undefined
    expense.meters = input.type === 'METER' ? input.meters : undefined
    expense.notes = input.notes?.trim() ?? ''
  }

  function removeExpense(id: string) {
    state.expenses = state.expenses.filter((expense) => expense.id !== id)
  }

  function previewSplit(expense: Pick<Expense, 'amount' | 'type' | 'unitId' | 'meters' | 'nature'>) {
    return splitExpense(
      {
        id: 'preview',
        title: '',
        amount: expense.amount,
        type: expense.type,
        nature: expense.nature,
        period: state.currentPeriod,
        unitId: expense.unitId,
        meters: expense.meters,
        notes: '',
        createdAt: '',
      },
      state.units,
      state.settings.waterEqualPercent,
      state.settings.waterPersonPercent,
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
    const next = normalizeState(JSON.parse(raw) as Partial<AppState>)
    state.units = next.units
    state.expenses = next.expenses
    state.payments = next.payments
    state.settings = next.settings
    state.currentPeriod = next.currentPeriod
  }

  function resetAll() {
    const fresh = createDefaultState()
    state.units = fresh.units
    state.expenses = fresh.expenses
    state.payments = fresh.payments
    state.settings = fresh.settings
    state.currentPeriod = fresh.currentPeriod
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
    state,
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
