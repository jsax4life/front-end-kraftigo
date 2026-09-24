import type { KrafterProfileCompletionSummary } from "@/lib/api/krafter-profile-completion";
import { canAccessKrafterDashboard } from "@/lib/krafterProfileCompletionDisplay";
import type { VerificationMyStatus } from "@/lib/api/verification";
import {
  getVerificationWire,
  shouldRedirectToDiditKyc,
  shouldRouteToKrafterProfileOnboarding,
} from "@/lib/api/verification";
import { useAuthStore } from "@/store/useAuthStore";
import {
  KRAFTER_SIGNUP_URL,
  KRAFTER_VERIFICATION_ROUTE,
  setKrafterSignupIntent,
} from "@/lib/krafterSignupIntent";

export type KrafterCtaState = {
  isKrafterEligible: boolean;
  bannerTitle: string;
  buttonLabel: string;
};

/** Marketplace-ready Krafters can switch to the Krafter dashboard (backend `allComplete`). */
export function getKrafterCtaState(
  verificationStatus: VerificationMyStatus | null | undefined,
  profileCompletionSummary?: KrafterProfileCompletionSummary | null,
): KrafterCtaState {
  if (canAccessKrafterDashboard(profileCompletionSummary)) {
    return {
      isKrafterEligible: true,
      bannerTitle: "GO TO KRAFTER DASHBOARD",
      buttonLabel: "Switch to Krafter",
    };
  }

  const { verificationState, kycStatus } = getVerificationWire(verificationStatus);

  const isKrafterEligible =
    kycStatus === "APPROVED" &&
    (verificationState === "PENDING" || verificationState === "APPROVED");

  return {
    isKrafterEligible,
    bannerTitle: isKrafterEligible
      ? "GO TO KRAFTER DASHBOARD"
      : "EARN MONEY BY COMPLETING KRAFTS",
    buttonLabel: isKrafterEligible ? "Switch to Krafter" : "Become a Krafter",
  };
}

/** Same routing as the profile page Krafter CTA. */
export function navigateKrafterCta(
  router: { push: (href: string) => void },
  verificationStatus: VerificationMyStatus | null | undefined,
  profileCompletionSummary?: KrafterProfileCompletionSummary | null,
): void {
  const { isKrafterEligible } = getKrafterCtaState(
    verificationStatus,
    profileCompletionSummary,
  );
  const isAuthenticated = useAuthStore.getState().isAuthenticated;

  if (isKrafterEligible) {
    try {
      window.localStorage.removeItem("kraftigo_profile_mode");
    } catch {
      /* ignore */
    }
    router.push("/tasker/dashboard");
    return;
  }

  if (!isAuthenticated) {
    setKrafterSignupIntent();
    router.push(KRAFTER_SIGNUP_URL);
    return;
  }

  if (shouldRedirectToDiditKyc(verificationStatus)) {
    router.push("/krafter/kyc-welcome");
    return;
  }
  if (shouldRouteToKrafterProfileOnboarding(verificationStatus)) {
    router.push("/krafter/profile-completion");
    return;
  }
  router.push(KRAFTER_VERIFICATION_ROUTE);
}
