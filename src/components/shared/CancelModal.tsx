"use client";

import { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import Image from "next/image";

interface CancelModalProps {
  booking: any;
  onClose: () => void;
  onConfirm: () => void;
}

const reasons = [
  "Schedule Conflict",
  "No longer need the service",
  "Found a different Krafter",
  "Other",
];

const CancelModal = ({ booking, onClose, onConfirm }: CancelModalProps) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [moreDetails, setMoreDetails] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    setConfirmed(true);
  };

  if (confirmed) {
    return (
      <div className="fixed inset-0 z-60 bg-white flex flex-col">
        {/* Main content — centered */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          {/* Lavender circle with blue calendar+X icon */}
          <div className="w-28 h-28 bg-[#E8E9FF] rounded-full flex items-center justify-center mb-8">
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
              <rect x="8" y="14" width="40" height="34" rx="4" fill="#0000FF" />
              <rect x="8" y="14" width="40" height="10" rx="4" fill="#0000CC" />
              <rect x="18" y="8" width="4" height="12" rx="2" fill="#0000FF" />
              <rect x="34" y="8" width="4" height="12" rx="2" fill="#0000FF" />
              <circle cx="20" cy="32" r="2" fill="white" />
              <circle cx="28" cy="32" r="2" fill="white" />
              <circle cx="20" cy="40" r="2" fill="white" />
              <circle cx="38" cy="40" r="7" fill="#FF4444" />
              <path d="M34.5 36.5l7 7M41.5 36.5l-7 7" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>

          <h2 className="text-[26px] font-gerat font-bold text-black mb-3 text-center">
            Kraft Cancelled
          </h2>
          <p className="text-[13px] font-poppins text-gray-500 text-center leading-relaxed mb-10">
            Your Booking has been Successfully removed. you<br />
            will receive an email confirmation shortly
          </p>

          {/* Refund Status card — bordered */}
          <div className="w-full border border-gray-200 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-1">
              {/* Payment/card icon */}
              <div className="w-9 h-9 border-2 border-gray-300 rounded-xl flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="5" width="20" height="14" rx="2" stroke="#555" strokeWidth="1.8"/>
                  <path d="M2 10h20" stroke="#555" strokeWidth="1.8"/>
                  <circle cx="6" cy="15" r="1.5" fill="#555"/>
                  <circle cx="10" cy="15" r="1.5" fill="#555"/>
                </svg>
              </div>
              <span className="text-[14px] font-poppins font-bold text-black">Refund Status</span>
            </div>
            <p className="text-[13px] font-poppins text-gray-500 ml-12 leading-relaxed">
              Full refund of $50.00 processed to your original payment method
            </p>
          </div>
        </div>

        {/* Buttons pinned to bottom */}
        <div className="px-5 pb-8 space-y-3">
          <button
            onClick={() => {}}
            className="w-full py-4 bg-brand-orange text-white rounded-lg text-[15px] font-poppins font-semibold hover:bg-orange-600 transition-colors"
          >
            Browse Krafters
          </button>
          <button
            onClick={onConfirm}
            className="w-full py-4 bg-brand-blue text-white rounded-lg text-[15px] font-poppins font-semibold hover:bg-blue-700 transition-colors"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }


  return (
    <>
      <div className="fixed inset-0 z-60 bg-black/40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-60 bg-white rounded-t-[32px] max-h-[92vh] flex flex-col">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-4 pb-3 shrink-0">
          <div>
            <h2 className="text-[20px] font-gerat font-bold text-black">
              Kraft Cancellation
            </h2>
            <p className="text-[12px] font-poppins text-gray-500 mt-0.5">
              Are You Sure You Want To Cancel?<br />
              Please confirm the details of the booking you wish to cancel.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 mt-1">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-6">
          {/* Booking Summary */}
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
              <p className="text-[12px] font-poppins text-gray-500">
                {booking.artisan?.location}
              </p>
              <p className="text-[12px] font-poppins text-gray-500">
                {booking.date} ({booking.timeLabel})
              </p>
            </div>
          </div>

          {/* Reason */}
          <p className="text-[13px] font-poppins font-semibold text-black mb-3">
            Reason for cancellation
          </p>
          <div className="space-y-3 mb-4">
            {reasons.map((reason) => (
              <label
                key={reason}
                className="flex items-center justify-between cursor-pointer"
              >
                <span className="text-[13px] font-poppins text-gray-700">
                  {reason}
                </span>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    selectedReason === reason
                      ? "border-brand-orange bg-brand-orange"
                      : "border-gray-300"
                  }`}
                  onClick={() => setSelectedReason(reason)}
                >
                  {selectedReason === reason && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
              </label>
            ))}
          </div>

          {/* Tell us more */}
          <button className="text-[13px] font-poppins text-brand-orange underline mb-4">
            Tell us more (Optional)
          </button>

          {/* Cancellation Policy */}
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-5 flex gap-2">
            <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[12px] font-poppins font-semibold text-red-600 mb-0.5">
                Cancellation Policy
              </p>
              <p className="text-[11px] font-poppins text-red-500">
                Cancellations made within 24 hours of the booking time may incur a 50% fee.
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleConfirm}
              disabled={!selectedReason}
              className={`w-full py-4 rounded-2xl text-[15px] font-poppins font-semibold transition-colors ${
                selectedReason
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              Confirm cancellation
            </button>
            <button
              onClick={onClose}
              className="w-full py-4 bg-brand-blue text-white rounded-2xl text-[15px] font-poppins font-semibold hover:bg-blue-700 transition-colors"
            >
              Keep booking
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CancelModal;
