import api from '@/lib/axios'

/**
 * Verification + Didit KYC (frontend contract)
 *
 * - Start: `POST /api/verification/start` with JWT → `{ verificationUrl }` → redirect the user there.
 * - Return: user lands on `/verification/didit-return` (configure `FRONTEND_URL` on the backend).
 * - Sync on return: `POST /api/verification/didit-return` (alias `POST /api/verification/sync`) with
 *   `{ verificationSessionId, providerStatus? }` — fetches Didit decision and applies webhook logic.
 * - Real KYC state: `GET /api/verification/my-status` → `kycStatus`, `kycSessionCreatedAt`, `kycVerifiedAt`.
 *   Treat `kycVerifiedAt` as approved even if `kycStatus` still reads `PENDING` briefly.
 * - Do **not** call `POST /api/webhooks/didit` from the browser — that route is Didit → backend only.
 */

/** KYC as returned by `GET /api/verification/my-status` after Didit processing. */
export type KycStatus = 'NOT_STARTED' | 'PENDING' | 'APPROVED' | 'REJECTED'

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function pickString(obj: Record<string, unknown> | null, ...keys: string[]): string | undefined {
  if (!obj) return undefined
  for (const key of keys) {
    const value = obj[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return undefined
}

function unwrapApiPayload(raw: unknown): Record<string, unknown> {
  const root = asRecord(raw)
  if (!root) return {}
  const nested = asRecord(root.data)
  return nested ?? root
}

/** Normalize Didit / API status tokens (`Approved`, `in review`, …). */
export function normalizeKycStatusToken(raw: string | null | undefined): KycStatus | null {
  if (!raw?.trim()) return null
  const token = raw.trim().toUpperCase().replace(/[\s-]+/g, '_')
  if (token === 'APPROVED' || token === 'APPROVE' || token === 'COMPLETED' || token === 'SUCCESS') {
    return 'APPROVED'
  }
  if (token === 'REJECTED' || token === 'DECLINED' || token === 'FAILED' || token === 'FAIL') {
    return 'REJECTED'
  }
  if (token === 'PENDING' || token === 'IN_REVIEW' || token === 'IN_PROGRESS' || token === 'PROCESSING') {
    return 'PENDING'
  }
  if (token === 'NOT_STARTED' || token === 'NOTSTARTED' || token === 'ABANDONED') {
    return 'NOT_STARTED'
  }
  return null
}

/** Didit redirect `status=Approved` — reference only; server state wins when synced. */
export function isProviderDiditApproved(providerStatus: string | null | undefined): boolean {
  return normalizeKycStatusToken(providerStatus) === 'APPROVED'
}

export function isProviderDiditRejected(providerStatus: string | null | undefined): boolean {
  return normalizeKycStatusToken(providerStatus) === 'REJECTED'
}

/** Coerce `GET /api/verification/my-status` (camelCase, snake_case, or `{ data }` envelope). */
export function normalizeVerificationMyStatus(raw: unknown): VerificationMyStatus {
  const body = unwrapApiPayload(raw)
  const verification = asRecord(body.verification)

  const kycVerifiedAt =
    pickString(body, 'kycVerifiedAt', 'kyc_verified_at') ??
    pickString(verification, 'kycVerifiedAt', 'kyc_verified_at') ??
    null

  const rawKyc =
    pickString(body, 'kycStatus', 'kyc_status') ??
    pickString(verification, 'kycStatus', 'kyc_status')

  let kycStatus = normalizeKycStatusToken(rawKyc) ?? (rawKyc ? (rawKyc.toUpperCase() as KycStatus) : undefined)

  if (kycVerifiedAt && kycStatus !== 'REJECTED') {
    kycStatus = 'APPROVED'
  }

  const verificationStatus =
    pickString(body, 'verificationStatus', 'verification_status') ??
    pickString(verification, 'status')

  return {
    ...(body as VerificationMyStatus),
    verificationStatus,
    verification: verification
      ? ({
          ...(verification as VerificationMyStatus['verification']),
          status: pickString(verification, 'status') ?? verificationStatus,
        } as VerificationMyStatus['verification'])
      : body.verification ?? null,
    kycStatus,
    kycSessionCreatedAt:
      pickString(body, 'kycSessionCreatedAt', 'kyc_session_created_at') ?? null,
    kycVerifiedAt,
  }
}

/** Effective KYC for UI — `kycVerifiedAt` means identity check passed even if `kycStatus` lags. */
export function resolveEffectiveKycStatus(
  status: VerificationMyStatus | null | undefined,
): KycStatus | null {
  if (!status) return null
  if (status.kycVerifiedAt?.trim()) return 'APPROVED'
  const normalized = normalizeKycStatusToken(status.kycStatus)
  return normalized ?? (status.kycStatus ? (String(status.kycStatus).toUpperCase() as KycStatus) : null)
}

export function isTerminalEffectiveKyc(status: VerificationMyStatus | null | undefined): boolean {
  const kyc = resolveEffectiveKycStatus(status)
  return kyc === 'APPROVED' || kyc === 'REJECTED'
}

export function shouldPollVerificationMyStatus(status: VerificationMyStatus | null | undefined): boolean {
  const kyc = resolveEffectiveKycStatus(status)
  return kyc === 'PENDING' || kyc === 'NOT_STARTED' || kyc === null
}

/** GET /api/verification/my-status */
export interface VerificationMyStatus {
  artisanId?: string | null
  verification?: {
    id?: string
    status?: string
    rejectionReason?: string | null
    submittedAt?: string | null
    reviewedAt?: string | null
    governmentIdType?: string | null
  } | null
  verificationStatus?: string
  kycStatus?: KycStatus | string
  /** Set when `POST /api/verification/start` succeeds (open Didit session). */
  kycSessionCreatedAt?: string | null
  /** Set when KYC is completed (approved) on our side. */
  kycVerifiedAt?: string | null
  /** True when artisan profile has all required fields completed (backend computed). */
  isProfileCompleted?: boolean
  hasStartedArtisanOnboarding?: boolean
  verificationDraft?: { draftId?: string; updatedAt?: string } | null
}

export const getVerificationMyStatus = async (): Promise<VerificationMyStatus> => {
  const response = await api.get<unknown>('/api/verification/my-status')
  return normalizeVerificationMyStatus(response.data)
}

/**
 * Pull Didit decision for the browser return URL (webhook fallback / unstick).
 * Tries `POST /api/verification/didit-return`, then alias `POST /api/verification/sync`.
 */
export async function syncDiditVerificationReturn(params: {
  verificationSessionId: string
  providerStatus?: string | null
}): Promise<VerificationMyStatus | null> {
  const verificationSessionId = params.verificationSessionId.trim()
  if (!verificationSessionId) return null

  const providerStatus = params.providerStatus?.trim()
  const payload = {
    verificationSessionId,
    ...(providerStatus ? { providerStatus } : {}),
  }

  for (const path of ['/api/verification/didit-return', '/api/verification/sync']) {
    try {
      const response = await api.post<unknown>(path, payload)
      return normalizeVerificationMyStatus(response.data)
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status
      if (status === 404 || status === 405) continue
      throw error
    }
  }

  return null
}

/** Top-level verification state (PENDING, APPROVED, REJECTED, …). */
export function getVerificationWire(status: VerificationMyStatus | null | undefined): {
  verificationState: string | null
  kycStatus: string | null
} {
  if (!status) return { verificationState: null, kycStatus: null }
  const verificationState =
    status.verificationStatus ?? status.verification?.status ?? null
  const kycStatus = resolveEffectiveKycStatus(status)
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
  const { verificationState } = getVerificationWire(status)
  const kycStatus = resolveEffectiveKycStatus(status)
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
  const { verificationState } = getVerificationWire(status)
  const kycStatus = resolveEffectiveKycStatus(status)
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

/** Krafter-facing route after Didit — never the customer profile. */
export function getKrafterVerificationContinuePath(
  status: VerificationMyStatus | null | undefined,
): string {
  if (shouldRouteToKrafterProfileOnboarding(status)) {
    return "/krafter/profile-completion";
  }
  if (shouldRedirectToDiditKyc(status)) {
    return "/krafter/kyc-welcome";
  }
  const { verificationState } = getVerificationWire(status);
  if (verificationState === "PENDING") {
    return "/krafter/verification";
  }
  return "/krafter/verification";
}
