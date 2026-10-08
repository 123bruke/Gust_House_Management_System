import { useEffect, useState, type ReactNode } from 'react'
import { getCurrentUser, login as loginRequest, sendHeartbeat } from '../api/auth'
import { clearLegacySharedSession, clearSession, getApiError, TOKEN_KEY } from '../api/client'
import { AuthContext } from './auth-context'
import type { Role, User } from '../types/api'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(() => Boolean(sessionStorage.getItem(TOKEN_KEY)))

  useEffect(() => {
    clearLegacySharedSession()
    if (!sessionStorage.getItem(TOKEN_KEY)) return
    getCurrentUser()
      .then(setUser)
      .catch(() => {
        clearSession()
        setUser(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    const userId = user?.id
    if (!userId) return
    const updatePresence = () => {
      sendHeartbeat().catch((error: unknown) => {
        console.error('Failed to update staff presence:', error)
      })
    }
    updatePresence()
    const intervalId = window.setInterval(updatePresence, 30_000)
    return () => window.clearInterval(intervalId)
  }, [user?.id])

  async function login(username: string, password: string, role: Role) {
    try {
      const response = await loginRequest(username, password, role)
      sessionStorage.setItem(TOKEN_KEY, response.access_token)
      setUser(response.user)
    } catch (error) {
      throw new Error(getApiError(error, 'Invalid username or password.'), { cause: error })
    }
  }

  function logout() { clearSession(); setUser(null) }
  function updateAuthenticatedUser(updatedUser: User) { setUser(updatedUser) }

  return <AuthContext.Provider value={{ user, isLoading, isAuthenticated: Boolean(user), login, updateAuthenticatedUser, logout }}>{children}</AuthContext.Provider>
}

export { useAuth } from '../hooks/useAuth'
