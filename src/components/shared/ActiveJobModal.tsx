"use client";

import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X, MessageCircle, AlertCircle, Pause, ChevronRight, Calendar } from "lucide-react";
import PhotoUploader, { Photo } from "@/components/shared/PhotoUploader";
import Button from "@/components/ui/button";
import RateCustomerModal from "@/components/shared/RateCustomerModal";
import { submitReview } from "@/lib/api/reviews";
import { buildTaskerMessageCustomerUrlFromBooking } from "@/lib/chatDeepLinks";
import type { Booking } from "@/types";
import { useBookingsStore } from "@/store/useBookingsStore";
import { parseBookingMoney } from "@/lib/bookingDisplay";

type JobPhase = "not-started" | "in-progress" | "completed";

const STATUS_STEPS = [
  { key: "not-started", label: "Confirmed", step: 1 },
  { key: "in-progress", label: "In progress", step: 2 },
  { key: "completed", label: "Completed", step: 3 },
] as const;

function normStatus(status: string | undefined): string {
  return String(status ?? "")
    .replace(/-/g, "_")
    .toUpperCase();
}

const jobWorkStartStorageKey = (bookingId: string) => `kraftigo:jobWorkStart:${bookingId}`;
const jobWorkDurationStorageKey = (bookingId: string) => `kraftigo:jobWorkDuration:${bookingId}`;

function msToTimer(totalMs: number): { hours: number; minutes: number; seconds: number } {
  const ms = Math.max(0, totalMs);
  const sec = Math.floor(ms / 1000);
  return {
    hours: Math.floor(sec / 3600),
    minutes: Math.floor((sec % 3600) / 60),
    seconds: sec % 60,
  };
}

/** Wall-clock anchor for “time on job” so leaving the schedule page does not reset the timer. */
function resolveJobWorkStartedAtMs(booking: Booking): number {
  const loose = booking as unknown as Record<string, unknown>;
  const candidates = [
    loose.startedAt,
    loose.started_at,
    loose.workStartedAt,
    loose.work_started_at,
    loose.inProgressAt,
    loose.in_progress_at,
    loose.jobStartedAt,
    loose.job_started_at,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) {
      const t = Date.parse(c);
      if (!Number.isNaN(t)) return t;
    }
  }
  if (typeof window !== "undefined") {
    const raw = window.sessionStorage.getItem(jobWorkStartStorageKey(booking.id));
    if (raw) {
      const t = parseInt(raw, 10);
      if (!Number.isNaN(t) && t > 0) return t;
    }
    const now = Date.now();
    window.sessionStorage.setItem(jobWorkStartStorageKey(booking.id), String(now));
    return now;
  }
  return Date.now();
}

function resolveJobCompletedDurationMs(booking: Booking): number {
  const loose = booking as unknown as Record<string, unknown>;
  const workDurationRaw = loose.workDurationSeconds ?? loose.work_duration_seconds;
  if (typeof workDurationRaw === "number" && Number.isFinite(workDurationRaw) && workDurationRaw >= 0) {
    return workDurationRaw * 1000;
  }
  if (typeof workDurationRaw === "string" && workDurationRaw.trim()) {
    const parsedSeconds = Number(workDurationRaw);
    if (Number.isFinite(parsedSeconds) && parsedSeconds >= 0) return parsedSeconds * 1000;
  }
  const startCandidates = [
    loose.startedAt,
    loose.started_at,
    loose.workStartedAt,
    loose.work_started_at,
    loose.inProgressAt,
    loose.in_progress_at,
    loose.jobStartedAt,
    loose.job_started_at,
  ];
  const endCandidates = [
    loose.completedAt,
    loose.completed_at,
  ];

  let startMs: number | null = null;
  for (const c of startCandidates) {
    if (typeof c === "string" && c.trim()) {
      const t = Date.parse(c);
      if (!Number.isNaN(t)) {
        startMs = t;
        break;
      }
    }
  }
  let endMs: number | null = null;
  for (const c of endCandidates) {
    if (typeof c === "string" && c.trim()) {
      const t = Date.parse(c);
      if (!Number.isNaN(t)) {
        endMs = t;
        break;
      }
    }
  }
  if (startMs != null && endMs != null && endMs > startMs) {
    return endMs - startMs;
  }

  if (typeof window !== "undefined") {
    const raw = window.localStorage.getItem(jobWorkDurationStorageKey(booking.id));
    if (raw) {
      const ms = parseInt(raw, 10);
      if (!Number.isNaN(ms) && ms >= 0) return ms;
    }
  }
  return 0;
}

