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

export function hasRegisteredUsers(): boolean {
  return loadUsers().length > 0
}

export function findUserByUsername(username: string): StoredUser | undefined {
  const normalized = username.trim().toLowerCase()
  return loadUsers().find((user) => user.username === normalized)
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
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
    id: crypto.randomUUID(),
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
