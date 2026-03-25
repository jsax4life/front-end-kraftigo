import api from '@/lib/axios'

/**
 * Verification + Didit KYC (frontend contract)
 *
 * - Start: `POST /api/verification/start` with JWT → `{ verificationUrl }` → redirect the user there.
 * - Return: user lands on `/verification/didit-return` (configure `FRONTEND_URL` on the backend).
 * - Real KYC state: `GET /api/verification/my-status` → `kycStatus`, `kycSessionCreatedAt`, `kycVerifiedAt`
 *   (webhook updates DB; `PENDING` after `/verification/start` means an open Didit session until completed,
 *   Abandoned → `NOT_STARTED`, or approved/rejected).
 * - Do **not** call `POST /api/webhooks/didit` from the browser — that route is Didit → backend only.
 */

/** KYC as returned by `GET /api/verification/my-status` after Didit processing. */
export type KycStatus = 'NOT_STARTED' | 'PENDING' | 'APPROVED' | 'REJECTED'

/** GET /api/verification/my-status */
export interface VerificationMyStatus {
  artisanId?: string | null
  verification?: {
    id?: string
    status?: string
    rejectionReason?: string | null
    submittedAt?: string | null
    reviewedAt?: string | null
  } | null
  verificationStatus?: string
  kycStatus?: KycStatus | string
  /** Set when `POST /api/verification/start` succeeds (open Didit session). */
  kycSessionCreatedAt?: string | null
  /** Set when KYC is completed (approved) on our side. */
  kycVerifiedAt?: string | null
  hasStartedArtisanOnboarding?: boolean
  verificationDraft?: { draftId?: string; updatedAt?: string } | null
}

export const getVerificationMyStatus = async (): Promise<VerificationMyStatus> => {
  const response = await api.get<VerificationMyStatus>('/api/verification/my-status')
  return response.data
}

/** Top-level verification state (PENDING, APPROVED, REJECTED, …). */
export function getVerificationWire(status: VerificationMyStatus | null | undefined): {
  verificationState: string | null
  kycStatus: string | null
} {
  if (!status) return { verificationState: null, kycStatus: null }
  const verificationState =
    status.verificationStatus ?? status.verification?.status ?? null
  const kycStatus = status.kycStatus ?? null
  return { verificationState, kycStatus }
}

/**
 * User should open the Didit flow when artisan verification is still pending admin and KYC is incomplete:
 * - `NOT_STARTED`: no session yet (or cleared after Abandoned).
 * - `PENDING`: open Didit session (set on `/verification/start`); not the same as “admin approved your docs.”
 * When `kycStatus === 'APPROVED'`, KYC is done — only admin review may still be pending.
 */
export function shouldRedirectToDiditKyc(
  status: VerificationMyStatus | null | undefined,
): boolean {
  const { verificationState, kycStatus } = getVerificationWire(status)
  if (verificationState !== 'PENDING') return false
  if (kycStatus === 'NOT_STARTED') return true
  if (kycStatus === 'APPROVED' || kycStatus === 'REJECTED') return false
  if (kycStatus === 'PENDING') {
    if (status?.kycVerifiedAt) return false
    return true
  }
  return false
}

/** Open Didit session in progress (user can call `/verification/start` again to continue). */
export function hasOpenDiditKycSession(
  status: VerificationMyStatus | null | undefined,
): boolean {
  const { kycStatus } = getVerificationWire(status)
  return kycStatus === 'PENDING' && !status?.kycVerifiedAt
}

/**
 * KYC approved but artisan verification still pending admin — user can complete Krafter profile
 * onboarding while waiting (e.g. `/krafter/profile-completion`).
 */
export function shouldRouteToKrafterProfileOnboarding(
  status: VerificationMyStatus | null | undefined,
): boolean {
  const { verificationState, kycStatus } = getVerificationWire(status)
  return verificationState === 'PENDING' && kycStatus === 'APPROVED'
}

/** POST /api/verification/start — `{ verificationUrl }` from backend (Didit session). */
export async function startDiditKycSession(): Promise<{ verificationUrl: string }> {
  const response = await api.post<Record<string, unknown>>('/api/verification/start', {})
  const data = response.data ?? {}
  const verificationUrl =
    (typeof data.verificationUrl === 'string' && data.verificationUrl) ||
    (typeof data.url === 'string' && data.url) ||
    (typeof data.redirectUrl === 'string' && data.redirectUrl) ||
    (typeof data.sessionUrl === 'string' && data.sessionUrl) ||
    (typeof data.link === 'string' && data.link)
  if (!verificationUrl) {
    throw new Error('No verification URL returned from server')
  }
  return { verificationUrl }
}

/** Server-stored verification draft payload (partial merge). */
export type VerificationDraftPayload = Record<string, unknown>

export interface VerificationDraftEnvelope {
  draftId: string | null
  payload: VerificationDraftPayload | null
  createdAt: string | null
  updatedAt: string | null
}

/** GET /api/verification/draft — load draft for resume */
export const getVerificationDraft = async (): Promise<VerificationDraftEnvelope> => {
  const response = await api.get<VerificationDraftEnvelope>('/api/verification/draft')
  return response.data
}

/** POST /api/verification/draft — upsert draft (merge payload) */
export const saveVerificationDraft = async (
  body: Record<string, unknown>,
): Promise<VerificationDraftEnvelope> => {
  const response = await api.post<VerificationDraftEnvelope>('/api/verification/draft', body)
  return response.data
}

/** PATCH /api/verification/draft/:draftId — merge into existing draft */
export const patchVerificationDraft = async (
  draftId: string,
  body: Record<string, unknown>,
): Promise<VerificationDraftEnvelope> => {
  const response = await api.patch<VerificationDraftEnvelope>(
    `/api/verification/draft/${draftId}`,
    body,
  )
  return response.data
}
