import { create } from 'zustand'
import { ArtisanProfile, CustomerProfile, PayoutInfo } from '@/types'
import api from '@/lib/axios'
import { getVerificationMyStatus, type VerificationMyStatus, startDiditKycSession } from '@/lib/api/verification'

interface ProfileState {
  artisanProfile: ArtisanProfile | null
  customerProfile: CustomerProfile | null
  payoutInfo: PayoutInfo | null
  isLoading: boolean
  error: string | null

  // Artisan Actions
  fetchArtisanProfile: () => Promise<void>
  createOrUpdateArtisanProfile: (profile: ArtisanProfile | FormData) => Promise<void>
  updateArtisanProfile: (profile: Partial<ArtisanProfile> | FormData) => Promise<void>

  // Customer Actions
  fetchCustomerProfile: () => Promise<void>
  createOrUpdateCustomerProfile: (profile: CustomerProfile) => Promise<void>
  updateCustomerProfile: (profile: Partial<CustomerProfile>) => Promise<void>

  // Verification Actions
  verificationStatus: VerificationMyStatus | null
  fetchVerificationStatus: () => Promise<void>
  submitVerification: (formData: FormData) => Promise<void>
  submitVerificationUrl: (payload: any) => Promise<any>
  startKyc: () => Promise<{ verificationUrl: string }>
  getUploadUrl: (filename: string, mimetype: string, fileSize: number) => Promise<{ uploadUrl: string, fileKey: string, publicUrl: string }>

  // Payout Actions
  fetchPayouts: () => Promise<void>

  clearProfileError: () => void
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  artisanProfile: null,
  customerProfile: null,
  payoutInfo: null,
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

  fetchPayouts: async () => {
    try {
      const response = await api.get('/api/payouts/my');
      set({ payoutInfo: Array.isArray(response.data) ? response.data[0] : (response.data || null) });
    } catch (error) {
      console.error('Failed to fetch payouts:', error);
    }
  },

  createOrUpdateArtisanProfile: async (profile) => {
    set({ isLoading: true, error: null })
    try {
      const isFormData = profile instanceof FormData;
      const response = await api.post('/api/profile/artisan', profile, {
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
      })
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
      const isFormData = profile instanceof FormData;
      const response = await api.put('/api/profile/artisan', profile, {
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
      })
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

  submitVerificationCountially: async (formData: FormData) => {
      // placeholder for counting utility if needed
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

  submitVerificationUrl: async (payload: any) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.post('/api/verification/submit/url', payload)
      const data = await getVerificationMyStatus()
      set({ verificationStatus: data, isLoading: false })
      return response.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to submit verification URL',
        isLoading: false,
      })
      throw error
    }
  },

  startKyc: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await startDiditKycSession()
      set({ isLoading: false })
      return data
    } catch (error: any) {
      set({
        error: error.message || 'Failed to start KYC session',
        isLoading: false,
      })
      throw error
    }
  },

  getUploadUrl: async (filename, mimetype, fileSize) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.post('/api/profile/artisan/upload-photo', {
        filename,
        mimetype,
        fileSize
      })
      set({ isLoading: false })
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to get upload URL',
        isLoading: false,
      })
      throw error
    }
  },

  clearProfileError: () => set({ error: null }),
}))
