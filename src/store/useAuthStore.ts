import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { user } from '@/types'
import api, { updateCachedToken } from '@/lib/axios'

interface AuthState {
  // State
  user: user | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // User Actions
  loginUser: (email: string, password: string) => Promise<void>
  registerUser: (userData: Omit<user, 'role'>) => Promise<void>
  
  // Tasker Actions
  loginTasker: (email: string, password: string) => Promise<void>
  registerTasker: (taskerData: Omit<user, 'role'>) => Promise<void>
  
  // Common Actions
  logout: () => Promise<void>
  logoutAll: () => Promise<void>
  clearError: () => void
  
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
            const response = await api.post('/api/auth/login', { email, password })
            const { user, accessToken, refreshToken } = response.data
            
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
            // Backend expects: email, password, role, phone
            const response = await api.post('/api/auth/register', {
              email: userData.email,
              password: userData.password,
              role: 'CUSTOMER',
              phone: userData.phone,
            })
            const { user, accessToken, refreshToken } = response.data
            
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
              error: error.response?.data?.message || 'Registration failed',
              isLoading: false,
            })
            throw error
          }
        },

        // Tasker Login
        loginTasker: async (email: string, password: string) => {
          set({ isLoading: true, error: null })
          try {
            const response = await api.post('/auth/tasker/login', { email, password })
            const { user, accessToken, refreshToken } = response.data
            
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
            const response = await api.post('/auth/tasker/register', {
              ...taskerData,
              role: 'TASKER',
            })
            const { user, accessToken, refreshToken } = response.data
            
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
              await api.post('/api/auth/logout', { refreshToken })
            }
          } catch (error) {
            // Even if logout fails, clear local state
            console.error('Logout API error:', error)
          } finally {
            // Always clear local state
            clearAuthState()
          }
        },

        // Logout from all devices (revoke all refresh tokens)
        logoutAll: async () => {
          try {
            // Revoke all refresh tokens on backend (requires valid accessToken)
            await api.delete('/api/auth/logout-all')
          } catch (error) {
            console.error('Logout all devices API error:', error)
          } finally {
            // Always clear local state
            clearAuthState()
          }
        },

      // Clear Error
      clearError: () => set({ error: null }),

      // Helper: Check if current user is a regular user
      isUser: () => {
        const { user } = get()
        return user?.roles?.includes('CUSTOMER') || user?.roles?.includes('user') || false
      },

      // Helper: Check if current user is a tasker
      isTasker: () => {
        const { user } = get()
        return user?.roles?.includes('TASKER') || user?.roles?.includes('tasker') || false
      },
    }},
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        // Don't persist loading and error states
      }),
    }
  )
)
