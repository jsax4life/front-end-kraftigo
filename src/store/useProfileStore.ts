import { create } from 'zustand'
import {
  ArtisanProfile,
  ArtisanProfileUrlSubmitPayload,
  CustomerProfile,
} from '@/types'
import api from '@/lib/axios'
import { getVerificationMyStatus, type VerificationMyStatus } from '@/lib/api/verification'
import {
  getKrafterOnboardingStatus,
  saveKrafterPersonalStep,
  saveKrafterAddressStep,
  type KrafterOnboardingStatus,
  type KrafterPersonalPayload,
  type KrafterAddressPayload,
} from '@/lib/api/krafter-onboarding'
import {
  getKrafterProfileCompletionSummary,
  getKrafterWorkEligibility,
  getKrafterWorkEligibilityUploadUrl,
  submitKrafterWorkEligibility,
  getKrafterPayoutStatus,
  submitKrafterPayout,
  getKrafterPersonalDetailsStatus,
  submitKrafterPersonalDetails,
  updateKrafterProfilePhoto,
  submitKrafterSkills,
  getUploadUrlForProfilePhoto,
  getUploadUrlForCertification,
  getUploadUrlForPortfolio,
  type KrafterProfileCompletionSummary,
  type KrafterWorkEligibilityStatus,
  type KrafterWorkEligibilitySubmitPayload,
  type KrafterWorkEligibilityUploadPayload,
  type KrafterWorkEligibilityUploadResponse,
  type KrafterPayoutStatus,
  type KrafterPayoutSubmitPayload,
  type KrafterPersonalDetailsStatus,
  type KrafterPersonalDetailsSubmitPayload,
  type KrafterProfilePhotoUpdatePayload,
  type KrafterSkillsSubmitPayload,
  type KrafterGenericUploadPayload,
  type KrafterGenericUploadResponse,
} from '@/lib/api/krafter-profile-completion'

