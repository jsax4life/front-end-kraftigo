import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useProfileStore } from "@/store/useProfileStore";
import { getVerificationWire } from "@/lib/api/verification";

/** Same routing as email login — Krafter dashboard vs customer home. */
export async function routeAfterAuthLogin(router: AppRouterInstance): Promise<void> {
  await useProfileStore.getState().fetchVerificationStatus();
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
}
