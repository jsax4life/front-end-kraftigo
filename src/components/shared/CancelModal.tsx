"use client";

import { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import Image from "next/image";
import type { CancelBookingPayload, CancelBookingReason } from "@/lib/api/bookings";
import { useTranslations } from "next-intl";

// Kept as fallback values, though we will map over these keys using translation in the component
const CANCEL_REASON_OPTIONS: { value: CancelBookingReason; translationKey: string }[] = [
  { value: "SCHEDULE_CONFLICT", translationKey: "scheduleConflict" },
  { value: "NO_LONGER_NEED_SERVICE", translationKey: "noLongerNeed" },
  { value: "FOUND_DIFFERENT_KRAFTER", translationKey: "foundDifferent" },
  { value: "OTHER", translationKey: "other" },
];

const DETAILS_MAX = 2000;

interface CancelModalProps {
  booking: any;
  onClose: () => void;
  onConfirm: (payload: CancelBookingPayload) => Promise<void>;
}

const CancelModal = ({ booking, onClose, onConfirm }: CancelModalProps) => {
  const t = useTranslations("modals.cancel");
  const [selectedReason, setSelectedReason] = useState<CancelBookingReason | "">("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const needsDetails = selectedReason === "OTHER";
  const detailsOk = !needsDetails || details.trim().length > 0;
  const isFormValid = Boolean(selectedReason) && detailsOk;

  const handleSubmit = async () => {
    if (!selectedReason || !isFormValid || submitting) return;
    if (needsDetails && !details.trim()) return;

    const payload: CancelBookingPayload =
      selectedReason === "OTHER"
        ? { reason: "OTHER", details: details.trim().slice(0, DETAILS_MAX) }
        : { reason: selectedReason };

    setSubmitting(true);
    try {
      await onConfirm(payload);
    } finally {
      setSubmitting(false);
    }
  };

  const dateLine = [booking.date, booking.time].filter(Boolean).join(" · ");

  return (
    <>
      <div className="fixed inset-0 z-60 bg-black/40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-60 bg-white rounded-t-[32px] max-h-[92vh] flex flex-col">
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="flex items-start justify-between px-5 pt-4 pb-3 shrink-0">
          <div>
            <h2 className="text-[20px] font-gerat font-bold text-black">{t("title")}</h2>
            <p className="text-[12px] font-poppins text-gray-500 mt-0.5">
              {t("subtitle")}
              <br />
              {t("description")}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 mt-1">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-6">
          <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3 mb-5">
            <Image
              src={booking.artisan?.image || "/images/pro.jpg"}
              alt="artisan"
              width={52}
              height={52}
              className="rounded-xl object-cover w-13 h-13 shrink-0"
            />
            <div>
              <p className="text-[13px] font-poppins font-bold text-black">
                {booking.artisan?.name || booking.service}
              </p>
              <p className="text-[12px] font-poppins text-gray-500">{booking.artisan?.location}</p>
              {dateLine ? (
                <p className="text-[12px] font-poppins text-gray-500">{dateLine}</p>
              ) : null}
            </div>
          </div>

          <p className="text-[13px] font-poppins font-semibold text-black mb-3">{t("reasonTitle")}</p>
          <div className="space-y-3 mb-4">
            {CANCEL_REASON_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center justify-between cursor-pointer gap-3"
                onClick={() => {
                  setSelectedReason(opt.value);
                  if (opt.value !== "OTHER") setDetails("");
                }}
              >
                <span className="text-[13px] font-poppins text-gray-700">{t(`reasons.${opt.translationKey}` as any)}</span>
                <span
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                    selectedReason === opt.value
                      ? "border-brand-orange bg-brand-orange"
                      : "border-gray-300"
                  }`}
                >
                  {selectedReason === opt.value && <span className="w-2 h-2 bg-white rounded-full" />}
                </span>
              </label>
            ))}
          </div>

          {needsDetails && (
            <div className="mb-4">
              <p className="text-[13px] font-poppins font-semibold text-black mb-2">
                {t("tellUsMore")} <span className="text-red-500">*</span>
              </p>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value.slice(0, DETAILS_MAX))}
                rows={4}
                maxLength={DETAILS_MAX}
                placeholder={t("describeReason")}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-[13px] font-poppins text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
              />
              <p className="text-[11px] font-poppins text-gray-400 mt-1 text-right">
                {details.length}/{DETAILS_MAX}
              </p>
            </div>
          )}

          <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-5 flex gap-2">
            <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[12px] font-poppins font-semibold text-red-600 mb-0.5">
                {t("policyTitle")}
              </p>
              <p className="text-[11px] font-poppins text-red-500">
                {t("policyDesc")}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isFormValid || submitting}
              className={`w-full py-4 rounded-2xl text-[15px] font-poppins font-semibold transition-colors ${
                isFormValid && !submitting
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              {submitting ? t("cancelling") : t("confirm")}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="w-full py-4 bg-brand-blue text-white rounded-2xl text-[15px] font-poppins font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {t("keepBooking")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CancelModal;
