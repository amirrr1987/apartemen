import { createClient } from '@libsql/client'
import { resolveTursoAuthToken, tursoHttpUrl } from '../database.ts'
import { SCHEMA_MIGRATIONS, SCHEMA_STATEMENTS } from '../src/lib/schema.ts'

const db = createClient({
  url: tursoHttpUrl,
  authToken: resolveTursoAuthToken(),
})

console.log(`Initializing schema on ${tursoHttpUrl} ...`)

try {
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
  console.log('Schema ready. Run the app and complete /setup to define units.')
  console.log('Done.')
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error('Database init failed:', message)
  if (message.includes('400')) {
    console.error(
      'Hint: regenerate the token at https://app.turso.tech/amirrr1987/databases/apartemen and update .env',
    )
  }
  process.exit(1)
}
