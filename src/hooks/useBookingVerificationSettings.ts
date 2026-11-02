"use client";

import { useEffect, useState } from "react";
import {
  type BookingVerificationSettings,
  getArtisanBookingVerificationSettings,
  getCustomerBookingVerificationSettings,
} from "@/lib/bookingVerificationSettings";

type Audience = "customer" | "artisan";

export function useBookingVerificationSettings(audience: Audience) {
  const [settings, setSettings] = useState<BookingVerificationSettings | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load =
      audience === "customer"
        ? getCustomerBookingVerificationSettings()
        : getArtisanBookingVerificationSettings();
    void load.then((s) => {
      if (!cancelled) setSettings(s);
    });
    return () => {
      cancelled = true;
    };
  }, [audience]);

  return {
    settings,
    loading: settings === null,
    arrivalPinEnabled: settings?.arrivalPinEnabled ?? false,
    completionProofRequired: settings?.completionProofRequired ?? false,
  };
}
