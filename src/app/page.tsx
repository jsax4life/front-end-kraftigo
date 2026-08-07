"use client";

import Image from "next/image";
import UserNav from "@/components/shared/userNav";
import {
  MapPin,
  Search,
  ChevronRight,
  Home,
  User,
  Plus,
  Clock,
} from "lucide-react";
import Userabt from "@/components/shared/userabt";
import ProCard from "@/components/ui/proCard";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useProfileStore } from "@/store/useProfileStore";
import { useAuthPromptStore } from "@/store/useAuthPromptStore";
import { useHomeStore, normSrc } from "@/store/useHomeStore";
import { useServicesStore } from "@/store/useServicesStore";
import { searchServices } from "@/lib/api/services";
import { useAddressStore } from "@/store/useAddressStore";
import toast from "react-hot-toast";
import KrafterDetailModal, {
  type KrafterDetail,
} from "@/components/shared/KrafterDetailModal";
import {
  buildDirectKrafterBookServiceUrl,
  buildKrafterDetailFromHomeRow,
  resolveHomeKrafterDetail,
} from "@/lib/krafterDetailDisplay";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import HomeKrafterBanner from "@/components/shared/HomeKrafterBanner";
import HomeSummerPromoBanner from "@/components/shared/HomeSummerPromoBanner";
import { buildCategoryBookingUrl } from "@/constants/betaLaunch";
import { formatDistanceDisplay, readDistanceFields } from "@/utils/distance";
import { formatHourlyRate, formatMoney } from "@/utils/currency";
import { DistanceBadge } from "@/components/ui/DistanceBadge";
import type { HomeProOfWeek } from "@/lib/api/auth";

// ─── Static fallbacks ─────────────────────────────────────────────────────────

const STATIC_CATEGORIES = [
  { name: "Gardening", image: "/images/home3.jpg" },
  { name: "Moving", image: "/images/home5.jpg" },
  { name: "Laundry", image: "/images/home6.jpg" },
  { name: "Errands", image: "/images/home2.jpg" },
  { name: "Outside", image: "/images/home1.jpg" },
  { name: "Home repairs", image: "/images/home4.jpg" },
];

