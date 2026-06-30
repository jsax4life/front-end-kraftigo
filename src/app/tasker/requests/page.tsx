"use client";

import TaskerNav from "@/components/shared/taskerNav";
import Select from "@/components/ui/select";
import JobCard from "@/components/ui/JobCard";
import RequestCard from "@/components/ui/RequestCard";
import DirectRequestDetailModal from "@/components/shared/DirectRequestDetailModal";
import ActiveJobModal from "@/components/shared/ActiveJobModal";
import TaskDetailModal from "@/components/shared/TaskDetailModal";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { formatDistanceDisplay, readDistanceFields } from "@/utils/distance";
import { DistanceBadge } from "@/components/ui/DistanceBadge";
import MarketplaceKraftDetailModal from "@/components/shared/MarketplaceKraftDetailModal";
import MarketplaceNegotiationModal, {
  type MarketplaceNegotiationFormValues,
} from "@/components/shared/MarketplaceNegotiationModal";
import { useBookingsStore } from "@/store/useBookingsStore";
import { getServiceCategories } from "@/lib/api/services";
import type { ServiceCategory } from "@/types";
import {
  declineArtisanBooking,
  getArtisanBookings,
  type DirectArtisanBookingRequest,
  type GetOpenMarketplaceTasksParams,
  type MarketplaceOpenSort,
} from "@/lib/api/bookings";
import {
  directRequestStatusBadgeLabel,
  isDirectRequestPendingPayment,
} from "@/lib/directRequestStatus";
import {
  filterBookingsByKrafterTab,
  KRAFTER_ASSIGNED_TAB_LABEL,
  KRAFTER_ASSIGNED_TAB_ORDER,
  type KrafterAssignedTabId,
  krafterAssignedTabForStatus,
} from "@/lib/krafterAssignedBookingTabs";
import type { Booking } from "@/types";
import toast from "react-hot-toast";

const MARKETPLACE_PAGE_SIZE = 20;

/** Same rule as Schedule: past jobs (negative diff) also qualify. */
function isWithin24Hours(dateIso: string | null | undefined): boolean {
  if (!dateIso) return false;
  const diff = new Date(dateIso).getTime() - Date.now();
  return diff <= 24 * 60 * 60 * 1000;
}

function shouldOpenActiveJobModal(booking: Booking): boolean {
  const status = String(booking.status ?? "").toUpperCase();
  if (status === "COMPLETED" || status === "EXPIRED" || status === "IN_PROGRESS") {
    return true;
  }
  return isWithin24Hours(booking.scheduled_date);
}

function formatMarketplaceMoney(value: number | string | null | undefined): string | null {
  if (value == null || value === "") return null;
  const n = typeof value === "string" ? parseFloat(value) : Number(value);
  if (!Number.isFinite(n)) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(n);
}

function buildMarketplaceApplicationMetaLine(booking: Booking): string {
  const parts: string[] = [];
  if (booking.marketplaceApplicationStatus?.trim()) {
    parts.push(`Status: ${booking.marketplaceApplicationStatus.trim()}`);
  }
  const listing = formatMarketplaceMoney(booking.listingProposedPrice);
  if (listing) parts.push(`Listing: ${listing}`);
  if (booking.marketplaceApplicationSubmittedAt) {
    const d = new Date(booking.marketplaceApplicationSubmittedAt);
    if (!Number.isNaN(d.getTime())) {
      parts.push(
        `Applied ${d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`,
      );
    }
  }
  return parts.join(" · ");
}

function priceRangeToParams(
  key: string,
): Pick<GetOpenMarketplaceTasksParams, "minPrice" | "maxPrice"> {
  switch (key) {
    case "0-100":
      return { minPrice: 0, maxPrice: 100 };
    case "100-200":
      return { minPrice: 100, maxPrice: 200 };
    case "200+":
      return { minPrice: 200 };
    default:
      return {};
  }
}

