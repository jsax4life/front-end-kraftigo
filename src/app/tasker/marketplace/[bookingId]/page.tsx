"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import TaskerNav from "@/components/shared/taskerNav";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import MarketplaceKraftDetailPanel from "@/components/shared/MarketplaceKraftDetailPanel";
import { getBookingById } from "@/lib/api/bookings";
import type { Booking } from "@/types";

function MarketplaceKraftDetailContent() {
  const router = useRouter();
  const params = useParams();
  const bookingId = typeof params.bookingId === "string" ? params.bookingId : "";

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      setLoadError("Missing task id.");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    void getBookingById(bookingId)
      .then((b) => {
        if (!cancelled) setBooking(b);
      })
      .catch((err: unknown) => {
        const ax = err as { response?: { data?: { message?: string } }; message?: string };
        if (!cancelled) {
          setLoadError(ax.response?.data?.message ?? ax.message ?? "Could not load this Kraft.");
          setBooking(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white pb-24">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (loadError || !booking) {
    return (
      <main className="min-h-screen bg-white pb-24 px-4 pt-6">
        <div className="max-w-4xl mx-auto w-full">
          <button type="button" onClick={() => router.back()} className="mb-4 flex items-center gap-2 text-gray-700">
            <ArrowLeft size={20} />
            Back
          </button>
          <p className="text-center text-gray-600 font-poppins py-12">{loadError ?? "Kraft not found."}</p>
        </div>
        <TaskerNav />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white relative">
      <div className="max-w-4xl mx-auto w-full">
        <MarketplaceKraftDetailPanel
          booking={booking}
          bookingId={bookingId}
          onDismiss={() => router.back()}
          onApplied={() => router.push("/tasker/requests")}
          showTaskerNav
        />
      </div>
    </main>
  );
}

export default function MarketplaceKraftDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <MarketplaceKraftDetailContent />
    </Suspense>
  );
}
