import { inferNature, payerFor } from '../data/defaults'
import type { AppState, Expense, Unit, UnitMonthSummary } from '../types'

export function totalArea(units: Unit[]): number {
  return units.reduce((sum, unit) => sum + unit.area, 0)
}

export function totalResidents(units: Unit[]): number {
  return units.reduce((sum, unit) => sum + Math.max(0, unit.residents), 0)
}

export function areaShare(unit: Unit, units: Unit[]): number {
  const total = totalArea(units)
  return total > 0 ? unit.area / total : 0
}

function splitRound(raw: number[], total: number): number[] {
  const rounded = raw.map((n) => Math.round(n))
  const diff = Math.round(total) - rounded.reduce((sum, n) => sum + n, 0)
  if (!rounded.length || diff === 0) return rounded

  let idx = 0
  let best = -1
  raw.forEach((n, i) => {
    const rem = Math.abs(n - Math.floor(n) - 0.5)
    if (rem > best) {
      best = rem
      idx = i
    }
  })
  const current = rounded[idx]
  if (current === undefined) return rounded
  rounded[idx] = current + diff
  return rounded
}

export function splitExpense(
  expense: Expense,
  units: Unit[],
  waterEqualPercent: number,
  waterPersonPercent: number,
): Record<number, number> {
  const result: Record<number, number> = {}
  units.forEach((unit) => {
    result[unit.id] = 0
  })

  const count = units.length || 1
  const area = totalArea(units)
  const people = totalResidents(units)

  const assign = (ratios: number[]) => {
    const raw = ratios.map((ratio) => expense.amount * ratio)
    const rounded = splitRound(raw, expense.amount)
    units.forEach((unit, i) => {
      result[unit.id] = rounded[i] ?? 0
    })
  }

  switch (expense.type) {
    case 'AREA':
      assign(units.map((unit) => (area > 0 ? unit.area / area : 1 / count)))
      break
    case 'EQUAL':
      assign(units.map(() => 1 / count))
      break
    case 'PERSON':
      assign(
        people > 0
          ? units.map((unit) => Math.max(0, unit.residents) / people)
          : units.map(() => 1 / count),
      )
      break
    case 'WATER': {
      const equalPart = waterEqualPercent / 100
      const personPart = waterPersonPercent / 100
      const personRatio =
        people > 0
          ? units.map((unit) => Math.max(0, unit.residents) / people)
          : units.map(() => 1 / count)
      assign(units.map((_, i) => equalPart / count + personPart * (personRatio[i] ?? 0)))
      break
    }
    case 'UNIT':
      if (expense.unitId != null) result[expense.unitId] = Math.round(expense.amount)
      break
    case 'METER': {
      const meters = expense.meters ?? {}
      const sum = units.reduce((acc, unit) => acc + (meters[unit.id] ?? 0), 0)
      assign(
        sum > 0
          ? units.map((unit) => (meters[unit.id] ?? 0) / sum)
          : units.map(() => 1 / count),
      )
      break
    }
  }

  return result
}

export function monthSummaries(state: AppState, period = state.currentPeriod): UnitMonthSummary[] {
  const expenses = state.expenses.filter((expense) => expense.period === period)
  const { waterEqualPercent, waterPersonPercent } = state.settings

  return state.units.map((unit) => {
    const breakdown = expenses
      .map((expense) => {
        const nature = expense.nature ?? inferNature(expense.title, expense.type)
        return {
          expense: { ...expense, nature },
          share:
            splitExpense(expense, state.units, waterEqualPercent, waterPersonPercent)[unit.id] ?? 0,
          payer: payerFor(unit, nature),
        }
      })
      .filter((row) => row.share !== 0)

    const charge = breakdown.reduce((sum, row) => sum + row.share, 0)
    const currentCharge = breakdown
      .filter((row) => row.expense.nature === 'CURRENT')
      .reduce((sum, row) => sum + row.share, 0)
    const capitalCharge = breakdown
      .filter((row) => row.expense.nature === 'CAPITAL')
      .reduce((sum, row) => sum + row.share, 0)
    const ownerCharge = breakdown
      .filter((row) => row.payer === 'OWNER')
      .reduce((sum, row) => sum + row.share, 0)
    const tenantCharge = breakdown
      .filter((row) => row.payer === 'TENANT')
      .reduce((sum, row) => sum + row.share, 0)

    const periodPayments = state.payments.filter(
      (payment) => payment.unitId === unit.id && payment.period === period,
    )
    const explicitOwnerPaid = periodPayments
      .filter((payment) => payment.party === 'OWNER')
      .reduce((sum, payment) => sum + payment.amount, 0)
    const explicitTenantPaid = periodPayments
      .filter((payment) => payment.party === 'TENANT')
      .reduce((sum, payment) => sum + payment.amount, 0)
    const legacyPaid = periodPayments
      .filter((payment) => payment.party == null)
      .reduce((sum, payment) => sum + payment.amount, 0)

    let ownerPaid = explicitOwnerPaid
    let tenantPaid = explicitTenantPaid
    if (legacyPaid > 0 && explicitOwnerPaid === 0 && explicitTenantPaid === 0 && charge > 0) {
      const ratio = Math.min(1, legacyPaid / charge)
      ownerPaid = Math.round(ownerCharge * ratio)
      tenantPaid = Math.round(tenantCharge * ratio)
    }

    const paidTotal =
      explicitOwnerPaid + explicitTenantPaid > 0 ? ownerPaid + tenantPaid : Math.max(ownerPaid + tenantPaid, legacyPaid)

    return {
      unit,
      areaShare: areaShare(unit, state.units),
      charge,
      currentCharge,
      capitalCharge,
      ownerCharge,
      tenantCharge,
      paid: Math.min(paidTotal, charge),
      ownerPaid: Math.min(ownerPaid, ownerCharge),
      tenantPaid: Math.min(tenantPaid, tenantCharge),
      remaining: Math.max(0, charge - paidTotal),
      ownerRemaining: Math.max(0, ownerCharge - ownerPaid),
      tenantRemaining: Math.max(0, tenantCharge - tenantPaid),
      breakdown,
    }
  })
}

export function monthTotals(summaries: UnitMonthSummary[]) {
  const charge = summaries.reduce((sum, row) => sum + row.charge, 0)
  const paid = summaries.reduce((sum, row) => sum + row.paid, 0)
  const ownerCharge = summaries.reduce((sum, row) => sum + row.ownerCharge, 0)
  const tenantCharge = summaries.reduce((sum, row) => sum + row.tenantCharge, 0)
  return {
    charge,
    paid,
    remaining: charge - paid,
    ownerCharge,
    tenantCharge,
    ownerRemaining: summaries.reduce((sum, row) => sum + row.ownerRemaining, 0),
    tenantRemaining: summaries.reduce((sum, row) => sum + row.tenantRemaining, 0),
  }
}