function buildMarketplaceFetchParams(
  offset: number,
  opts: {
    debouncedSearch: string;
    serviceCategoryId: string;
    distanceKm: string;
    priceRange: string;
    sort: MarketplaceOpenSort;
    /** Optional override for distance / `distance_asc`; when omitted, backend uses artisan profile lat/lng. */
    origin?: { latitude: number; longitude: number } | null;
    /** `GET .../marketplace/open?excludeAlreadyApplied=true` — hide tasks the Krafter already applied to. */
    excludeAlreadyApplied?: boolean;
  },
): GetOpenMarketplaceTasksParams {
  const params: GetOpenMarketplaceTasksParams = {
    limit: MARKETPLACE_PAGE_SIZE,
    offset,
    sort: opts.sort,
  };
  if (opts.debouncedSearch) params.search = opts.debouncedSearch;
  if (opts.serviceCategoryId !== "all") {
    params.serviceCategoryId = opts.serviceCategoryId;
  }
  if (opts.distanceKm !== "all") {
    const km = parseInt(opts.distanceKm, 10);
    if (Number.isFinite(km)) params.maxDistanceKm = km;
  }
  Object.assign(params, priceRangeToParams(opts.priceRange));
  if (
    opts.origin &&
    Number.isFinite(opts.origin.latitude) &&
    Number.isFinite(opts.origin.longitude)
  ) {
    params.latitude = opts.origin.latitude;
    params.longitude = opts.origin.longitude;
  }
  if (opts.excludeAlreadyApplied === true) {
    params.excludeAlreadyApplied = true;
  }
  return params;
}

