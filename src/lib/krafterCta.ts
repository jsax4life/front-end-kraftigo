import type { VerificationMyStatus } from "@/lib/api/verification";
import {
  getVerificationWire,
  shouldRedirectToDiditKyc,
  shouldRouteToKrafterProfileOnboarding,
} from "@/lib/api/verification";

export type KrafterCtaState = {
  isKrafterEligible: boolean;
  bannerTitle: string;
  buttonLabel: string;
};

/** Shared labels + eligibility for profile card and home banner routing. */
export function getKrafterCtaState(
  verificationStatus: VerificationMyStatus | null | undefined,
): KrafterCtaState {
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
): void {
  const { isKrafterEligible } = getKrafterCtaState(verificationStatus);

  if (isKrafterEligible) {
    try {
      window.localStorage.removeItem("kraftigo_profile_mode");
    } catch {
      /* ignore */
    }
    router.push("/tasker/dashboard");
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
  router.push("/krafter/verification");
}
