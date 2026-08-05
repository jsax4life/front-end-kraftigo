/** Emitted when KYC / artisan verification domain events arrive; profile screens re-fetch status. */
export const KYC_VERIFICATION_STATUS_INVALIDATE_EVENT =
  "kraftigo:kyc-verification-status-invalidate";

export function emitKycVerificationStatusInvalidate(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(KYC_VERIFICATION_STATUS_INVALIDATE_EVENT));
}

/** Placeholder for future web push — mirrors backend KycNotificationsService push stubs. */
export function logKycPushStub(
  eventType: string,
  payload: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  if (process.env.NODE_ENV === "production") return;
  console.info("[KycNotifications] push stub", eventType, payload);
}

export const KYC_DOMAIN_EVENT_TYPES = [
  "ARTISAN_VERIFIED",
  "ARTISAN_KYC_REJECTED",
  "ARTISAN_KYC_UNDER_REVIEW",
  "ARTISAN_KYC_ACTION_REQUIRED",
] as const;

export type KycDomainEventType = (typeof KYC_DOMAIN_EVENT_TYPES)[number];

export function isKycDomainEventType(type: string): type is KycDomainEventType {
  return (KYC_DOMAIN_EVENT_TYPES as readonly string[]).includes(type);
}
