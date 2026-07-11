"use client";

import { useState, useEffect } from "react";
import { X, ChevronRight, Calendar } from "lucide-react";
import Image from "next/image";
import { useBookingsStore } from "@/store/useBookingsStore";
import type { Booking } from "@/types";
import Button from "../ui/button";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import PhotoUploader, { type Photo } from "@/components/shared/PhotoUploader";
import { formatDistanceDisplay, readDistanceFields } from "@/utils/distance";
import { DistanceBadge } from "@/components/ui/DistanceBadge";

interface TaskDetailModalProps {
  booking: Booking | null;
  onClose: () => void;
  onReschedule?: (booking: Booking) => void;
  onReportIssue?: (booking: Booking) => void;
  /** After POST `/api/artisan/bookings/:id/start` or `/complete` (Krafter schedule). */
  onBookingUpdated?: (booking: Booking) => void;
}

/* Map status → active step index (0-based) */
const STATUS_STEP: Record<string, number> = {
  REQUESTED: 0,
  PENDING: 0,
  CONFIRMED: 1,
  PAYMENT_PENDING: 1,
  IN_PROGRESS: 2,
  COMPLETED: 3,
  EXPIRED: 0,
  CANCELLED: 0,
  COUNTERED: 0,
};

const STEP_LABELS = ["Upcoming", "Confirmed", "In Progress", "Completed"];

function formatDate(iso: string) {
  const d = new Date(iso);
  const day = d.getDate();
  const ord =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
        ? "nd"
        : day % 10 === 3 && day !== 13
          ? "rd"
          : "th";
  return `${day}${ord} ${d.toLocaleString("en-GB", { month: "short" })}, ${d.getFullYear()}`;
}

