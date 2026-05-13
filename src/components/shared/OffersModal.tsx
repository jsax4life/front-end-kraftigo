"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, Star } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import CompareSheet from "./CompareModal";
import type { Application, Booking } from "@/types";
import { getBookingApplicants } from "@/lib/api/bookings";
import {
  isPendingBookingApplication,
  mapBookingApplicationRowToApplication,
} from "@/lib/mapBookingApplicants";
import { bookingPaymentClientSecret } from "@/lib/bookingPaymentCheckout";
import { useBookingsStore } from "@/store/useBookingsStore";
import { DEFAULT_DURATION_HOURS } from "@/lib/durationHours";

interface OffersModalProps {
  booking: Booking | null;
  onClose: () => void;
  /**
   * Marketplace open listing: after `select-applicant` + `proceed-to-payment`, parent can open
   * checkout (e.g. `BookingPaymentConfirmModal`) with the returned booking.
   */
  onMarketplacePaymentReady?: (booking: Booking) => void;
}

const mockApplications: Application[] = [
  {
    id: "app-1",
    job_id: "1",
    artisan_id: "art-1",
    artisan_name: "Edith R.",
    image: "/images/pro.jpg",
    rating: 4,
    reviews_count: 23,
    tasks_count: 72,
    price: "€41.29/hr",
    status: "pending",
    proposal_message:
      "I have six years of experience cleaning houses. My priority is to bring a good service and leave everything very clean✨.",
    description:
      "I have six years of experience cleaning houses. My priority is to bring a good service and leave everything very clean✨.",
    is_top_pro: true,
  },
];

