import { createClient } from '@libsql/client'
import {
  localDbPath,
  resolveTursoAuthToken,
  tursoHttpUrl,
} from '../database.ts'
import { createDefaultState } from '../src/data/defaults.ts'
import { SCHEMA_STATEMENTS } from '../src/lib/schema.ts'

const isLocal = process.argv.includes('--local')
const target = isLocal ? localDbPath : tursoHttpUrl
const authToken = isLocal ? undefined : resolveTursoAuthToken()

const db = createClient({
  url: target,
  authToken,
})

console.log(`Initializing schema on ${target} ...`)

try {
  for (const sql of SCHEMA_STATEMENTS) {
    await db.execute(sql)
  }

  const units = await db.execute('SELECT COUNT(*) AS count FROM units')
  const count = Number(units.rows[0]?.count ?? 0)

  if (count === 0) {
    const defaults = createDefaultState()
    const stmts = [
      {
        sql: `UPDATE settings SET
        building_name = ?,
        water_equal_percent = ?,
        water_person_percent = ?,
        manager_fee = ?
      WHERE id = 1`,
        args: [
          defaults.settings.buildingName,
          defaults.settings.waterEqualPercent,
          defaults.settings.waterPersonPercent,
          defaults.settings.managerFee,
        ],
      },
      {
        sql: `INSERT INTO meta (key, value) VALUES ('current_period', ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        args: [defaults.currentPeriod],
      },
      ...defaults.units.map((unit) => ({
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
        ],
      })),
    ]
    await db.batch(stmts, 'write')
    console.log('Seeded default units.')
  } else {
    console.log(`Database already has ${count} unit(s).`)
  }

  console.log('Done.')
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error('Database init failed:', message)
  if (!isLocal && message.includes('400')) {
    console.error(
      'Hint: regenerate the token at https://app.turso.tech/amirrr1987/databases/apartemen and update .env',
    )
  }
  process.exit(1)
}
