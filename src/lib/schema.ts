export const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    building_name TEXT NOT NULL DEFAULT 'ساختمان',
    water_equal_percent INTEGER NOT NULL DEFAULT 30,
    water_person_percent INTEGER NOT NULL DEFAULT 70,
    manager_fee INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS units (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    area REAL NOT NULL,
    residents INTEGER NOT NULL,
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
    meters_json TEXT,
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
