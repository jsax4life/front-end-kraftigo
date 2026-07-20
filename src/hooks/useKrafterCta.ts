"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useProfileStore } from "@/store/useProfileStore";
import { getKrafterCtaState, navigateKrafterCta } from "@/lib/krafterCta";

type UseKrafterCtaOptions = {
  /** When false, skips the background verification fetch (e.g. logged-out home). */
  enabled?: boolean;
};

/** Load verification status once (silent) and expose shared Krafter CTA state + navigation. */
export function useKrafterCta(options?: UseKrafterCtaOptions) {
  const enabled = options?.enabled ?? true;
  const router = useRouter();
  const verificationStatus = useProfileStore((s) => s.verificationStatus);
  const fetchVerificationStatusSilent = useProfileStore((s) => s.fetchVerificationStatusSilent);

  useEffect(() => {
    if (!enabled) return;
    void fetchVerificationStatusSilent();
  }, [enabled, fetchVerificationStatusSilent]);

  const cta = useMemo(() => getKrafterCtaState(verificationStatus), [verificationStatus]);

  const handleAction = useCallback(() => {
    navigateKrafterCta(router, verificationStatus);
  }, [router, verificationStatus]);

  return { ...cta, handleAction, verificationStatus };
}
