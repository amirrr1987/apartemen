import { defineStore } from 'pinia'
import { useSessionStorage } from '@vueuse/core'
import { computed } from 'vue'
import { hasRegisteredUsers, registerUser, verifyUserPassword } from '../lib/users'

const AUTH_KEY = 'aparteman-auth'
const USER_KEY = 'aparteman-user'

interface SessionUser {
  username: string
  displayName: string
  isAdmin: boolean
}

function expectedUsername(): string {
  return import.meta.env.VITE_USERNAME ?? ''
}

function expectedPassword(): string {
  return import.meta.env.VITE_PASSWORD ?? ''
}

export function isAuthConfigured(): boolean {
  return Boolean(expectedUsername() && expectedPassword())
}

export function canAuthenticate(): boolean {
  return isAuthConfigured() || hasRegisteredUsers()
}

export const useAuthStore = defineStore('auth', () => {
  const isLoggedIn = useSessionStorage(AUTH_KEY, false)
  const sessionUser = useSessionStorage<SessionUser | null>(USER_KEY, null)

  const currentUser = computed(() => sessionUser.value)

  function setSession(user: SessionUser) {
    sessionUser.value = user
    isLoggedIn.value = true
  }

  async function login(username: string, password: string): Promise<boolean> {
    const trimmed = username.trim()

    if (
      isAuthConfigured() &&
      trimmed === expectedUsername() &&
      password === expectedPassword()
    ) {
      setSession({
        username: trimmed,
        displayName: trimmed,
        isAdmin: true,
      })
      return true
    }

    const user = await verifyUserPassword(trimmed, password)
    if (!user) return false

    setSession({
      username: user.username,
      displayName: user.displayName,
      isAdmin: false,
    })
    return true
  }

  async function register(
    username: string,
    password: string,
    displayName: string,
  ): Promise<{ ok: true; displayName: string } | { ok: false; error: string }> {
    const result = await registerUser(username, password, displayName)
    if (!result.ok) return result

    setSession({
      username: result.user.username,
      displayName: result.user.displayName,
      isAdmin: false,
    })
    return { ok: true, displayName: result.user.displayName }
  }

  function logout() {
    isLoggedIn.value = false
    sessionUser.value = null
  }

  return { isLoggedIn, currentUser, login, register, logout }
})
