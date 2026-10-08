import { createContext } from 'react'
import type { Role, User } from '../types/api'

export interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (username: string, password: string, role: Role) => Promise<void>
  updateAuthenticatedUser: (user: User) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)