const STATIC_PROS = [
  {
    name: "Edith R.",
    rating: 4,
    reviews: 65,
    tasks: 72,
    description:
      "I have six years of experience cleaning houses. My priority is to bring a good service and leav...",
    price: formatHourlyRate(41.29),
    distance: undefined,
    image: "/images/pro.jpg",
    badge: "TOP PRO",
  },
  {
    name: "Sarah M.",
    rating: 5,
    reviews: 89,
    tasks: 120,
    description:
      "Professional cleaner with attention to detail. I ensure every corner is spotless and your home...",
    price: formatHourlyRate(45),
    distance: undefined,
    image: "/images/pro.jpg",
    badge: "TOP PRO",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatScheduledAt = (iso: string) => {
  try {
    const date = new Date(iso);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

type SearchResultRow = Record<string, unknown>;

type HomeKrafterCard = {
  name: string;
  rating: number;
  reviews: number;
  tasks: number;
  description: string;
  price: string;
  distance?: string;
  image: string;
  badge?: string;
};

function formatHomeKrafterDisplayName(displayName: string): string {
  const parts = displayName.trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts[1][0]}.` : parts[0];
}

function mapHomeKrafterToCard(p: HomeProOfWeek): HomeKrafterCard {
  return {
    name: formatHomeKrafterDisplayName(p.displayName),
    rating: Math.round(p.rating),
    reviews: p.reviewCount,
    tasks: p.completedKrafts,
    description: p.description ?? "",
    price: formatHourlyRate(p.hourlyRate),
    distance: formatDistanceDisplay(readDistanceFields(p)) ?? undefined,
    image: normSrc(p.profilePhotoUrl) ?? "/images/pro.jpg",
    badge: p.badges[0] ? p.badges[0].replace(/_/g, " ") : undefined,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

const Page = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { openPrompt } = useAuthPromptStore();
  const { customerProfile, fetchCustomerProfile } = useProfileStore();
  const { currentLatitude, currentLongitude } = useAddressStore();

  const {
    categories: apiCategories,
    prosOfWeek,
    kraftersNearYou,
    upcoming,
    isLoading,
    hasFetched,
    error,
    fetchHomeData,
    recentSearches,
    addRecentSearch,
  } = useHomeStore();
  const { categories: serviceCategories, skillGroups, fetchCategories, fetchSkillGroups } =
    useServicesStore();

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchServiceResults, setSearchServiceResults] = useState<
    SearchResultRow[]
  >([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchRequestError, setSearchRequestError] = useState<string | null>(
    null,
  );
  const [selectedKrafter, setSelectedKrafter] = useState<KrafterDetail | null>(
    null,
  );
  const [isLoadingKrafterProfile, setIsLoadingKrafterProfile] = useState(false);

  // ── Fetch profile (auth only) + home feed (`GET /api/home`) for everyone ───
  useEffect(() => {
    if (isAuthenticated && !customerProfile) {
      void fetchCustomerProfile();
    }
    void fetchHomeData();
  }, [isAuthenticated, customerProfile, fetchCustomerProfile, fetchHomeData]);

  useEffect(() => {
    if (serviceCategories.length === 0) {
      void fetchCategories();
    }
    if (skillGroups.length === 0) {
      void fetchSkillGroups();
    }
  }, [serviceCategories.length, skillGroups.length, fetchCategories, fetchSkillGroups]);

  // ── Derived display values ──────────────────────────────────────────────────
  const displayName = user?.firstName || "User";
  const avatar = customerProfile?.profilePhotoUrl || user?.avatar;

  /** Curated home carousel categories (`GET /api/home`) — browsing only. */
  const displayCategories =
    apiCategories.length > 0
      ? apiCategories.map((c) => ({
          id: c.id,
          name: c.name,
          image: normSrc(c.imageUrl) ?? "/images/home3.jpg",
        }))
      : STATIC_CATEGORIES.map((c) => ({ id: "", ...c }));

  /** Bookable service taxonomy — always from `GET /api/services/categories`. */
  const bookableCategories = useMemo(
    () =>
      serviceCategories
        .filter((c) => c.id?.trim())
        .map((c) => ({ id: c.id, name: c.name })),
    [serviceCategories],
  );

  const openKrafterModal = async (pro: HomeKrafterCard, raw: HomeProOfWeek) => {
    const rawRecord = { ...(raw as unknown as Record<string, unknown>) };
    if (raw.skillTags?.length) {
      rawRecord.skillTags = raw.skillTags;
    }
    if (raw.serviceCategoryOfferings?.length) {
      rawRecord.serviceCategoryOfferings = raw.serviceCategoryOfferings;
    }
    setIsLoadingKrafterProfile(true);
    try {
      setSelectedKrafter(
        await resolveHomeKrafterDetail(pro, rawRecord, skillGroups, {
          serviceCategories: bookableCategories,
          latitude:
            typeof currentLatitude === "number" && Number.isFinite(currentLatitude)
              ? currentLatitude
              : undefined,
          longitude:
            typeof currentLongitude === "number" && Number.isFinite(currentLongitude)
              ? currentLongitude
              : undefined,
        }),
      );
    } catch {
      setSelectedKrafter(
        buildKrafterDetailFromHomeRow(
          pro,
          rawRecord,
          skillGroups,
          bookableCategories,
        ),
      );
    } finally {
      setIsLoadingKrafterProfile(false);
    }
  };

  const displayNearYouKrafters: HomeKrafterCard[] =
    kraftersNearYou.length > 0
      ? kraftersNearYou.map(mapHomeKrafterToCard)
      : isAuthenticated
        ? []
        : STATIC_PROS;

  // Featured pros of the week (separate curated list)
  const displayProsOfWeek: HomeKrafterCard[] =
    prosOfWeek.length > 0 ? prosOfWeek.map(mapHomeKrafterToCard) : [];

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleProtectedAction = (path: string) => {
    if (!isAuthenticated) {
      openPrompt();
    } else {
      router.push(path);
    }
  };

  const handleCustomKraft = () => {
    handleProtectedAction("/user/custom-kraft");
  };

  const searchArtisans = useMemo(() => {
    const byId = new Map<
      string,
      {
        id: string;
        name: string;
        image?: string;
        categoryName?: string;
        rating?: number;
        reviewCount?: number;
        completedJobs?: number;
        isAvailable?: boolean;
        hourlyRate?: number;
        distanceKm?: number;
        distanceLabel?: string | null;
      }
    >();
    for (const svc of searchServiceResults) {
      const artisan = (svc.artisan ?? {}) as Record<string, unknown>;
      const artisanId = typeof artisan.id === "string" ? artisan.id : "";
      if (!artisanId || byId.has(artisanId)) continue;
      byId.set(artisanId, {
        id: artisanId,
        name:
          (typeof artisan.displayName === "string" &&
            artisan.displayName.trim()) ||
          (typeof artisan.fullName === "string" && artisan.fullName.trim()) ||
          "Krafter",
        image:
          (typeof artisan.profilePhotoUrl === "string" &&
            artisan.profilePhotoUrl) ||
          (typeof artisan.avatar === "string" && artisan.avatar) ||
          undefined,
        categoryName:
          typeof (svc.category as Record<string, unknown> | undefined)?.name ===
          "string"
            ? ((svc.category as Record<string, unknown>).name as string)
            : undefined,
        rating:
          typeof artisan.rating === "number" && Number.isFinite(artisan.rating)
            ? artisan.rating
            : undefined,
        reviewCount:
          typeof artisan.reviewCount === "number" &&
          Number.isFinite(artisan.reviewCount)
            ? artisan.reviewCount
            : undefined,
        completedJobs:
          typeof artisan.completedJobs === "number" &&
          Number.isFinite(artisan.completedJobs)
            ? artisan.completedJobs
            : undefined,
        isAvailable:
          typeof artisan.isAvailable === "boolean"
            ? artisan.isAvailable
            : undefined,
        hourlyRate:
          typeof artisan.hourlyRate === "number" &&
          Number.isFinite(artisan.hourlyRate)
            ? artisan.hourlyRate
            : undefined,
        distanceKm:
          typeof svc.distanceKm === "number" && Number.isFinite(svc.distanceKm)
            ? svc.distanceKm
            : undefined,
        distanceLabel:
          typeof svc.distanceLabel === "string" && svc.distanceLabel.trim()
            ? svc.distanceLabel.trim()
            : undefined,
      });
    }
    return Array.from(byId.values());
  }, [searchServiceResults]);

  useEffect(() => {
    if (!showSearchModal) return;
    const q = searchQuery.trim();
    if (q.length < 3) {
      setSearchServiceResults([]);
      setSearchRequestError(null);
      setIsSearchLoading(false);
      return;
    }

    let cancelled = false;
    const t = setTimeout(async () => {
      setIsSearchLoading(true);
      setSearchRequestError(null);
      try {
        const res = await searchServices({
          q,
          ...(Number.isFinite(currentLatitude as number) &&
          Number.isFinite(currentLongitude as number)
            ? { lat: Number(currentLatitude), lng: Number(currentLongitude) }
            : {}),
          limit: 20,
          offset: 0,
        });
        const responsePayload = res as unknown as Record<string, unknown>;
        const rows = Array.isArray(responsePayload.results)
          ? (responsePayload.results as SearchResultRow[])
          : Array.isArray(responsePayload.data)
            ? (responsePayload.data as SearchResultRow[])
            : [];
        if (!cancelled) setSearchServiceResults(rows);
      } catch {
        if (!cancelled) {
          setSearchServiceResults([]);
          setSearchRequestError("Could not search services right now.");
        }
      } finally {
        if (!cancelled) setIsSearchLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [searchQuery, showSearchModal, currentLatitude, currentLongitude]);

  return (
    <main className="relative w-full min-h-screen bg-white pb-24 md:pb-0">
      {/* Page Content */}
      <div className="w-full px-4 sm:px-0  py-6">
        <div className="hidden md:block max-w-4xl mx-auto">
          <Navbar />
        </div>
        <div className="bg-[#FF66001A] h-93.75 md:flex flex-col justify-center hidden">
          <div className=" max-w-4xl mx-auto w-full">
            {/* Avatar & Greeting Section */}

            <div className="flex justify-between">
              <div className="flex items-center gap-5 mb-8">
                {/* Greetings and Title */}
                <div className="flex-1">
                  <h1 className="text-[36px] sm:text-[36px] lg:text-[42px] font-gerat font-[850] leading-10 text-[#1D2939]">
                    What do you need <br className="hidden md:block " />
                    today?
                  </h1>
                </div>
              </div>
              {isAuthenticated && (
                <div
                className="border-2 border-dashed border-brand-orange rounded-full w-20 h-20  flex items-center justify-center cursor-pointer shrink-0"
                onClick={() => handleProtectedAction("/user/profile")}
                 >
                <div className="relative w-17.5 h-17.5 rounded-full overflow-hidden bg-gray-50 flex items-center justify-center shadow-sm">
                  {avatar ? (
                    <Image
                      src={avatar}
                      alt="profile"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <User size={32} className="text-gray-300" />
                  )}
                </div>
              </div>
              )}
            </div>

            {/* Search Bar section */}
            <div className="mb-10">
              <div
                className="relative shadow-2xl rounded-full cursor-pointer"
                onClick={() => setShowSearchModal(true)}
              >
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Find a plumber"
                  className="w-full pl-12 pr-4 py-4 bg-white rounded-full border border-gray-200 focus:outline-none focus:border-brand-cream text-[14px] sm:text-[16px] font-poppins cursor-pointer"
                  readOnly
                />
              </div>
            </div>
            <div className="flex flex-col justify-center items-center w-full gap-2">
              <p className="text-[12px]">Popular Searches</p>
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {displayCategories.slice(0, 4).map((category) => (
                    <button
                      key={category.id || category.name}
                      onClick={() =>
                        router.push(
                          buildCategoryBookingUrl(category.id, category.name),
                        )
                      }
                      className="bg-[#F6F6F6] rounded-md px-1.5 py-0.5 text-[12px] hover:bg-brand-orange hover:text-white transition-colors cursor-pointer"
                    >
                      {category.name.split("/")[0].trim()}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto">
          <div className="md:hidden">
            {/* Header with Logo */}
            <div className="flex justify-center mb-6">
              <Image
                src="/craft.svg"
                alt="kraftigö logo"
                width={173}
                height={58}
                className="w-32 sm:w-40 h-auto object-contain"
              />
            </div>

            {/* Top Bar: Address & Actions */}
            <div className="mb-6">
              <Userabt />
            </div>

            {/* Avatar & Greeting Section */}
            <div className="flex flex-col items-start gap-5 mb-8">
              {/* Avatar with Dashed Border */}
              {isAuthenticated && (
                <div
              className="border-2 border-dashed border-brand-orange rounded-full w-17 h-17  flex items-center justify-center cursor-pointer shrink-0"
              onClick={() => handleProtectedAction("/user/profile")}
              >
                <div className="relative w-[60px] h-[60px]  rounded-full overflow-hidden bg-gray-50 flex items-center justify-center shadow-sm">
                  {avatar ? (
                    <Image
                      src={avatar}
                      alt="profile"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <User size={32} className="text-gray-300" />
                  )}
                </div>
              </div>
              )}

              {/* Greetings and Title */}
              <div className="flex-1">
                {/* <p className="text-[14px] sm:text-[16px] font-poppins text-[#667085] mb-1">
                Hello <span className="text-[#1D2939] font-bold">{displayName}</span> 👋
              </p> */}
                <h1 className="text-[36px] sm:text-[36px] lg:text-[42px] font-gerat font-[850] leading-tight text-[#1D2939]">
                  What do you <br className="sm:hidden" /> need today?
                </h1>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-10">
              <div
                className="relative shadow-2xl rounded-full cursor-pointer"
                onClick={() => setShowSearchModal(true)}
              >
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Find a plumber"
                  className="w-full pl-12 pr-4 py-4 rounded-full border border-gray-200 focus:outline-none focus:border-brand-cream text-[14px] sm:text-[16px] font-poppins cursor-pointer"
                  readOnly
                />
              </div>
            </div>
          </div>
          {isAuthenticated && (
            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 pt-3">
              <div className="flex gap-6 w-max">
                <HomeKrafterBanner />
                <HomeSummerPromoBanner />
              </div>
            </div>
          )}

          {/* Categories */}
          <div className="mb-8 mt-15">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[18px] sm:text-[20px] font-gerat font-bold">
                Categories
              </h2>
              <button
                onClick={() => router.push("/user/categories")}
                className="text-[14px] font-poppins hover:underline flex items-center gap-1"
              >
                <p>See all</p>
                <ChevronRight size={18} />
              </button>
            </div>

            {isLoading && !hasFetched ? (
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="rounded-xl aspect-square mb-2 bg-gray-200" />
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : displayCategories.length > 0 ? (
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                {displayCategories.map((category, index) => {
                  const handleCategoryClick = () => {
                    router.push(buildCategoryBookingUrl(category.id, category.name));
                  };
                  return (
                    <div
                      key={category.id || `cat-${index}`}
                      className="cursor-pointer group"
                      onClick={handleCategoryClick}
                    >
                      <div className="relative rounded-xl overflow-hidden aspect-square mb-2 lg:aspect-auto lg:w-71.25 lg:h-41.25">
                        <Image
                          src={category.image}
                          alt={category.name}
                          fill
                          sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 15vw"
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 rounded-xl" />
                      </div>
                      <p className="text-left text-[12px] sm:text-[14px] font-mabry font-semibold text-gray-800 group-hover:text-brand-orange group-hover:underline group-hover:underline-offset-2 transition-all duration-200">
                        {category.name.split("/")[0].trim()}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          {/* Krafters near you */}
          {(isLoading && !hasFetched) || displayNearYouKrafters.length > 0 ? (
            <div className="mb-8">
              <h2 className="text-[20px] sm:text-[20px] font-poppins font-semibold mb-4">
                Krafter&apos;s near you
              </h2>

              {isLoading && !hasFetched ? (
                <div className="flex gap-4">
                  {[...Array(2)].map((_, i) => (
                    <div
                      key={i}
                      className="animate-pulse bg-gray-100 rounded-xl p-4 w-[85%] sm:w-[70%] lg:w-[48%] shrink-0 h-40"
                    />
                  ))}
                </div>
              ) : displayNearYouKrafters.length > 1 ? (
                <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
                  <div className="flex gap-4">
                    {displayNearYouKrafters.map((pro, index) => {
                      const raw = kraftersNearYou[index];
                      return (
                        <ProCard
                          key={raw?.krafterId ?? index}
                          name={pro.name}
                          rating={pro.rating}
                          reviews={pro.reviews}
                          tasks={pro.tasks}
                          description={pro.description}
                          price={pro.price}
                          distance={pro.distance}
                          image={pro.image}
                          badge={pro.badge}
                          onViewProfile={() => openKrafterModal(pro, raw)}
                        />
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  {displayNearYouKrafters.map((pro, index) => {
                    const raw = kraftersNearYou[index];
                    return (
                      <ProCard
                        key={raw?.krafterId ?? index}
                        name={pro.name}
                        rating={pro.rating}
                        reviews={pro.reviews}
                        tasks={pro.tasks}
                        description={pro.description}
                        price={pro.price}
                        distance={pro.distance}
                        image={pro.image}
                        badge={pro.badge}
                        onViewProfile={() => openKrafterModal(pro, raw)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}

          {/* Pros of the week */}
          {displayProsOfWeek.length > 0 ? (
            <div className="mb-8">
              <h2 className="text-[20px] sm:text-[20px] font-poppins font-semibold mb-4">
                Pros of the week
              </h2>
              <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
                <div className="flex gap-4">
                  {displayProsOfWeek.map((pro, index) => {
                    const raw = prosOfWeek[index];
                    return (
                      <ProCard
                        key={raw?.krafterId ?? index}
                        name={pro.name}
                        rating={pro.rating}
                        reviews={pro.reviews}
                        tasks={pro.tasks}
                        description={pro.description}
                        price={pro.price}
                        distance={pro.distance}
                        image={pro.image}
                        badge={pro.badge}
                        onViewProfile={() => openKrafterModal(pro, raw)}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

          {/* Upcoming Bookings */}
          {isAuthenticated && (
            <div className="mb-6">
              <h2 className="text-[18px] sm:text-[20px] font-gerat font-bold mb-4">
                Upcoming
              </h2>

              {isLoading && !hasFetched ? (
                // Skeleton
                <div className="animate-pulse bg-gray-100 rounded-xl h-28" />
              ) : upcoming.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {[...upcoming]
                    .sort(
                      (a, b) =>
                        new Date(a.scheduledAt || 0).getTime() -
                        new Date(b.scheduledAt || 0).getTime(),
                    )
                    .slice(0, 1)
                    .map((booking) => (
                      <div
                        key={booking.bookingId}
                        className="bg-[#FF66001A] rounded-xl p-2 sm:p-5 border border-[#0000001A]"
                      >
                        <div className="flex gap-4">
                          {/* Booking Details */}
                          <div className="flex-1">
                            <h3 className="text-[16px] sm:text-[14px] font-poppins font-bold mb-2">
                              {booking.jobTitle}
                            </h3>
                            <div className="space-y-1 text-[14px] sm:text-[13px] text-gray-700 font-poppins">
                              <div className="flex items-start gap-2 flex-wrap">
                                <MapPin size={14} className="text-gray-500 shrink-0 mt-0.5" />
                                <span>{booking.addressSummary}</span>
                                {booking.krafter ? (
                                  <DistanceBadge
                                    size="xs"
                                    sources={[booking.krafter]}
                                  />
                                ) : null}
                              </div>
                              <div className="flex items-start gap-2">
                                <Image
                                  src="/taskerCal.svg"
                                  alt="calendar"
                                  width={15}
                                  height={15}
                                />
                                <span>
                                  {formatScheduledAt(booking.scheduledAt)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Krafter Photo (optional until a Krafter is assigned) */}
                          <div className="relative w-[75px] h-[75px] sm:w-[100px] sm:h-[100px] rounded-xl overflow-hidden shrink-0">
                            <Image
                              src={
                                normSrc(booking.krafter?.profilePhotoUrl) ??
                                "/images/pro.jpg"
                              }
                              alt={booking.krafter?.displayName ?? "Krafter"}
                              fill
                              className="object-cover"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                // Empty state — no upcoming bookings
                <div className="bg-[#FF66001A] rounded-xl p-4 sm:p-5 border border-[#0000001A]">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <h3 className="text-[16px] sm:text-[14px] font-poppins font-bold mb-2">
                        No upcoming bookings
                      </h3>
                      <p className="text-[12px] sm:text-[13px] text-gray-600 font-poppins">
                        Book a service to see your upcoming appointments here.
                      </p>
                    </div>
                    <div className="w-[88px] h-[88px] rounded-xl bg-gray-200 shrink-0 flex items-center justify-center">
                      <Plus size={28} className="text-gray-400" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Search Modal */}
      {showSearchModal && (
        <div
          className="fixed inset-0 bg-[#C0C0C0] z-60 flex flex-col overflow-hidden"
          style={{ animation: "searchScrimIn 280ms ease forwards" }}
          onClick={() => setShowSearchModal(false)}
        >
          <div
            className="flex flex-col flex-1 min-h-0 p-4 pt-6 max-w-4xl mx-auto w-full"
            style={{ animation: "searchSheetIn 380ms cubic-bezier(0.32, 0.72, 0, 1) forwards" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative mb-6 shrink-0">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Find a plumber"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-12 py-4 rounded-full border-2 border-brand-orange bg-white focus:outline-none focus:border-brand-orange text-[14px] sm:text-[16px] font-poppins shadow-lg"
              />
              <button
                onClick={() => setShowSearchModal(false)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close search"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M1 1l16 16M17 1L1 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Conditional Content - Show Results or Recents */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
              {searchQuery.trim() ? (
                <div className="bg-white rounded-2xl p-4 shadow-lg border border-[#0000001A]">
                  {/* Services Section */}
                  <div className="mb-6">
                    <h3 className="text-[12px] font-poppins font-semibold mb-3 text-[#00000066]">
                      Services
                    </h3>
                    <div>
                      {isSearchLoading ? (
                        <p className="text-[14px] text-gray-500 font-poppins px-3 pb-3">
                          Searching…
                        </p>
                      ) : null}
                      {!isSearchLoading && searchRequestError ? (
                        <p className="text-[14px] text-red-500 font-poppins px-3 pb-3">
                          {searchRequestError}
                        </p>
                      ) : null}
                      {!isSearchLoading &&
                        !searchRequestError &&
                        searchServiceResults
                          .slice(0, 5)
                          .map((service, index) => {
                            const category = (service.category ?? {}) as Record<
                              string,
                              unknown
                            >;
                            const title =
                              (typeof service.title === "string" &&
                                service.title.trim()) ||
                              "Service";
                            const categoryName =
                              (typeof category.name === "string" &&
                                category.name.trim()) ||
                              title ||
                              "Service";
                            const categoryId =
                              typeof category.id === "string" &&
                              category.id.trim()
                                ? category.id.trim()
                                : undefined;
                            const serviceId =
                              typeof service.id === "string" &&
                              service.id.trim()
                                ? service.id.trim()
                                : undefined;
                            const price =
                              typeof service.price === "number" &&
                              Number.isFinite(service.price)
                                ? service.price
                                : null;
                            const priceType =
                              typeof service.priceType === "string" &&
                              service.priceType.toUpperCase() === "FLAT"
                                ? "FLAT"
                                : "HOURLY";
                            const durationMinutes =
                              typeof service.estimatedDurationMinutes ===
                                "number" &&
                              Number.isFinite(service.estimatedDurationMinutes)
                                ? service.estimatedDurationMinutes
                                : null;
                            const artisan = (service.artisan ?? {}) as Record<
                              string,
                              unknown
                            >;
                            const artisanName =
                              (typeof artisan.displayName === "string" &&
                                artisan.displayName.trim()) ||
                              (typeof artisan.fullName === "string" &&
                                artisan.fullName.trim()) ||
                              "Krafter";
                            const serviceImages = Array.isArray(service.images)
                              ? (service.images as unknown[]).filter(
                                  (img): img is string =>
                                    typeof img === "string" &&
                                    img.trim().length > 0,
                                )
                              : [];
                            const thumb =
                              serviceImages.find((img) => !!normSrc(img)) ||
                              (typeof category.imageUrl === "string"
                                ? normSrc(category.imageUrl)
                                : undefined);
                            return (
                              <button
                                key={index}
                                onClick={() => {
                                  addRecentSearch(categoryName);
                                  const extraParams: Record<string, string> = {};
                                  if (serviceId) extraParams.serviceId = serviceId;
                                  handleProtectedAction(
                                    buildCategoryBookingUrl(
                                      categoryId,
                                      categoryName,
                                      extraParams,
                                    ),
                                  );
                                  setShowSearchModal(false);
                                }}
                                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 relative bg-gray-100 flex items-center justify-center">
                                  {thumb ? (
                                    <Image
                                      src={thumb}
                                      alt={categoryName}
                                      fill
                                      className="object-cover"
                                    />
                                  ) : (
                                    <Home size={20} className="text-gray-400" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1 text-left">
                                  <p className="text-[14px] font-poppins font-semibold text-gray-800 truncate">
                                    {title}
                                  </p>
                                  <p className="text-[12px] font-poppins text-gray-500 truncate">
                                    {categoryName} · {artisanName}
                                  </p>
                                  <p className="text-[12px] font-poppins text-brand-orange mt-0.5">
                                    {price != null
                                      ? `${formatMoney(price)}${
                                          priceType === "HOURLY" ? "/hr" : " flat"
                                        }`
                                      : "—"}
                                    {durationMinutes
                                      ? ` · ~${Math.round(durationMinutes / 60)}h`
                                      : ""}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                      {!isSearchLoading &&
                      !searchRequestError &&
                      searchQuery.trim().length < 3 ? (
                        <p className="text-[14px] text-gray-500 font-poppins px-3 pb-3">
                          Type at least 3 letters to search.
                        </p>
                      ) : null}
                      {!isSearchLoading &&
                      !searchRequestError &&
                      searchQuery.trim().length >= 3 &&
                      searchServiceResults.length === 0 ? (
                        <p className="text-[14px] text-gray-500 font-poppins px-3 pb-3">
                          No services found.
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {/* Artisans Section */}
                  <div>
                    <h3 className="text-[12px] font-poppins font-semibold mb-3 text-[#00000066]">
                      Artisans
                    </h3>
                    <div>
                      {!isSearchLoading &&
                        !searchRequestError &&
                        searchArtisans.slice(0, 5).map((artisan, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              addRecentSearch(artisan.name);
                              // Needs artisan profile route mapping - routing to custom for now as placeholder
                              handleProtectedAction("/user/custom-kraft");
                              setShowSearchModal(false);
                            }}
                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                              <Image
                                src={
                                  normSrc(artisan.image) ?? "/images/pro.jpg"
                                }
                                alt={artisan.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1 text-left">
                              <p className="text-[14px] font-poppins font-semibold text-gray-800 truncate">
                                {artisan.name}
                              </p>
                              <p className="text-[12px] font-poppins text-gray-500 truncate">
                                {artisan.categoryName || "Krafter"}
                              </p>
                              <DistanceBadge
                                size="xs"
                                sources={[artisan]}
                                className="mt-1"
                              />
                              <p className="text-[12px] font-poppins text-gray-600 mt-0.5">
                                {artisan.rating != null
                                  ? `★ ${artisan.rating.toFixed(1)}`
                                  : "★ —"}
                                {artisan.reviewCount != null
                                  ? ` (${artisan.reviewCount})`
                                  : ""}
                                {artisan.completedJobs != null
                                  ? ` · ${artisan.completedJobs} jobs`
                                  : ""}
                                {artisan.hourlyRate != null
                                  ? ` · ${formatHourlyRate(artisan.hourlyRate)}`
                                  : ""}
                                {artisan.isAvailable === true
                                  ? " · Available"
                                  : ""}
                              </p>
                            </div>
                          </button>
                        ))}
                      {!isSearchLoading &&
                      !searchRequestError &&
                      searchQuery.trim().length >= 3 &&
                      searchArtisans.length === 0 ? (
                        <p className="text-[14px] text-gray-500 font-poppins px-3 pb-3">
                          No artisans found.
                        </p>
                      ) : null}
                    </div>
                    <div className="mt-12 text-center">
                      <p className="text-[14px] sm:text-[15px] font-poppins text-gray-600 mb-2">
                        Cant find what you need?
                      </p>
                      <button
                        onClick={handleCustomKraft}
                        className="text-[16px] sm:text-[17px] font-poppins font-bold text-brand-orange hover:underline"
                      >
                        Request A Custom Kraft
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // Recents Section
                <div className="bg-white rounded-2xl p-4 shadow-lg border border-[#0000001A]">
                  <h3 className="text-[12px] font-poppins font-semibold mb-3 text-[#00000066]">
                    {recentSearches.length > 0 ? "Recents" : "Popular Searches"}
                  </h3>
                  <div>
                    {recentSearches.length > 0 ? (
                      recentSearches.map((term, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setSearchQuery(term);
                          }}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="bg-gray-100 text-gray-500 w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                            <Clock size={20} />
                          </div>
                          <span className="text-[14px] font-poppins text-gray-800">
                            {term}
                          </span>
                        </button>
                      ))
                    ) : (
                      <>
                        {["Cleaning", "Home repairs", "Gardening"].map((term, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setSearchQuery(term);
                            }}
                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="bg-gray-100 text-gray-500 w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                              <Search size={20} />
                            </div>
                            <span className="text-[14px] font-poppins text-gray-800">
                              {term}
                            </span>
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                  <div className="mt-12 text-center">
                    <p className="text-[14px] sm:text-[15px] font-poppins text-gray-600 mb-2">
                      Cant find what you need?
                    </p>
                    <button
                      onClick={handleCustomKraft}
                      className="text-[16px] sm:text-[17px] font-poppins font-bold text-brand-orange hover:underline"
                    >
                      Request A Custom Kraft
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="hidden md:block max-w-4xl mx-auto mt-20">
        <Footer />
      </div>

      {/* Bottom Navigation */}
      <UserNav />

      {selectedKrafter && (
        <KrafterDetailModal
          krafter={selectedKrafter}
          onClose={() => setSelectedKrafter(null)}
          requireServiceSelection
          isLoadingProfile={isLoadingKrafterProfile}
          onSelect={(id, offering) => {
            if (!offering) {
              toast.error("Select a service before booking this Krafter.");
              return;
            }
            setSelectedKrafter(null);
            handleProtectedAction(
              buildDirectKrafterBookServiceUrl(id, offering, selectedKrafter ?? undefined),
            );
          }}
        />
      )}
    </main>
  );
};

export default Page;
