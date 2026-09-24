import { createClient, type Client } from '@libsql/client/web'
import { createDefaultState, clampPersonWeight, inferCategory } from '../data/defaults'
import { currentPeriod } from './jalali'
import { SCHEMA_MIGRATIONS, SCHEMA_STATEMENTS } from './schema'
import { normalizeTursoToken } from './turso-token'
import type { AppState, CostType, Expense, Payment, Unit, UnitGuestStay } from '../types'

let client: Client | null = null

function tursoUrl(): string | undefined {
  return import.meta.env.VITE_TURSO_DATABASE_URL
}

function tursoToken(): string | undefined {
  const raw = import.meta.env.VITE_TURSO_AUTH_TOKEN
  return raw ? normalizeTursoToken(raw) : undefined
}

export function isDbConfigured(): boolean {
  return Boolean(tursoUrl() && tursoToken())
}

export function getDbClient(): Client {
  if (!client) {
    const url = tursoUrl()
    const authToken = tursoToken()
    if (!url || !authToken) throw new Error('Turso is not configured')
    client = createClient({ url, authToken })
  }
  return client
}

export async function initSchema(db: Client = getDbClient()): Promise<void> {
  for (const sql of SCHEMA_STATEMENTS) {
    await db.execute(sql)
  }
  for (const sql of SCHEMA_MIGRATIONS) {
    try {
      await db.execute(sql)
    } catch {
      // column may already exist
    }
  }
}

function migrateCostType(type: string): CostType {
  if (type === 'WATER') return 'PERSON'
  if (type === 'METER') return 'UNIT'
  return type as CostType
}

function rowUnit(row: Record<string, unknown>): Unit {
  return {
    id: Number(row.id),
    name: String(row.name),
    area: Number(row.area),
    residents: Number(row.residents),
    hasParking: Boolean(Number(row.has_parking ?? 0)),
    owner: String(row.owner ?? ''),
    tenant: String(row.tenant ?? ''),
    currentPayer: (row.current_payer as Unit['currentPayer']) ?? 'TENANT',
    capitalPayer: (row.capital_payer as Unit['capitalPayer']) ?? 'OWNER',
    notes: String(row.notes ?? ''),
  }
}

function rowExpense(row: Record<string, unknown>): Expense {
  const title = String(row.title)
  const type = migrateCostType(String(row.type))
  const rawWeight = row.person_weight
  return {
    id: String(row.id),
    category: String(row.category ?? inferCategory(title)),
    title,
    amount: Number(row.amount),
    type,
    nature: row.nature as Expense['nature'],
    period: String(row.period),
    unitId: row.unit_id == null ? undefined : Number(row.unit_id),
    parkingScope: (row.parking_scope as Expense['parkingScope']) ?? 'ALL',
    personWeight:
      type === 'HYBRID'
        ? clampPersonWeight(rawWeight == null ? undefined : Number(rawWeight))
        : undefined,
    notes: String(row.notes ?? ''),
    createdAt: String(row.created_at),
  }
}

function rowPayment(row: Record<string, unknown>): Payment {
  return {
    id: String(row.id),
    unitId: Number(row.unit_id),
    period: String(row.period),
    amount: Number(row.amount),
    party: row.party == null ? undefined : (row.party as Payment['party']),
    createdAt: String(row.created_at),
  }
}

function rowGuestStay(row: Record<string, unknown>): UnitGuestStay {
  return {
    unitId: Number(row.unit_id),
    period: String(row.period),
    guestNights: Math.max(0, Math.round(Number(row.guest_nights) || 0)),
  }
}