const RequestsPage = () => {
  const router = useRouter();
  const {
    bookings,
    marketplaceApplications,
    isLoadingMarketplaceApplications,
    directArtisanRequests,
    isLoading,
    fetchDirectArtisanBookings,
    fetchOpenMarketplaceTasks,
    fetchMarketplaceApplications,
    respondToBooking,
    startBooking,
  } = useBookingsStore();

  const [activeTab, setActiveTab] = useState<"marketplace" | "requests">("marketplace");
  /** Under “Marketplace”: browse open tasks vs applications the Krafter already sent. */
  const [marketplaceSubTab, setMarketplaceSubTab] = useState<"browse" | "my_applications">("browse");
  /** Browse feed: `excludeAlreadyApplied` on `GET .../marketplace/open` (default on = cleaner feed). */
  const [hideAppliedFromBrowse, setHideAppliedFromBrowse] = useState(true);
  /** Under “Requests”: switch between direct-requests list and assigned bookings. */
  const [requestsSubTab, setRequestsSubTab] = useState<"direct" | "myBookings">("direct");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [serviceCategoryId, setServiceCategoryId] = useState("all");
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [distanceKm, setDistanceKm] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [marketplaceSort, setMarketplaceSort] =
    useState<MarketplaceOpenSort>("recent");
  const [marketplaceTotal, setMarketplaceTotal] = useState(0);
  const [loadingMoreMarketplace, setLoadingMoreMarketplace] = useState(false);
  const [marketplaceKraftDetailOpen, setMarketplaceKraftDetailOpen] = useState<{
    bookingId: string;
    readOnlyApplication?: boolean;
    artisanApplicationStatus?: string | null;
  } | null>(null);

  /** Renegotiate counter-offer for a direct request (opened from detail modal). */
  const [openNegotiationModal, setOpenNegotiationModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [detailRequest, setDetailRequest] =
    useState<DirectArtisanBookingRequest | null>(null);
  const [detailSubmitting, setDetailSubmitting] = useState(false);

  /** From `GET /api/artisan/bookings` — assigned jobs (separate from marketplace `bookings` in the store). */
  const [assignedBookings, setAssignedBookings] = useState<Booking[]>([]);
  const [assignedLoading, setAssignedLoading] = useState(false);
  const [assignedError, setAssignedError] = useState<string | null>(null);
  const [assignedTab, setAssignedTab] = useState<KrafterAssignedTabId>("needs_attention");
  const [assignedActionId, setAssignedActionId] = useState<string | null>(null);
  const [selectedAssignedBooking, setSelectedAssignedBooking] = useState<Booking | null>(null);

  const loadAssignedBookings = useCallback(async () => {
    setAssignedLoading(true);
    setAssignedError(null);
    try {
      const rows = await getArtisanBookings();
      setAssignedBookings(Array.isArray(rows) ? rows : []);
    } catch {
      setAssignedBookings([]);
      setAssignedError("Could not load your assigned bookings.");
    } finally {
      setAssignedLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 450);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    getServiceCategories()
      .then((cats) => {
        if (!cancelled) setCategories(cats);
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not load categories.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (activeTab !== "requests") return;
    void fetchDirectArtisanBookings();
    void loadAssignedBookings();
  }, [activeTab, fetchDirectArtisanBookings, loadAssignedBookings]);

  useEffect(() => {
    if (activeTab !== "marketplace" || marketplaceSubTab !== "browse") return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetchOpenMarketplaceTasks(
          buildMarketplaceFetchParams(0, {
            debouncedSearch,
            serviceCategoryId,
            distanceKm,
            priceRange,
            sort: marketplaceSort,
            excludeAlreadyApplied: hideAppliedFromBrowse,
          }),
          { append: false },
        );
        if (!cancelled) setMarketplaceTotal(r.total);
      } catch {
        if (!cancelled) toast.error("Could not load marketplace jobs.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    activeTab,
    marketplaceSubTab,
    hideAppliedFromBrowse,
    debouncedSearch,
    serviceCategoryId,
    distanceKm,
    priceRange,
    marketplaceSort,
    fetchOpenMarketplaceTasks,
  ]);

  useEffect(() => {
    if (activeTab !== "marketplace" || marketplaceSubTab !== "my_applications") return;
    void fetchMarketplaceApplications().catch(() => {
      toast.error("Could not load your marketplace applications.");
    });
  }, [activeTab, marketplaceSubTab, fetchMarketplaceApplications]);

  const refreshMarketplaceList = useCallback(async () => {
    try {
      const r = await fetchOpenMarketplaceTasks(
        buildMarketplaceFetchParams(0, {
          debouncedSearch,
          serviceCategoryId,
          distanceKm,
          priceRange,
          sort: marketplaceSort,
          excludeAlreadyApplied: hideAppliedFromBrowse,
        }),
        { append: false },
      );
      setMarketplaceTotal(r.total);
      await fetchMarketplaceApplications().catch(() => {});
    } catch {
      toast.error("Could not refresh marketplace.");
    }
  }, [
    debouncedSearch,
    serviceCategoryId,
    distanceKm,
    priceRange,
    marketplaceSort,
    hideAppliedFromBrowse,
    fetchOpenMarketplaceTasks,
    fetchMarketplaceApplications,
  ]);

  const handleLoadMoreMarketplace = useCallback(async () => {
    if (activeTab !== "marketplace" || marketplaceSubTab !== "browse" || loadingMoreMarketplace) return;
    const { bookings: current } = useBookingsStore.getState();
    if (current.length >= marketplaceTotal) return;
    setLoadingMoreMarketplace(true);
    try {
      const r = await fetchOpenMarketplaceTasks(
        buildMarketplaceFetchParams(current.length, {
          debouncedSearch,
          serviceCategoryId,
          distanceKm,
          priceRange,
          sort: marketplaceSort,
          excludeAlreadyApplied: hideAppliedFromBrowse,
        }),
        { append: true },
      );
      setMarketplaceTotal(r.total);
    } catch {
      toast.error("Could not load more jobs.");
    } finally {
      setLoadingMoreMarketplace(false);
    }
  }, [
    activeTab,
    marketplaceSubTab,
    hideAppliedFromBrowse,
    debouncedSearch,
    serviceCategoryId,
    distanceKm,
    priceRange,
    marketplaceSort,
    fetchOpenMarketplaceTasks,
    loadingMoreMarketplace,
    marketplaceTotal,
  ]);

  const openCounterNegotiationModal = (requestId: string) => {
    setSelectedRequestId(requestId);
    setOpenNegotiationModal(true);
  };

  const handleBookmark = (jobId: string) => {
    console.log("Bookmark job:", jobId);
  };

  const formatDirectRequestPrice = (value: string | null) => {
    if (value == null || value === "") return "—";
    const n = parseFloat(String(value));
    if (!Number.isFinite(n)) return value;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 2,
    }).format(n);
  };

  const formatAssignedBookingPrice = (booking: Booking) => {
    const n = booking.price ?? booking.counterPrice;
    if (n == null || !Number.isFinite(Number(n))) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 2,
    }).format(Number(n));
  };

  const assignedTabCounts = useMemo(() => {
    const base: Record<KrafterAssignedTabId, number> = {
      needs_attention: 0,
      confirmed: 0,
      in_progress: 0,
      completed: 0,
    };
    for (const b of assignedBookings) {
      base[krafterAssignedTabForStatus(String(b.status))] += 1;
    }
    return base;
  }, [assignedBookings]);

  const filteredAssigned = useMemo(
    () => filterBookingsByKrafterTab(assignedBookings, assignedTab),
    [assignedBookings, assignedTab],
  );

  const handleStartAssignedBooking = async (bookingId: string) => {
    setAssignedActionId(bookingId);
    try {
      await startBooking(bookingId);
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(`kraftigo:jobWorkStart:${bookingId}`, String(Date.now()));
      }
      toast.success("Job started.");
      await loadAssignedBookings();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast.error(
        ax.response?.data?.message ??
          "Could not start the job. It is only allowed when the booking is confirmed and payment is authorized.",
      );
    } finally {
      setAssignedActionId(null);
    }
  };

  const handleCompleteAssignedBooking = (bookingId: string) => {
    router.push(`/tasker/schedule?openJob=${encodeURIComponent(bookingId)}`);
    toast(
      "Finish on Schedule: add 1–3 completion photos, optional notes, then tap Complete job.",
      { duration: 5000 },
    );
  };

  const handleAcceptRequest = async (requestId: string) => {
    const row =
      directArtisanRequests.find((r) => r.id === requestId) ?? detailRequest;
    if (row && isDirectRequestPendingPayment(row.status)) {
      toast.error("This request is already waiting for the customer to pay.");
      return;
    }
    setDetailSubmitting(true);
    try {
      await respondToBooking(requestId, { action: "ACCEPT" });
      toast.success("Booking accepted!");
      setDetailRequest(null);
      await fetchDirectArtisanBookings();
      await loadAssignedBookings();
    } catch {
      toast.error("Could not accept booking. Try again.");
    } finally {
      setDetailSubmitting(false);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    setDetailSubmitting(true);
    try {
      await declineArtisanBooking(requestId);
      toast.success("Booking declined.");
      setDetailRequest(null);
      await fetchDirectArtisanBookings();
      await loadAssignedBookings();
    } catch {
      toast.error("Could not decline booking. Try again.");
    } finally {
      setDetailSubmitting(false);
    }
  };

  const handleRenegotiate = (requestId: string) => {
    setDetailRequest(null);
    openCounterNegotiationModal(requestId);
  };

  const handleCounterNegotiationSubmit = async (
    values: MarketplaceNegotiationFormValues,
  ) => {
    const price = parseFloat(values.amount);
    if (!price || price <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    if (!selectedRequestId) {
      toast.error("Missing request.");
      return;
    }
    setIsSubmitting(true);
    try {
      await respondToBooking(selectedRequestId, {
        action: "COUNTER",
        counterPrice: price,
        message: values.message.trim() || undefined,
      });
      toast.success("Counter offer sent!");
      setOpenNegotiationModal(false);
      setSelectedRequestId(null);
      await fetchDirectArtisanBookings();
      await loadAssignedBookings();
    } catch {
      toast.error("Failed to send counter offer. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCounterRequest =
    (selectedRequestId
      ? directArtisanRequests.find((r) => r.id === selectedRequestId) ?? null
      : null) ?? detailRequest;
  const selectedCounterMinAmount = (() => {
    const raw = selectedCounterRequest?.proposedPrice;
    const n = typeof raw === "number" ? raw : parseFloat(String(raw ?? ""));
    return Number.isFinite(n) && n > 0 ? n : undefined;
  })();
  const selectedCounterPricingType = (() => {
    const raw = (
      selectedCounterRequest as unknown as
        | { proposedPricingType?: string; proposed_pricing_type?: string; offerPricingType?: string }
        | null
    );
    const t = String(
      raw?.proposedPricingType ?? raw?.proposed_pricing_type ?? raw?.offerPricingType ?? "FLAT",
    ).toUpperCase();
    return t === "HOURLY" ? "HOURLY" : "FLAT";
  })();

  return (
    <main className="relative w-full min-h-screen bg-white pb-24">
      <div className="max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <button className="mb-4" onClick={() => router.back()}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold mb-4">Job Requests</h1>

        {/* Tab Toggle */}
        <div className="flex gap-2 mb-4 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("marketplace")}
            className={`flex-1 py-1 text-sm px-6 rounded-lg font-medium transition-colors ${
              activeTab === "marketplace"
                ? "bg-brand-blue text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            Marketplace
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`flex-1 py-1 text-sm px-6 rounded-lg font-medium transition-colors ${
              activeTab === "requests"
                ? "bg-brand-orange text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            Requests
          </button>
        </div>

        {activeTab === "marketplace" && (
          <div className="mb-3 flex justify-center sm:justify-start">
            <div
              className="flex w-full max-w-md gap-0.5 rounded-md bg-gray-100/90 p-[3px] border border-gray-200/70 shadow-inner"
              role="tablist"
              aria-label="Marketplace list type"
            >
              <button
                type="button"
                role="tab"
                aria-selected={marketplaceSubTab === "browse"}
                onClick={() => setMarketplaceSubTab("browse")}
                className={`min-w-0 flex-1 py-1 px-1.5 text-[11px] leading-tight sm:text-xs rounded-[5px] font-poppins font-medium transition-colors ${
                  marketplaceSubTab === "browse"
                    ? "bg-white text-brand-orange shadow-sm ring-1 ring-black/6"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Browse
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={marketplaceSubTab === "my_applications"}
                onClick={() => setMarketplaceSubTab("my_applications")}
                className={`min-w-0 flex-1 py-1 px-1.5 text-[11px] leading-tight sm:text-xs rounded-[5px] font-poppins font-medium transition-colors ${
                  marketplaceSubTab === "my_applications"
                    ? "bg-white text-brand-orange shadow-sm ring-1 ring-black/6"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                My applications
              </button>
            </div>
          </div>
        )}

        {activeTab === "requests" && (
          <div className="mb-3 flex justify-center sm:justify-start">
            <div
              className="flex w-full max-w-62 gap-0.5 rounded-md bg-gray-100/90 p-[3px] border border-gray-200/70 shadow-inner"
              role="tablist"
              aria-label="Request list type"
            >
              <button
                type="button"
                role="tab"
                aria-selected={requestsSubTab === "direct"}
                onClick={() => setRequestsSubTab("direct")}
                className={`min-w-0 flex-1 py-1 px-1.5 text-[11px] leading-tight sm:text-xs rounded-[5px] font-poppins font-medium transition-colors ${
                  requestsSubTab === "direct"
                    ? "bg-white text-brand-orange shadow-sm ring-1 ring-black/6"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Direct requests
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={requestsSubTab === "myBookings"}
                onClick={() => setRequestsSubTab("myBookings")}
                className={`min-w-0 flex-1 py-1 px-1.5 text-[11px] leading-tight sm:text-xs rounded-[5px] font-poppins font-medium transition-colors ${
                  requestsSubTab === "myBookings"
                    ? "bg-white text-brand-orange shadow-sm ring-1 ring-black/6"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                My bookings
              </button>
            </div>
          </div>
        )}

        {/* Marketplace filters — match GET /api/artisan/bookings/marketplace/open query params */}
        {activeTab === "marketplace" && marketplaceSubTab === "browse" && (
          <div className="space-y-3 pb-2">
            <Input
              label="Search"
              type="text"
              placeholder="Title, description, or address"
              value={searchInput}
              onChange={(value) => setSearchInput(value)}
            />
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-800 font-poppins">
              <input
                id="hide-applied-marketplace"
                type="checkbox"
                checked={hideAppliedFromBrowse}
                onChange={(e) => setHideAppliedFromBrowse(e.target.checked)}
                className="h-4 w-4 shrink-0 rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
              />
              <span>Hide jobs I&apos;ve already applied to</span>
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              <div className="min-w-[140px] shrink-0">
                <Select
                  value={serviceCategoryId}
                  onChange={setServiceCategoryId}
                  options={[
                    { value: "all", label: "All categories" },
                    ...categories.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                  placeholder="Category"
                  disabled={categories.length === 0}
                />
              </div>
              <div className="min-w-[120px] shrink-0">
                <Select
                  value={distanceKm}
                  onChange={setDistanceKm}
                  options={[
                    { value: "all", label: "Any distance" },
                    { value: "5", label: "Within 5 km" },
                    { value: "10", label: "Within 10 km" },
                    { value: "20", label: "Within 20 km" },
                  ]}
                  placeholder="Distance"
                  className="bg-brand-orange text-white"
                />
              </div>
              <div className="min-w-[130px] shrink-0">
                <Select
                  value={priceRange}
                  onChange={setPriceRange}
                  options={[
                    { value: "all", label: "Any price" },
                    { value: "0-100", label: "€0 – €100" },
                    { value: "100-200", label: "€100 – €200" },
                    { value: "200+", label: "€200+" },
                  ]}
                  placeholder="Price"
                />
              </div>
              <div className="min-w-[150px] shrink-0">
                <Select
                  value={marketplaceSort}
                  onChange={(v) => setMarketplaceSort(v as MarketplaceOpenSort)}
                  options={[
                    { value: "recent", label: "Most recent" },
                    { value: "distance_asc", label: "Nearest first" },
                  ]}
                  placeholder="Sort"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content - Marketplace browse */}
      {activeTab === "marketplace" && marketplaceSubTab === "browse" && (
        <div className="px-4 space-y-4 mt-4">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange"></div>
            </div>
          ) : bookings.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              {hideAppliedFromBrowse
                ? "No open tasks match your filters (applied listings are hidden)."
                : "No open marketplace tasks found."}
            </p>
          ) : (
            bookings.map((booking) => {
              const price = booking.price ?? 0;
              const distanceLabel = formatDistanceDisplay(readDistanceFields(booking));
              return (
              <JobCard
                key={booking.id}
                id={booking.id}
                title={
                  booking.jobTitle ||
                  booking.title ||
                  booking.service?.title ||
                  "Marketplace Task"
                }
                location={booking.location || booking.address || "Location not specified"}
                distanceLabel={distanceLabel}
                bidsCount={0}
                description={
                  booking.jobDescription ||
                  booking.notes ||
                  booking.service?.description ||
                  "No description provided."
                }
                category={booking.service?.category?.name || booking.serviceCategory?.name || "General"}
                priceRange={{
                  min: price > 0 ? price : 0,
                  max: price > 0 ? price : 0,
                }}
                image={booking.image || "/images/home1.jpg"}
                hasApplied={booking.hasApplied}
                onViewKraft={(id) => setMarketplaceKraftDetailOpen({ bookingId: id })}
                onBookmark={handleBookmark}
              />
            )})
          )}
          {!isLoading &&
            marketplaceSubTab === "browse" &&
            bookings.length > 0 &&
            bookings.length < marketplaceTotal && (
              <div className="pt-2 space-y-2">
                <p className="text-center text-xs text-gray-500">
                  Showing {bookings.length} of {marketplaceTotal}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  onClick={handleLoadMoreMarketplace}
                  disabled={loadingMoreMarketplace}
                >
                  {loadingMoreMarketplace ? "Loading…" : "Load more"}
                </Button>
              </div>
            )}
        </div>
      )}

      {/* Content - Marketplace applications */}
      {activeTab === "marketplace" && marketplaceSubTab === "my_applications" && (
        <div className="px-4 space-y-4 mt-4 pb-4">
          {isLoadingMarketplaceApplications ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange" />
            </div>
          ) : marketplaceApplications.length === 0 ? (
            <p className="text-center text-gray-500 py-8 text-sm font-poppins">
              You haven&apos;t applied to any marketplace listings yet.
            </p>
          ) : (
            marketplaceApplications.map((booking) => {
              const price = Number(booking.price ?? 0);
              const offerLabel = formatMarketplaceMoney(booking.price);
              const metaLine = buildMarketplaceApplicationMetaLine(booking);
              const distanceLabel = formatDistanceDisplay(readDistanceFields(booking));
              return (
                <JobCard
                  key={booking.marketplaceApplicationId ?? booking.id}
                  id={booking.id}
                  title={
                    booking.jobTitle ||
                    booking.title ||
                    booking.service?.title ||
                    "Marketplace application"
                  }
                  location={booking.location || booking.address || "Location not specified"}
                  distanceLabel={distanceLabel}
                  bidsCount={0}
                  description={
                    booking.jobDescription ||
                    booking.notes ||
                    booking.service?.description ||
                    "No description provided."
                  }
                  category={booking.service?.category?.name || booking.serviceCategory?.name || "General"}
                  priceRange={{
                    min: price > 0 ? price : 0,
                    max: price > 0 ? price : 0,
                  }}
                  priceBadgeLabel={offerLabel ? `Your offer: ${offerLabel}` : undefined}
                  metaLine={metaLine || undefined}
                  noteLine={booking.marketplaceApplicationMessage?.trim() || undefined}
                  image={booking.image || "/images/home1.jpg"}
                  hasApplied
                  forceViewKraft
                  onViewKraft={() =>
                    setMarketplaceKraftDetailOpen({
                      bookingId: booking.id,
                      readOnlyApplication: true,
                      artisanApplicationStatus: booking.marketplaceApplicationStatus ?? null,
                    })
                  }
                  onBookmark={handleBookmark}
                />
              );
            })
          )}
        </div>
      )}

      {/* Content - Requests: sub-tab Direct vs My bookings */}
      {activeTab === "requests" && requestsSubTab === "direct" && (
        <div className="px-4 mt-4 pb-4">
          <section aria-label="Direct requests">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange" />
              </div>
            ) : directArtisanRequests.length === 0 ? (
              <p className="text-center text-gray-500 py-6 text-sm font-poppins">
                No direct requests right now.
              </p>
            ) : (
              <div className="space-y-4">
                {directArtisanRequests.map((request) => (
                  <RequestCard
                    key={request.id}
                    jobTitle={request.jobTitle}
                    description={request.jobDescription}
                    proposedPriceLabel={formatDirectRequestPrice(request.proposedPrice)}
                    statusBadge={directRequestStatusBadgeLabel(request.status)}
                    distanceLabel={formatDistanceDisplay(readDistanceFields(request))}
                    onViewRequest={() => setDetailRequest(request)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === "requests" && requestsSubTab === "myBookings" && (
        <div className="px-4 mt-4 pb-4">
          <section aria-label="My bookings">
            <p className="text-[12px] font-poppins text-gray-500 mb-3">
              Jobs assigned to you. Filter by status — same list as your schedule.
            </p>

            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 mb-4 no-scrollbar">
              {KRAFTER_ASSIGNED_TAB_ORDER.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setAssignedTab(tab)}
                  className={`shrink-0 rounded-full px-3.5 py-2 text-[12px] font-poppins font-semibold whitespace-nowrap transition-colors ${
                    assignedTab === tab
                      ? "bg-brand-orange text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {KRAFTER_ASSIGNED_TAB_LABEL[tab]}
                  <span className="opacity-80 ml-1">({assignedTabCounts[tab]})</span>
                </button>
              ))}
            </div>

            {assignedError && (
              <p className="text-sm text-red-600 font-poppins mb-2">{assignedError}</p>
            )}

            {assignedLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue" />
              </div>
            ) : filteredAssigned.length === 0 ? (
              <p className="text-center text-gray-500 py-6 text-sm font-poppins">
                No bookings in &ldquo;{KRAFTER_ASSIGNED_TAB_LABEL[assignedTab]}&rdquo;.
              </p>
            ) : (
              <ul className="space-y-3 list-none p-0 m-0">
                {filteredAssigned.map((booking) => (
                  <li
                    key={booking.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedAssignedBooking(booking)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedAssignedBooking(booking);
                      }
                    }}
                    className="bg-white p-4 rounded-xl border border-[#0000001A] shadow-sm hover:border-brand-orange/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-poppins font-bold text-[15px] text-gray-900 line-clamp-2">
                        {booking.title || booking.service?.title || "Booking"}
                      </h3>
                      <span className="shrink-0 text-[10px] font-poppins font-semibold uppercase tracking-wide text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">
                        {String(booking.status).replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-poppins mb-1">
                      {booking.scheduled_date}
                      {booking.scheduled_time ? ` · ${booking.scheduled_time}` : ""}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <p className="text-sm text-gray-600 font-poppins line-clamp-2 flex-1 min-w-0">
                        {booking.location || "—"}
                      </p>
                      <DistanceBadge size="xs" sources={[booking]} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 justify-between">
                      <span className="text-brand-orange font-bold text-base font-poppins">
                        {formatAssignedBookingPrice(booking)}
                      </span>
                      <div className="flex flex-wrap gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                        {booking.status === "CONFIRMED" && (
                          <Button
                            type="button"
                            variant="primary"
                            fullWidth={false}
                            className="!h-auto !min-h-0 !py-2 !px-3 !text-[13px] sm:!min-w-0"
                            disabled={assignedActionId === booking.id}
                            onClick={() => void handleStartAssignedBooking(booking.id)}
                          >
                            {assignedActionId === booking.id ? "Starting…" : "Start job"}
                          </Button>
                        )}
                        {booking.status === "IN_PROGRESS" && (
                          <Button
                            type="button"
                            variant="primary"
                            fullWidth={false}
                            className="!h-auto !min-h-0 !py-2 !px-3 !text-[13px] sm:!min-w-0"
                            onClick={() => handleCompleteAssignedBooking(booking.id)}
                          >
                            Complete job
                          </Button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            router.push(`/tasker/schedule?openJob=${encodeURIComponent(booking.id)}`)
                          }
                          className="text-[12px] font-poppins font-semibold text-brand-blue py-2 px-2 hover:underline"
                        >
                          Schedule
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
      </div>

      <MarketplaceKraftDetailModal
        open={marketplaceKraftDetailOpen != null}
        bookingId={marketplaceKraftDetailOpen?.bookingId ?? null}
        readOnlyApplication={marketplaceKraftDetailOpen?.readOnlyApplication === true}
        artisanApplicationStatus={marketplaceKraftDetailOpen?.artisanApplicationStatus ?? null}
        onClose={() => setMarketplaceKraftDetailOpen(null)}
        onApplied={() => void refreshMarketplaceList()}
      />

      <DirectRequestDetailModal
        request={detailRequest}
        open={detailRequest != null}
        onClose={() => setDetailRequest(null)}
        onAccept={handleAcceptRequest}
        onDecline={handleDeclineRequest}
        onRenegotiate={handleRenegotiate}
        isSubmitting={detailSubmitting}
      />

      <MarketplaceNegotiationModal
        open={openNegotiationModal}
        mode="counter"
        onClose={() => {
          setOpenNegotiationModal(false);
          setSelectedRequestId(null);
        }}
        onSubmit={handleCounterNegotiationSubmit}
        isSubmitting={isSubmitting}
        minAmount={selectedCounterMinAmount}
        pricingType={selectedCounterPricingType}
      />

      {selectedAssignedBooking &&
        (shouldOpenActiveJobModal(selectedAssignedBooking) ? (
          <ActiveJobModal
            booking={selectedAssignedBooking}
            onClose={() => setSelectedAssignedBooking(null)}
            onBookingUpdated={(b) => {
              setSelectedAssignedBooking(b);
              void loadAssignedBookings();
            }}
          />
        ) : (
          <TaskDetailModal
            booking={selectedAssignedBooking}
            onClose={() => setSelectedAssignedBooking(null)}
            onBookingUpdated={(b) => {
              setSelectedAssignedBooking(b);
              void loadAssignedBookings();
            }}
          />
        ))}

      {/* Bottom Navigation */}
      <TaskerNav />
    </main>
  );
};

export default RequestsPage;
