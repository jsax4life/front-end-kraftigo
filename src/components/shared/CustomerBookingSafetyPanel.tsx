"use client";

import { useState } from "react";
import type { Booking } from "@/types";
import ArrivalPinPanel from "@/components/shared/ArrivalPinPanel";
import KrafterNotHerePanel from "@/components/shared/KrafterNotHerePanel";
import CompletionDecisionPanel from "@/components/shared/CompletionDecisionPanel";
import ReauthorizeCompletionModal from "@/components/shared/ReauthorizeCompletionModal";
import OpenDisputeModal from "@/components/shared/OpenDisputeModal";
import {
  isCompletionSubmittedStatus,
  isConfirmedStatus,
  isDisputedStatus,
  isInProgressStatus,
} from "@/lib/bookingSafety";

type Props = {
  booking: Booking;
  onUpdated?: (booking: Booking) => void;
};

export default function CustomerBookingSafetyPanel({ booking, onUpdated }: Props) {
  const [reauthOpen, setReauthOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);

  return (
    <div className="space-y-3">
      {isConfirmedStatus(booking.status) && <ArrivalPinPanel booking={booking} />}

      {isInProgressStatus(booking.status) && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
          <p className="text-[14px] font-poppins font-semibold text-emerald-950">Krafter started</p>
          <p className="text-[12px] font-poppins text-emerald-900/90 mt-0.5">
            Work is in progress. Ordinary cancellation is unavailable. You can still report a
            Krafter-not-here incident if they are not at the address.
          </p>
        </div>
      )}

      <KrafterNotHerePanel booking={booking} onUpdated={onUpdated} />

      {isCompletionSubmittedStatus(booking.status) && (
        <CompletionDecisionPanel
          booking={booking}
          onUpdated={onUpdated}
          onReauthorize={() => setReauthOpen(true)}
        />
      )}

      {isDisputedStatus(booking.status) && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 space-y-2">
          <p className="text-[14px] font-poppins font-semibold text-red-950">This booking is disputed</p>
          <p className="text-[12px] font-poppins text-red-900/90">
            Payout is frozen. Submit evidence from Disputes. Do not treat this as completed or paid.
          </p>
          <button
            type="button"
            className="text-[13px] font-poppins font-semibold text-brand-orange"
            onClick={() => setDisputeOpen(true)}
          >
            Open another dispute statement
          </button>
        </div>
      )}

      <ReauthorizeCompletionModal
        open={reauthOpen}
        bookingId={booking.id}
        onClose={() => setReauthOpen(false)}
      />
      <OpenDisputeModal
        open={disputeOpen}
        bookingId={booking.id}
        bookingStatus={booking.status}
        onClose={() => setDisputeOpen(false)}
      />
    </div>
  );
}
