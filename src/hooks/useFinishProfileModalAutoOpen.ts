import { useCallback, useEffect, useRef, useState } from "react";
import type { KrafterProfileCompletionSummary } from "@/lib/api/krafter-profile-completion";

export function isKrafterProfileIncomplete(
  summary: KrafterProfileCompletionSummary | null | undefined,
): boolean {
  if (!summary) return false;
  return !summary.allComplete;
}

type UseFinishProfileModalAutoOpenOptions = {
  /** Rising edge opens the modal (e.g. ?modal=open after a profile step). */
  forceOpen?: boolean;
};

/**
 * Auto-opens the Finish Profile modal on the Krafter dashboard while
 * `profileCompletionSummary.allComplete` is false. Users may dismiss for the
 * current visit (progress widget still reopens it); returning to the dashboard
 * shows it again until the profile is complete.
 */
export function useFinishProfileModalAutoOpen(
  summary: KrafterProfileCompletionSummary | null,
  options?: UseFinishProfileModalAutoOpenOptions,
) {
  const [isOpen, setIsOpen] = useState(false);
  const dismissedThisVisitRef = useRef(false);
  const lastForceOpenRef = useRef(false);

  useEffect(() => {
    const forceOpen = options?.forceOpen === true;
    const forceOpenPulse = forceOpen && !lastForceOpenRef.current;
    lastForceOpenRef.current = forceOpen;

    if (forceOpenPulse) {
      dismissedThisVisitRef.current = false;
      setIsOpen(true);
      return;
    }

    if (!summary) {
      return;
    }

    if (summary.allComplete) {
      setIsOpen(false);
      return;
    }

    if (!dismissedThisVisitRef.current) {
      setIsOpen(true);
    }
  }, [summary, options?.forceOpen]);

  const open = useCallback(() => {
    dismissedThisVisitRef.current = false;
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    dismissedThisVisitRef.current = true;
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    open,
    close,
    isIncomplete: isKrafterProfileIncomplete(summary),
  };
}