let verificationSilentFetch: Promise<void> | null = null

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
  /** Same as fetchVerificationStatus but does not toggle global `isLoading` (safe for banners/background refresh). */
  fetchVerificationStatusSilent: () => Promise<void>
  submitVerification: (formData: FormData) => Promise<void>
  submitArtisanProfileUrl: (payload: ArtisanProfileUrlSubmitPayload) => Promise<void>

  clearProfileError: () => void

  // Krafter initial onboarding (switch-acct flow)
  onboardingStatus: KrafterOnboardingStatus | null
  fetchKrafterOnboardingStatus: () => Promise<void>
  saveKrafterPersonal: (payload: KrafterPersonalPayload) => Promise<KrafterOnboardingStatus>
  saveKrafterAddress: (payload: KrafterAddressPayload) => Promise<KrafterOnboardingStatus>

  // Krafter complete profile summary (dashboard checklist)
  profileCompletionSummary: KrafterProfileCompletionSummary | null
  fetchKrafterProfileCompletionSummary: () => Promise<void>

  // Krafter work eligibility
  workEligibilityStatus: KrafterWorkEligibilityStatus | null
  fetchKrafterWorkEligibility: () => Promise<void>
  getUploadUrlForWorkEligibility: (
    payload: KrafterWorkEligibilityUploadPayload,
  ) => Promise<KrafterWorkEligibilityUploadResponse>
  submitWorkEligibilityDocument: (
    payload: KrafterWorkEligibilitySubmitPayload,
  ) => Promise<KrafterProfileCompletionSummary>

  // Krafter payout
  payoutStatus: KrafterPayoutStatus | null
  fetchKrafterPayoutStatus: () => Promise<void>
  submitPayoutDetails: (
    payload: KrafterPayoutSubmitPayload,
  ) => Promise<KrafterProfileCompletionSummary>

  // Krafter personal details
  personalDetailsStatus: KrafterPersonalDetailsStatus | null
  fetchKrafterPersonalDetailsStatus: () => Promise<void>
  submitPersonalDetails: (
    payload: KrafterPersonalDetailsSubmitPayload,
  ) => Promise<KrafterProfileCompletionSummary>
  updateKrafterProfilePhotoUrl: (
    payload: KrafterProfilePhotoUpdatePayload,
  ) => Promise<KrafterProfileCompletionSummary>

  // Krafter skills
  submitSkills: (
    payload: KrafterSkillsSubmitPayload,
  ) => Promise<KrafterProfileCompletionSummary>
  
  getUploadUrlForProfilePic: (
    payload: KrafterGenericUploadPayload,
  ) => Promise<KrafterGenericUploadResponse>
  getUploadUrlForPortfolioMedia: (
    payload: KrafterGenericUploadPayload,
  ) => Promise<KrafterGenericUploadResponse>
  getUploadUrlForCert: (
    payload: KrafterGenericUploadPayload,
  ) => Promise<KrafterGenericUploadResponse>
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  artisanProfile: null,
  customerProfile: null,
  isLoading: false,
  error: null,
  onboardingStatus: null,
  profileCompletionSummary: null,
  workEligibilityStatus: null,
  payoutStatus: null,
  personalDetailsStatus: null,

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
      await api.put('/api/profile/customer', profile)
      // The PUT endpoint returns {} on success, so we fetch the updated profile
      const fetchRes = await api.get('/api/profile/customer/me')
      set({ customerProfile: fetchRes.data, isLoading: false })
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

  fetchVerificationStatusSilent: async () => {
    if (verificationSilentFetch) {
      await verificationSilentFetch
      return
    }
    verificationSilentFetch = (async () => {
      try {
        const data = await getVerificationMyStatus()
        set({ verificationStatus: data })
      } catch {
        /* banners / home can ignore — CTA falls back to "Become a Krafter" */
      }
    })()
    try {
      await verificationSilentFetch
    } finally {
      verificationSilentFetch = null
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

  // ── Krafter initial onboarding ──────────────────────────────────────────
  fetchKrafterOnboardingStatus: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await getKrafterOnboardingStatus()
      set({ onboardingStatus: data, isLoading: false })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch onboarding status',
        isLoading: false,
      })
    }
  },

  saveKrafterPersonal: async (payload) => {
    set({ isLoading: true, error: null })
    try {
      const data = await saveKrafterPersonalStep(payload)
      set({ onboardingStatus: data, isLoading: false })
      return data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to save personal details',
        isLoading: false,
      })
      throw error
    }
  },

  saveKrafterAddress: async (payload) => {
    set({ isLoading: true, error: null })
    try {
      const data = await saveKrafterAddressStep(payload)
      set({ onboardingStatus: data, isLoading: false })
      return data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to save address',
        isLoading: false,
      })
      throw error
    }
  },

  // ── Krafter complete profile ──────────────────────────────────────────────
  fetchKrafterProfileCompletionSummary: async () => {
    // Intentionally not setting overall isLoading to avoid full page loaders when silently syncing
    try {
      const data = await getKrafterProfileCompletionSummary()
      set({ profileCompletionSummary: data })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch profile summary',
      })
    }
  },

  fetchKrafterWorkEligibility: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await getKrafterWorkEligibility()
      set({ workEligibilityStatus: data, isLoading: false })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch work eligibility',
        isLoading: false,
      })
    }
  },

  getUploadUrlForWorkEligibility: async (payload) => {
    // Intentionally not setting global loading state for background API calls
    try {
      const data = await getKrafterWorkEligibilityUploadUrl(payload)
      return data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to get upload URL',
      })
      throw error
    }
  },

  submitWorkEligibilityDocument: async (payload) => {
    set({ isLoading: true, error: null })
    try {
      const newSummary = await submitKrafterWorkEligibility(payload)
      // Automatically refresh the status
      const newEligibility = await getKrafterWorkEligibility()
      set({
        profileCompletionSummary: newSummary,
        workEligibilityStatus: newEligibility,
        isLoading: false,
      })
      return newSummary
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to submit document',
        isLoading: false,
      })
      throw error
    }
  },

  // ── Krafter payout ────────────────────────────────────────────────────────
  fetchKrafterPayoutStatus: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await getKrafterPayoutStatus()
      set({ payoutStatus: data, isLoading: false })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch payout status',
        isLoading: false,
      })
    }
  },

  submitPayoutDetails: async (payload) => {
    set({ isLoading: true, error: null })
    try {
      const newSummary = await submitKrafterPayout(payload)
      const newPayoutStatus = await getKrafterPayoutStatus()
      set({
        profileCompletionSummary: newSummary,
        payoutStatus: newPayoutStatus,
        isLoading: false,
      })
      return newSummary
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to save payout details',
        isLoading: false,
      })
      throw error
    }
  },

  // ── Krafter personal details ──────────────────────────────────────────────
  fetchKrafterPersonalDetailsStatus: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await getKrafterPersonalDetailsStatus()
      set({ personalDetailsStatus: data, isLoading: false })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch personal details status',
        isLoading: false,
      })
    }
  },

  submitPersonalDetails: async (payload) => {
    set({ isLoading: true, error: null })
    try {
      const newSummary = await submitKrafterPersonalDetails(payload)
      const newPersonalStatus = await getKrafterPersonalDetailsStatus()
      await get().fetchArtisanProfile()
      set({
        profileCompletionSummary: newSummary,
        personalDetailsStatus: newPersonalStatus,
        isLoading: false,
      })
      return newSummary
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to save personal details',
        isLoading: false,
      })
      throw error
    }
  },

  updateKrafterProfilePhotoUrl: async (payload) => {
    set({ error: null })
    try {
      const newSummary = await updateKrafterProfilePhoto(payload)
      const newPersonalStatus = await getKrafterPersonalDetailsStatus()
      set({
        profileCompletionSummary: newSummary,
        personalDetailsStatus: newPersonalStatus,
      })
      return newSummary
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to update profile photo',
      })
      throw error
    }
  },

  submitSkills: async (payload) => {
    set({ isLoading: true, error: null })
    try {
      const newSummary = await submitKrafterSkills(payload)
      set({
        profileCompletionSummary: newSummary,
        isLoading: false,
      })
      return newSummary
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to save skills',
        isLoading: false,
      })
      throw error
    }
  },

  getUploadUrlForProfilePic: async (payload) => {
    try {
      const data = await getUploadUrlForProfilePhoto(payload)
      return data
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to get upload URL' })
      throw error
    }
  },

  getUploadUrlForPortfolioMedia: async (payload) => {
    try {
      const data = await getUploadUrlForPortfolio(payload)
      return data
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to get upload URL' })
      throw error
    }
  },

  getUploadUrlForCert: async (payload) => {
    try {
      const data = await getUploadUrlForCertification(payload)
      return data
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to get upload URL' })
      throw error
    }
  },
}))
