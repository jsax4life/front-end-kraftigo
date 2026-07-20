"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import UserNav from "@/components/shared/userNav";
import { ArrowLeft, Search, MapPin, Tag, MessageCircle, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import OffersModal from "@/components/shared/OffersModal";
import CustomerKraftTaskDetailModal from "@/components/shared/CustomerKraftTaskDetailModal";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ErrorBanner from "@/components/shared/ErrorBanner";
import { useBookingsStore } from "@/store/useBookingsStore";
import type { Booking, BookingStatus } from "@/types";
import {
  bookingNeedsKrafterSelection,
  buildSelectArtisanQuery,
  bookingArtisanName,
  deriveActiveJobDisplay,
  getKraftListCardImage,
  isKraftTaskPlaceholderImage,
  parseBookingMoney,
} from "@/lib/bookingDisplay";
import { buildCustomerMessageKrafterUrl, canCustomerMessageKrafter } from "@/lib/chatDeepLinks";
import BookingPaymentConfirmModal from "@/components/shared/BookingPaymentConfirmModal";
import { bookingPaymentClientSecret } from "@/lib/bookingPaymentCheckout";
import { getBookingApplicants } from "@/lib/api/bookings";
import { isPendingBookingApplication } from "@/lib/mapBookingApplicants";

function KraftTaskThumbnail({ src, alt }: { src: string; alt: string }) {
  const isPlaceholder = isKraftTaskPlaceholderImage(src);
  return (
    <div
      className={`relative w-20 h-20 rounded-xl shrink-0 overflow-hidden ${
        isPlaceholder ? "bg-[#FFF5F0] border border-orange-100 flex items-center justify-center" : ""
      }`}
    >
      <Image
        src={src}
        alt={alt}
        width={isPlaceholder ? 36 : 80}
        height={isPlaceholder ? 36 : 80}
        className={isPlaceholder ? "object-contain" : "object-cover w-full h-full"}
      />
    </div>
  );
}

function formatPostedDayMonth(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}

type UpcomingBookingFilter = "all" | "active" | "open_and_waiting" | "drafts" | "declined";

const UPCOMING_FILTER_STATUSES: Record<
  UpcomingBookingFilter,
  readonly BookingStatus[] | null
> = {
  all: null,
  active: ["ACCEPTED", "CONFIRMED", "IN_PROGRESS", "PAYMENT_PENDING"],
  open_and_waiting: ["REQUESTED", "KRAFTER_SELECTED", "COUNTERED", "OPEN_FOR_APPLICATIONS"],
  drafts: ["RECOMMENDATION_PENDING"],
  declined: ["DECLINED"],
};


const AWAITING_KRAFTER_STATUSES: readonly BookingStatus[] = [
  "REQUESTED",
  "KRAFTER_SELECTED",
  "COUNTERED",
];

const UPCOMING_FILTER_TABS: { id: UpcomingBookingFilter; label: string; hint?: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "open_and_waiting", label: "Waiting & open", hint: "Responses & community" },
  { id: "drafts", label: "Drafts", hint: "Pick a Krafter" },
  { id: "declined", label: "Declined" },
];

function matchesUpcomingFilter(status: BookingStatus, filter: UpcomingBookingFilter): boolean {
  const allowed = UPCOMING_FILTER_STATUSES[filter];
  if (allowed === null) return true;
  return allowed.includes(status);
}

/** Statuses shown under “Waiting & open” — card opens task detail modal on tap. */
const WAITING_OPEN_DETAIL_STATUSES = UPCOMING_FILTER_STATUSES.open_and_waiting as readonly BookingStatus[];

/** “All” filter: same detail modal as Waiting & open, but only for marketplace-style rows. */
function opensTaskDetailFromUpcomingCard(
  filter: UpcomingBookingFilter,
  status: BookingStatus,
): boolean {
  if (filter === "open_and_waiting" && WAITING_OPEN_DETAIL_STATUSES.includes(status)) return true;
  if (filter === "all" && (status === "OPEN_FOR_APPLICATIONS" || status === "KRAFTER_SELECTED")) {
    return true;
  }
  return false;
}

