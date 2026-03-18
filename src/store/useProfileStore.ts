2import { create } from 'zustand'
import { ArtisanProfile, CustomerProfile } from '@/types'
import api from '@/lib/axios'

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
  verificationStatus: any | null
  fetchVerificationStatus: () => Promise<void>
  submitVerification: (formData: FormData) => Promise<any>
  startKyc: () => Promise<{ verificationUrl: string }>
  getProfilePhotoUploadUrl: (filename: string, mimetype: string, fileSize: number) => Promise<{ uploadUrl: string, fileKey: string, publicUrl: string }>

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
      const response = await api.get('/api/verification/my-status')
      set({ verificationStatus: response.data, isLoading: false })
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
      const response = await api.post('/api/verification/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      set({ verificationStatus: response.data, isLoading: false })
      return response.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to submit verification',
        isLoading: false,
      })
      throw error
    }
  },

  startKyc: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.post('/api/verification/start')
      set({ isLoading: false })
      return response.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to start KYC verification',
        isLoading: false,
      })
      throw error
    }
  },

  getProfilePhotoUploadUrl: async (filename: string, mimetype: string, fileSize: number) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.post('/api/profile/artisan/upload-photo', {
        filename,
        mimetype,
        fileSize
      })
      set({ isLoading: false })
      return response.data;
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
