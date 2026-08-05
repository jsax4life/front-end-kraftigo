import api from '@/lib/axios'

/** GET /api/profile/krafter/complete-profile/summary */
export interface KrafterProfileCompletionSummary {
  initialOnboarding: { isComplete: boolean; personalCompletedAt?: string | null; addressCompletedAt?: string | null }
  personalDetails: { isComplete: boolean; completedAt?: string | null }
  skills: {
    isComplete: boolean
    completedAt?: string | null
    serviceCategoryOfferings?: ServiceCategoryOffering[]
  }
  workEligibility: {
    isComplete: boolean
    hasApprovedDocument: boolean
    hasFinishedKrafterSubmission: boolean
    hasSubmittedAwaitingReview: boolean
    awaitingReviewSince: string | null
    canSubmitNewDocument: boolean
  }
  legalIdentity: {
    kycStatus: string | null
  }
  payout: {
    isComplete: boolean
    maskedAccountInfo: string | null
    /** Stripe onboarding done when connected; not required for profile `allComplete`. */
    requiredForProfileCompletion?: boolean
    /** User must connect before `POST /api/payouts/withdraw`. */
    requiredForWithdrawal?: boolean
  }
  recommendedNextStep: string | null
  allComplete: boolean
}

// ─── Work Eligibility specific types ──────────────────────────────────────────

/** GET /api/profile/krafter/complete-profile/work-eligibility */
export interface KrafterWorkEligibilityStatus {
  completedAt: string | null
  isComplete: boolean
  hasApprovedDocument: boolean
  pendingReviewCount: number
  rejectedDocumentCount: number
  hasSubmittedAwaitingReview: boolean
  awaitingReviewSince: string | null
  canSubmitNewDocument: boolean
  hasFinishedKrafterSubmission: boolean
  documentTypeOptions: Array<{ value: string; label: string }>
  documents: Array<{
    id: string
    documentType: string
    status: string // e.g., "PENDING", "APPROVED", "REJECTED"
    rejectionReason?: string | null
    submittedAt: string
  }>
}

/** POST /api/profile/krafter/upload/work-eligibility */
export interface KrafterWorkEligibilityUploadPayload {
  filename: string
  mimetype: string
  fileSize: number
}

export interface KrafterWorkEligibilityUploadResponse {
  uploadUrl: string
  fileKey: string
  publicUrl: string
  requiredUploadHeaders: Record<string, string>
}

/** PATCH /api/profile/krafter/complete-profile/work-eligibility */
export interface KrafterWorkEligibilitySubmitPayload {
  documentType: string
  otherDescription?: string
  documentUrl: string
}

// ─── Personal Details specific types ──────────────────────────────────────────

/** GET /api/profile/krafter/complete-profile/personal-details */
export interface KrafterPersonalDetailsStatus {
  suggestedDisplayName?: string | null
  completedAt?: string | null
  personal: {
    displayName?: string | null
    profilePhotoUrl?: string | null
    bio?: string | null
    occupationDescription?: string | null
    languages?: Array<{ code: string; name: string; proficiency: string }>
    whereYouLive?: string | null
    latitude?: number | null
    longitude?: number | null
    travelRadiusKm?: number | null
    uniqueSellingPoint?: string | null
    certifications?: Array<{
      name: string
      issuer: string
      issueDate: string
      expiryDate: string
      documentUrl: string
    }>
    portfolioPhotoUrls?: string[]
    portfolioVideoUrl?: string | null
  }
  /** Returned alongside personal details — certifications and portfolio media */
  work?: {
    certifications: Array<{
      name: string
      issuer: string
      issueDate?: string | null
      expiryDate?: string | null
      documentUrl: string
    }>
    portfolioPhotoUrls: string[]
    portfolioVideoUrl: string | null
  }
}

export type KrafterWorkCertification = NonNullable<
  KrafterPersonalDetailsStatus['work']
>['certifications'][number]

