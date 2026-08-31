import { createClient, type Client } from '@libsql/client/web'
import { createDefaultState } from '../data/defaults'
import { currentPeriod } from './jalali'
import { SCHEMA_STATEMENTS } from './schema'
import { normalizeTursoToken } from './turso-token'
import type { AppState, Expense, Payment, Unit } from '../types'

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
}

function rowUnit(row: Record<string, unknown>): Unit {
  return {
    id: Number(row.id),
    name: String(row.name),
    area: Number(row.area),
    residents: Number(row.residents),
    owner: String(row.owner ?? ''),
    tenant: String(row.tenant ?? ''),
    currentPayer: (row.current_payer as Unit['currentPayer']) ?? 'TENANT',
    capitalPayer: (row.capital_payer as Unit['capitalPayer']) ?? 'OWNER',
    notes: String(row.notes ?? ''),
  }
}

function rowExpense(row: Record<string, unknown>): Expense {
  const metersRaw = row.meters_json
  return {
    id: String(row.id),
    title: String(row.title),
    amount: Number(row.amount),
    type: row.type as Expense['type'],
    nature: row.nature as Expense['nature'],
    period: String(row.period),
    unitId: row.unit_id == null ? undefined : Number(row.unit_id),
    meters: metersRaw ? (JSON.parse(String(metersRaw)) as Record<number, number>) : undefined,
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

export async function loadAppState(db: Client = getDbClient()): Promise<AppState | null> {
  await initSchema(db)

  const [settingsRes, unitsRes, expensesRes, paymentsRes, metaRes] = await Promise.all([
    db.execute('SELECT * FROM settings WHERE id = 1'),
    db.execute('SELECT * FROM units ORDER BY id'),
    db.execute('SELECT * FROM expenses ORDER BY created_at'),
    db.execute('SELECT * FROM payments ORDER BY created_at'),
    db.execute("SELECT value FROM meta WHERE key = 'current_period'"),
  ])

  const hasData =
    unitsRes.rows.length > 0 || expensesRes.rows.length > 0 || paymentsRes.rows.length > 0
  if (!hasData) return null

  const settingsRow = settingsRes.rows[0]
  const currentPeriodRow = metaRes.rows[0]

  return {
    units: unitsRes.rows.map((row) => rowUnit(row as Record<string, unknown>)),
    expenses: expensesRes.rows.map((row) => rowExpense(row as Record<string, unknown>)),
    payments: paymentsRes.rows.map((row) => rowPayment(row as Record<string, unknown>)),
    settings: settingsRow
      ? {
          buildingName: String(settingsRow.building_name),
          waterEqualPercent: Number(settingsRow.water_equal_percent),
          waterPersonPercent: Number(settingsRow.water_person_percent),
          managerFee: Number(settingsRow.manager_fee),
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
        water_equal_percent = ?,
        water_person_percent = ?,
        manager_fee = ?
      WHERE id = 1`,
      args: [
        state.settings.buildingName,
        state.settings.waterEqualPercent,
        state.settings.waterPersonPercent,
        state.settings.managerFee,
      ] as (string | number)[],
    },
    { sql: 'DELETE FROM units', args: [] as (string | number)[] },
    { sql: 'DELETE FROM expenses', args: [] as (string | number)[] },
    { sql: 'DELETE FROM payments', args: [] as (string | number)[] },
    {
      sql: `INSERT INTO meta (key, value) VALUES ('current_period', ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      args: [state.currentPeriod] as (string | number)[],
    },
    ...state.units.map((unit) => ({
      sql: `INSERT INTO units (
        id, name, area, residents, owner, tenant, current_payer, capital_payer, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        unit.id,
        unit.name,
        unit.area,
        unit.residents,
        unit.owner,
        unit.tenant,
        unit.currentPayer,
        unit.capitalPayer,
        unit.notes,
      ] as (string | number)[],
    })),
    ...state.expenses.map((expense) => ({
      sql: `INSERT INTO expenses (
        id, title, amount, type, nature, period, unit_id, meters_json, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        expense.id,
        expense.title,
        expense.amount,
        expense.type,
        expense.nature,
        expense.period,
        expense.unitId ?? null,
        expense.meters ? JSON.stringify(expense.meters) : null,
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
  ]

  await db.batch(stmts, 'write')
}

export async function seedDefaultUnits(db: Client = getDbClient()): Promise<void> {
  const defaults = createDefaultState()
  await saveAppState(defaults, db)
}
