import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  saveCard,
  savePaymentMethod,
  getSavedPaymentMethods,
  deleteSavedPaymentMethod,
  setDefaultSavedPaymentMethod,
} from '@/lib/api/payments'
import type { SetupIntentResponse, SavedPaymentMethod } from '@/lib/api/payments'

// ─── State ────────────────────────────────────────────────────────────────────

interface PaymentState {
  savedMethods: SavedPaymentMethod[]
  selectedPaymentId: string | null

  // Request state
  isLoading: boolean
  error: string | null
  setupIntent: SetupIntentResponse | null

  // ─── UI helpers ─────────────────────────────────────────────────────────────
  selectPayment: (id: string) => void
  hasPaymentMethods: () => boolean
  getDefaultPayment: () => SavedPaymentMethod | null

  // ─── API actions ─────────────────────────────────────────────────────────────
  initiateSaveCard: (idempotencyKey?: string) => Promise<SetupIntentResponse | null>
  persistPaymentMethod: (paymentMethodId: string, isDefault?: boolean) => Promise<boolean>
  fetchSavedMethods: () => Promise<void>
  removeSavedMethod: (id: string) => Promise<boolean>
  setDefaultSavedMethod: (id: string) => Promise<boolean>
  clearSetupIntent: () => void
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const usePaymentStore = create<PaymentState>()(
  persist(
    (set, get) => ({
      savedMethods: [],
      selectedPaymentId: null,
      isLoading: false,
      error: null,
      setupIntent: null,

      // ─── UI helpers ───────────────────────────────────────────────────────

      selectPayment: (id) => {
        set({ selectedPaymentId: id })
      },

      hasPaymentMethods: () => {
        return get().savedMethods.length > 0
      },

      getDefaultPayment: () => {
        const { savedMethods } = get()
        return savedMethods.find((m) => m.isDefault) ?? savedMethods[0] ?? null
      },

      // ─── API actions ──────────────────────────────────────────────────────

      initiateSaveCard: async (idempotencyKey) => {
        set({ isLoading: true, error: null })
        try {
          const result = await saveCard({ idempotencyKey })
          set({ setupIntent: result, isLoading: false })
          return result
        } catch (err: any) {
          const message =
            err?.response?.data?.message ||
            err?.message ||
            'Failed to create SetupIntent. Please try again.'
          set({ error: message, isLoading: false })
          return null
        }
      },

      persistPaymentMethod: async (paymentMethodId, isDefault = false) => {
        set({ isLoading: true, error: null })
        try {
          await savePaymentMethod({ paymentMethodId, isDefault })
          const methods = await getSavedPaymentMethods()
          set({ savedMethods: methods, isLoading: false })
          return true
        } catch (err: any) {
          const message =
            err?.response?.data?.message ||
            err?.message ||
            'Failed to save payment method. Please try again.'
          set({ error: message, isLoading: false })
          return false
        }
      },

      fetchSavedMethods: async () => {
        set({ isLoading: true, error: null })
        try {
          const methods = await getSavedPaymentMethods()
          set({ savedMethods: methods, isLoading: false })
        } catch (err: any) {
          const message =
            err?.response?.data?.message ||
            err?.message ||
            'Failed to fetch saved payment methods.'
          set({ error: message, isLoading: false })
        }
      },

      removeSavedMethod: async (id) => {
        set({ isLoading: true, error: null })
        try {
          await deleteSavedPaymentMethod(id)
          set((state) => ({
            savedMethods: state.savedMethods.filter((m) => m.id !== id),
            selectedPaymentId: state.selectedPaymentId === id ? null : state.selectedPaymentId,
            isLoading: false,
          }))
          return true
        } catch (err: any) {
          const message =
            err?.response?.data?.message ||
            err?.message ||
            'Failed to delete payment method. Please try again.'
          set({ error: message, isLoading: false })
          return false
        }
      },

      setDefaultSavedMethod: async (id) => {
        set({ isLoading: true, error: null })
        try {
          await setDefaultSavedPaymentMethod(id)
          set((state) => ({
            savedMethods: state.savedMethods.map((m) => ({
              ...m,
              isDefault: m.id === id,
            })),
            isLoading: false,
          }))
          return true
        } catch (err: any) {
          const message =
            err?.response?.data?.message ||
            err?.message ||
            'Failed to set default payment method. Please try again.'
          set({ error: message, isLoading: false })
          return false
        }
      },

      clearSetupIntent: () => {
        set({ setupIntent: null, error: null })
      },
    }),
    {
      name: 'payment-storage',
    }
  )
)