function opensCompletedTabDetail(status: BookingStatus): boolean {
  return status === "EXPIRED" || status === "CANCELLED" || status === "DISPUTED";
}

function handleCompletedTabCardClick(
  task: Booking,
  router: ReturnType<typeof useRouter>,
  setTaskDetailBooking: (b: Booking) => void,
) {
  if (task.status === "COMPLETED") {
    router.push(`/user/book-service/completed-job?id=${task.id}`);
    return;
  }
  if (opensCompletedTabDetail(task.status)) {
    setTaskDetailBooking(task);
  }
}

const KraftsPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"upcoming" | "completed">("upcoming");
  const [upcomingStatusFilter, setUpcomingStatusFilter] = useState<UpcomingBookingFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showOffers, setShowOffers] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Booking | null>(null);
  const [applicantCounts, setApplicantCounts] = useState<Record<string, number>>({});
  const [paymentModalBooking, setPaymentModalBooking] = useState<Booking | null>(null);
  const [taskDetailBooking, setTaskDetailBooking] = useState<Booking | null>(null);
  const [discardConfirmBooking, setDiscardConfirmBooking] = useState<Booking | null>(null);
  const [discardBusy, setDiscardBusy] = useState(false);

  const {
    fetchMyBookings,
    refreshBookingAfterPayment,
    deleteDraftBooking,
    getUpcomingBookings,
    getCompletedBookings,
    bookings,
    isLoading,
    isSubmitting,
    error,
    clearError,
    lastFetchStatus,
  } = useBookingsStore();

  useEffect(() => {
    void fetchMyBookings();
  }, [fetchMyBookings]);

  const upcomingBookings = getUpcomingBookings();
  const completedBookings = getCompletedBookings();
  const requestedBookings = bookings.filter((b) => b.status === "REQUESTED");

  const upcomingByStatus = upcomingBookings.filter((b) =>
    matchesUpcomingFilter(b.status, upcomingStatusFilter),
  );

  // Filter by search query
  const filterBySearch = (bookings: Booking[]) => {
    if (!searchQuery) return bookings;
    const q = searchQuery.toLowerCase();
    return bookings.filter((b) => {
      const title = (b.jobTitle ?? b.service?.title ?? "").toLowerCase();
      const loc = (b.address ?? b.location ?? "").toLowerCase();
      const artisan = (b.artisan?.fullName ?? b.service?.artisan?.fullName ?? "").toLowerCase();
      return title.includes(q) || loc.includes(q) || artisan.includes(q);
    });
  };

  const showKraftRequests =
    (upcomingStatusFilter === "all" || upcomingStatusFilter === "open_and_waiting") &&
    filterBySearch(requestedBookings).length > 0;

  const upcomingForGroupedList = showKraftRequests
    ? upcomingByStatus.filter((b) => b.status !== "REQUESTED")
    : upcomingByStatus;

  const filteredUpcoming = filterBySearch(upcomingForGroupedList);
  const filteredCompleted = filterBySearch(completedBookings);

  const openListingIdsKey = useMemo(() => {
    const ids = filteredUpcoming
      .filter((b) => b.status === "OPEN_FOR_APPLICATIONS")
      .map((b) => b.id)
      .sort();
    return ids.join(",");
  }, [filteredUpcoming]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!openListingIdsKey) {
        await Promise.resolve();
        if (!cancelled) setApplicantCounts({});
        return;
      }
      const ids = openListingIdsKey.split(",");
      const entries = await Promise.all(
        ids.map(async (id) => {
          try {
            const rows = await getBookingApplicants(id);
            const n = (Array.isArray(rows) ? rows : []).filter(isPendingBookingApplication).length;
            return [id, n] as const;
          } catch {
            return [id, 0] as const;
          }
        }),
      );
      if (!cancelled) setApplicantCounts(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, [openListingIdsKey]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Group bookings by month label (e.g. "January 2025")
  const groupByMonth = (items: Booking[]) => {
    const groups: Record<string, Booking[]> = {};
    for (const item of items) {
      const dateKey = item.preferredDate ?? item.scheduled_date ?? item.created_at;
      const label = dateKey
        ? new Date(dateKey).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
        : "Upcoming";
      if (!groups[label]) groups[label] = [];
      groups[label].push(item);
    }
    return groups;
  };

  const statusBadge = (status: Booking["status"]) => {
    if (status === "COMPLETED")
      return <span className="text-[11px] font-poppins font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">Completed</span>;
    if (status === "EXPIRED")
      return <span className="text-[11px] font-poppins font-semibold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full">Expired</span>;
    if (status === "CANCELLED")
      return <span className="text-[11px] font-poppins font-semibold text-red-500 bg-red-50 px-2.5 py-1 rounded-full">You cancelled this Kraft</span>;
    if (status === "DISPUTED")
      return <span className="text-[11px] font-poppins font-semibold text-brand-orange bg-orange-50 px-2.5 py-1 rounded-full">Disputed</span>;
    if (status === "IN_PROGRESS")
      return <span className="text-[11px] font-poppins font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">In Progress</span>;
    if (status === "CONFIRMED")
      return <span className="text-[11px] font-poppins font-semibold text-brand-blue bg-blue-50 px-2.5 py-1 rounded-full">Confirmed</span>;
    if (status === "DECLINED")
      return <span className="text-[11px] font-poppins font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">Declined</span>;
    if (status === "RECOMMENDATION_PENDING")
      return <span className="text-[11px] font-poppins font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">Draft</span>;
    if (status === "KRAFTER_SELECTED")
      return <span className="text-[11px] font-poppins font-semibold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-full">Krafter selected</span>;
    if (status === "OPEN_FOR_APPLICATIONS")
      return <span className="text-[11px] font-poppins font-semibold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full">Open listing</span>;
    if (status === "REQUESTED")
      return <span className="text-[11px] font-poppins font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">Requested</span>;
    if (status === "ACCEPTED")
      return <span className="text-[11px] font-poppins font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">Accepted</span>;
    if (status === "PAYMENT_PENDING")
      return (
        <span className="text-[11px] font-poppins font-semibold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full">
          Payment needed
        </span>
      );
    if (status === "COUNTERED")
      return <span className="text-[11px] font-poppins font-semibold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-full">Countered</span>;
    return <span className="text-[11px] font-poppins font-semibold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full">{status}</span>;
  };

  const awaitingKrafterBookings = filteredUpcoming.filter((b) =>
    AWAITING_KRAFTER_STATUSES.includes(b.status),
  );
  const communityListingBookings = filteredUpcoming.filter(
    (b) => b.status === "OPEN_FOR_APPLICATIONS",
  );
  const hasOpenAndWaitingSplit =
    upcomingStatusFilter === "open_and_waiting" &&
    (awaitingKrafterBookings.length > 0 || communityListingBookings.length > 0);

  const waitingOpenTab = upcomingStatusFilter === "open_and_waiting";

  const handleConfirmDiscardDraft = async () => {
    if (!discardConfirmBooking) return;
    setDiscardBusy(true);
    try {
      await deleteDraftBooking(discardConfirmBooking.id);
      toast.success("Draft discarded");
      setDiscardConfirmBooking(null);
    } catch (err: unknown) {
      const e = err as { userMessage?: string; response?: { data?: { message?: string } } };
      toast.error(
        e.userMessage ||
          e.response?.data?.message ||
          "Could not discard this draft. Try again or refresh the page.",
      );
    } finally {
      setDiscardBusy(false);
    }
  };

  const renderUpcomingCards = (tasks: Booking[]) =>
    Object.entries(groupByMonth(tasks)).map(([month, monthTasks]) => (
      <div key={month}>
        <h2 className="text-[16px] font-poppins font-bold mb-3 text-black">{month}</h2>
        <div className="space-y-3">
          {monthTasks.map((task: Booking) => {
            if (task.status === "OPEN_FOR_APPLICATIONS") {
              const title = task.jobTitle ?? task.service?.title ?? "Kraft";
              const rate = parseBookingMoney(task.proposedPrice ?? task.listingProposedPrice);
              const priceLabel = rate != null ? `$${rate.toFixed(2)}/hr` : "—";
              const posted = formatPostedDayMonth(task.created_at ?? task.createdAt);
              const offerCount = applicantCounts[task.id];
              const offersLabel =
                offerCount === undefined ? "…" : `${offerCount} Offer${offerCount === 1 ? "" : "s"} Received`;

              const cardOpensDetail = opensTaskDetailFromUpcomingCard(upcomingStatusFilter, task.status);

              return (
                <div
                  key={task.id}
                  role={cardOpensDetail ? "button" : undefined}
                  tabIndex={cardOpensDetail ? 0 : undefined}
                  onClick={() => {
                    if (cardOpensDetail) setTaskDetailBooking(task);
                  }}
                  onKeyDown={(e) => {
                    if (!cardOpensDetail) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setTaskDetailBooking(task);
                    }
                  }}
                  className={`bg-[#FAFAFA] border border-gray-100 rounded-2xl p-4 shadow-sm mb-3 ${
                    cardOpensDetail ? "cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-orange/40" : ""
                  }`}
                >
                  <h3 className="text-[15px] font-poppins font-bold text-black mb-1">{title}</h3>
                  <p className="text-[14px] font-poppins font-bold text-black mb-3">{priceLabel}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 text-[12px] font-poppins">
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Image src="/taskerCal.svg" alt="" width={14} height={14} />
                      <span>Posted {posted}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-brand-orange font-semibold">
                      <Tag size={14} className="shrink-0" aria-hidden />
                      <span>{offersLabel}</span>
                    </div>
                  </div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedJob(task);
                        setShowOffers(true);
                      }}
                      className="flex-1 bg-brand-orange text-white py-3 rounded-xl text-[14px] font-poppins font-semibold hover:bg-orange-600 transition-colors"
                    >
                      View Offers
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/user/book-service/active-job?status=accepted&id=${task.id}`)
                      }
                      className="px-6 bg-[#FFF5F0] border border-gray-100 rounded-xl text-[14px] font-poppins font-bold text-gray-800 hover:bg-orange-50 transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              );
            }

            const title = task.jobTitle ?? task.service?.title ?? "Service";
            const location = task.address ?? task.location ?? "—";
            const dateRaw = task.preferredDate ?? task.scheduled_date ?? task.created_at;
            const time = dateRaw ? formatDate(dateRaw) : "—";
            const image = getKraftListCardImage(task);
            const imageAlt = title;

            const needsPay = task.status === "PAYMENT_PENDING";
            const isDraft = task.status === "RECOMMENDATION_PENDING";

            return (
              <div
                key={task.id}
                className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden hover:border-brand-orange transition-colors"
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (opensTaskDetailFromUpcomingCard(upcomingStatusFilter, task.status)) {
                      setTaskDetailBooking(task);
                      return;
                    }
                    if (bookingNeedsKrafterSelection(task)) {
                      router.push(`/user/book-service/select-artisan?${buildSelectArtisanQuery(task)}`);
                      return;
                    }
                    router.push(`/user/book-service/active-job?status=accepted&id=${task.id}`);
                  }}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter" && e.key !== " ") return;
                    e.preventDefault();
                    if (opensTaskDetailFromUpcomingCard(upcomingStatusFilter, task.status)) {
                      setTaskDetailBooking(task);
                      return;
                    }
                    if (bookingNeedsKrafterSelection(task)) {
                      router.push(`/user/book-service/select-artisan?${buildSelectArtisanQuery(task)}`);
                      return;
                    }
                    router.push(`/user/book-service/active-job?status=accepted&id=${task.id}`);
                  }}
                  className="p-4 flex gap-3 cursor-pointer"
                >
                  <div className="flex-1 space-y-1.5">
                    <h3 className="text-[14px] font-poppins font-bold text-black">{title}</h3>
                    <div className="flex items-center gap-1.5 text-[12px] text-gray-500 font-poppins">
                      <MapPin size={13} className="text-gray-400 shrink-0" />
                      <span>{location}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[12px] text-gray-500 font-poppins">
                      <Image src="/taskerCal.svg" alt="calendar" width={13} height={13} className="shrink-0" />
                      <span>{time}</span>
                    </div>
                    <div className="pt-1">{statusBadge(task.status)}</div>
                  </div>
                  <KraftTaskThumbnail src={image} alt={imageAlt} />
                </div>
                {needsPay && (
                  <div className="px-4 pb-4 pt-0 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setPaymentModalBooking(task)}
                      className="w-full py-3 bg-brand-orange text-white text-[14px] font-poppins font-semibold rounded-xl hover:bg-orange-600 transition-colors"
                    >
                      Confirm payment
                    </button>
                  </div>
                )}
                {isDraft && (
                  <div
                    className="px-4 pb-4 pt-0 border-t border-gray-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/user/book-service/select-artisan?${buildSelectArtisanQuery(task)}`,
                          )
                        }
                        className="flex-1 py-2.5 bg-brand-orange text-white text-[13px] font-poppins font-semibold rounded-xl hover:bg-orange-600 transition-colors"
                      >
                        Continue
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiscardConfirmBooking(task)}
                        disabled={isSubmitting || discardBusy}
                        aria-label="Discard draft"
                        className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={18} aria-hidden />
                      </button>
                    </div>
                  </div>
                )}
                {!canCustomerMessageKrafter(task) ? null : (
                  <div
                    className="px-4 pb-3 pt-0 border-t border-gray-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => router.push(buildCustomerMessageKrafterUrl(task)!)}
                      className="w-full py-2.5 flex items-center justify-center gap-2 rounded-xl border border-brand-orange text-brand-orange text-[13px] font-poppins font-semibold hover:bg-[#FFF5F0] transition-colors"
                    >
                      <MessageCircle size={16} strokeWidth={2} aria-hidden />
                      Message Krafter
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    ));

  return (
    <main className="relative w-full min-h-screen bg-white pb-24">
      <div className="px-4 py-6 max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.push("/")} className="p-1">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-[28px] font-gerat font-bold">Krafts</h1>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-xl mb-5">
          <button
            onClick={() => {
              setActiveTab("upcoming");
              setUpcomingStatusFilter("all");
            }}
            className={`flex-1 py-2.5 text-[14px] font-poppins font-semibold rounded-lg transition-all ${
              activeTab === "upcoming" ? "bg-brand-blue text-white" : "text-gray-500"
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`flex-1 py-2.5 text-[14px] font-poppins font-semibold rounded-lg transition-all ${
              activeTab === "completed" ? "bg-brand-blue text-white" : "text-gray-500"
            }`}
          >
            Completed
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl focus:outline-none text-[14px] font-poppins text-black"
          />
        </div>

        {/* Error Banner */}
        {error && lastFetchStatus === 'error' && (
          <ErrorBanner
            message={error}
            onDismiss={clearError}
            className="mb-4"
          />
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-10">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {!isLoading && activeTab === "upcoming" && (
          <div className="space-y-6">
            <div className="flex flex-nowrap gap-2 overflow-x-auto pb-2 -mx-1 px-1 scroll-smooth [scrollbar-width:thin]">
              {UPCOMING_FILTER_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  title={tab.hint}
                  onClick={() => setUpcomingStatusFilter(tab.id)}
                  className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-[12px] font-poppins font-semibold transition-colors ${
                    upcomingStatusFilter === tab.id
                      ? "bg-brand-blue text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Kraft Requests */}
            {showKraftRequests && (
              <div>
                <h2 className="text-[16px] font-poppins font-bold mb-3 text-black">Kraft Requests</h2>
                {filterBySearch(requestedBookings).map((job) => {
                  const title = `${job.service?.title ?? "Request"} with ${job.service?.artisan?.fullName ?? "Pro"}`;
                  const date = formatDate(job.created_at);

                  return (
                    <div
                      key={job.id}
                      role={waitingOpenTab ? "button" : undefined}
                      tabIndex={waitingOpenTab ? 0 : undefined}
                      onClick={() => {
                        if (waitingOpenTab) setTaskDetailBooking(job);
                      }}
                      onKeyDown={(e) => {
                        if (!waitingOpenTab) return;
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setTaskDetailBooking(job);
                        }
                      }}
                      className={`bg-white border border-gray-100 rounded-2xl p-4 shadow-sm mb-3 ${
                        waitingOpenTab
                          ? "cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
                          : ""
                      }`}
                    >
                      <h3 className="text-[15px] font-poppins font-bold text-black mb-2">{title}</h3>
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-1.5 text-[12px] text-gray-500 font-poppins">
                          <Image src="/taskerCal.svg" alt="calendar" width={14} height={14} />
                          <span>Posted {date}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[12px] text-brand-orange font-poppins font-semibold">
                          <MapPin size={14} />
                          <span>Request Pending</span>
                        </div>
                      </div>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedJob(job);
                            setShowOffers(true);
                          }}
                          className="flex-1 bg-brand-orange text-white py-3 rounded-xl text-[14px] font-poppins font-semibold hover:bg-orange-600 transition-colors"
                        >
                          View Offers
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            router.push(`/user/book-service/active-job?status=accepted&id=${job.id}`)
                          }
                          className="px-6 bg-[#FFF5F0] border border-gray-100 rounded-xl text-[14px] font-poppins font-bold text-gray-800 hover:bg-orange-50 transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Upcoming Bookings grouped by month */}
            {filteredUpcoming.length === 0 && !showKraftRequests ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-[16px] font-poppins font-semibold text-gray-400">
                  {upcomingStatusFilter === "all" ? "No upcoming krafts" : "No krafts in this category"}
                </p>
                <p className="text-[13px] font-poppins text-gray-300 mt-1">
                  {upcomingStatusFilter === "all"
                    ? "Your bookings and requests will appear here"
                    : "Try another filter or choose All"}
                </p>
              </div>
            ) : hasOpenAndWaitingSplit ? (
              <div className="space-y-8">
                {awaitingKrafterBookings.length > 0 && (
                  <section aria-labelledby="krafts-awaiting-heading">
                    <h2
                      id="krafts-awaiting-heading"
                      className="text-[13px] font-poppins font-bold text-gray-500 uppercase tracking-wide mb-3"
                    >
                      Awaiting Krafter
                    </h2>
                    <p className="text-[12px] font-poppins text-gray-400 mb-4">
                      Direct requests and counter-offers
                    </p>
                    {renderUpcomingCards(awaitingKrafterBookings)}
                  </section>
                )}
                {communityListingBookings.length > 0 && (
                  <section aria-labelledby="krafts-community-heading">
                    <h2
                      id="krafts-community-heading"
                      className="text-[13px] font-poppins font-bold text-gray-500 uppercase tracking-wide mb-3 mt-2"
                    >
                      Public listings
                    </h2>
                    <p className="text-[12px] font-poppins text-gray-400 mb-4">
                      Open to applications from Krafters
                    </p>
                    {renderUpcomingCards(communityListingBookings)}
                  </section>
                )}
              </div>
            ) : (
              renderUpcomingCards(filteredUpcoming)
            )}
          </div>
        )}

        {!isLoading && activeTab === "completed" && (
          filteredCompleted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-[16px] font-poppins font-semibold text-gray-400">No completed krafts yet</p>
              <p className="text-[13px] font-poppins text-gray-300 mt-1">Finished bookings will appear here</p>
            </div>
          ) : (
            Object.entries(groupByMonth(filteredCompleted)).map(([month, tasks]) => (
              <div key={month} className="mb-6">
                <h2 className="text-[16px] font-poppins font-bold mb-3 text-black">{month}</h2>
                <div className="space-y-3">
                  {tasks.map((task: Booking) => {
                    const display = deriveActiveJobDisplay(task);
                    const title = display.artisan.name || `${display.service} with ${bookingArtisanName(task)}`;
                    const location = display.jobLocation || "—";
                    const time = [display.date, display.time].filter(Boolean).join(" · ") || "—";
                    const image = getKraftListCardImage(task);
                    const imageAlt = display.artisan.name || title;
                    const taskStatus = task.status;

                    const isCompletedCardClickable =
                      taskStatus === "COMPLETED" || opensCompletedTabDetail(taskStatus);

                    return (
                      <div
                        key={task.id}
                        className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden"
                      >
                        <div
                          role={isCompletedCardClickable ? "button" : undefined}
                          tabIndex={isCompletedCardClickable ? 0 : undefined}
                          onClick={() => handleCompletedTabCardClick(task, router, setTaskDetailBooking)}
                          onKeyDown={(e) => {
                            if (!isCompletedCardClickable) return;
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleCompletedTabCardClick(task, router, setTaskDetailBooking);
                            }
                          }}
                          className={`p-4 flex gap-3 ${
                            isCompletedCardClickable
                              ? "cursor-pointer hover:border-brand-orange transition-colors"
                              : ""
                          }`}
                        >
                          <div className="flex-1 space-y-1.5">
                            <h3 className="text-[14px] font-poppins font-bold text-black">{title}</h3>
                            <div className="flex items-center gap-1.5 text-[12px] text-gray-500 font-poppins">
                              <MapPin size={13} className="text-gray-400 shrink-0" />
                              <span>{location}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[12px] text-gray-500 font-poppins">
                              <Image src="/taskerCal.svg" alt="calendar" width={13} height={13} className="shrink-0" />
                              <span>{time}</span>
                            </div>
                            <div className="pt-1">{statusBadge(taskStatus)}</div>
                          </div>
                          <KraftTaskThumbnail src={image} alt={imageAlt} />
                        </div>
                        {canCustomerMessageKrafter(task) ? (
                          <div className="px-4 pb-3 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => router.push(buildCustomerMessageKrafterUrl(task)!)}
                              className="w-full py-2.5 flex items-center justify-center gap-2 rounded-xl border border-brand-orange text-brand-orange text-[13px] font-poppins font-semibold hover:bg-[#FFF5F0] transition-colors"
                            >
                              <MessageCircle size={16} strokeWidth={2} aria-hidden />
                              Message Krafter
                            </button>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )
        )}
      </div>

      {showOffers && selectedJob && (
        <OffersModal
          booking={selectedJob}
          onClose={() => {
            setShowOffers(false);
            setSelectedJob(null);
          }}
          onMarketplacePaymentReady={(b) => setPaymentModalBooking(b)}
        />
      )}

      {taskDetailBooking && (
        <CustomerKraftTaskDetailModal
          booking={taskDetailBooking}
          open
          onClose={() => setTaskDetailBooking(null)}
          onBookingUpdated={() => void fetchMyBookings()}
        />
      )}

      {paymentModalBooking && (
        <BookingPaymentConfirmModal
          open
          bookingId={paymentModalBooking.id}
          initialClientSecret={bookingPaymentClientSecret(paymentModalBooking)}
          returnUrl={
            typeof window !== "undefined"
              ? `${window.location.origin}/user/krafts`
              : undefined
          }
          onClose={() => setPaymentModalBooking(null)}
          onComplete={() => {
            void (async () => {
              const id = paymentModalBooking?.id;
              setPaymentModalBooking(null);
              if (id) {
                await refreshBookingAfterPayment(id);
              } else {
                await fetchMyBookings();
              }
            })();
          }}
        />
      )}

      {discardConfirmBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-[18px] font-poppins font-bold text-[#1D2939] mb-2">
              Discard this draft?
            </h3>
            <p className="text-[14px] font-poppins text-[#667085] mb-6">
              This cannot be undone. Any photos you added will be removed.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDiscardConfirmBooking(null)}
                disabled={discardBusy}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-[14px] font-poppins font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Keep draft
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDiscardDraft()}
                disabled={discardBusy}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white text-[14px] font-poppins font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                {discardBusy ? "Discarding…" : "Discard"}
              </button>
            </div>
          </div>
        </div>
      )}

      <UserNav />
    </main>
  );
};

export default KraftsPage;
