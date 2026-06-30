"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useProfileStore } from "@/store/useProfileStore";
import { getVerificationWire } from "@/lib/api/verification";

const Page = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { fetchVerificationStatus, verificationStatus } = useProfileStore();

  useEffect(() => {
    // If authenticated, go to home
    if (isAuthenticated) {
      (async () => {
        await fetchVerificationStatus();
        const { verificationState, kycStatus } = getVerificationWire(
          useProfileStore.getState().verificationStatus,
        );

        // Default to krafter screens when KYC is approved and internal verification is pending/approved.
        if (
          kycStatus === "APPROVED" &&
          (verificationState === "PENDING" || verificationState === "APPROVED")
        ) {
          router.replace("/tasker/dashboard");
          return;
        }

        router.replace("/");
      })();
    } else {
      // Per user request: redirect to login if not authenticated or if an error happens
      // This ensures the user is forced into the login flow immediately
      router.replace("/user/login");
    }
  }, [isAuthenticated, router, fetchVerificationStatus]);

  // Return null because this is a redirect-only page
  return null;
};

export default Page;
