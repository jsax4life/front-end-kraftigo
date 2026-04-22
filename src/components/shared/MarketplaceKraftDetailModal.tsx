"use client";

import { useEffect, useState } from "react";
import { getBookingById } from "@/lib/api/bookings";
import type { Booking } from "@/types";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import MarketplaceKraftDetailPanel from "@/components/shared/MarketplaceKraftDetailPanel";

interface MarketplaceKraftDetailModalProps {
  open: boolean;
  bookingId: string | null;
  onClose: () => void;
  /** e.g. refetch marketplace list after a successful apply */
  onApplied?: () => void;
  /** Set when opening from “My applications” so apply/negotiate stay hidden after `getBookingById`. */
  readOnlyApplication?: boolean;
  artisanApplicationStatus?: string | null;
}

export default function MarketplaceKraftDetailModal({
  open,
  bookingId,
  onClose,
  onApplied,
  readOnlyApplication = false,
  artisanApplicationStatus = null,
}: MarketplaceKraftDetailModalProps) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !bookingId) {
      setBooking(null);
      setError(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void getBookingById(bookingId)
      .then((b) => {
        if (!cancelled) setBooking(b);
      })
      .catch((err: unknown) => {
        const ax = err as { response?: { data?: { message?: string } }; message?: string };
        if (!cancelled) {
          setError(ax.response?.data?.message ?? ax.message ?? "Could not load this Kraft.");
          setBooking(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, bookingId]);

  if (!open || !bookingId) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-black/50 sm:flex sm:flex-row sm:items-center sm:justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="marketplace-kraft-detail-title"
      onClick={onClose}
    >
      {/* Mobile: leave ~52px of dimmed overlay at top so the sheet reads as a modal over the list */}
      <button
        type="button"
        className="min-h-[52px] w-full flex-1 shrink-0 cursor-pointer border-0 bg-transparent p-0 sm:hidden"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className="relative mx-auto flex w-full max-w-lg shrink-0 flex-col overflow-hidden rounded-t-3xl bg-white shadow-xl max-h-[calc(100dvh-52px)] min-h-0 sm:mx-0 sm:max-h-[min(92dvh,880px)] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {loading && (
          <div className="flex flex-1 items-center justify-center min-h-[240px]">
            <LoadingSpinner size="lg" />
          </div>
        )}
        {!loading && error && (
          <div className="flex flex-col flex-1 p-6">
            <p className="text-center text-gray-600 font-poppins flex-1 flex items-center justify-center">
              {error}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full py-3 rounded-lg bg-brand-blue text-white font-medium font-poppins"
            >
              Close
            </button>
          </div>
        )}
        {booking && !loading && !error && (
          <MarketplaceKraftDetailPanel
            booking={booking}
            bookingId={bookingId}
            onDismiss={onClose}
            onApplied={() => {
              onApplied?.();
              onClose();
            }}
            showTaskerNav={false}
            readOnlyApplication={readOnlyApplication}
            artisanApplicationStatus={artisanApplicationStatus}
          />
        )}
      </div>
    </div>
  );
}
