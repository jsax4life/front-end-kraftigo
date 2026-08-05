import api from '@/lib/axios'
import type { GenderApiValue } from '@/lib/genderOptions'

// ─── Types ───────────────────────────────────────────────────────────────────

/** GET /api/profile/krafter/initial-onboarding/status */
export interface KrafterOnboardingStatus {
  personal: {
    firstName?: string | null
    lastName?: string | null
    gender?: string | null
    dateOfBirth?: string | null
    nationality?: string | null
    completedAt?: string | null
  } | null
  address: {
    street?: string | null
    postalCode?: string | null
    city?: string | null
    country?: string | null
    completedAt?: string | null
  } | null
}

/** PATCH /api/profile/krafter/initial-onboarding/personal — request body */
export interface KrafterPersonalPayload {
  firstName: string
  lastName: string
  /** MALE | FEMALE | DIVERS | NOT_SPECIFIED */
  gender: GenderApiValue
  /** ISO date: "1990-05-15" */
  dateOfBirth: string
  /** ISO 3166-1 alpha-2 country code e.g. "DE", "GH" */
  nationality: string
  /** Required on first onboarding; omit or pass true on later profile edits. */
  hasAcceptedTerms?: boolean
}

/** PATCH /api/profile/krafter/initial-onboarding/address — request body */
export interface KrafterAddressPayload {
  street: string
  postalCode: string
  city: string
  latitude?: number
  longitude?: number
}

// ─── API functions ────────────────────────────────────────────────────────────

/**
 * GET /api/profile/krafter/initial-onboarding/status
 * Returns the prefill data and completion timestamps for both onboarding steps.
 * Call this when the switch-acct page mounts to restore any previously saved data.
 */
export const getKrafterOnboardingStatus =
  async (): Promise<KrafterOnboardingStatus> => {
    const response =
      await api.get<KrafterOnboardingStatus>(
        '/api/profile/krafter/initial-onboarding/status',
      )
    return response.data
  }

/**
 * PATCH /api/profile/krafter/initial-onboarding/personal
 * Saves step 1 (name, gender, DOB, nationality) and marks the personal step complete.
 */
export const saveKrafterPersonalStep = async (
  payload: KrafterPersonalPayload,
): Promise<KrafterOnboardingStatus> => {
  const response = await api.patch<KrafterOnboardingStatus>(
    '/api/profile/krafter/initial-onboarding/personal',
    payload,
  )
  return response.data
}

/**
 * PATCH /api/profile/krafter/initial-onboarding/address
 * Saves step 2 (street, postalCode, city) and marks the address step complete.
 * Requires the personal step to be completed first.
 */
export const saveKrafterAddressStep = async (
  payload: KrafterAddressPayload,
): Promise<KrafterOnboardingStatus> => {
  const response = await api.patch<KrafterOnboardingStatus>(
    '/api/profile/krafter/initial-onboarding/address',
    payload,
  )
  return response.data
}
