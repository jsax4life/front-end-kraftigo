"use client";

import Image from "next/image";
import { X, Calendar } from "lucide-react";
import type { DirectArtisanBookingRequest } from "@/lib/api/bookings";
import { isDirectRequestPendingPayment } from "@/lib/directRequestStatus";

function formatPreferredTime(time: string): string {
  if (!time) return "";
  const m = time.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return time.trim();
  let h = parseInt(m[1], 10);
  const min = m[2];
  const ap = h >= 12 ? "PM" : "AM";
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${min} ${ap}`;
}

/** e.g. "15th Jan, 2025" */
function formatPreferredDateLong(isoDate: string): string {
  try {
    const d = new Date(isoDate + "T12:00:00");
    if (Number.isNaN(d.getTime())) return isoDate;
    const day = d.getDate();
    const suf =
      day === 1 || day === 21 || day === 31
        ? "st"
        : day === 2 || day === 22
          ? "nd"
          : day === 3 || day === 23
            ? "rd"
            : "th";
    const mon = d.toLocaleDateString("en-GB", { month: "short" });
    const year = d.getFullYear();
    return `${day}${suf} ${mon}, ${year}`;
  } catch {
    return isoDate;
  }
}

function formatHourlyPrice(value: string | null | undefined): string {
  if (value == null || value === "") return "—";
  const n = parseFloat(String(value));
  if (!Number.isFinite(n)) return String(value);
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
  return `${formatted}/hr`;
}

function parseJobDescription(raw: string): {
  kraftDetails: string;
  specialInstructions: string;
} {
  if (!raw?.trim()) return { kraftDetails: "", specialInstructions: "" };
  const split = raw.split(/\r?\n\r?\nSpecial instructions:\s*/i);
  if (split.length < 2) {
    return { kraftDetails: raw.trim(), specialInstructions: "" };
  }
  return {
    kraftDetails: split[0].trim(),
    specialInstructions: split.slice(1).join("\n\n").trim(),
  };
}

/** Human-readable + raw API values for preferred slot */
function preferredDateTimeDisplay(request: DirectArtisanBookingRequest): {
  friendly: string;
  raw: string;
} {
  const date = request.preferredDate?.trim() || "";
  const time = request.preferredTime?.trim() || "";
  const friendlyDate = date ? formatPreferredDateLong(date) : "";
  const friendlyTime = time ? formatPreferredTime(time) : "";
  const friendly = [friendlyDate, friendlyTime].filter(Boolean).join(" · ") || "—";
  const raw = [date && `Date: ${date}`, time && `Time: ${time}`]
    .filter(Boolean)
    .join("\n");
  return { friendly, raw: raw || "—" };
}

type DirectRequestDetailModalProps = {
  request: DirectArtisanBookingRequest | null;
  open: boolean;
  onClose: () => void;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onRenegotiate: (id: string) => void;
  isSubmitting?: boolean;
};

export default function DirectRequestDetailModal({
  request,
  open,
  onClose,
  onAccept,
  onDecline,
  onRenegotiate,
  isSubmitting = false,
}: DirectRequestDetailModalProps) {
  if (!open || !request) return null;

  const pendingCustomerPayment = isDirectRequestPendingPayment(request.status);

  const { kraftDetails, specialInstructions } = parseJobDescription(
    request.jobDescription || "",
  );
  const dateTimeLine = preferredDateTimeDisplay(request);
  const summaryLine = [
    formatPreferredDateLong(request.preferredDate),
    formatPreferredTime(request.preferredTime),
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className="fixed inset-0 z-70 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] overflow-hidden flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="direct-request-title"
      >
        <div className="flex items-start justify-between px-5 pt-5 pb-2 shrink-0">
          <h2
            id="direct-request-title"
            className="text-[22px] sm:text-[24px] font-gerat font-bold text-gray-900 pr-8 leading-tight"
          >
            {request.jobTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 -mr-1 rounded-full hover:bg-gray-100 text-gray-400 shrink-0"
            aria-label="Close"
          >
            <X size={24} strokeWidth={2} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 pb-4">
          {pendingCustomerPayment && (
            <div
              className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3"
              role="status"
            >
              <p className="text-[13px] font-poppins font-semibold text-amber-900">
                Payment pending
              </p>
              <p className="text-[12px] font-poppins text-amber-800/90 mt-1 leading-snug">
                You accepted this request. The customer still needs to authorize payment in the app
                before the booking is fully confirmed.
              </p>
            </div>
          )}
          <div className="text-center mb-5">
            <p className="text-[26px] sm:text-[28px] font-poppins font-bold text-brand-orange">
              {formatHourlyPrice(request.proposedPrice)}
            </p>
            <div className="flex items-center justify-center gap-2 mt-2 text-[14px] font-poppins text-gray-700">
              <Calendar size={18} className="text-gray-500 shrink-0" />
              <span>{summaryLine || "—"}</span>
            </div>
          </div>

          <div className="mb-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <span className="text-[15px] font-poppins font-bold text-gray-900">
                Job Location
              </span>
              <span className="text-[13px] font-poppins text-gray-700 text-right max-w-[60%]">
                {request.address}
              </span>
            </div>
            <div className="relative rounded-xl overflow-hidden border border-[#0000001A]">
              <Image
                src="/images/map.png"
                alt="Map preview"
                width={600}
                height={360}
                className="w-full h-44 sm:h-52 object-cover"
              />
              <div className="absolute bottom-3 left-3">
                <span className="inline-block bg-brand-orange text-white text-[12px] font-poppins font-semibold px-3 py-1.5 rounded-full shadow-md">
                  Service Area
                </span>
              </div>
            </div>
          </div>

          <div className="mb-5">
            <p className="text-[15px] font-poppins font-bold text-gray-900 mb-2">
              Preferred date and time
            </p>
            <div className="bg-[#F6F6F6] rounded-xl px-3 py-3 border border-[#0000000D] space-y-2">
              <p className="text-[14px] font-poppins text-gray-900 font-medium">
                {dateTimeLine.friendly}
              </p>
              {/* <p className="text-[12px] font-mono text-gray-500 whitespace-pre-wrap leading-relaxed">
                {dateTimeLine.raw}
              </p> */}
            </div>
          </div>

          <div className="mb-5">
            <p className="text-[15px] font-poppins font-bold text-gray-900 mb-2">
              Kraft Details
            </p>
            <div className="bg-[#F6F6F6] rounded-xl px-3 py-3 border border-[#0000000D]">
              <p className="text-[14px] font-poppins text-gray-700 whitespace-pre-wrap wrap-break-word leading-relaxed">
                {kraftDetails || "—"}
              </p>
            </div>
          </div>

          {request.mediaUrls && request.mediaUrls.length > 0 && (
            <div className="mb-5">
              <p className="text-[15px] font-poppins font-bold text-gray-900 mb-2">
                Photos
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {request.mediaUrls.map((url) => (
                  <div
                    key={url}
                    className="relative w-[88px] h-[88px] shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-200"
                  >
                    <Image
                      src={url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="88px"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-2">
            <p className="text-[15px] font-poppins font-bold text-gray-900 mb-2">
              Special Instructions
            </p>
            <div className="bg-[#F6F6F6] rounded-xl px-3 py-3 border border-[#0000000D]">
              <p className="text-[14px] font-poppins text-gray-700 whitespace-pre-wrap wrap-break-word leading-relaxed">
                {specialInstructions || "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 px-5 py-4 space-y-3 shrink-0 bg-white">
          {/* <button
            type="button"
            onClick={() => onRenegotiate(request.id)}
            disabled={isSubmitting}
            className="w-full text-center text-brand-orange font-poppins font-semibold text-[14px] py-1 hover:underline disabled:opacity-50"
          >
            Renegotiate offer
          </button> */}
          <button
            type="button"
            onClick={() => onAccept(request.id)}
            disabled={isSubmitting || pendingCustomerPayment}
            className="w-full py-3.5 rounded-xl bg-brand-orange text-white font-poppins font-semibold text-[16px] hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm"
          >
            {pendingCustomerPayment
              ? "Awaiting customer payment"
              : isSubmitting
                ? "Please wait…"
                : "Accept Request"}
          </button>
          <button
            type="button"
            onClick={() => onDecline(request.id)}
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-brand-blue text-white font-poppins font-semibold text-[16px] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
