"use client";

import { useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/ui/button";
import { apiErrorMessage } from "@/lib/apiErrorMessage";
import { canOpenGeneralDispute } from "@/lib/bookingSafety";
import { useDisputesStore } from "@/store/useDisputesStore";
import { useBookingsStore } from "@/store/useBookingsStore";

type Props = {
  open: boolean;
  bookingId: string;
  bookingStatus?: string | null;
  onClose: () => void;
  onOpened?: (disputeId: string) => void;
};

export default function OpenDisputeModal({
  open,
  bookingId,
  bookingStatus,
  onClose,
  onOpened,
}: Props) {
  const openDispute = useDisputesStore((s) => s.openDispute);
  const isSubmitting = useDisputesStore((s) => s.isSubmitting);
  const refetchBookingSilent = useBookingsStore((s) => s.refetchBookingSilent);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");

  if (!open) return null;

  const allowed = canOpenGeneralDispute(bookingStatus);

  const submit = async () => {
    if (isSubmitting || !allowed) return;
    if (reason.trim().length < 3 || description.trim().length < 8) {
      toast.error("Enter a short reason and a detailed description.");
      return;
    }
    try {
      const dispute = await openDispute({
        bookingId,
        reason: reason.trim(),
        description: description.trim(),
      });
      await refetchBookingSilent(bookingId);
      toast.success("Dispute opened.");
      onOpened?.(dispute.id);
      onClose();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not open a dispute."));
      await refetchBookingSilent(bookingId);
    }
  };

  return (
    <div className="fixed inset-0 z-70 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md p-6">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-[20px] font-gerat font-bold">Open a dispute</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-100" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        {!allowed ? (
          <p className="text-[13px] font-poppins text-gray-600">
            Disputes can be opened after work starts, completes, is cancelled, or enters
            completion review.
          </p>
        ) : (
          <div className="space-y-3">
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-poppins"
              placeholder="Short factual reason"
              maxLength={200}
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-28 p-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-poppins resize-none"
              placeholder="Detailed description of the disagreement"
              maxLength={5000}
            />
            <Button type="button" variant="primary" fullWidth disabled={isSubmitting} onClick={() => void submit()}>
              {isSubmitting ? "Opening…" : "Open dispute"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
