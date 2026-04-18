"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/components/ui/loader";
import toast from "react-hot-toast";
import {
  getVerificationMyStatus,
  getVerificationWire,
  shouldRedirectToDiditKyc,
  shouldRouteToKrafterProfileOnboarding,
  startDiditKycSession,
} from "@/lib/api/verification";

export default function KrafterKycPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const status = await getVerificationMyStatus();
        if (cancelled) return;
        if (!shouldRedirectToDiditKyc(status)) {
          const { verificationState, kycStatus } = getVerificationWire(status);
          if (shouldRouteToKrafterProfileOnboarding(status)) {
            router.replace("/krafter/dashboard");
          } else if (kycStatus === "REJECTED") {
            router.replace("/krafter/verification");
          } else if (verificationState === "PENDING") {
            router.replace("/krafter/dashboard");
            toast.success("Your verification is in progress.");
          } else {
            router.replace("/krafter/verification");
          }
          return;
        }
        const { verificationUrl } = await startDiditKycSession();
        if (cancelled) return;
        window.location.assign(verificationUrl);
      } catch (e: unknown) {
        if (cancelled) return;
        const err = e as { response?: { data?: { message?: string } }; message?: string };
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Could not start identity verification";
        setError(msg);
        toast.error(msg);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-white">
      {error ? (
        <p className="text-center text-sm font-poppins text-[rgba(0,0,0,0.7)] max-w-sm">
          {error}
        </p>
      ) : (
        <>
          <Loader />
          <p className="text-sm font-poppins text-[rgba(0,0,0,0.7)]">
            Redirecting to secure verification…
          </p>
        </>
      )}
    </div>
  );
}
