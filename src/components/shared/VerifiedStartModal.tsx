"use client";

import { useState } from "react";
import { MapPin, ShieldCheck, X } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/ui/button";
import type { Booking } from "@/types";
import type { ArtisanStartBookingPayload } from "@/lib/api/bookings";
import { mapStartVerificationError } from "@/lib/apiErrorMessage";
import {
  captureFreshLocation,
  getOrCreateDeviceId,
  isValidArrivalPin,
  normalizeArrivalPin,
} from "@/lib/workVerification";

type VerifiedStartModalProps = {
  open: boolean;
  booking: Booking;
  onClose: () => void;
  onStart: (payload: ArtisanStartBookingPayload) => Promise<Booking>;
  onStarted?: (booking: Booking) => void;
};

export default function VerifiedStartModal({
  open,
  booking,
  onClose,
  onStart,
  onStarted,
}: VerifiedStartModalProps) {
  const [arrivalPin, setArrivalPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) return null;

  const submit = async () => {
    if (!isValidArrivalPin(arrivalPin)) {
      toast.error("Enter the six-digit arrival PIN shown by the customer.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Capture immediately before the request; do not reuse a stored position.
      const location = await captureFreshLocation();
      const updated = await onStart({
        arrivalPin,
        ...location,
        deviceId: getOrCreateDeviceId(),
      });
      onStarted?.(updated);
      setArrivalPin("");
      toast.success("Job started and your arrival was verified.");
      onClose();
    } catch (error: unknown) {
      toast.error(mapStartVerificationError(error, "Could not verify the job start."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-70 flex items-end justify-center bg-black/55"
      role="dialog"
      aria-modal="true"
      aria-labelledby="verified-start-title"
      onClick={isSubmitting ? undefined : onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-brand-orange">
              <ShieldCheck size={20} />
              <span className="text-xs font-semibold uppercase tracking-wide">Verified start</span>
            </div>
            <h2 id="verified-start-title" className="font-gerat text-2xl font-bold text-gray-900">
              Start {booking.title || booking.service?.title || "this job"}
            </h2>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="rounded-full p-2 hover:bg-gray-100 disabled:opacity-50"
            aria-label="Close"
          >
            <X size={21} />
          </button>
        </div>

        <p className="mb-5 text-sm leading-relaxed text-gray-600">
          Ask the customer for their arrival PIN. Precise location is captured only when you
          press Verify and start.
        </p>

        <label htmlFor="arrival-pin" className="mb-2 block text-sm font-semibold text-gray-800">
          Six-digit arrival PIN
        </label>
        <input
          id="arrival-pin"
          value={arrivalPin}
          onChange={(event) => setArrivalPin(normalizeArrivalPin(event.target.value))}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={6}
          disabled={isSubmitting}
          placeholder="000000"
          className="mb-4 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-center font-mono text-3xl tracking-[0.4em] outline-none focus:border-brand-orange disabled:opacity-60"
        />

        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <MapPin size={18} className="mt-0.5 shrink-0 text-brand-blue" />
          <p className="text-xs leading-relaxed text-blue-900">
            Location permission and good GPS accuracy are required. The server verifies the
            schedule, payment, one-use PIN, geofence, and device signal.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          fullWidth
          disabled={isSubmitting || !isValidArrivalPin(arrivalPin)}
          onClick={() => void submit()}
        >
          {isSubmitting ? "Capturing location and verifying…" : "Verify and start"}
        </Button>
      </div>
    </div>
  );
}
