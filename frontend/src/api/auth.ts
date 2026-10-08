import { api } from './client'
import type {
  AdminOverrideResetPayload,
  LoginResponse,
  PasswordChangeResponse,
  PublicChangePasswordPayload,
  Role,
  User,
} from '../types/api'

export async function login(username: string, password: string, role: Role) {
  const { data } = await api.post<LoginResponse>('/auth/login', { username, password, role })
  return data
}

export async function getCurrentUser() {
  const { data } = await api.get<User>('/auth/me')
  return data
}

export async function publicChangePassword(payload: PublicChangePasswordPayload) {
  const { data } = await api.post<PasswordChangeResponse>('/auth/public-change-password', payload)
  return data
}

export async function adminOverrideResetPassword(payload: AdminOverrideResetPayload) {
  const { data } = await api.post<PasswordChangeResponse>('/auth/admin-override-reset', payload)
  return data
}