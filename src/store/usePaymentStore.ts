import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PaymentMethodType = 'card' | 'sepa' | 'paypal' | 'googlepay'

export interface PaymentMethod {
  id: string
  type: PaymentMethodType
  name: string
  details?: {
    holder?: string
    number?: string
    last4?: string
    expiryDate?: string
    iban?: string
  }
  isDefault: boolean
  createdAt: string
}

interface PaymentState {
  paymentMethods: PaymentMethod[]
  selectedPaymentId: string | null
  
  // Actions
  addPaymentMethod: (method: Omit<PaymentMethod, 'id' | 'createdAt'>) => void
  removePaymentMethod: (id: string) => void
  setDefaultPayment: (id: string) => void
  selectPayment: (id: string) => void
  getDefaultPayment: () => PaymentMethod | null
  hasPaymentMethods: () => boolean
}

export const usePaymentStore = create<PaymentState>()(
  persist(
    (set, get) => ({
      paymentMethods: [],
      selectedPaymentId: null,

      addPaymentMethod: (method) => {
        const newMethod: PaymentMethod = {
          ...method,
          id: `pm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
        }

        set((state) => {
          // If this is the first payment method, make it default
          const isFirstMethod = state.paymentMethods.length === 0
          const updatedMethods = isFirstMethod
            ? [{ ...newMethod, isDefault: true }]
            : [...state.paymentMethods, newMethod]

          return {
            paymentMethods: updatedMethods,
            selectedPaymentId: isFirstMethod ? newMethod.id : state.selectedPaymentId,
          }
        })
      },

      removePaymentMethod: (id) => {
        set((state) => {
          const updatedMethods = state.paymentMethods.filter((m) => m.id !== id)
          
          // If removed method was default, make first remaining method default
          if (state.paymentMethods.find((m) => m.id === id)?.isDefault && updatedMethods.length > 0) {
            updatedMethods[0].isDefault = true
          }

          return {
            paymentMethods: updatedMethods,
            selectedPaymentId: state.selectedPaymentId === id ? updatedMethods[0]?.id || null : state.selectedPaymentId,
          }
        })
      },

      setDefaultPayment: (id) => {
        set((state) => ({
          paymentMethods: state.paymentMethods.map((method) => ({
            ...method,
            isDefault: method.id === id,
          })),
        }))
      },

      selectPayment: (id) => {
        set({ selectedPaymentId: id })
      },

      getDefaultPayment: () => {
        const state = get()
        return state.paymentMethods.find((m) => m.isDefault) || state.paymentMethods[0] || null
      },

      hasPaymentMethods: () => {
        return get().paymentMethods.length > 0
      },
    }),
    {
      name: 'payment-storage',
    }
  )
)
