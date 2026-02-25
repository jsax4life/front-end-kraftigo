"use client";

import { X, ChevronRight, Calendar } from "lucide-react";
import Image from "next/image";
import { Booking } from "@/store/useBookingStore";
import Button from "../ui/button";
import { useRouter } from "next/navigation";

interface TaskDetailModalProps {
  booking: Booking | null;
  onClose: () => void;
  onReschedule?: (booking: Booking) => void;
  onReportIssue?: (booking: Booking) => void;
  onCancel?: (booking: Booking) => void;
}

/* Map status → active step index (0-based) */
const STATUS_STEP: Record<string, number> = {
  REQUESTED: 0,
  PENDING: 0,
  CONFIRMED: 1,
  IN_PROGRESS: 2,
  COMPLETED: 3,
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
  onCancel,
}: TaskDetailModalProps) {
  const router = useRouter();
  if (!booking) return null;

  const activeStep = STATUS_STEP[booking.status] ?? 0;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-t-xl w-full max-w-md mx-auto max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 pt-3 pb-3">
          <h2 className="text-[22px] font-bold text-gray-900 leading-tight">
            {booking.title}
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
            {formatDate(booking.date)}{" "}
            <span className="font-bold text-gray-900">{booking.time}</span>
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
              {booking.customerName}
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

        {/* ── Action Buttons ── */}
        <div className="px-5 pt-4 pb-8 space-y-3">
          <Button
            onClick={() => onReschedule?.(booking)}
            variant="primary"
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
          <button
            onClick={() => onCancel?.(booking)}
            className="w-full flex items-center justify-center text-brand-blue-deep py-1 hover:opacity-80 transition-opacity"
          >
            Cancel Kraft
          </button>
        </div>
      </div>
    </div>
  );
}
