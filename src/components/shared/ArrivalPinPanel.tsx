"use client";

import { useEffect, useState } from "react";
import { KeyRound, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import type { Booking } from "@/types";
import { generateArrivalPin } from "@/lib/api/fraudPrevention";
import { apiErrorMessage, apiStatusCode } from "@/lib/apiErrorMessage";
import {
  arrivalPinCooldownRemainingMs,
  readArrivalPin,
  rememberArrivalPin,
} from "@/lib/arrivalPinMemory";
import { isConfirmedStatus, syncArrivalPinWithBookingStatus } from "@/lib/bookingSafety";
import { useBookingsStore } from "@/store/useBookingsStore";
import Button from "@/components/ui/button";

type Props = {
  booking: Booking;
};

export default function ArrivalPinPanel({ booking }: Props) {
  const refetchBookingSilent = useBookingsStore((s) => s.refetchBookingSilent);
  const [pin, setPin] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [cooldownMs, setCooldownMs] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    syncArrivalPinWithBookingStatus(booking.id, booking.status);
    if (!isConfirmedStatus(booking.status)) {
      setPin(null);
      setExpiresAt(null);
      return;
    }
    const remembered = readArrivalPin(booking.id);
    setPin(remembered?.pin ?? null);
    setExpiresAt(remembered?.expiresAt ?? null);
    setCooldownMs(arrivalPinCooldownRemainingMs(booking.id));
  }, [booking.id, booking.status]);

  useEffect(() => {
    if (cooldownMs <= 0) return;
    const t = window.setInterval(() => {
      setCooldownMs(arrivalPinCooldownRemainingMs(booking.id));
    }, 500);
    return () => window.clearInterval(t);
  }, [booking.id, cooldownMs]);

  if (!isConfirmedStatus(booking.status)) return null;

  const cooldownSec = Math.ceil(cooldownMs / 1000);

  const issuePin = async () => {
    if (busy || cooldownMs > 0) return;
    setBusy(true);
    try {
      const result = await generateArrivalPin(booking.id);
      rememberArrivalPin(result.bookingId || booking.id, result.arrivalPin, result.expiresAt);
      setPin(result.arrivalPin);
      setExpiresAt(result.expiresAt);
      setCooldownMs(arrivalPinCooldownRemainingMs(booking.id));
    } catch (error) {
      const code = apiStatusCode(error);
      toast.error(apiErrorMessage(error, "Arrival PIN is unavailable right now."));
      if (code === 400 || code === 409) {
        await refetchBookingSilent(booking.id);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <KeyRound size={18} className="mt-0.5 shrink-0 text-brand-blue" />
        <div>
          <h3 className="text-[14px] font-poppins font-semibold text-blue-950">Arrival PIN</h3>
          <p className="text-[12px] font-poppins text-blue-800/90 mt-0.5 leading-relaxed">
            Show this six-digit PIN to your Krafter when they arrive. It is one-use and is not
            stored on this device.
          </p>
        </div>
      </div>

      {pin ? (
        <p
          className="text-center font-mono text-[32px] tracking-[0.35em] text-blue-950 py-2"
          aria-live="polite"
        >
          {pin}
        </p>
      ) : (
        <p className="text-[12px] font-poppins text-blue-900/80">
          Generate a PIN when the Krafter is at the door. Regeneration invalidates the previous PIN.
        </p>
      )}

      {expiresAt ? (
        <p className="text-[11px] font-poppins text-blue-800/80">
          Expires {new Date(expiresAt).toLocaleString()}
        </p>
      ) : null}

      <Button
        type="button"
        variant="primary"
        fullWidth
        disabled={busy || cooldownMs > 0}
        onClick={() => void issuePin()}
      >
        {busy ? (
          "Requesting PIN…"
        ) : cooldownMs > 0 ? (
          `Wait ${cooldownSec}s to regenerate`
        ) : (
          <span className="inline-flex items-center gap-2">
            <RefreshCw size={16} />
            {pin ? "Regenerate PIN" : "Show arrival PIN"}
          </span>
        )}
      </Button>
    </section>
  );
}