const OffersModal = ({ booking, onClose, onMarketplacePaymentReady }: OffersModalProps) => {
  const router = useRouter();
  const [showCompare, setShowCompare] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [selectingId, setSelectingId] = useState<string | null>(null);

  const { selectApplicant, proceedToPayment, fetchMyBookings, clearError } = useBookingsStore();

  const isMarketplaceOpen = booking?.status === "OPEN_FOR_APPLICATIONS";
  const isBookingExpired = booking?.status === "EXPIRED";

  const loadApplicants = useCallback(async () => {
    if (!booking?.id || !isMarketplaceOpen) return;
    setLoadingApplicants(true);
    setLoadError(null);
    try {
      const rows = await getBookingApplicants(booking.id);
      const list = (Array.isArray(rows) ? rows : [])
        .filter(isPendingBookingApplication)
        .map((row) => mapBookingApplicationRowToApplication(row, booking.id))
        .filter((a): a is Application => a !== null);
      setApplications(list);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? String((err as { response?: { data?: { message?: string } } }).response?.data?.message)
          : null;
      setLoadError(msg || "Could not load applicants");
      setApplications([]);
    } finally {
      setLoadingApplicants(false);
    }
  }, [booking?.id, isMarketplaceOpen]);

  useEffect(() => {
    if (!booking) {
      setApplications([]);
      setLoadError(null);
      return;
    }
    if (isMarketplaceOpen) {
      void loadApplicants();
      return;
    }
    setApplications(
      mockApplications.map((a) => ({
        ...a,
        job_id: booking.id,
      })),
    );
    setLoadError(null);
  }, [booking, isMarketplaceOpen, loadApplicants]);

  const title =
    booking?.jobTitle ??
    booking?.service?.title ??
    (booking?.status === "REQUESTED"
      ? `${booking?.service?.title ?? "Request"} with ${booking?.service?.artisan?.fullName ?? "Pro"}`
      : "Offers");

  const handleAcceptApplication = async (applicationId: string) => {
    if (isBookingExpired) {
      toast.error("This booking has expired. Create or repost a new booking to continue.");
      return;
    }
    if (!booking?.id || !isMarketplaceOpen) {
      router.push("/user/book-service/active-job?status=accepted");
      return;
    }
    setSelectingId(applicationId);
    try {
      const bookingLoose = booking as unknown as Record<string, unknown>;
      const pricingTypeRaw =
        bookingLoose.offerPricingType ??
        bookingLoose.offer_pricing_type ??
        bookingLoose.proposedPricingType ??
        bookingLoose.proposed_pricing_type;
      const isHourlyListing = String(pricingTypeRaw ?? "").toUpperCase() === "HOURLY";
      const durationRaw =
        bookingLoose.offerDurationHours ??
        bookingLoose.offer_duration_hours ??
        bookingLoose.durationHours ??
        bookingLoose.duration_hours;
      const durationParsed = Number(durationRaw);
      const durationHours =
        Number.isFinite(durationParsed) && durationParsed > 0
          ? durationParsed
          : DEFAULT_DURATION_HOURS;
      const afterSelect = await selectApplicant(booking.id, {
        applicationId,
        ...(isHourlyListing ? { durationHours } : {}),
      });

      let afterPay: Booking;
      try {
        afterPay = await proceedToPayment(afterSelect.id);
      } catch {
        const { error: payErr } = useBookingsStore.getState();
        clearError();
        toast.error(
          payErr ||
            "Could not start payment. Add a saved card in Payment methods if needed, then complete payment from this booking.",
        );
        await fetchMyBookings();
        onClose();
        router.push(`/user/book-service/active-job?status=accepted&id=${afterSelect.id}`);
        return;
      }

      await fetchMyBookings();
      const secret = bookingPaymentClientSecret(afterPay);
      onClose();

      if (secret && onMarketplacePaymentReady) {
        toast.success("Krafter selected — confirm payment to continue.");
        onMarketplacePaymentReady(afterPay);
        return;
      }

      if (secret) {
        toast.success("Krafter selected — confirm payment to continue.");
        router.push(`/user/book-service/active-job?status=accepted&id=${afterPay.id}`);
        return;
      }

      toast.success("Krafter selected.");
      router.push(`/user/book-service/active-job?status=accepted&id=${afterPay.id}`);
    } catch {
      toast.error("Could not select this Krafter");
    } finally {
      setSelectingId(null);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        <div className="px-4 pt-6 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-[20px] font-gerat font-bold text-black pr-4">{title}</h1>
            <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 shrink-0">
              <X size={22} />
            </button>
          </div>
          <p className="text-[14px] font-poppins font-bold text-brand-orange">
            {loadingApplicants && isMarketplaceOpen
              ? "Loading offers…"
              : `${applications.length} Offer${applications.length === 1 ? "" : "s"} Received`}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-28 mb-20">
          {isBookingExpired && (
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-[13px] font-poppins text-amber-900">
              This booking expired because the scheduled time passed. Repost the task to receive new offers.
            </div>
          )}
          {loadError && isMarketplaceOpen && (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-[13px] font-poppins text-red-700">
              {loadError}
              <button
                type="button"
                onClick={() => void loadApplicants()}
                className="mt-2 block text-brand-orange font-semibold"
              >
                Try again
              </button>
            </div>
          )}

          {!loadingApplicants && isMarketplaceOpen && applications.length === 0 && !loadError && (
            <p className="text-center text-[14px] font-poppins text-gray-500 py-8">
              No Krafters have applied yet. Check back soon.
            </p>
          )}

          {applications.map((app) => (
            <div
              key={app.id}
              className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:border-brand-orange transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <Image
                  src={app.image}
                  alt={app.artisan_name}
                  width={52}
                  height={52}
                  className="rounded-full object-cover w-13 h-13 shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-poppins font-bold text-black">{app.artisan_name}</span>
                    {app.is_top_pro && (
                      <span className="text-[10px] font-poppins font-bold text-brand-orange border border-brand-orange rounded-full px-2 py-0.5">
                        TOP PRO
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={12}
                        className={
                          star <= app.rating
                            ? "text-brand-orange fill-brand-orange"
                            : "text-gray-300 fill-gray-300"
                        }
                      />
                    ))}
                    <span className="text-[12px] font-poppins text-gray-500 ml-1">
                      ({app.reviews_count} Reviews) &nbsp; {app.tasks_count} Krafts
                    </span>
                  </div>
                </div>
              </div>

              {/* horizontal line */}
              <div className="h-px bg-gray-200 my-4"></div>
              <p className="text-[20px] font-gerat  mb-2"> {app.artisan_name} is negotiating the price <span className="text-brand-orange "> {app.price}</span></p>

              <p className="text-[13px] font-poppins text-gray-600 mb-4 leading-relaxed">
                {app.proposal_message || app.description}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const qp = new URLSearchParams();
                    qp.set("artisanId", app.artisan_id);
                    qp.set("name", app.artisan_name);
                    if (app.job_id?.trim()) qp.set("bookingId", app.job_id.trim());
                    router.push(`/user/chat?${qp.toString()}`);
                  }}
                  className="bg-[#FF66001A] flex items-center justify-center gap-2 px-5 py-3 border border-gray-200 rounded-xl text-[13px] font-poppins font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Chat
                </button>
                <button
                  type="button"
                  disabled={Boolean(selectingId) || isBookingExpired}
                  onClick={() =>
                    isMarketplaceOpen ? void handleAcceptApplication(app.id) : router.push("/user/book-service/active-job?status=accepted")
                  }
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-brand-orange text-white rounded-xl text-[13px] font-poppins font-semibold hover:bg-orange-600 transition-colors disabled:opacity-60"
                >
                  {selectingId === app.id ? "Working…" : "Accept Offer"}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-white border-t border-gray-100 mb-20 mt-20">
          <button
            type="button"
            onClick={() => setShowCompare(true)}
            disabled={applications.length < 2 || Boolean(selectingId) || isBookingExpired}
            className="w-full py-4 bg-brand-orange text-white rounded-full text-[15px] font-poppins font-semibold flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors shadow-md disabled:opacity-40 disabled:pointer-events-none"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 16l-4 4-4-4M17 20V4M3 8l4-4 4 4M7 4v16" />
            </svg>
            Compare Krafters ({applications.length})
          </button>
        </div>
      </div>

      {showCompare && (
        <CompareSheet
          allArtisans={applications}
          onClose={() => setShowCompare(false)}
          onSelect={(artisan) => {
            void handleAcceptApplication(artisan.id);
            setShowCompare(false);
          }}
        />
      )}
    </>
  );
};

export default OffersModal;
