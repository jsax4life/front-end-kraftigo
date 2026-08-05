import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'
import { updateCachedToken } from '@/lib/axios'
import type { RegisterPayload, ResetPasswordPayload, GoogleAuthPayload } from '@/lib/api/auth'
import {
  loginUser,
  registerUser,
  verifyEmail,
  resendVerificationCode,
  forgotPassword,
  resetPassword,
  changePassword as changePasswordApi,
  loginWithGoogle as loginWithGoogleApi,
  loginTasker,
  registerTasker,
  logoutUser,
  logoutAllDevices,
} from '@/lib/api/auth'
import { useDomainNotificationHistoryStore } from '@/store/useDomainNotificationHistoryStore'
import { useAddressStore } from '@/store/useAddressStore'

interface AuthState {
  // State
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // User Actions
  loginUser: (email: string, password: string) => Promise<void>
  registerUser: (userData: Omit<RegisterPayload, 'role'> & { role?: 'CUSTOMER' | 'ARTISAN' }) => Promise<{ verificationRequired: boolean; message: string }>
  verifyEmail: (email: string, code: string) => Promise<void>
  resendVerificationCode: (email: string) => Promise<string>
  forgotPassword: (email: string) => Promise<string>
  resetPassword: (payload: ResetPasswordPayload) => Promise<string>
  changePassword: (currentPassword: string, newPassword: string) => Promise<string>
  loginWithGoogle: (payload: GoogleAuthPayload) => Promise<void>
  
  // Tasker Actions
  loginTasker: (email: string, password: string) => Promise<void>
  registerTasker: (taskerData: Omit<RegisterPayload, 'role'>) => Promise<{ verificationRequired: boolean; message: string }>
  
  // Common Actions
  logout: () => Promise<void>
  logoutAll: () => Promise<void>
  clearError: () => void

  /** Keep Zustand in sync when axios refresh updates tokens (Socket.IO `/chat` reads `accessToken`). */
  applyRefreshedTokens: (accessToken: string, refreshToken: string | null) => void