function formatDateLabel(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

interface ActiveJobModalProps {
  booking: Booking | null;
  onClose: () => void;
  /** After POST start / complete succeeds; parent can refresh list and keep selection in sync. */
  onBookingUpdated?: (booking: Booking) => void;
}

export default function ActiveJobModal({ booking, onClose, onBookingUpdated }: ActiveJobModalProps) {
  const router = useRouter();
  const { startBooking, completeBooking } = useBookingsStore();

  const [phase, setPhase] = useState<JobPhase>("not-started");
  const [showReportIssue, setShowReportIssue] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [timer, setTimer] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isPaused, setIsPaused] = useState(false);
  const [ongoingNotes, setOngoingNotes] = useState("");
  const [completionNotes, setCompletionNotes] = useState("");
  const [proofPhotos, setProofPhotos] = useState<Photo[]>([]);
  const [showKraftDetails, setShowKraftDetails] = useState(false);
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
  const [hasSubmittedReview, setHasSubmittedReview] = useState(false);
  const estimatedHours = 2;

  const buildReviewPayload = (rating: number, tags: string[], feedback: string) => ({
    bookingId: booking!.id,
    rating,
    feedback: feedback.trim() || undefined,
    selectedTags: tags,
    highlights: tags,
    clearInstructions: tags.includes("Clear Instructions") ? 5 : undefined,
    instructionClarity: tags.includes("Accurate Brief") ? 5 : undefined,
    respectful: tags.includes("Respectful") ? 5 : undefined,
    customerCourtesy: tags.includes("Respectful") ? 5 : undefined,
    safeEnvironment: tags.includes("Safe Environment") ? 5 : undefined,
    environmentSafety: tags.includes("Safe Environment") ? 5 : undefined,
    accessPreparedness: tags.includes("On time") ? 5 : undefined,
    wouldWorkAgain: rating >= 4,
  });

  const workAnchorMsRef = useRef(0);
  const pauseStartedAtRef = useRef<number | null>(null);
  const pausedTotalMsRef = useRef(0);

  const computeElapsedMs = () => {
    const pauseExtra = pauseStartedAtRef.current ? Date.now() - pauseStartedAtRef.current : 0;
    return Date.now() - workAnchorMsRef.current - pausedTotalMsRef.current - pauseExtra;
  };

  useEffect(() => {
    if (!booking) return;
    const s = normStatus(booking.status);
    if (s === "COMPLETED") {
      setPhase("completed");
      const completedMs = resolveJobCompletedDurationMs(booking);
      setTimer(msToTimer(completedMs));
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(jobWorkStartStorageKey(booking.id));
      }
    } else if (s === "IN_PROGRESS") {
      setPhase("in-progress");
      workAnchorMsRef.current = resolveJobWorkStartedAtMs(booking);
      setTimer(msToTimer(computeElapsedMs()));
    } else {
      setPhase("not-started");
      setTimer({ hours: 0, minutes: 0, seconds: 0 });
      pausedTotalMsRef.current = 0;
      pauseStartedAtRef.current = null;
    }
    if (s !== "IN_PROGRESS") {
      setIsPaused(false);
    }
    setOngoingNotes("");
    setCompletionNotes("");
    setProofPhotos([]);
    setShowKraftDetails(false);
    setShowPriceBreakdown(false);
  }, [booking?.id, booking?.status]);

  useEffect(() => {
    if (phase !== "in-progress" || isPaused) return;
    const tick = () => setTimer(msToTimer(computeElapsedMs()));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [phase, isPaused, booking?.id]);

  if (!booking) return null;

  const apiStatus = normStatus(booking.status);
  const isPaymentPending = apiStatus === "PAYMENT_PENDING";
  const isConfirmed = apiStatus === "CONFIRMED";
  const isExpired = apiStatus === "EXPIRED";
  const displayTitle = booking.title || booking.service?.title || "Booking";
  const customerLabel = booking.customerName ?? "Customer";
  const dateLabel = formatDateLabel(booking.scheduled_date);
  const timeLabel = booking.scheduled_time || booking.preferredTime || "TBD";
  const kraftDetailsText = booking.jobDescription || booking.notes || "No additional details provided.";
  const serviceAmount = parseBookingMoney(
    booking.finalAgreedPrice ?? booking.proposedPrice ?? booking.price,
  );
  const platformFee = parseBookingMoney(booking.platformFee ?? booking.systemPrice);
  const payoutAmount = parseBookingMoney(booking.artisanEarning);

  const stepIndex = STATUS_STEPS.findIndex((s) => s.key === phase);
  const isOvertime = () => timer.hours * 60 + timer.minutes > estimatedHours * 60;

  const handleStartJob = async () => {
    if (!isConfirmed) return;
    setIsActionLoading(true);
    try {
      const updated = await startBooking(booking.id);
      onBookingUpdated?.(updated);
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(jobWorkStartStorageKey(booking.id), String(Date.now()));
        window.localStorage.removeItem(jobWorkDurationStorageKey(booking.id));
      }
      workAnchorMsRef.current = resolveJobWorkStartedAtMs(updated);
      pausedTotalMsRef.current = 0;
      pauseStartedAtRef.current = null;
      setTimer(msToTimer(computeElapsedMs()));
      toast.success("Job started. Coordinate with your customer while you work.");
      setPhase("in-progress");
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast.error(
        ax.response?.data?.message ??
          "Could not start the job. It is only allowed once the booking is confirmed and payment is authorized.",
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const customerChatUrl = buildTaskerMessageCustomerUrlFromBooking(booking);

  const handleMessageCustomer = () => {
    if (!customerChatUrl) {
      toast.error("Could not open chat for this customer yet.");
      return;
    }
    onClose();
    router.push(customerChatUrl);
  };

  const handleCompleteJob = async () => {
    const files = proofPhotos.map((p) => p.file).filter((f): f is File => f instanceof File);
    if (files.length < 1) {
      toast.error("Add at least one completion photo (required, up to 3).");
      return;
    }
    setIsActionLoading(true);
    try {
      const updated = await completeBooking(booking.id, {
        completionImages: files.slice(0, 3),
        notes: ongoingNotes.trim() || undefined,
      });
      onBookingUpdated?.(updated);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(jobWorkDurationStorageKey(booking.id), String(Math.max(0, computeElapsedMs())));
        window.sessionStorage.removeItem(jobWorkStartStorageKey(booking.id));
      }
      toast.success("Job completed.");
      setPhase("completed");
      setShowRatingModal(true);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast.error(ax.response?.data?.message ?? "Could not complete the job. Try again.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const hasCompletionPhotos = proofPhotos.some((p) => p.file instanceof File);

  const handleRatingSubmit = async (rating: number, tags: string[], feedback: string) => {
    if (hasSubmittedReview || isReviewSubmitting) return;
    setIsReviewSubmitting(true);
    try {
      await submitReview(buildReviewPayload(rating, tags, feedback));
      setHasSubmittedReview(true);
      toast.success("Review submitted.");
      setShowRatingModal(false);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast.error(ax.response?.data?.message ?? "Could not submit review. Try again.");
      throw err;
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
        onClick={onClose}
      >
        <div
          className="relative bg-white rounded-t-xl w-full max-w-md mx-auto max-h-[94vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white px-5 pt-5 pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <h1 className="text-[22px] font-bold font-gerat text-gray-900">{displayTitle}</h1>
              <button
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={22} className="text-gray-600" />
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {STATUS_STEPS.map((status, index) => {
                const isActive = index === stepIndex;
                const isPastStep = index < stepIndex;
                return (
                  <div
                    key={status.key}
                    className={`flex items-center justify-center gap-1 rounded-full text-[12px] font-semibold transition-colors ${
                      isActive
                        ? "bg-brand-blue text-white px-4 py-2"
                        : isPastStep
                          ? "w-8 h-8 bg-brand-orange text-white"
                          : "w-8 h-8 bg-gray-200 text-gray-500"
                    }`}
                  >
                    {isPastStep && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="none">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                    )}
                    {isActive ? status.label : isPastStep ? "" : status.step}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="px-5 py-5 space-y-4">
            {(phase === "in-progress" || phase === "completed") && (
              <div className="flex items-center justify-center gap-4">
                {(["hours", "minutes", "seconds"] as const).map((unit) => (
                  <div key={unit} className="bg-gray-100 rounded-2xl p-4 text-center min-w-20">
                    <div
                      className={`text-4xl font-bold ${
                        isOvertime() && phase === "in-progress" ? "text-red-600" : "text-gray-900"
                      }`}
                    >
                      {String(timer[unit]).padStart(2, "0")}
                    </div>
                    <div className="text-sm text-gray-600 mt-1 capitalize">{unit}</div>
                  </div>
                ))}
              </div>
            )}

            {phase === "completed" && (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Total earned</p>
                <p className="text-3xl font-bold text-green-600">
                  +€{booking.price != null ? Number(booking.price).toFixed(2) : "0.00"}
                </p>
              </div>
            )}

            {phase === "completed" && (
              <div className="flex items-center justify-center gap-2 text-[13px] font-poppins text-gray-500">
                <Calendar size={14} className="shrink-0" />
                <span>
                  {dateLabel} {timeLabel ? `· ${timeLabel}` : ""}
                </span>
              </div>
            )}

            <div className="bg-[#F6F6F6] border border-[#0000001A] rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-300 flex items-center justify-center">
                    {booking.image ? (
                      <Image
                        src={booking.image}
                        alt={customerLabel}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-white text-lg font-bold">{customerLabel.charAt(0)}</span>
                    )}
                </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-gray-900">{customerLabel}</h3>
                    <p className="text-[12px] text-gray-500 mt-0.5">
                      {phase === "completed"
                        ? "Completed booking summary"
                        : "Message for this listed kraft if you use chat."}
                    </p>
                  </div>
              </div>
                {phase !== "completed" && !isExpired ? (
                  <button
                    type="button"
                    onClick={handleMessageCustomer}
                    className="w-11 h-11 bg-[#FFE5D9] rounded-full flex items-center justify-center hover:bg-[#FFD5C2] transition-colors"
                  >
                    <MessageCircle size={18} className="text-brand-orange" />
                  </button>
                ) : phase === "completed" ? (
                  <div className="w-11 h-11 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                      <path d="M9 16.17 4.83 12 3.41 13.41 9 19l12-12-1.41-1.41z" />
                    </svg>
                  </div>
                ) : null}
              </div>
            </div>

            {phase === "completed" && (
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setShowKraftDetails((v) => !v)}
                  className="w-full flex items-center justify-between py-3 border-b border-gray-100"
                >
                  <span className="text-[15px] font-bold text-gray-900">Kraft details</span>
                  <ChevronRight
                    size={18}
                    className={`text-gray-400 transition-transform ${showKraftDetails ? "rotate-90" : ""}`}
                  />
                </button>
                {showKraftDetails && (
                  <div className="py-2">
                    <p className="text-[13px] text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {kraftDetailsText}
                    </p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setShowPriceBreakdown((v) => !v)}
                  className="w-full flex items-center justify-between py-3 border-b border-gray-100"
                >
                  <span className="text-[15px] font-bold text-gray-900">Price breakdown</span>
                  <ChevronRight
                    size={18}
                    className={`text-gray-400 transition-transform ${showPriceBreakdown ? "rotate-90" : ""}`}
                  />
                </button>
                {showPriceBreakdown && (
                  <div className="py-2 space-y-1.5">
                    {serviceAmount != null && (
                      <div className="flex justify-between text-[13px] text-gray-600">
                        <span>Service amount</span>
                        <span>€{serviceAmount.toFixed(2)}</span>
                      </div>
                    )}
                    {platformFee != null && (
                      <div className="flex justify-between text-[13px] text-gray-600">
                        <span>Platform fee</span>
                        <span>€{platformFee.toFixed(2)}</span>
                      </div>
                    )}
                    {payoutAmount != null && (
                      <div className="flex justify-between text-[13px] font-semibold text-gray-900">
                        <span>Krafter payout</span>
                        <span>€{payoutAmount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {isPaymentPending && phase === "not-started" && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle size={18} className="text-amber-700 shrink-0 mt-0.5" />
                <p className="text-[13px] text-amber-900 leading-relaxed">
                  Waiting for the customer to authorize payment. You can start the job once the booking is confirmed.
                </p>
              </div>
            )}

            {isExpired && phase === "not-started" && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle size={18} className="text-amber-700 shrink-0 mt-0.5" />
                <p className="text-[13px] text-amber-900 leading-relaxed">
                  This booking expired before work started. Ask the customer to reschedule or create a new booking.
                </p>
              </div>
            )}

            {phase === "in-progress" && isOvertime() && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle size={18} className="text-red-600 shrink-0" />
                <p className="text-[13px] text-red-600 font-medium">You are past the estimated time for this job.</p>
              </div>
            )}

            {phase === "in-progress" && (
              <div>
                <h3 className="text-[15px] font-bold text-gray-900 mb-2">Notes (optional)</h3>
                <textarea
                  value={ongoingNotes}
                  onChange={(e) => setOngoingNotes(e.target.value)}
                  placeholder="Optional notes sent with completion (access, handover, etc.)"
                  className="w-full h-28 p-3 bg-[#F6F6F6] border border-[#0000001A] rounded-xl text-[14px] resize-none focus:outline-none focus:border-brand-orange"
                />
              </div>
            )}

            {phase === "in-progress" && (
              <div>
                <h3 className="text-[15px] font-bold text-gray-900 mb-2">Completion photos (1–3 required)</h3>
                <PhotoUploader
                  photos={proofPhotos}
                  onChange={setProofPhotos}
                  maxPhotos={3}
                  embedded
                />
              </div>
            )}

            {phase === "completed" && (
              <div>
                <h3 className="text-[15px] font-bold text-gray-900 mb-2 text-center">Completion notes</h3>
                <textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="Anything to remember for reviews or support…"
                  className="w-full h-28 p-3 bg-[#F6F6F6] border border-[#0000001A] rounded-xl text-[14px] resize-none focus:outline-none focus:border-brand-orange"
                />
              </div>
            )}

            {phase === "not-started" && (
              <div className="bg-[#F6F6F6] border border-[#0000001A] rounded-2xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-[15px] font-bold text-gray-900">Job location</h3>
                  <p className="text-[13px] text-gray-500 text-right max-w-[55%] leading-tight">{booking.location}</p>
                </div>
                <div className="relative rounded-xl overflow-hidden h-40">
                  <Image src="/images/map.png" alt="Job location map" fill className="object-cover" />
                  <span className="absolute bottom-3 left-3 bg-brand-orange text-white px-3 py-1.5 rounded-full text-[12px] font-medium shadow">
                    Open in maps
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-3 pb-4">
              {phase === "not-started" && isConfirmed && (
                <Button
                  type="button"
                  onClick={handleStartJob}
                  variant="primary"
                  fullWidth
                  disabled={isActionLoading}
                >
                  {isActionLoading ? "Starting…" : "Start job"}
                </Button>
              )}

              {phase === "not-started" && !isConfirmed && !isPaymentPending && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-[13px] text-gray-600">
                  This job is not ready to start yet (status: {booking.status}). Pull to refresh or check again after
                  the customer confirms.
                </div>
              )}

              {phase === "in-progress" && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPaused((p) => {
                        if (!p) {
                          pauseStartedAtRef.current = Date.now();
                        } else {
                          if (pauseStartedAtRef.current) {
                            pausedTotalMsRef.current += Date.now() - pauseStartedAtRef.current;
                          }
                          pauseStartedAtRef.current = null;
                        }
                        return !p;
                      });
                    }}
                    className="w-full py-4 bg-[#FF66001A] border border-[#FF66001A] text-brand-orange text-[15px] font-semibold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                  >
                    <Pause size={18} />
                    {isPaused ? "Resume timer" : "Pause timer"}
                  </button>
                  <Button
                    type="button"
                    onClick={handleCompleteJob}
                    variant="primary"
                    fullWidth
                    disabled={isActionLoading || !hasCompletionPhotos}
                  >
                    {isActionLoading ? "Completing…" : "Complete job"}
                  </Button>
                  <p className="text-[11px] text-center text-gray-500 font-poppins px-1">
                    Add 1–3 photos of finished work. You can rate the customer after completing.
                  </p>
                </>
              )}

              {phase === "completed" && (
                <button
                  type="button"
                  onClick={() => setShowRatingModal(true)}
                  disabled={hasSubmittedReview}
                  className="w-full py-3 border border-brand-orange text-brand-orange text-[15px] font-semibold rounded-xl hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {hasSubmittedReview ? "Review submitted" : "Rate customer"}
                </button>
              )}

              <Button type="button" onClick={() => setShowReportIssue(true)} variant="secondary" fullWidth>
                Report issue
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showReportIssue && (
        <div
          className="fixed inset-0 bg-black/60 z-60 flex items-end justify-center"
          onClick={() => setShowReportIssue(false)}
        >
          <div
            className="bg-white rounded-t-3xl w-full max-w-md mx-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[20px] font-bold font-gerat">Report issue</h2>
              <button
                type="button"
                onClick={() => setShowReportIssue(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={22} className="text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[14px] font-semibold text-gray-700 mb-2 block">Issue type</label>
                <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:border-brand-orange">
                  <option>Customer not available</option>
                  <option>Wrong address</option>
                  <option>Safety concern</option>
                  <option>Equipment issue</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="text-[14px] font-semibold text-gray-700 mb-2 block">Description</label>
                <textarea
                  placeholder="Describe the issue…"
                  className="w-full h-28 p-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] resize-none focus:outline-none focus:border-brand-orange"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowReportIssue(false);
                  toast.success("Issue reported.");
                }}
                className="w-full py-3 bg-brand-orange text-white text-[15px] font-semibold rounded-xl hover:opacity-90 transition-opacity"
              >
                Submit report
              </button>
            </div>
          </div>
        </div>
      )}

      <RateCustomerModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        customerName={customerLabel}
        customerAvatar={booking.image ?? "/images/pro.jpg"}
        onSubmit={handleRatingSubmit}
        isSubmitting={isReviewSubmitting}
      />
    </>
  );
}
