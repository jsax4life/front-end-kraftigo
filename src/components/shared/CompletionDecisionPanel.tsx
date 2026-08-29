"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, ImageIcon, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";
import type { Booking } from "@/types";
import {
  confirmBookingCompletion,
  disputeBookingCompletion,
} from "@/lib/api/fraudPrevention";
import { apiErrorMessage, isValidationClientError } from "@/lib/apiErrorMessage";
import {
  completionAnomalyFlags,
  completionDueAt,
  completionMediaUrls,
  formatAnomalyFlag,
  isCompletionSubmittedStatus,
} from "@/lib/bookingSafety";
import { useBookingsStore } from "@/store/useBookingsStore";
import { useDisputesStore } from "@/store/useDisputesStore";
import Button from "@/components/ui/button";

type Props = {
  booking: Booking;
  onUpdated?: (booking: Booking) => void;
  onReauthorize?: () => void;
};

function formatDue(iso: string | null): string {
  if (!iso) return "the server deadline";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function CompletionDecisionPanel({ booking, onUpdated, onReauthorize }: Props) {
  const applyCanonicalBooking = useBookingsStore((s) => s.applyCanonicalBooking);
  const refetchBookingSilent = useBookingsStore((s) => s.refetchBookingSilent);
  const fetchMyDisputes = useDisputesStore((s) => s.fetchMyDisputes);
  const [busy, setBusy] = useState<"confirm" | "dispute" | null>(null);
  const [showDispute, setShowDispute] = useState(false);
  const [reason, setReason] = useState("Work was not completed");
  const [description, setDescription] = useState("");
  const [now, setNow] = useState(Date.now());
  const [mediaFailed, setMediaFailed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const due = completionDueAt(booking);
  const dueMs = due ? Date.parse(due) : NaN;
  const remainingLabel = useMemo(() => {
    if (!isCompletionSubmittedStatus(booking.status)) return null;
    if (!due || Number.isNaN(dueMs)) return null;
    const diff = dueMs - now;
    if (diff <= 0) return "Deadline passed — awaiting server confirmation";
    const hours = Math.floor(diff / 3_600_000);
    const mins = Math.floor((diff % 3_600_000) / 60_000);
    return `${hours}h ${mins}m remaining`;
  }, [booking.status, due, dueMs, now]);

  if (!isCompletionSubmittedStatus(booking.status)) return null;

  const media = completionMediaUrls(booking);
  const flags = completionAnomalyFlags(booking);
  const notes = booking.completionNotes ?? booking.completion_notes;

  const afterMutate = async () => {
    const fresh = await refetchBookingSilent(booking.id);
    if (fresh) {
      applyCanonicalBooking(fresh);
      onUpdated?.(fresh);
    }
    void fetchMyDisputes().catch(() => {});
  };

  const confirm = async () => {
    if (busy) return;
    setBusy("confirm");
    try {
      const updated = await confirmBookingCompletion(booking.id);
      applyCanonicalBooking(updated);
      onUpdated?.(updated);
      toast.success("Work confirmed. The Krafter can receive payout credit after the hold.");
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not confirm completion."));
      if (isValidationClientError(error)) await afterMutate();
    } finally {
      setBusy(null);
    }
  };

  const dispute = async () => {
    if (busy) return;
    if (reason.trim().length < 3 || description.trim().length < 8) {
      toast.error("Add a short reason and a detailed description.");
      return;
    }
    setBusy("dispute");
    try {
      await disputeBookingCompletion(booking.id, {
        reason: reason.trim(),
        description: description.trim(),
      });
      await afterMutate();
      toast.success("Dispute opened. Payout is frozen until this is resolved.");
      setShowDispute(false);
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not open a completion dispute."));
      if (isValidationClientError(error)) await afterMutate();
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="rounded-2xl border border-orange-200 bg-[#FFF8F4] p-4 space-y-4">
      <div>
        <h3 className="text-[15px] font-poppins font-semibold text-gray-900">
          Review completion proof
        </h3>
        <p className="text-[12px] font-poppins text-gray-600 mt-1 leading-relaxed">
          The Krafter submitted work for your confirmation. This is not completed, paid, or
          reviewable until you confirm or the server auto-confirms unflagged evidence.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-xl bg-white border border-orange-100 px-3 py-2">
        <Clock size={16} className="mt-0.5 shrink-0 text-brand-orange" />
        <p className="text-[12px] font-poppins text-gray-700">
          Confirm or dispute by <strong>{formatDue(due)}</strong>
          {remainingLabel ? ` · ${remainingLabel}` : ""}. The deadline comes from the server.
        </p>
      </div>

      {flags.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2">
          <ShieldAlert size={16} className="mt-0.5 shrink-0 text-amber-700" />
          <p className="text-[12px] font-poppins text-amber-900">
            Flagged evidence is never auto-confirmed:{" "}
            {flags.map(formatAnomalyFlag).join(", ")}.
          </p>
        </div>
      )}

      {typeof notes === "string" && notes.trim() ? (
        <p className="text-[13px] font-poppins text-gray-800 whitespace-pre-wrap">{notes}</p>
      ) : null}

      {media.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {media.map((url) =>
            mediaFailed[url] ? (
              <button
                key={url}
                type="button"
                onClick={() => {
                  setMediaFailed((prev) => ({ ...prev, [url]: false }));
                  void refetchBookingSilent(booking.id);
                }}
                className="shrink-0 w-28 h-28 rounded-xl border border-dashed border-gray-300 bg-gray-50 text-[11px] font-poppins text-gray-600 px-2"
              >
                Image expired. Tap to refresh.
              </button>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt="Completion proof"
                className="shrink-0 w-28 h-28 rounded-xl object-cover border border-gray-100"
                onError={() => {
                  setMediaFailed((prev) => ({ ...prev, [url]: true }));
                }}
              />
            ),
          )}
        </div>
      ) : (
        <p className="text-[12px] font-poppins text-gray-500 inline-flex items-center gap-1">
          <ImageIcon size={14} /> Proof images will appear after a booking refresh.
        </p>
      )}

      {!showDispute ? (
        <div className="space-y-2">
          <Button
            type="button"
            variant="primary"
            fullWidth
            disabled={busy != null}
            onClick={() => void confirm()}
          >
            {busy === "confirm" ? "Confirming…" : "Confirm work"}
          </Button>
          <Button
            type="button"
            variant="outline"
            fullWidth
            disabled={busy != null}
            onClick={() => setShowDispute(true)}
          >
            Dispute completion
          </Button>
          {onReauthorize ? (
            <button
              type="button"
              className="w-full text-[12px] font-poppins text-brand-blue font-semibold py-1"
              onClick={onReauthorize}
            >
              Card authorization expired? Reauthorize payment
            </button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={200}
            disabled={busy != null}
            className="w-full p-3 bg-white border border-gray-200 rounded-xl text-[13px] font-poppins focus:outline-none focus:border-brand-orange"
            placeholder="Short factual reason"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={5000}
            disabled={busy != null}
            className="w-full h-28 p-3 bg-white border border-gray-200 rounded-xl text-[13px] font-poppins resize-none focus:outline-none focus:border-brand-orange"
            placeholder="Detailed description of the disagreement"
          />
          <div className="flex gap-2">
            <Button type="button" variant="outline" fullWidth disabled={busy != null} onClick={() => setShowDispute(false)}>
              Back
            </Button>
            <Button type="button" variant="primary" fullWidth disabled={busy != null} onClick={() => void dispute()}>
              {busy === "dispute" ? "Submitting…" : "Open dispute"}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
