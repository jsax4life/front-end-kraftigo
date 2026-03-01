"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X, MessageCircle, AlertCircle, Pause } from "lucide-react";
import PhotoUploader, { Photo } from "@/components/shared/PhotoUploader";
import Button from "@/components/ui/button";
import RateCustomerModal from "@/components/shared/RateCustomerModal";
import { Booking } from "@/store/useBookingStore";
import { useBookingsStore } from "@/store/useBookingsStore";

type JobStatus = "not-started" | "in-transit" | "in-progress" | "completed";

const STATUS_STEPS = [
  { key: "not-started", label: "Not started", step: 1 },
  { key: "in-transit",  label: "In Transit",  step: 2 },
  { key: "in-progress", label: "In Progress", step: 3 },
  { key: "completed",   label: "Completed",   step: 4 },
] as const;

interface ActiveJobModalProps {
  booking: Booking | null;
  onClose: () => void;
}

export default function ActiveJobModal({ booking, onClose }: ActiveJobModalProps) {
  const router = useRouter();

  const { startBooking, completeBooking } = useBookingsStore();

  const [currentStatus, setCurrentStatus] = useState<JobStatus>("not-started");
  const [showReportIssue, setShowReportIssue] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [timer, setTimer] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isPaused, setIsPaused] = useState(false);
  const [ongoingNotes, setOngoingNotes] = useState("");
  const [completionNotes, setCompletionNotes] = useState("");
  const [proofPhotos, setProofPhotos] = useState<Photo[]>([]);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const estimatedHours = 2;

  // Reset state when a new booking is opened
  useEffect(() => {
    if (booking) {
      if (booking.status === "IN_PROGRESS") setCurrentStatus("in-progress");
      else if (booking.status === "COMPLETED") setCurrentStatus("completed");
      else setCurrentStatus("not-started");
      setTimer({ hours: 0, minutes: 0, seconds: 0 });
      setIsPaused(false);
      setOngoingNotes("");
      setCompletionNotes("");
      setProofPhotos([]);
    }
  }, [booking?.id]);

  // Timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (currentStatus === "in-progress" && !isPaused) {
      interval = setInterval(() => {
        setTimer((prev) => {
          let { hours, minutes, seconds } = prev;
          seconds++;
          if (seconds === 60) { seconds = 0; minutes++; }
          if (minutes === 60) { minutes = 0; hours++; }
          return { hours, minutes, seconds };
        });
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [currentStatus, isPaused]);

  if (!booking) return null;

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === currentStatus);
  const isOvertime = () => (timer.hours * 60 + timer.minutes) > estimatedHours * 60;

  const handleStartKraft = async () => {
    setIsActionLoading(true);
    try {
      await startBooking(booking!.id);
      setCurrentStatus("in-progress");
      setIsPaused(false);
    } catch {
      toast.error("Could not start the job. Try again.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCompleteJob = async () => {
    if (proofPhotos.length === 0) {
      toast.error("Please upload at least one photo as proof of work");
      return;
    }
    setIsActionLoading(true);
    try {
      await completeBooking(booking!.id);
      setCurrentStatus("completed");
      setShowRatingModal(true);
    } catch {
      // Even if API fails, still allow rating flow
      toast.error("Could not mark complete on server, but continuing...");
      setCurrentStatus("completed");
      setShowRatingModal(true);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRatingSubmit = (rating: number, tags: string[], feedback: string) => {
    console.log("Job completed", { rating, tags, feedback, completionNotes, proofPhotos });
    onClose();
    router.push("/tasker/dashboard");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
        onClick={onClose}
      >
        <div
          className="relative bg-white rounded-t-xl w-full max-w-md mx-auto max-h-[94vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="bg-white px-5 pt-5 pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <h1 className="text-[22px] font-bold font-gerat text-gray-900">
                {booking.title}
              </h1>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={22} className="text-gray-600" />
              </button>
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {STATUS_STEPS.map((status, index) => {
                const isActive = index === currentStepIndex;
                const isPastStep = index < currentStepIndex;
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

          {/* ── Content ── */}
          <div className="px-5 py-5 space-y-4">

            {/* Timer */}
            {(currentStatus === "in-progress" || currentStatus === "completed") && (
              <div className="flex items-center justify-center gap-4">
                {(["hours", "minutes", "seconds"] as const).map((unit) => (
                  <div key={unit} className="bg-gray-100 rounded-2xl p-4 text-center min-w-20">
                    <div className={`text-4xl font-bold ${isOvertime() && currentStatus === "in-progress" ? "text-red-600" : "text-gray-900"}`}>
                      {String(timer[unit]).padStart(2, "0")}
                    </div>
                    <div className="text-sm text-gray-600 mt-1 capitalize">{unit}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Total Earned */}
            {currentStatus === "completed" && (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Total Earned</p>
                <p className="text-3xl font-bold text-green-600">
                  +€{booking.price?.toFixed(2) ?? "0.00"}
                </p>
              </div>
            )}

            {/* Customer Card */}
            {currentStatus !== "completed" && (
              <div className="bg-[#F6F6F6] border border-[#0000001A] rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-300 flex items-center justify-center">
                      {booking.image ? (
                        <Image src={booking.image} alt={booking.customerName ?? "Customer"} fill className="object-cover" />
                      ) : (
                        <span className="text-white text-lg font-bold">
                          {booking.customerName?.charAt(0) ?? "?"}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-gray-900">{booking.customerName}</h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#000" stroke="none">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        <span className="text-[13px] text-gray-600">4.9</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push("/tasker/chat")}
                    className="w-11 h-11 bg-[#FFE5D9] rounded-full flex items-center justify-center hover:bg-[#FFD5C2] transition-colors"
                  >
                    <MessageCircle size={18} className="text-brand-orange" />
                  </button>
                </div>
              </div>
            )}

            {/* Overtime Warning */}
            {currentStatus === "in-progress" && isOvertime() && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle size={18} className="text-red-600 shrink-0" />
                <p className="text-[13px] text-red-600 font-medium">You are working overtime</p>
              </div>
            )}

            {/* Ongoing Notes */}
            {currentStatus === "in-progress" && (
              <div>
                <h3 className="text-[15px] font-bold text-gray-900 mb-2">Ongoing Notes</h3>
                <textarea
                  value={ongoingNotes}
                  onChange={(e) => setOngoingNotes(e.target.value)}
                  placeholder="Add progress notes, missing parts, or observations..."
                  className="w-full h-28 p-3 bg-[#F6F6F6] border border-[#0000001A] rounded-xl text-[14px] resize-none focus:outline-none focus:border-brand-orange"
                />
              </div>
            )}

            {/* Proof of Work */}
            {currentStatus === "completed" && (
              <div>
                <h3 className="text-[15px] font-bold text-gray-900 mb-2 text-center">Upload proof of work</h3>
                <PhotoUploader photos={proofPhotos} onChange={setProofPhotos} title="" />
                <p className="text-xs text-gray-500 text-center pt-2">At least 1 photo required</p>
              </div>
            )}

            {/* Completion Notes */}
            {currentStatus === "completed" && (
              <div>
                <h3 className="text-[15px] font-bold text-gray-900 mb-2 text-center">Completion Notes</h3>
                <textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="Add final notes or observations..."
                  className="w-full h-28 p-3 bg-[#F6F6F6] border border-[#0000001A] rounded-xl text-[14px] resize-none focus:outline-none focus:border-brand-orange"
                />
              </div>
            )}

            {/* Job Location */}
            {currentStatus !== "in-progress" && currentStatus !== "completed" && (
              <div className="bg-[#F6F6F6] border border-[#0000001A] rounded-2xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-[15px] font-bold text-gray-900">Job Location</h3>
                  <p className="text-[13px] text-gray-500 text-right max-w-[55%] leading-tight">{booking.location}</p>
                </div>
                <div className="relative rounded-xl overflow-hidden h-40">
                  <Image src="/images/map.png" alt="Job location map" fill className="object-cover" />
                  <button className="absolute bottom-3 left-3 bg-brand-orange text-white px-3 py-1.5 rounded-full text-[12px] font-medium shadow">
                    Tap to open in maps
                  </button>
                </div>
              </div>
            )}

            {/* Transit Warning */}
            {(currentStatus === "not-started" || currentStatus === "in-transit") && (
              <div className="bg-[#FFF4E6] border border-[#FFB84D] rounded-xl p-4 flex items-start gap-3">
                <AlertCircle size={18} className="text-brand-orange shrink-0 mt-0.5" />
                <p className="text-[13px] text-brand-orange leading-relaxed">
                  Kindly let your client know you are in transit before your kraft officially starts.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pb-4">
              {currentStatus === "not-started" && (
                <Button onClick={() => setCurrentStatus("in-transit")} variant="primary" fullWidth>
                  Set Status to In Transit
                </Button>
              )}
              {currentStatus === "in-transit" && (
                <Button
                  onClick={handleStartKraft}
                  variant="primary"
                  fullWidth
                  disabled={isActionLoading}
                >
                  {isActionLoading ? "Starting..." : "Start Kraft"}
                </Button>
              )}
              {currentStatus === "in-progress" && (
                <>
                  <button
                    onClick={() => setIsPaused((p) => !p)}
                    className="w-full py-4 bg-[#FF66001A] border border-[#FF66001A] text-brand-orange text-[15px] font-semibold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                  >
                    <Pause size={18} />
                    {isPaused ? "Resume Task" : "Pause Task"}
                  </button>
                  <Button onClick={() => setCurrentStatus("completed")} variant="primary" fullWidth>
                    Mark Kraft as Completed
                  </Button>
                </>
              )}
              {currentStatus === "completed" && (
                <>
                  <Button onClick={handleCompleteJob} variant="primary" fullWidth disabled={isActionLoading}>
                    {isActionLoading ? "Submitting..." : "Submit & Complete"}
                  </Button>
                  {/* Rate Customer — always visible when completed so they can rate later */}
                  <button
                    onClick={() => setShowRatingModal(true)}
                    className="w-full py-3 border border-brand-orange text-brand-orange text-[15px] font-semibold rounded-xl hover:bg-orange-50 transition-colors"
                  >
                    Rate Customer
                  </button>
                </>
              )}
              <Button onClick={() => setShowReportIssue(true)} variant="secondary" fullWidth>
                Report Issue
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Report Issue Sub-modal ── */}
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
              <h2 className="text-[20px] font-bold font-gerat">Report Issue</h2>
              <button
                onClick={() => setShowReportIssue(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={22} className="text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[14px] font-semibold text-gray-700 mb-2 block">Issue Type</label>
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
                  placeholder="Describe the issue..."
                  className="w-full h-28 p-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] resize-none focus:outline-none focus:border-brand-orange"
                />
              </div>
              <button
                onClick={() => { setShowReportIssue(false); toast.success("Issue reported successfully"); }}
                className="w-full py-3 bg-brand-orange text-white text-[15px] font-semibold rounded-xl hover:opacity-90 transition-opacity"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Rate Customer Modal ── */}
      <RateCustomerModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        customerName={booking.customerName ?? "Customer"}
        customerAvatar={booking.image ?? "/images/pro.jpg"}
        onSubmit={handleRatingSubmit}
      />
    </>
  );
}
