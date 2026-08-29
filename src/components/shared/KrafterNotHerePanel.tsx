"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import type { Booking } from "@/types";
import { reportKrafterNotHere } from "@/lib/api/fraudPrevention";
import { apiErrorMessage, isValidationClientError } from "@/lib/apiErrorMessage";
import {
  isConfirmedStatus,
  isInProgressStatus,
  isKrafterNotHereWindowOpen,
  resolveNoShowGraceMinutes,
} from "@/lib/bookingSafety";
import { useBookingsStore } from "@/store/useBookingsStore";
import { useDisputesStore } from "@/store/useDisputesStore";
import Button from "@/components/ui/button";

type Props = {
  booking: Booking;
  onUpdated?: (booking: Booking) => void;
};

export default function KrafterNotHerePanel({ booking, onUpdated }: Props) {
  const refetchBookingSilent = useBookingsStore((s) => s.refetchBookingSilent);
  const applyCanonicalBooking = useBookingsStore((s) => s.applyCanonicalBooking);
  const fetchMyDisputes = useDisputesStore((s) => s.fetchMyDisputes);
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(
    "I have waited at the service address and the Krafter is absent.",
  );
  const [busy, setBusy] = useState(false);
  const [windowOpen, setWindowOpen] = useState(false);

  const eligible = isConfirmedStatus(booking.status) || isInProgressStatus(booking.status);

  useEffect(() => {
    if (!eligible) return;
    const tick = () => setWindowOpen(isKrafterNotHereWindowOpen(booking));
    tick();
    const id = window.setInterval(tick, 15_000);
    return () => window.clearInterval(id);
  }, [booking, eligible]);

  if (!eligible || !windowOpen) return null;

  const grace = resolveNoShowGraceMinutes(booking);

  const submit = async () => {
    if (busy) return;
    const text = details.trim();
    if (text.length < 8) {
      toast.error("Please describe what happened.");
      return;
    }
    setBusy(true);
    try {
      await reportKrafterNotHere(booking.id, text);
      const fresh = await refetchBookingSilent(booking.id, { includePaymentSummary: true });
      if (fresh) {
        applyCanonicalBooking(fresh);
        onUpdated?.(fresh);
      }
      void fetchMyDisputes().catch(() => {});
      toast.success(
        isInProgressStatus(booking.status)
          ? "Incident reported. This booking is now under dispute."
          : "No-show reported. The booking will update shortly.",
      );
      setOpen(false);
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not report that the Krafter is not here."));
      if (isValidationClientError(error)) {
        const fresh = await refetchBookingSilent(booking.id, { includePaymentSummary: true });
        if (fresh) onUpdated?.(fresh);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-700" />
        <div>
          <h3 className="text-[14px] font-poppins font-semibold text-amber-950">
            Krafter not here
          </h3>
          <p className="text-[12px] font-poppins text-amber-900/90 mt-0.5 leading-relaxed">
            Available after the scheduled start plus a {grace}-minute wait. If work has not
            started this cancels and refunds; if it already started, funds are frozen in a dispute.
          </p>
        </div>
      </div>

      {!open ? (
        <Button type="button" variant="outline" fullWidth onClick={() => setOpen(true)}>
          Report Krafter not here
        </Button>
      ) : (
        <div className="space-y-3">
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            maxLength={2000}
            disabled={busy}
            className="w-full h-24 p-3 bg-white border border-amber-200 rounded-xl text-[13px] font-poppins resize-none focus:outline-none focus:border-brand-orange"
          />
          <div className="flex gap-2">
            <Button type="button" variant="outline" fullWidth disabled={busy} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="primary" fullWidth disabled={busy} onClick={() => void submit()}>
              {busy ? "Reporting…" : "Submit incident"}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
