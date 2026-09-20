import { sha256Hex } from './sha256'

export interface StoredUser {
  id: string
  username: string
  passwordHash: string
  displayName: string
  createdAt: string
}

const USERS_KEY = 'aparteman-users'

function loadUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as StoredUser[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveUsers(users: StoredUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function newId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function hasRegisteredUsers(): boolean {
  return loadUsers().length > 0
}

export function findUserByUsername(username: string): StoredUser | undefined {
  const normalized = username.trim().toLowerCase()
  return loadUsers().find((user) => user.username === normalized)
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  return sha256Hex(`${salt}:${password}`)
}

export async function registerUser(
  username: string,
  password: string,
  displayName: string,
): Promise<{ ok: true; user: StoredUser } | { ok: false; error: string }> {
  const trimmed = username.trim()
  const normalized = trimmed.toLowerCase()

  if (normalized.length < 3) {
    return { ok: false, error: 'نام کاربری باید حداقل ۳ کاراکتر باشد' }
  }
  if (password.length < 4) {
    return { ok: false, error: 'رمز عبور باید حداقل ۴ کاراکتر باشد' }
  }
  if (findUserByUsername(normalized)) {
    return { ok: false, error: 'این نام کاربری قبلاً ثبت شده است' }
  }

  const user: StoredUser = {
    id: newId(),
    username: normalized,
    passwordHash: await hashPassword(password, normalized),
    displayName: displayName.trim() || trimmed,
    createdAt: new Date().toISOString(),
  }

  const users = loadUsers()
  users.push(user)
  saveUsers(users)
  return { ok: true, user }
}

export async function verifyUserPassword(username: string, password: string): Promise<StoredUser | null> {
  const user = findUserByUsername(username)
  if (!user) return null
  const hash = await hashPassword(password, user.username)
  return hash === user.passwordHash ? user : null
}
