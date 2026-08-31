import { defineStore } from 'pinia'
import { useSessionStorage } from '@vueuse/core'

const AUTH_KEY = 'aparteman-auth'

function expectedUsername(): string {
  return import.meta.env.VITE_USERNAME ?? ''
}

function expectedPassword(): string {
  return import.meta.env.VITE_PASSWORD ?? ''
}

export function isAuthConfigured(): boolean {
  return Boolean(expectedUsername() && expectedPassword())
}

export const useAuthStore = defineStore('auth', () => {
  const isLoggedIn = useSessionStorage(AUTH_KEY, false)

  function login(username: string, password: string): boolean {
    const ok =
      username.trim() === expectedUsername() && password === expectedPassword()
    if (ok) isLoggedIn.value = true
    return ok
  }

  function logout() {
    isLoggedIn.value = false
  }

  return { isLoggedIn, login, logout }
})
