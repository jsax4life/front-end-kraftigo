import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useAuthStore } from "@/store/useAuthStore";
import { useProfileStore } from "@/store/useProfileStore";
import {
  getKrafterSignupIntent,
  KRAFTER_VERIFICATION_ROUTE,
} from "@/lib/krafterSignupIntent";
import { canAccessKrafterDashboard } from "@/lib/krafterProfileCompletionDisplay";

function userIsArtisan(): boolean {
  const roles = useAuthStore.getState().user?.roles ?? [];
  return roles.includes("ARTISAN") || roles.includes("TASKER") || roles.includes("tasker");
}

/** Same routing as email login — Krafter dashboard when marketplace-ready per backend summary. */
export async function routeAfterAuthLogin(router: AppRouterInstance): Promise<void> {
  try {
    if (getKrafterSignupIntent()) {
      router.replace(KRAFTER_VERIFICATION_ROUTE);
      return;
    }

    if (userIsArtisan()) {
      try {
        await useProfileStore.getState().fetchKrafterProfileCompletionSummary();
      } catch {
        /* fall through */
      }
      if (
        canAccessKrafterDashboard(
          useProfileStore.getState().profileCompletionSummary,
        )
      ) {
        router.replace("/tasker/dashboard");
        return;
      }
      if (userIsArtisan()) {
        router.replace("/tasker/switch-acct");
        return;
      }
    }

    router.replace("/");
  } catch {
    router.replace("/");
  }
}