export default function TaskDetailModal({
  booking,
  onClose,
  onReschedule,
  onReportIssue,
  onBookingUpdated,
}: TaskDetailModalProps) {
  const router = useRouter();
  const { startBooking, completeBooking } = useBookingsStore();
  const [jobActionLoading, setJobActionLoading] = useState(false);
  const [completionPhotos, setCompletionPhotos] = useState<Photo[]>([]);
  const [completionNotesInput, setCompletionNotesInput] = useState("");

  useEffect(() => {
    if (!booking?.id) return;
    setCompletionPhotos([]);
    setCompletionNotesInput("");
  }, [booking?.id]);

  if (!booking) return null;

  const hasCompletionPhotos = completionPhotos.some((p) => p.file instanceof File);

  const activeStep = STATUS_STEP[booking.status] ?? 0;
  const isConfirmed = booking.status === "CONFIRMED";
  const isPaymentPending = booking.status === "PAYMENT_PENDING";
  const isInProgress = booking.status === "IN_PROGRESS";
  const isExpired = booking.status === "EXPIRED";
  const displayTitle = booking.title || booking.service?.title || "Craft";
  const distanceText = formatDistanceDisplay(readDistanceFields(booking));

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-t-xl w-full max-w-md mx-auto max-h-[calc(100vh-80px)] overflow-y-auto pb-20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 pt-3 pb-3">
          <h2 className="text-[22px] font-bold text-gray-900 leading-tight">
            {displayTitle}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors shrink-0"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* ── Status Steps ── */}
        <div className="flex items-center gap-2 px-5 mb-5">
          {STEP_LABELS.map((label, i) => {
            const isActive = i === activeStep;
            const isPast = i < activeStep;
            return (
              <div
                key={i}
                className={`flex items-center justify-center rounded-full text-[12px] font-semibold transition-colors
                  ${
                    isActive
                      ? "bg-brand-blue text-white px-4 py-2"
                      : isPast
                        ? "w-8 h-8 bg-brand-orange text-white"
                        : "w-8 h-8 bg-gray-200 text-gray-500"
                  }`}
              >
                {isActive ? label : i + 1}
              </div>
            );
          })}
        </div>

        {/* ── Date & Time ── */}
        <div className="flex items-center justify-center gap-2 px-5 mb-5 ">
          <Calendar size={16} className="text-gray-400 shrink-0" />
          <p className="text-[14px] text-gray-600">
            {formatDate(booking.scheduled_date || new Date().toISOString())}{" "}
            <span className="font-bold text-gray-900">{booking.scheduled_time || "TBD"}</span>
          </p>
        </div>

        {/* ── Customer Card ── */}
        <div className="mx-5 mb-5 bg-[#F6F6F6] border border-[#0000001A] rounded-lg p-3 flex items-center gap-3">
          {/* Avatar */}
          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-300 shrink-0 flex items-center justify-center">
            {booking.image ? (
              <Image
                src={booking.image}
                alt={booking.customerName ?? "Customer"}
                fill
                className="object-cover"
              />
            ) : (
              <span className="text-white text-lg font-bold">
                {booking.customerName?.charAt(0) ?? "?"}
              </span>
            )}
          </div>
          {/* Info */}
          <div>
            <p className="text-[15px] font-bold text-gray-900">
              {booking.customerName ?? "Customer"}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              {/* 3 full stars */}
              {[0, 1, 2].map((s) => (
                <svg
                  key={s}
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="#FF6600"
                  stroke="none"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
              {/* Half star */}
              <div className="relative w-3.25 h-3.25 overflow-hidden">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="#FF6600"
                  stroke="none"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <div className="absolute inset-0 right-1/2 bg-[#F6F6F6]" />
              </div>
              {/* Empty star */}
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="#D1D5DB"
                stroke="none"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className="text-[12px] text-gray-500 ml-1">
                (23 Reviews)
              </span>
            </div>
          </div>
        </div>

        {/* ── Job Location ── */}
        <div className="px-5 mb-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[15px] font-bold text-gray-900">
              Job Location
            </h3>
            <p className="text-[13px] text-gray-500 text-right max-w-[55%] leading-tight">
              {booking.location}
            </p>
          </div>
          {distanceText && (
            <div className="flex justify-end mb-2">
              <DistanceBadge label={distanceText} size="sm" align="right" />
            </div>
          )}
          {/* Map */}
          <div className="relative rounded-2xl overflow-hidden h-44 bg-gray-100">
            <Image
              src="/images/map.png"
              alt="Job location map"
              fill
              className="object-cover"
            />
            <div className="absolute bottom-3 left-3">
              <span className="bg-brand-orange text-white text-[12px] font-semibold px-3 py-1.5 rounded-full shadow">
                Service Area
              </span>
            </div>
          </div>
        </div>

        {/* ── Accordion rows ── */}
        <div className="mx-5 mb-2 rounded-2xl overflow-hidden divide-y divide-gray-100">
          <button
            className="w-full flex items-center justify-between border-b border-[#0000001A] px-4 py-4 hover:bg-gray-50 transition-colors"
            onClick={() => router.push(`/tasker/active-job/${booking.id}`)}
          >
            <span className="text-[15px] font-bold text-gray-900">
              Kraft Details
            </span>
            <ChevronRight size={18} className="text-gray-400" />
          </button>
          <button className="w-full flex items-center justify-between border-b border-[#0000001A] px-4 py-4 hover:bg-gray-50 transition-colors">
            <span className="text-[15px] font-bold text-gray-900">
              Price Breakdown
            </span>
            <ChevronRight size={18} className="text-gray-400" />
          </button>
        </div>

        {/* ── Action Buttons (hidden for completed bookings) ── */}
        {booking.status !== "COMPLETED" && (
          <div className="px-5 pt-4 pb-8 space-y-3">
            {isExpired && (
              <p className="text-[13px] text-amber-900 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 font-poppins">
                This booking expired before work started. Use reschedule or create a new booking.
              </p>
            )}
            {isPaymentPending && (
              <p className="text-[13px] text-amber-900 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 font-poppins">
                Waiting for the customer to authorize payment. You can start the job once the booking is{" "}
                <strong>CONFIRMED</strong>.
              </p>
            )}
            {isConfirmed && (
              <Button
                type="button"
                variant="primary"
                fullWidth
                disabled={jobActionLoading}
                onClick={async () => {
                  setJobActionLoading(true);
                  try {
                    const updated = await startBooking(booking.id);
                    if (typeof window !== "undefined") {
                      window.sessionStorage.setItem(`kraftigo:jobWorkStart:${booking.id}`, String(Date.now()));
                    }
                    onBookingUpdated?.(updated);
                    toast.success("Job started. Coordinate with your customer while you work.");
                  } catch (err: unknown) {
                    const ax = err as { response?: { data?: { message?: string } } };
                    toast.error(
                      ax.response?.data?.message ??
                        "Could not start the job. It may only be allowed after payment is confirmed.",
                    );
                  } finally {
                    setJobActionLoading(false);
                  }
                }}
              >
                {jobActionLoading ? "Starting…" : "Start job"}
              </Button>
            )}
            {isInProgress && (
              <div className="px-5 pb-2 space-y-3">
                <h3 className="text-[15px] font-bold text-gray-900">Completion photos (1–3 required)</h3>
                <PhotoUploader photos={completionPhotos} onChange={setCompletionPhotos} maxPhotos={3} title="" />
                <div>
                  <label className="text-[14px] font-semibold text-gray-700 mb-1 block">Notes (optional)</label>
                  <textarea
                    value={completionNotesInput}
                    onChange={(e) => setCompletionNotesInput(e.target.value)}
                    placeholder="Optional notes sent with completion"
                    className="w-full h-24 p-3 bg-[#F6F6F6] border border-[#0000001A] rounded-xl text-[14px] resize-none focus:outline-none focus:border-brand-orange"
                  />
                </div>
              </div>
            )}
            {isInProgress && (
              <>
                <Button
                  type="button"
                  variant="primary"
                  fullWidth
                  disabled={jobActionLoading || !hasCompletionPhotos}
                  onClick={async () => {
                    const files = completionPhotos
                      .map((p) => p.file)
                      .filter((f): f is File => f instanceof File);
                    if (files.length < 1) {
                      toast.error("Add at least one completion photo (up to 3).");
                      return;
                    }
                    setJobActionLoading(true);
                    try {
                      const updated = await completeBooking(booking.id, {
                        completionImages: files.slice(0, 3),
                        notes: completionNotesInput.trim() || undefined,
                      });
                      onBookingUpdated?.(updated);
                      toast.success("Job completed.");
                      onClose();
                    } catch (err: unknown) {
                      const ax = err as { response?: { data?: { message?: string } } };
                      toast.error(ax.response?.data?.message ?? "Could not complete the job. Try again.");
                    } finally {
                      setJobActionLoading(false);
                    }
                  }}
                >
                  {jobActionLoading ? "Completing…" : "Complete job"}
                </Button>
                <p className="text-[11px] text-center text-gray-500 font-poppins px-1">
                  The customer is notified when you complete the job; payout steps run on the server.
                </p>
              </>
            )}
            <Button
              onClick={() => onReschedule?.(booking)}
              variant={isConfirmed || isInProgress ? "outline" : "primary"}
              fullWidth
            >
              Reschedule
            </Button>
            <Button
              onClick={() => onReportIssue?.(booking)}
              variant="secondary"
              fullWidth
            >
              Report Issue
            </Button>
            <p className="text-[11px] text-center text-gray-500 font-poppins px-2 leading-relaxed">
              Krafters can’t cancel an assigned booking here — to decline before accepting, use{" "}
              <strong>Requests</strong> → direct request actions. Customers cancel from their booking screen.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
