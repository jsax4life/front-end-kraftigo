"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import BookingPaymentConfirmModal from "@/components/shared/BookingPaymentConfirmModal";
import {
  getBookingById,
  normalizeBookingDetailResponse,
  proceedToPayment,
} from "@/lib/api/bookings";
import { getMyPayments } from "@/lib/api/payments";
import { bookingPaymentClientSecret } from "@/lib/bookingPaymentCheckout";
import {
  type BookingEmailIntent,
  bookingNeedsCustomerPayment,
  findPaymentIdForBooking,
  paymentBelongsToBooking,
  resolveBookingEmailIntent,
} from "@/lib/bookingEmailDeepLink";
import type { Booking } from "@/types";
import { useAuthStore } from "@/store/useAuthStore";
import toast from "react-hot-toast";

function parseIntent(raw: string | null): BookingEmailIntent {
  const v = (raw ?? "").trim().toLowerCase();
  if (v === "pay" || v === "payment" || v === "checkout") return "pay";
  if (v === "receipt") return "receipt";
  return "auto";
}

function BookingDeepLinkContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = typeof params.id === "string" ? params.id : "";

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => !s.isLoading);

  const intent = useMemo(
    () => parseIntent(searchParams.get("intent") ?? searchParams.get("action")),
    [searchParams],
  );

  const [phase, setPhase] = useState<
    "loading" | "pay" | "redirecting" | "error" | "idle"
  >("loading");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const returnUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/bookings/${bookingId}`
      : `/bookings/${bookingId}`;

  const loadFlow = useCallback(async () => {
    if (!bookingId) {
      setErrorMessage("Missing booking id.");
      setPhase("error");
      return;
    }

    setPhase("loading");
    setErrorMessage(null);

    try {
      let detail = await getBookingById(bookingId, { includePaymentSummary: true });

      if (bookingNeedsCustomerPayment(detail.status) && detail.status === "ACCEPTED") {
        try {
          const afterProceed = await proceedToPayment(bookingId);
          detail = normalizeBookingDetailResponse(afterProceed);
        } catch {
          detail = await getBookingById(bookingId, { includePaymentSummary: true });
        }
      }

      const payments = await getMyPayments();
      const linkedPayments = payments.filter((p) => paymentBelongsToBooking(p, bookingId));
      const resolved = resolveBookingEmailIntent(intent, detail, linkedPayments);

      setBooking(detail);

      if (resolved === "receipt") {
        const paymentId = await findPaymentIdForBooking(bookingId);
        if (paymentId) {
          setPhase("redirecting");
          router.replace(`/user/profile/receipt?id=${encodeURIComponent(paymentId)}`);
          return;
        }
        setErrorMessage(
          "Payment record is not available yet. Open My Krafts or try again in a moment.",
        );
        setPhase("error");
        return;
      }

      if (resolved === "pay") {
        if (!bookingNeedsCustomerPayment(detail.status) && detail.status !== "PAYMENT_PENDING") {
          setPhase("redirecting");
          router.replace(`/user/book-service/active-job?status=accepted&id=${bookingId}`);
          return;
        }
        setPaymentModalOpen(true);
        setPhase("pay");
        return;
      }

      setPhase("redirecting");
      router.replace(`/user/book-service/active-job?status=accepted&id=${bookingId}`);
    } catch (err: unknown) {
      const ax = err as { response?: { status?: number; data?: { message?: string } } };
      if (ax.response?.status === 401) {
        const next = encodeURIComponent(`/bookings/${bookingId}`);
        router.replace(`/user/login?redirect=${next}`);
        return;
      }
      setErrorMessage(
        ax.response?.data?.message ?? "Could not load this booking. It may not exist or you may not have access.",
      );
      setPhase("error");
    }
  }, [bookingId, intent, router]);

  useEffect(() => {
    if (!authReady) return;
    if (!isAuthenticated) {
      const next = encodeURIComponent(`/bookings/${bookingId}`);
      router.replace(`/user/login?redirect=${next}`);
      return;
    }
    void loadFlow();
  }, [authReady, isAuthenticated, bookingId, router, loadFlow]);

  const handlePaymentComplete = () => {
    toast.success("Payment confirmed.");
    setPaymentModalOpen(false);
    void (async () => {
      const paymentId = await findPaymentIdForBooking(bookingId);
      if (paymentId) {
        router.replace(`/user/profile/receipt?id=${encodeURIComponent(paymentId)}`);
        return;
      }
      router.replace("/user/krafts");
    })();
  };

  if (phase === "loading" || phase === "redirecting") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center">
        <p className="text-[15px] font-poppins text-gray-700 mb-4">{errorMessage}</p>
        <button
          type="button"
          onClick={() => router.push("/user/krafts")}
          className="px-5 py-3 bg-brand-orange text-white rounded-xl font-poppins font-semibold text-[14px]"
        >
          Go to My Krafts
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center">
        <p className="text-[15px] font-poppins text-gray-700 mb-2">
          {booking?.jobTitle ?? booking?.service?.title ?? "Your booking"}
        </p>
        <p className="text-[13px] font-poppins text-gray-500">
          Complete payment to confirm your appointment.
        </p>
      </div>

      {booking && (
        <BookingPaymentConfirmModal
          open={paymentModalOpen}
          bookingId={booking.id}
          initialClientSecret={bookingPaymentClientSecret(booking)}
          returnUrl={returnUrl}
          onClose={() => {
            setPaymentModalOpen(false);
            router.push("/user/krafts");
          }}
          onComplete={handlePaymentComplete}
        />
      )}
    </>
  );
}

export default function BookingEmailDeepLinkPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <BookingDeepLinkContent />
    </Suspense>
  );
}
