import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useProfileStore } from "@/store/useProfileStore";
import { getVerificationWire } from "@/lib/api/verification";
import {
  getKrafterSignupIntent,
  KRAFTER_VERIFICATION_ROUTE,
} from "@/lib/krafterSignupIntent";

/** Same routing as email login — Krafter dashboard vs customer home. */
export async function routeAfterAuthLogin(router: AppRouterInstance): Promise<void> {
  try {
    if (getKrafterSignupIntent()) {
      router.replace(KRAFTER_VERIFICATION_ROUTE);
      return;
    }

    try {
      await useProfileStore.getState().fetchVerificationStatusSilent();
    } catch {
      /* fall through to default route */
    }

    const { verificationState, kycStatus } = getVerificationWire(
      useProfileStore.getState().verificationStatus,
    );
    if (
      kycStatus === "APPROVED" &&
      (verificationState === "PENDING" || verificationState === "APPROVED")
    ) {
      router.replace("/tasker/dashboard");
      return;
    }

    router.replace("/");
  } catch {
    router.replace("/");
  }
}
