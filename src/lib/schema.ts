export const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    building_name TEXT NOT NULL DEFAULT '',
    manager_fee INTEGER NOT NULL DEFAULT 0,
    setup_complete INTEGER NOT NULL DEFAULT 0,
    expense_categories_json TEXT NOT NULL DEFAULT '[]'
  )`,
  `CREATE TABLE IF NOT EXISTS units (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    area REAL NOT NULL,
    residents INTEGER NOT NULL,
    has_parking INTEGER NOT NULL DEFAULT 0,
    owner TEXT NOT NULL DEFAULT '',
    tenant TEXT NOT NULL DEFAULT '',
    current_payer TEXT NOT NULL DEFAULT 'TENANT',
    capital_payer TEXT NOT NULL DEFAULT 'OWNER',
    notes TEXT NOT NULL DEFAULT ''
  )`,
  `CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL,
    nature TEXT NOT NULL,
    period TEXT NOT NULL,
    unit_id INTEGER,
    parking_scope TEXT NOT NULL DEFAULT 'ALL',
    category TEXT NOT NULL DEFAULT 'سایر',
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    unit_id INTEGER NOT NULL,
    period TEXT NOT NULL,
    amount INTEGER NOT NULL,
    party TEXT,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`,
  `INSERT OR IGNORE INTO settings (id) VALUES (1)`,
] as const

export const SCHEMA_MIGRATIONS = [
  `ALTER TABLE units ADD COLUMN has_parking INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE settings ADD COLUMN setup_complete INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE expenses ADD COLUMN parking_scope TEXT NOT NULL DEFAULT 'ALL'`,
  `ALTER TABLE expenses ADD COLUMN category TEXT NOT NULL DEFAULT 'سایر'`,
  `ALTER TABLE settings ADD COLUMN expense_categories_json TEXT NOT NULL DEFAULT '[]'`,
] as const
