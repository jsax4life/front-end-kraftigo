import { getPendingEmailVerification } from "@/lib/pendingEmailVerification";

/** Persisted while a user signs up via a "become a Krafter" link. */
export const KRAFTER_SIGNUP_INTENT_KEY = "kraftigo_krafter_signup_intent";

/** Primary signup URL for Krafter recruitment links. */
export const KRAFTER_SIGNUP_URL = "/user/createacc?intent=krafter";

/** Short marketing alias — redirects to {@link KRAFTER_SIGNUP_URL}. */
export const KRAFTER_SIGNUP_SHORT_URL = "/krafter/signup";

export const KRAFTER_VERIFICATION_ROUTE = "/krafter/verification";

export function setKrafterSignupIntent(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KRAFTER_SIGNUP_INTENT_KEY, "1");
}

export function getKrafterSignupIntent(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(KRAFTER_SIGNUP_INTENT_KEY) === "1";
}

export function clearKrafterSignupIntent(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KRAFTER_SIGNUP_INTENT_KEY);
}

export function isKrafterSignupIntentParam(value: string | null | undefined): boolean {
  const normalized = value?.trim().toLowerCase();
  return normalized === "krafter" || normalized === "become-krafter";
}

export function syncKrafterSignupIntentFromSearchParams(
  params: Pick<URLSearchParams, "get">,
): boolean {
  if (isKrafterSignupIntentParam(params.get("intent"))) {
    setKrafterSignupIntent();
    return true;
  }
  return false;
}

/** Re-apply Krafter intent saved alongside a pending email verification. */
export function restoreKrafterSignupIntentFromPendingVerification(): boolean {
  if (getPendingEmailVerification()?.krafterSignupIntent) {
    setKrafterSignupIntent();
    return true;
  }
  return false;
}

/** Build a verify-email URL; backend emails can append `intent=krafter` for Krafter signups. */
export function buildVerifyEmailUrl(
  email: string,
  code: string,
  options?: { krafterIntent?: boolean },
): string {
  const params = new URLSearchParams({
    email,
    code,
  });
  if (options?.krafterIntent) {
    params.set("intent", "krafter");
  }
  return `/user/verify-email?${params.toString()}`;
}
