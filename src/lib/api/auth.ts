import api from '@/lib/axios'
import type { User } from '@/types'

// ─── Request Payloads ─────────────────────────────────────────────────────────

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
  fullName?: string
  phone?: string
  hasAcceptedTerms?: boolean
  role: 'CUSTOMER' | 'TASKER'
}

export interface VerifyEmailPayload {
  email: string
  code: string
}

export interface GoogleAuthPayload {
  idToken: string
}

// ─── Response Shapes ──────────────────────────────────────────────────────────

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export interface RegisterResponse {
  user: User
  verificationRequired: boolean
  message: string
}

export interface VerifyEmailResponse {
  user: User
  message: string
}

// ─── Customer Auth ────────────────────────────────────────────────────────────

/** POST /api/auth/login — log in as a customer */
export const loginUser = async (payload: LoginPayload): Promise<AuthResponse> => {
  const response = await api.post('/api/auth/login', payload)
  return response.data
}

/** POST /api/auth/register — register a new customer account */
export const registerUser = async (payload: Omit<RegisterPayload, 'role'>): Promise<RegisterResponse> => {
  const response = await api.post('/api/auth/register', {
    ...payload,
    role: 'CUSTOMER',
  })
  return response.data
}

/** POST /api/auth/verify-email — verify email with OTP code */
export const verifyEmail = async (payload: VerifyEmailPayload): Promise<VerifyEmailResponse> => {
  const response = await api.post('/api/auth/verify-email', payload)
  return response.data
}

/** POST /api/auth/resend-verification — resend OTP to email */
export const resendVerificationCode = async (email: string): Promise<{ message: string }> => {
  const response = await api.post('/api/auth/resend-verification', { email })
  return response.data
}

/** POST /api/auth/google — sign in / sign up via Google OAuth */
export const loginWithGoogle = async (payload: GoogleAuthPayload): Promise<AuthResponse> => {
  const response = await api.post('/api/auth/google', payload)
  return response.data
}

/** POST /api/auth/logout — revoke current refresh token */
export const logoutUser = async (refreshToken: string): Promise<void> => {
  await api.post('/api/auth/logout', { refreshToken })
}

/** DELETE /api/auth/logout-all — revoke all refresh tokens (all devices) */
export const logoutAllDevices = async (): Promise<void> => {
  await api.delete('/api/auth/logout-all')
}

// ─── Tasker Auth ──────────────────────────────────────────────────────────────

/** POST /auth/tasker/login — log in as a tasker */
export const loginTasker = async (payload: LoginPayload): Promise<AuthResponse> => {
  const response = await api.post('/auth/tasker/login', payload)
  return response.data
}

/** POST /auth/tasker/register — register a new tasker account */
export const registerTasker = async (payload: Omit<RegisterPayload, 'role'>): Promise<AuthResponse> => {
  const response = await api.post('/auth/tasker/register', {
    ...payload,
    role: 'TASKER',
  })
  return response.data
}
