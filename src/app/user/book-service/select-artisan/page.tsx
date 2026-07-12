"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Check, ChevronDown, ChevronUp, ArrowLeftRight, Star } from "lucide-react";
import PriceFilterDropdown from "@/components/shared/PriceFilterDropdown";
import RatingFilterDropdown from "@/components/shared/RatingFilterDropdown";
import AvailabilityFilterDropdown from "@/components/shared/AvailabilityFilterDropdown";
import AllFiltersModal from "@/components/shared/AllFiltersModal";
import Button from "@/components/ui/button";
import ArtisanCard from "@/components/shared/ArtisanCard";
import KrafterDetailModal, {
  type KrafterDetail,
} from "@/components/shared/KrafterDetailModal";
import ArtisanGridCard from "@/components/shared/ArtisanGridCard";
import CompareSheet from "@/components/shared/CompareModal";
import { Application } from "@/types";
import { useBookingsStore } from "@/store/useBookingsStore";
import { useAddressStore } from "@/store/useAddressStore";
import { formatLocalDateYmd, parseLocalDateYmd } from "@/utils/date";
import { readDistanceFields } from "@/utils/distance";
import { resolveTaskCoordinates } from "@/lib/taskLocation";
import { readFlexibleScheduleFromUrlParams } from "@/lib/flexibleSchedule";

interface Artisan {
  id: string;
  name: string;
  profileImage: string;
  badge?: string | null;
  rating: number;
  reviewCount: number;
  taskCount: number;
  location: string;
  description: string;
  distance?: number | null;
  distanceLabel?: string | null;
  pricePerHour: number;
  isNewTasker?: boolean;
  isAvailable?: boolean;
  // Extra fields from recommendation API
  bio?: string;
  uniqueSellingPoint?: string;
  occupationDescription?: string;
  languagesSpoken?: string[];
  skillTags?: string[];
  portfolioImages?: string[];
  responseRate?: number | null;
  averageResponseHours?: number | null;
  yearsWithUs?: number;
}

function mapRecommendationToArtisan(rawItem: any, index: number): Artisan {
  // BE: compare/recommend cards are flat — distance + krafter fields at top level.
  const nested = rawItem?.artisan ?? rawItem?.data ?? null;
  const item = nested ?? rawItem;
  const distance = readDistanceFields(rawItem);
  const id = String(
    rawItem?.krafterId ??
      item?.krafterId ??
      item?.id ??
      item?.artisanId ??
      item?.artisan_id ??
      index + 1,
  );
  return {
    id,
    name:
      rawItem?.displayName ??
      item?.displayName ??
      item?.fullName ??
      item?.name ??
      item?.artisanName ??
      "Krafter",
    profileImage:
      item?.profilePhotoUrl ??
      item?.avatar ??
      item?.profileImage ??
      "/images/pro.jpg",
    badge: (() => {
      const raw = item?.badges?.[0] ?? item?.badge ?? null;
      if (!raw) return null;
      const upper = String(raw).toUpperCase().replace(/_/g, " ");
      return upper;
    })(),
    rating:
      Number(rawItem?.rating ?? item?.rating ?? item?.reviewsRating ?? 0) || 0,
    reviewCount:
      Number(
        rawItem?.reviewCount ??
          item?.reviewCount ??
          item?.reviewsCount ??
          item?.reviews_count ??
          0,
      ) || 0,
    taskCount:
      Number(
        rawItem?.completedKrafts ??
          item?.completedKrafts ??
          item?.completedJobs ??
          item?.taskCount ??
          item?.tasks_count ??
          0,
      ) || 0,
    location:
      item?.address ?? item?.location ?? item?.city ?? item?.baseCity ?? "",
    description: item?.description ?? item?.bio ?? item?.proposal_message ?? "",
    distance: distance.distanceKm,
    distanceLabel: distance.distanceLabel,
    pricePerHour:
      Number(
        rawItem?.hourlyRate ??
          item?.hourlyRate ??
          item?.pricePerHour ??
          item?.price_per_hour ??
          item?.proposedPrice ??
          0,
      ) || 0,
    isNewTasker: item?.isNewTasker ?? item?.is_new ?? false,
    isAvailable: item?.isAvailable ?? false,
    // Extra fields for detail modal
    bio: item?.bio ?? item?.description ?? "",
    uniqueSellingPoint: item?.uniqueSellingPoint ?? null,
    occupationDescription: item?.occupationDescription ?? null,
    languagesSpoken: Array.isArray(item?.languagesSpoken)
      ? item.languagesSpoken
      : [],
    skillTags: Array.isArray(item?.skillTags) ? item.skillTags : [],
    portfolioImages: Array.isArray(item?.portfolioImages)
      ? item.portfolioImages.filter(Boolean)
      : [],
    responseRate: item?.responseRate ?? null,
    averageResponseHours: item?.averageResponseHours ?? null,
    yearsWithUs: Number(item?.yearsWithUs ?? 0),
  };
}

const SelectArtisanPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("categoryId") || "";
  const categoryName = searchParams.get("category") || "Service";
  const address =
    searchParams.get("address") || "Hauptstraße 123 - 10115, Berlin";
  const dateParam = searchParams.get("date") || new Date().toISOString();
  const timeParam = searchParams.get("time") || "08:00";
  const taskDetails = searchParams.get("taskDetails") || "";
  const latitudeFromUrl = searchParams.get("latitude") ?? "";
  const longitudeFromUrl = searchParams.get("longitude") ?? "";
  const preselectedArtisanId = searchParams.get("artisanId") || "";

  const { getRecommendations, isLoading } = useBookingsStore();
  const { currentLatitude, currentLongitude } = useAddressStore();

  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [artisansFromApi, setArtisansFromApi] = useState(false);
  const [fetchDone, setFetchDone] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [showCompare, setShowCompare] = useState(false);
  const [selectedKrafter, setSelectedKrafter] = useState<KrafterDetail | null>(
    null,
  );
  const [coordsError, setCoordsError] = useState<string | null>(null);
  const [priceFilterActive, setPriceFilterActive] = useState(false);
  const [ratingFilterActive, setRatingFilterActive] = useState(false);
  const [todayFilterActive, setTodayFilterActive] = useState(false);
  const [showAllFiltersModal, setShowAllFiltersModal] = useState(false);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null);

  const taskCoords = resolveTaskCoordinates({
    urlLat: latitudeFromUrl,
    urlLng: longitudeFromUrl,
    storeLat: currentLatitude,
    storeLng: currentLongitude,
  });

  const canCompare = artisans.length > 1;

  useEffect(() => {
    if (!canCompare || viewMode !== "grid") {
      setShowCompare(false);
    }
  }, [canCompare, viewMode]);

  // Fetch recommendations from API
  useEffect(() => {
    if (!categoryId || !taskDetails.trim()) {
      setFetchDone(true);
      return;
    }

    if (!taskCoords) {
      setCoordsError(
        "We need your job location coordinates to show Krafter distance. Go back and pick your address from the suggestions list.",
      );
      setArtisans([]);
      setArtisansFromApi(false);
      setFetchDone(true);
      return;
    }

    setCoordsError(null);
    const preferredDate = (() => {
      const fromYmd = parseLocalDateYmd(dateParam);
      if (fromYmd) return formatLocalDateYmd(fromYmd);
      if (dateParam.includes("T")) {
        const parsed = new Date(dateParam);
        if (!Number.isNaN(parsed.getTime())) return formatLocalDateYmd(parsed);
      }
      return dateParam.slice(0, 10);
    })();

    getRecommendations({
      serviceCategoryId: categoryId,
      jobTitle: categoryName,
      jobDescription: taskDetails,
      latitude: taskCoords.latitude,
      longitude: taskCoords.longitude,
      preferredDate,
      preferredTime: timeParam,
      ...readFlexibleScheduleFromUrlParams(searchParams),
      limit: 16,
    })
      .then((list) => {
        if (Array.isArray(list) && list.length > 0) {
          setArtisans(
            list.map((item, i) => mapRecommendationToArtisan(item, i)),
          );
          setArtisansFromApi(true);
        } else {
          setArtisans([]);
          setArtisansFromApi(false);
        }
      })
      .catch(() => {
        setArtisans([]);
        setArtisansFromApi(false);
      })
      .finally(() => setFetchDone(true));
  }, [
    categoryId,
    categoryName,
    taskDetails,
    dateParam,
    timeParam,
    taskCoords?.latitude,
    taskCoords?.longitude,
    getRecommendations,
  ]);

  const bookingId = searchParams.get("bookingId") || "";

  const handlePriceApply = useCallback((min: number, max: number) => {
    setPriceRange({ min, max });
  }, []);

  const filteredArtisans = useMemo(() => {
    let result = artisans;
    if (priceRange) {
      result = result.filter(a => a.pricePerHour >= priceRange.min && a.pricePerHour <= priceRange.max);
    }
    return result;
  }, [artisans, priceRange]);

  const handleSelectArtisan = (artisanId: string) => {
    const selected = artisans.find((a) => a.id === artisanId);
    const params = new URLSearchParams(searchParams.toString());
    if (bookingId) params.set("bookingId", bookingId);
    params.set("artisanId", artisanId);
    if (selected) {
      params.set("artisanName", selected.name);
      if (selected.profileImage) {
        params.set("artisanImage", selected.profileImage);
      }
      params.set("artisanBadge", selected.badge ?? "");
      params.set("pricePerHour", selected.pricePerHour.toString());
      params.set("artisanKrafts", selected.taskCount.toString());
      if (selected.distanceLabel) {
        params.set("distanceLabel", selected.distanceLabel);
      }
      if (selected.distance != null && Number.isFinite(selected.distance)) {
        params.set("distanceKm", String(selected.distance));
      }
    }
    router.push(`/user/book-service/verifyDetails?${params.toString()}`);
  };

  // Auto-select krafter when arriving from a specific profile (e.g. home page "Book" button)
  const [autoSelected, setAutoSelected] = useState(false);
  useEffect(() => {
    if (!preselectedArtisanId || autoSelected || !fetchDone) return;
    // If the recommended list includes this artisan, select them automatically
    const match = artisans.find((a) => a.id === preselectedArtisanId);
    if (match) {
      setAutoSelected(true);
      handleSelectArtisan(preselectedArtisanId);
    } else if (artisans.length > 0 || !preselectedArtisanId) {
      // Artisan not in recommendation list — let user pick manually
      setAutoSelected(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedArtisanId, fetchDone, artisans]);

  const mappedArtisans: Application[] = artisans.map((artisan) => ({
    id: artisan.id.toString(),
    job_id: categoryId || "",
    artisan_id: artisan.id.toString(),
    artisan_name: artisan.name,
    proposal_message: "",
    price: `€${artisan.pricePerHour}/hr`,
    status: "pending",
    rating: artisan.rating,
    reviews_count: artisan.reviewCount,
    tasks_count: artisan.taskCount,
    image: artisan.profileImage,
    description: artisan.description,
    distance: artisan.distance,
    distanceLabel: artisan.distanceLabel,
    is_top_pro: artisan.badge === "TOP PRO",
  }));
  const handleChat = (artisanId: string) => {
    const artisan = artisans.find((a) => a.id === artisanId);
    router.push(
      `/user/chat?artisanId=${artisanId}&name=${encodeURIComponent(artisan?.name || "")}`,
    );
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}

      <div className="bg-[#FF66001A]">
        <div className="max-w-4xl mx-auto px-4 sm:px-0 py-6 flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="w-9 h-9 bg-brand-orange rounded-full flex items-center justify-center cursor-pointer hover:bg-orange-600 transition-colors">
              <Check size={20} className="text-white" />
            </span>
            <span className="w-9 h-9 bg-brand-orange rounded-full flex items-center justify-center cursor-pointer hover:bg-orange-600 transition-colors">
              <Check size={20} className="text-white" />
            </span>
            <span className="w-fit px-3 py-2.5 text-xs sm:text-sm bg-brand-orange text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-orange-600 transition-colors">
              Krafter
            </span>
            <span className="w-9 h-9 bg-white font-bold rounded-full text-[#00000066] flex items-center justify-center text-sm">
              4
            </span>
            <span className="w-9 h-9 bg-white font-bold rounded-full text-[#00000066] flex items-center justify-center text-sm">
              5
            </span>
          </div>
          <button
            className="text-brand-orange text-[14px] sm:text-[16px] font-poppins font-semibold"
            onClick={() => router.back()}
          >
            Back
          </button>
        </div>
        {/* Service Header */}
        <div className="max-w-4xl mx-auto px-4 sm:px-0 pb-3 mb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-gerat font-bold mb-1">
                {categoryName}
              </h1>
              <p className="text-[14px] sm:text-[15px] text-gray-600 font-poppins truncate max-w-[280px] sm:max-w-sm">
                {address || "Select a location"}
              </p>
              <p className="text-[14px] sm:text-[15px] text-gray-600 font-poppins">
                {(() => {
                  try {
                    if (!dateParam) return "Select a date";
                    const d = new Date(dateParam);
                    if (isNaN(d.getTime()))
                      return `${dateParam} at ${timeParam}`;
                    return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
                  } catch {
                    return "Select a date";
                  }
                })()}
              </p>
            </div>
            <Image
              src="/card.svg"
              alt="cardimg"
              width={70}
              height={70}
              className="w-16 h-16 sm:w-20 sm:h-20"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto  sm:px-0 pb-24">
        {/* Post to Community */}
        <div className="bg-[#F6F6F6] rounded-2xl p-1 mx-4 sm:mx-0 sm:p-5 mb-6  relative">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <span className="text-xs text-[#E29A00] bg-[#E29A001A] px-2 py-1.5 rounded-full  ">
                Recommended
              </span>
              <h3 className="text-[20px] sm:text-[20px] font-poppins font-bold mb-1 mt-2">
                Post To The Community
              </h3>
              <p className="text-[12px] sm:text-[13px] font-poppins mb-3">
                Make your request public so all qualified taskers can serve you
                offers and marketplace pricing
              </p>
              <div className="w-fit">
                <Button
                  variant="primary"
                  className="text-[13px] sm:text-[14px] py-2.5 px-4 inline-flex items-center gap-2"
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    router.push(
                      `/user/book-service/select-artisan/publicTask?${params.toString()}`,
                    );
                  }}
                >
                  <p>Post public task</p>
                  <Image
                    src="/speaker.svg"
                    alt="icon"
                    width={25}
                    height={25}
                    className="-mt-2"
                  />
                </Button>
              </div>
            </div>
            <Image
              src="/people.svg"
              alt="icon"
              width={200}
              height={200}
              className="-mt-2 absolute right-0 -top-4"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="max-w-4xl mx-auto  pb-4 px-4 sm:px-0  relative">
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 w-full">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              <button 
                onClick={() => {
                  setPriceFilterActive(!priceFilterActive);
                  setRatingFilterActive(false);
                  setTodayFilterActive(false);
                }}
                className="px-4 py-2 bg-[#F6F6F6] border border-[#0000001A] text-gray-700 text-[13px] sm:text-[14px] font-poppins font-medium rounded-lg whitespace-nowrap flex items-center gap-2 cursor-pointer transition-colors hover:border-brand-orange hover:text-brand-orange"
              >
                Price
                {priceFilterActive ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              <button 
                onClick={() => {
                  setRatingFilterActive(!ratingFilterActive);
                  setPriceFilterActive(false);
                  setTodayFilterActive(false);
                }}
                className="px-4 py-2 bg-[#F6F6F6] border border-[#0000001A] text-gray-700 text-[13px] sm:text-[14px] font-poppins font-medium rounded-lg whitespace-nowrap flex items-center gap-2 cursor-pointer transition-colors hover:border-brand-orange hover:text-brand-orange"
              >
                Rating
                {ratingFilterActive ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              <button 
                onClick={() => {
                  setTodayFilterActive(!todayFilterActive);
                  setPriceFilterActive(false);
                  setRatingFilterActive(false);
                }}
                className="hidden md:flex px-4 py-2 bg-[#F6F6F6] border border-[#0000001A] text-gray-700 text-[13px] sm:text-[14px] font-poppins font-medium rounded-lg whitespace-nowrap items-center gap-2 cursor-pointer transition-colors hover:border-brand-orange hover:text-brand-orange"
              >
                Today
                {todayFilterActive ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              {canCompare && (
                <button
                  onClick={() => setShowCompare(true)}
                  className="w-10 h-10 md:w-auto md:h-auto md:px-7 md:py-2.5 bg-[#F6F6F6] border border-[#0000001A] text-gray-700 text-[13px] sm:text-[14px] font-poppins font-medium rounded-lg md:rounded-full whitespace-nowrap flex items-center justify-center gap-2 cursor-pointer transition-colors hover:border-brand-orange hover:text-brand-orange"
                >
                  <ArrowLeftRight size={18} className="md:w-[14px] md:h-[14px]" /> 
                  <span className="hidden md:inline">Compare ({artisans.length})</span>
                </button>
              )}
              <button 
                onClick={() => setShowAllFiltersModal(true)}
                className="w-10 h-10 bg-[#F6F6F6] border border-[#0000001A] rounded-lg flex items-center justify-center cursor-pointer transition-colors hover:border-brand-orange"
              >
                <Image src="/filter.svg" alt="filter" width={18} height={18} />
              </button>
            </div>
          </div>
          
          {/* Dropdown Popovers */}
          {priceFilterActive && (
            <div className="absolute top-[65px] left-0 z-[60] w-full sm:w-[403px]">
              <PriceFilterDropdown 
                onApply={handlePriceApply} 
              />
            </div>
          )}
          {ratingFilterActive && (
            <div className="absolute top-[65px] left-0 sm:left-[85px] z-[60] w-full sm:w-[286px]">
              <RatingFilterDropdown />
            </div>
          )}
          {todayFilterActive && (
            <div className="absolute top-[65px] left-0 sm:left-[170px] z-[60] w-full sm:w-[307px]">
              <AvailabilityFilterDropdown />
            </div>
          )}
          {showAllFiltersModal && (
            <AllFiltersModal 
              onClose={() => setShowAllFiltersModal(false)}
              onApplyPrice={handlePriceApply}
            />
          )}
        </div>
        
        {/* Taskers Available */}
        <div className="mb-4 flex justify-between items-center px-4 sm:px-0">
          <h2 className="text-[14px] sm:text-[15px] font-poppins font-semibold text-gray-600">
            {isLoading
              ? "Loading Krafters…"
              : `${filteredArtisans.length} Krafter${filteredArtisans.length !== 1 ? "s" : ""} Available`}
          </h2>
          {filteredArtisans.length > 0 && (
            <button
              onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
              className="bg-[#FF66001A] w-fit p-2 hover:bg-[#FF66002A] transition-colors rounded"
            >
              <Image
                src={viewMode === "list" ? "/group.svg" : "/grid.svg"}
                alt="toggle view"
                width={18}
                height={18}
              />
            </button>
          )}
        </div>

        {/* Empty / Loading states */}
        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && fetchDone && coordsError && (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <p className="text-[16px] font-poppins font-semibold text-gray-600">
              {coordsError}
            </p>
          </div>
        )}

        {!isLoading && fetchDone && !coordsError && filteredArtisans.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <p className="text-[16px] font-poppins font-semibold text-gray-400">
              No Krafters found
            </p>
            <p className="text-[13px] font-poppins text-gray-300 mt-1">
              Try posting a public task so Krafters can come to you
            </p>
          </div>
        )}

        {/* Artisan Cards - List View */}
        {!isLoading && viewMode === "list" && filteredArtisans.length > 0 && (
          <div className="space-y-3">
            {filteredArtisans.map((artisan, index) => (
              <ArtisanCard
                key={artisan.id}
                artisan={artisan}
                index={index}
                onSelect={handleSelectArtisan}
                onChat={handleChat}
                onViewProfile={(id) => {
                  const raw = artisans.find((a) => a.id === id);
                  if (!raw) return;
                  // Find the raw recommendation item to get extra fields
                  setSelectedKrafter(raw as KrafterDetail);
                }}
              />
            ))}
          </div>
        )}

        {/* Artisan Cards - Grid View */}
        {!isLoading && viewMode === "grid" && filteredArtisans.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 px-2 relative">
            {filteredArtisans.map((artisan) => (
              <ArtisanGridCard
                key={artisan.id}
                artisan={artisan}
                onSelect={handleSelectArtisan}
                onViewProfile={(id) => {
                  const raw = artisans.find((a) => a.id === id);
                  if (!raw) return;
                  setSelectedKrafter(raw as KrafterDetail);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Compare Modal — grid view only; hidden when a single Krafter is returned */}
      {canCompare && showCompare && (
        <CompareSheet
          allArtisans={mappedArtisans}
          onClose={() => setShowCompare(false)}
          onSelect={(app) => {
            setShowCompare(false);
            handleSelectArtisan(app.id);
          }}
          fromRecommendations={artisansFromApi}
          serviceCategoryId={categoryId || undefined}
          taskLatitude={taskCoords?.latitude}
          taskLongitude={taskCoords?.longitude}
        />
      )}

      {/* Krafter Detail Modal */}
      {selectedKrafter && (
        <KrafterDetailModal
          krafter={selectedKrafter}
          onClose={() => setSelectedKrafter(null)}
          onSelect={(id) => {
            setSelectedKrafter(null);
            handleSelectArtisan(id);
          }}
        />
      )}
    </main>
  );
};

export default SelectArtisanPage;
