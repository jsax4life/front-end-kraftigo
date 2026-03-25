import { create } from 'zustand'
import {
  ArtisanProfile,
  ArtisanProfileUrlSubmitPayload,
  CustomerProfile,
} from '@/types'
import api from '@/lib/axios'
import { getVerificationMyStatus, type VerificationMyStatus } from '@/lib/api/verification'

interface ProfileState {
  artisanProfile: ArtisanProfile | null
  customerProfile: CustomerProfile | null
  isLoading: boolean
  error: string | null

  // Artisan Actions
  fetchArtisanProfile: () => Promise<void>
  createOrUpdateArtisanProfile: (profile: ArtisanProfile) => Promise<void>
  updateArtisanProfile: (profile: Partial<ArtisanProfile>) => Promise<void>

  // Customer Actions
  fetchCustomerProfile: () => Promise<void>
  createOrUpdateCustomerProfile: (profile: CustomerProfile) => Promise<void>
  updateCustomerProfile: (profile: Partial<CustomerProfile>) => Promise<void>

  // Verification Actions
  verificationStatus: VerificationMyStatus | null
  fetchVerificationStatus: () => Promise<void>
  submitVerification: (formData: FormData) => Promise<void>
  submitArtisanProfileUrl: (payload: ArtisanProfileUrlSubmitPayload) => Promise<void>

  clearProfileError: () => void
}

export const useProfileStore = create<ProfileState>((set) => ({
  artisanProfile: null,
  customerProfile: null,
  isLoading: false,
  error: null,

  fetchArtisanProfile: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.get('/api/profile/artisan/me')
      set({ artisanProfile: response.data, isLoading: false })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch artisan profile',
        isLoading: false,
      })
    }
  },

  createOrUpdateArtisanProfile: async (profile) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.post('/api/profile/artisan', profile)
      set({ artisanProfile: response.data, isLoading: false })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to update artisan profile',
        isLoading: false,
      })
      throw error
    }
  },

  updateArtisanProfile: async (profile) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.put('/api/profile/artisan', profile)
      set({ artisanProfile: response.data, isLoading: false })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to update artisan profile',
        isLoading: false,
      })
      throw error
    }
  },

  fetchCustomerProfile: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.get('/api/profile/customer/me')
      set({ customerProfile: response.data, isLoading: false })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch customer profile',
        isLoading: false,
      })
    }
  },

  createOrUpdateCustomerProfile: async (profile) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.post('/api/profile/customer', profile)
      set({ customerProfile: response.data, isLoading: false })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to update customer profile',
        isLoading: false,
      })
      throw error
    }
  },

  updateCustomerProfile: async (profile) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.put('/api/profile/customer', profile)
      set({ customerProfile: response.data, isLoading: false })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to update customer profile',
        isLoading: false,
      })
      throw error
    }
  },

  verificationStatus: null,

  fetchVerificationStatus: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await getVerificationMyStatus()
      set({ verificationStatus: data, isLoading: false })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch verification status',
        isLoading: false,
      })
    }
  },

  submitVerification: async (formData) => {
    set({ isLoading: true, error: null })
    try {
      await api.post('/api/verification/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      const data = await getVerificationMyStatus()
      set({ verificationStatus: data, isLoading: false })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to submit verification',
        isLoading: false,
      })
      throw error
    }
  },

  submitArtisanProfileUrl: async (payload) => {
    set({ isLoading: true, error: null })
    try {
      await api.post('/api/profile/artisan/url', payload)
      const me = await api.get<ArtisanProfile>('/api/profile/artisan/me')
      set({ artisanProfile: me.data, isLoading: false })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to save artisan profile',
        isLoading: false,
      })
      throw error
    }
  },

  clearProfileError: () => set({ error: null }),
}))
