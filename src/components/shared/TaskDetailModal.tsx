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
import { deriveBookingCustomerPresentation } from "@/lib/bookingDisplay";
import { getBookingById } from "@/lib/api/bookings";
import { DistanceBadge } from "@/components/ui/DistanceBadge";
import VerifiedStartModal from "@/components/shared/VerifiedStartModal";
import { captureFreshLocation, getOrCreateDeviceId } from "@/lib/workVerification";

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
  COMPLETION_SUBMITTED: 3,
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
  const [showVerifiedStart, setShowVerifiedStart] = useState(false);

  useEffect(() => {
    if (!booking?.id) return;
    setCompletionPhotos([]);
    setCompletionNotesInput("");
  }, [booking?.id]);

  useEffect(() => {
    if (!booking?.id) return;
    const c = booking.customer;
    const hasCustomerIdentity =
      Boolean(booking.customerName?.trim()) ||
      Boolean(c?.firstName?.trim()) ||
      Boolean(c?.lastName?.trim()) ||
      Boolean(c?.phone?.trim());
    if (hasCustomerIdentity) return;
    let cancelled = false;
    void (async () => {
      try {
        const full = await getBookingById(booking.id);
        if (cancelled || !full) return;
        onBookingUpdated?.(full);
      } catch {
        /* keep list row if detail fetch fails */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [booking?.id, booking?.customer, booking?.customerName, onBookingUpdated]);

  if (!booking) return null;

  const hasCompletionPhotos = completionPhotos.some((p) => p.file instanceof File);

  const activeStep = STATUS_STEP[booking.status] ?? 0;
  const isConfirmed = booking.status === "CONFIRMED";
  const isPaymentPending = booking.status === "PAYMENT_PENDING";
  const isInProgress = booking.status === "IN_PROGRESS";
  const isCompletionSubmitted = booking.status === "COMPLETION_SUBMITTED";
  const isExpired = booking.status === "EXPIRED";
  const displayTitle = booking.title || booking.service?.title || "Craft";
  const distanceText = formatDistanceDisplay(readDistanceFields(booking));
  const customerPresentation = deriveBookingCustomerPresentation(booking);

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
            {customerPresentation.photoUrl ? (
              <Image
                src={customerPresentation.photoUrl}
                alt={customerPresentation.displayName}
                fill
                className="object-cover"
              />
            ) : (
              <span className="text-white text-lg font-bold">
                {customerPresentation.initials}
              </span>
            )}
          </div>
          {/* Info */}
          <div>
            <p className="text-[15px] font-bold text-gray-900">
              {customerPresentation.displayName}
            </p>
            {customerPresentation.secondaryLine !== "Customer" ? (
              <p className="text-[12px] text-gray-500 mt-0.5">{customerPresentation.secondaryLine}</p>
            ) : (
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
            )}
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
            onClick={() =>
              router.push(`/tasker/schedule?openJob=${encodeURIComponent(booking.id)}`)
            }
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
                onClick={() => setShowVerifiedStart(true)}
              >
                {jobActionLoading ? "Starting…" : "Start job"}
              </Button>
            )}
            {isInProgress && (
              <div className="px-5 pb-2 space-y-3">
                <h3 className="text-[15px] font-bold text-gray-900">Completion photos (1–3 required)</h3>
                <PhotoUploader
                  photos={completionPhotos}
                  onChange={setCompletionPhotos}
                  maxPhotos={3}
                  title=""
                  acceptImagesOnly
                />
                <div>
                  <label className="text-[14px] font-semibold text-gray-700 mb-1 block">Notes (optional)</label>
                  <textarea
                    value={completionNotesInput}
                    onChange={(e) => setCompletionNotesInput(e.target.value.slice(0, 2000))}
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
                      const location = await captureFreshLocation();
                      const updated = await completeBooking(booking.id, {
                        completionImages: files.slice(0, 3),
                        notes: completionNotesInput.trim() || undefined,
                        ...location,
                        deviceId: getOrCreateDeviceId(),
                      });
                      onBookingUpdated?.(updated);
                      toast.success("Completion proof submitted. Awaiting customer confirmation.");
                      onClose();
                    } catch (err: unknown) {
                      const canonical = useBookingsStore.getState().bookings.find((b) => b.id === booking.id);
                      if (canonical?.status === "COMPLETION_SUBMITTED") {
                        onBookingUpdated?.(canonical);
                        toast.success("Completion was recorded. Awaiting customer confirmation.");
                      } else {
                        const ax = err as { response?: { data?: { message?: string } } };
                        toast.error(
                          ax.response?.data?.message ??
                            (err instanceof Error ? err.message : "Could not submit completion. Try again."),
                        );
                      }
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
            {isCompletionSubmitted && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-950">Awaiting customer confirmation</p>
                <p className="mt-1 text-xs leading-relaxed text-blue-800">
                  Completion proof is under review. No earnings are withdrawable until the booking
                  becomes completed and the wallet records the payout.
                </p>
              </div>
            )}
            {booking.status === "DISPUTED" && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-950">Disputed — payout frozen</p>
                <p className="mt-1 text-xs leading-relaxed text-red-800">
                  Submit evidence from this job. Frozen dispute holds never appear as available to withdraw.
                </p>
              </div>
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
      <VerifiedStartModal
        open={showVerifiedStart}
        booking={booking}
        onClose={() => setShowVerifiedStart(false)}
        onStart={(payload) => startBooking(booking.id, payload)}
        onStarted={(updated) => {
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem(
              `kraftigo:jobWorkStart:${booking.id}`,
              String(Date.now()),
            );
          }
          onBookingUpdated?.(updated);
        }}
      />
    </div>
  );
}
