"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useProfileStore } from "@/store/useProfileStore";
import { canAccessKrafterDashboard } from "@/lib/krafterProfileCompletionDisplay";

function userIsArtisan(roles: string[] | undefined): boolean {
  if (!roles?.length) return false;
  return roles.includes("ARTISAN") || roles.includes("TASKER") || roles.includes("tasker");
}

const Page = () => {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { fetchKrafterProfileCompletionSummary } = useProfileStore();

  useEffect(() => {
    if (isAuthenticated) {
      (async () => {
        if (userIsArtisan(user?.roles)) {
          try {
            await fetchKrafterProfileCompletionSummary();
            if (
              canAccessKrafterDashboard(
                useProfileStore.getState().profileCompletionSummary,
              )
            ) {
              router.replace("/tasker/dashboard");
              return;
            }
          } catch {
            /* fall through to customer home */
          }
        }

        router.replace("/");
      })();
    } else {
      router.replace("/user/login");
    }
  }, [isAuthenticated, router, fetchKrafterProfileCompletionSummary, user?.roles]);

  return null;
};

export default Page;