export async function loadAppState(db: Client = getDbClient()): Promise<AppState | null> {
  await initSchema(db)

  const [settingsRes, unitsRes, expensesRes, paymentsRes, guestRes, metaRes] = await Promise.all([
    db.execute('SELECT * FROM settings WHERE id = 1'),
    db.execute('SELECT * FROM units ORDER BY id'),
    db.execute('SELECT * FROM expenses ORDER BY created_at'),
    db.execute('SELECT * FROM payments ORDER BY created_at'),
    db.execute('SELECT * FROM guest_stays'),
    db.execute("SELECT value FROM meta WHERE key = 'current_period'"),
  ])

  const settingsRow = settingsRes.rows[0]
  const setupComplete = Boolean(Number(settingsRow?.setup_complete ?? 0))
  const hasData =
    setupComplete ||
    unitsRes.rows.length > 0 ||
    expensesRes.rows.length > 0 ||
    paymentsRes.rows.length > 0
  if (!hasData) return null

  const currentPeriodRow = metaRes.rows[0]

  return {
    units: unitsRes.rows.map((row) => rowUnit(row as Record<string, unknown>)),
    expenses: expensesRes.rows.map((row) => rowExpense(row as Record<string, unknown>)),
    payments: paymentsRes.rows.map((row) => rowPayment(row as Record<string, unknown>)),
    guestStays: guestRes.rows
      .map((row) => rowGuestStay(row as Record<string, unknown>))
      .filter((stay) => stay.guestNights > 0),
    settings: settingsRow
      ? {
          buildingName: String(settingsRow.building_name ?? ''),
          managerFee: Number(settingsRow.manager_fee ?? 0),
          setupComplete,
          expenseCategories: JSON.parse(String(settingsRow.expense_categories_json ?? '[]')) as string[],
        }
      : createDefaultState().settings,
    currentPeriod: currentPeriodRow ? String(currentPeriodRow.value) : currentPeriod(),
  }
}

export async function saveAppState(state: AppState, db: Client = getDbClient()): Promise<void> {
  await initSchema(db)

  const stmts = [
    {
      sql: `UPDATE settings SET
        building_name = ?,
        manager_fee = ?,
        setup_complete = ?,
        expense_categories_json = ?
      WHERE id = 1`,
      args: [
        state.settings.buildingName,
        state.settings.managerFee,
        state.settings.setupComplete ? 1 : 0,
        JSON.stringify(state.settings.expenseCategories),
      ] as (string | number)[],
    },
    { sql: 'DELETE FROM units', args: [] as (string | number)[] },
    { sql: 'DELETE FROM expenses', args: [] as (string | number)[] },
    { sql: 'DELETE FROM payments', args: [] as (string | number)[] },
    { sql: 'DELETE FROM guest_stays', args: [] as (string | number)[] },
    {
      sql: `INSERT INTO meta (key, value) VALUES ('current_period', ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      args: [state.currentPeriod] as (string | number)[],
    },
    ...state.units.map((unit) => ({
      sql: `INSERT INTO units (
        id, name, area, residents, has_parking, owner, tenant, current_payer, capital_payer, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        unit.id,
        unit.name,
        unit.area,
        unit.residents,
        unit.hasParking ? 1 : 0,
        unit.owner,
        unit.tenant,
        unit.currentPayer,
        unit.capitalPayer,
        unit.notes,
      ] as (string | number)[],
    })),
    ...state.expenses.map((expense) => ({
      sql: `INSERT INTO expenses (
        id, title, amount, type, nature, period, unit_id, parking_scope, category, person_weight, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        expense.id,
        expense.title,
        expense.amount,
        expense.type,
        expense.nature,
        expense.period,
        expense.unitId ?? null,
        expense.parkingScope,
        expense.category,
        expense.type === 'HYBRID' ? clampPersonWeight(expense.personWeight) : null,
        expense.notes,
        expense.createdAt,
      ] as (string | number | null)[],
    })),
    ...state.payments.map((payment) => ({
      sql: `INSERT INTO payments (id, unit_id, period, amount, party, created_at)
        VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        payment.id,
        payment.unitId,
        payment.period,
        payment.amount,
        payment.party ?? null,
        payment.createdAt,
      ] as (string | number | null)[],
    })),
    ...(state.guestStays ?? [])
      .filter((stay) => stay.guestNights > 0)
      .map((stay) => ({
        sql: `INSERT INTO guest_stays (unit_id, period, guest_nights) VALUES (?, ?, ?)`,
        args: [stay.unitId, stay.period, stay.guestNights] as (string | number)[],
      })),
  ]

  await db.batch(stmts, 'write')
}