/** Portfolio + certifications live under `work`; older responses may nest them on `personal`. */
export function getKrafterWorkMediaFromStatus(
  status: KrafterPersonalDetailsStatus | null | undefined,
): {
  certifications: KrafterWorkCertification[]
  portfolioPhotoUrls: string[]
  portfolioVideoUrl: string | null
} {
  const work = status?.work
  const personal = status?.personal
  return {
    certifications: work?.certifications ?? personal?.certifications ?? [],
    portfolioPhotoUrls:
      work?.portfolioPhotoUrls ?? personal?.portfolioPhotoUrls ?? [],
    portfolioVideoUrl:
      work?.portfolioVideoUrl ?? personal?.portfolioVideoUrl ?? null,
  }
}

/** PATCH /api/profile/krafter/profile-photo — URL only, after presigned upload (same rules as personal-details profilePhotoUrl) */
export interface KrafterProfilePhotoUpdatePayload {
  profilePhotoUrl: string
}

/** PATCH /api/profile/krafter/complete-profile/personal-details */
export interface KrafterPersonalDetailsSubmitPayload {
  displayName?: string
  profilePhotoUrl?: string
  bio?: string
  occupationDescription?: string
  languages?: Array<{ code: string; name: string; proficiency: string }>
  whereYouLive?: string
  latitude?: number
  longitude?: number
  travelRadiusKm?: number
  uniqueSellingPoint?: string
  certifications?: Array<{
    name: string
    issuer: string
    issueDate?: string
    expiryDate?: string
    documentUrl: string
  }>
  portfolioPhotoUrls?: string[]
  portfolioVideoUrl?: string
  submitAsDraft?: boolean
}

// ─── Skills specific types ────────────────────────────────────────────────────

export interface ServiceCategoryOffering {
  serviceCategoryId: string
  serviceCategoryName?: string
  pricingType: 'HOURLY' | 'FLAT'
  hourlyRate?: number
  flatRate?: number
  experienceYears?: number
  photoUrl?: string
}

/** GET /api/profile/krafter/complete-profile/skills */
export interface KrafterSkillsStatus {
  completedAt?: string | null
  isComplete?: boolean
  serviceCategoryOfferings?: ServiceCategoryOffering[]
  skills?: {
    isComplete?: boolean
    completedAt?: string | null
    serviceCategoryOfferings?: ServiceCategoryOffering[]
  }
}

/** PATCH /api/profile/krafter/complete-profile/skills */
export interface KrafterSkillsSubmitPayload {
  serviceCategoryOfferings: ServiceCategoryOffering[]
  submitAsDraft?: boolean
}

// Generic file upload payload (reused across profile-photo, certification, portfolio)
export interface KrafterGenericUploadPayload {
  filename: string
  mimetype: string
  fileSize: number
}

export interface KrafterGenericUploadResponse {
  uploadUrl: string
  fileKey: string
  publicUrl: string
  requiredUploadHeaders: Record<string, string>
}

// ─── Payout specific types ────────────────────────────────────────────────────

/** GET /api/profile/krafter/complete-profile/payout */
export interface KrafterPayoutStatus {
  completedAt: string | null
  payout: {
    ibanMasked: string | null
    bicMasked: string | null
    ibanLast4: string | null
    hasIban: boolean
    hasBic: boolean
  }
}

/** PATCH /api/profile/krafter/complete-profile/payout */
export interface KrafterPayoutSubmitPayload {
  iban: string
  bic: string
  submitAsDraft?: boolean
}

// ─── API Functions ────────────────────────────────────────────────────────────

export const getKrafterProfileCompletionSummary =
  async (): Promise<KrafterProfileCompletionSummary> => {
    const response = await api.get<KrafterProfileCompletionSummary>(
      '/api/profile/krafter/complete-profile/summary',
    )
    return response.data
  }

export const getKrafterWorkEligibility = async (): Promise<KrafterWorkEligibilityStatus> => {
  const response = await api.get<KrafterWorkEligibilityStatus>(
    '/api/profile/krafter/complete-profile/work-eligibility',
  )
  return response.data
}