  // Helper Methods
  isUser: () => boolean
  isTasker: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      // Helper to clear auth state
      const clearAuthState = () => {
        updateCachedToken(null) // Clear axios cache
        useAddressStore.getState().clearAddresses() // Clear address storage on logout
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        })
      }

      return {

        // Initial State
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        // User Login
        loginUser: async (email: string, password: string) => {
          set({ isLoading: true, error: null })
          try {
            const { user, accessToken, refreshToken } = await loginUser({ email, password })
            
            updateCachedToken(accessToken) // Update axios cache
            set({
              user,
              accessToken,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
            })
          } catch (error: any) {
            set({
              error: error.response?.data?.message || 'Login failed',
              isLoading: false,
            })
            throw error
          }
        },

        // Customer Registration
        registerUser: async (userData) => {
          set({ isLoading: true, error: null })
          try {
            const { user, verificationRequired, message } = await registerUser(userData)
            
            set({
              user,
              accessToken: null,
              refreshToken: null,
              isAuthenticated: false,
              isLoading: false,
            })
            
            return { verificationRequired, message }
          } catch (error: any) {
            set({
              error: error.response?.data?.message || 'Registration failed',
              isLoading: false,
            })
            throw error
          }
        },

        // Email Verification
        verifyEmail: async (email: string, code: string) => {
          set({ isLoading: true, error: null })
          try {
            const { user, message } = await verifyEmail({ email, code })
            
            set({
              user,
              isLoading: false,
            })
            
            return message as unknown as void // Original code implied returning void but caught message
          } catch (error: any) {
            set({
              error: error.response?.data?.message || 'Verification failed',
              isLoading: false,
            })
            throw error
          }
        },

        // Resend Verification Code
        resendVerificationCode: async (email: string) => {
          set({ isLoading: true, error: null })
          try {
            const { message } = await resendVerificationCode(email)
            
            set({ isLoading: false })
            
            return message
          } catch (error: any) {
            set({
              error: error.response?.data?.message || 'Verification failed',
              isLoading: false,
            })
            throw error
          }
        },

        // Forgot Password
        forgotPassword: async (email: string) => {
          set({ isLoading: true, error: null })
          try {
            const { message } = await forgotPassword(email)
            set({ isLoading: false })
            return message
          } catch (error: any) {
            set({
              error: error.response?.data?.message || 'Failed to send reset email',
              isLoading: false,
            })
            throw error
          }
        },

        // Reset Password
        resetPassword: async (payload) => {
          set({ isLoading: true, error: null })
          try {
            const { message } = await resetPassword(payload)
            set({ isLoading: false })
            return message
          } catch (error: any) {
            set({
              error: error.response?.data?.message || 'Failed to reset password',
              isLoading: false,
            })
            throw error
          }
        },

        changePassword: async (currentPassword, newPassword) => {
          set({ isLoading: true, error: null })
          try {
            const { message } = await changePasswordApi({ currentPassword, newPassword })
            await get().logout()
            set({ isLoading: false })
            return message
          } catch (error: any) {
            set({
              error: error.response?.data?.message || 'Failed to change password',
              isLoading: false,
            })
            throw error
          }
        },

        // Google OAuth Login/Signup
        loginWithGoogle: async (payload: GoogleAuthPayload) => {
          set({ isLoading: true, error: null })
          try {
            const { user, accessToken, refreshToken } = await loginWithGoogleApi(payload)
            
            updateCachedToken(accessToken)
            set({
              user,
              accessToken,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
            })
          } catch (error: any) {
            set({
              error: error.response?.data?.message || 'Google authentication failed',
              isLoading: false,
            })
            throw error
          }
        },

        // Tasker Login
        loginTasker: async (email: string, password: string) => {
          set({ isLoading: true, error: null })
          try {
            const { user, accessToken, refreshToken } = await loginTasker({ email, password })
            
            updateCachedToken(accessToken) // Update axios cache
            set({
              user,
              accessToken,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
            })
          } catch (error: any) {
            set({
              error: error.response?.data?.message || 'Login failed',
              isLoading: false,
            })
            throw error
          }
        },

        // Tasker Registration
        registerTasker: async (taskerData) => {
          set({ isLoading: true, error: null })
          try {
            const { user, verificationRequired, message } = await registerTasker(taskerData)
            
            set({
              user,
              accessToken: null,
              refreshToken: null,
              isAuthenticated: false,
              isLoading: false,
            })
            
            return { verificationRequired, message }
          } catch (error: any) {
            set({
              error: error.response?.data?.message || 'Registration failed',
              isLoading: false,
            })
            throw error
          }
        },

        // Logout (works for both user and tasker)
        logout: async () => {
          const { refreshToken } = get()
          
          try {
            // Revoke refresh token on backend
            if (refreshToken) {
              await logoutUser(refreshToken)
            }
          } catch (error) {
            // Even if logout fails, clear local state
            console.error('Logout API error:', error)
          } finally {
            useDomainNotificationHistoryStore.getState().clearAll()
            clearAuthState()
          }
        },

        // Logout from all devices (revoke all refresh tokens)
        logoutAll: async () => {
          try {
            // Revoke all refresh tokens on backend 
            await logoutAllDevices()
          } catch (error) {
            console.error('Logout all devices API error:', error)
          } finally {
            useDomainNotificationHistoryStore.getState().clearAll()
            clearAuthState()
          }
        },

      // Clear Error
      clearError: () => set({ error: null }),

      applyRefreshedTokens: (accessToken: string, refreshToken: string | null) => {
        updateCachedToken(accessToken)
        set((s) => ({
          accessToken,
          refreshToken: refreshToken ?? s.refreshToken,
        }))
      },

      // Helper: Check if current user is a regular user
      isUser: () => {
        const { user } = get()
        return user?.roles?.includes('CUSTOMER') || user?.roles?.includes('user') || false
      },

      // Helper: Check if current user is a tasker
      isTasker: () => {
        const { user } = get()
        return user?.roles?.includes('TASKER') || user?.roles?.includes('tasker') || user?.roles?.includes('ARTISAN') || false
      },
    }},
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