export const getKrafterWorkEligibilityUploadUrl = async (
  payload: KrafterWorkEligibilityUploadPayload,
): Promise<KrafterWorkEligibilityUploadResponse> => {
  const response = await api.post<KrafterWorkEligibilityUploadResponse>(
    '/api/profile/krafter/upload/work-eligibility',
    payload,
  )
  return response.data
}

export const submitKrafterWorkEligibility = async (
  payload: KrafterWorkEligibilitySubmitPayload,
): Promise<KrafterProfileCompletionSummary> => {
  const response = await api.patch<KrafterProfileCompletionSummary>(
    '/api/profile/krafter/complete-profile/work-eligibility',
    payload,
  )
  return response.data
}

export const getKrafterPayoutStatus = async (): Promise<KrafterPayoutStatus> => {
  const response = await api.get<KrafterPayoutStatus>(
    '/api/profile/krafter/complete-profile/payout',
  )
  return response.data
}

export const submitKrafterPayout = async (
  payload: KrafterPayoutSubmitPayload,
): Promise<KrafterProfileCompletionSummary> => {
  const response = await api.patch<KrafterProfileCompletionSummary>(
    '/api/profile/krafter/complete-profile/payout',
    payload,
  )
  return response.data
}

// ─── Personal Details API Functions ───────────────────────────────────────────

export const getKrafterPersonalDetailsStatus = async (): Promise<KrafterPersonalDetailsStatus> => {
  const response = await api.get<KrafterPersonalDetailsStatus>(
    '/api/profile/krafter/complete-profile/personal-details',
  )
  return response.data
}

export const submitKrafterPersonalDetails = async (
  payload: KrafterPersonalDetailsSubmitPayload,
): Promise<KrafterProfileCompletionSummary> => {
  const response = await api.patch<KrafterProfileCompletionSummary>(
    '/api/profile/krafter/complete-profile/personal-details',
    payload,
  )
  return response.data
}

export const updateKrafterProfilePhoto = async (
  payload: KrafterProfilePhotoUpdatePayload,
): Promise<KrafterProfileCompletionSummary> => {
  const response = await api.patch<KrafterProfileCompletionSummary>(
    '/api/profile/krafter/profile-photo',
    payload,
  )
  return response.data
}

// ─── Skills API Functions ─────────────────────────────────────────────────────

export const getKrafterSkillsStatus = async (): Promise<KrafterSkillsStatus> => {
  const response = await api.get<KrafterSkillsStatus>(
    '/api/profile/krafter/complete-profile/skills',
  )
  return response.data
}

export const submitKrafterSkills = async (
  payload: KrafterSkillsSubmitPayload,
): Promise<KrafterProfileCompletionSummary> => {
  const response = await api.patch<KrafterProfileCompletionSummary>(
    '/api/profile/krafter/complete-profile/skills',
    payload,
  )
  return response.data
}

// Uploaders
export const getUploadUrlForProfilePhoto = async (
  payload: KrafterGenericUploadPayload,
): Promise<KrafterGenericUploadResponse> => {
  const response = await api.post<KrafterGenericUploadResponse>(
    '/api/profile/krafter/upload/profile-photo',
    payload,
  )
  return response.data
}

export const getUploadUrlForCertification = async (
  payload: KrafterGenericUploadPayload,
): Promise<KrafterGenericUploadResponse> => {
  const response = await api.post<KrafterGenericUploadResponse>(
    '/api/profile/krafter/upload/certification',
    payload,
  )
  return response.data
}

export const getUploadUrlForPortfolio = async (
  payload: KrafterGenericUploadPayload,
): Promise<KrafterGenericUploadResponse> => {
  const response = await api.post<KrafterGenericUploadResponse>(
    '/api/profile/krafter/upload/portfolio',
    payload,
  )
  return response.data
}
