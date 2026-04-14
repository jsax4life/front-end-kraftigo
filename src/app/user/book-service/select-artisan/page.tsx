"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Check, ChevronDown } from "lucide-react";
import Button from "@/components/ui/button";
import ArtisanCard from "@/components/shared/ArtisanCard";
import ArtisanGridCard from "@/components/shared/ArtisanGridCard";
import CompareSheet from "@/components/shared/CompareModal";
import { Application } from "@/types";
import { useBookingsStore } from "@/store/useBookingsStore";
import { useAddressStore } from "@/store/useAddressStore";

interface Artisan {
  id: number;
  name: string;
  profileImage: string;
  badge?: "TOP PRO" | "ELITE" | null;
  rating: number;
  reviewCount: number;
  taskCount: number;
  location: string;
  description: string;
  pricePerHour: number;
  isNewTasker?: boolean;
}

/** Map API recommendation item to UI Artisan shape (flexible for backend fields) */
function mapRecommendationToArtisan(item: any, index: number): Artisan {
  const id = Number(item?.id ?? item?.artisanId ?? item?.artisan_id ?? index + 1);
  return {
    id,
    name: item?.fullName ?? item?.name ?? item?.artisanName ?? "Krafter",
    profileImage: item?.avatar ?? item?.profileImage ?? item?.profilePhotoUrl ?? "/images/pro.jpg",
    badge: item?.badge === "TOP PRO" || item?.isTopPro ? "TOP PRO" : item?.badge ?? null,
    rating: Number(item?.rating ?? item?.reviewsRating ?? 0) || 0,
    reviewCount: Number(item?.reviewsCount ?? item?.reviewCount ?? item?.reviews_count ?? 0) || 0,
    taskCount: Number(item?.completedJobs ?? item?.taskCount ?? item?.tasks_count ?? 0) || 0,
    location: item?.location ?? item?.city ?? item?.baseCity ?? "New Tasker",
    description: item?.bio ?? item?.description ?? item?.proposal_message ?? "",
    pricePerHour: Number(item?.pricePerHour ?? item?.price_per_hour ?? item?.proposedPrice ?? 0) || 0,
    isNewTasker: item?.isNewTasker ?? item?.is_new ?? false,
  };
}



const SelectArtisanPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("categoryId") || "";
  const categoryName = searchParams.get("category") || "Service";
  const address = searchParams.get("address") || "Hauptstraße 123 - 10115, Berlin";
  const dateParam = searchParams.get("date") || new Date().toISOString();
  const timeParam = searchParams.get("time") || "08:00";
  const taskDetails = searchParams.get("taskDetails") || "";

  const { getRecommendations, isLoading } = useBookingsStore();
  const { currentLatitude, currentLongitude } = useAddressStore();

  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [artisansFromApi, setArtisansFromApi] = useState(false);
  const [fetchDone, setFetchDone] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [showCompare, setShowCompare] = useState(false);

  // Fetch recommendations from API
  useEffect(() => {
    if (!categoryId || !taskDetails.trim()) {
      setFetchDone(true);
      return;
    }

    const lat = currentLatitude ?? 0;
    const lng = currentLongitude ?? 0;
    const preferredDate = dateParam.includes("T")
      ? new Date(dateParam).toISOString().split("T")[0]
      : dateParam.slice(0, 10);

    getRecommendations({
      serviceCategoryId: categoryId,
      jobTitle: categoryName,
      jobDescription: taskDetails,
      latitude: lat,
      longitude: lng,
      preferredDate,
      preferredTime: timeParam,
      limit: 16,
    })
      .then((list) => {
        if (Array.isArray(list) && list.length > 0) {
          setArtisans(list.map((item, i) => mapRecommendationToArtisan(item, i)));
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
    currentLatitude,
    currentLongitude,
    getRecommendations,
  ]);

  const handleSelectArtisan = (artisanId: number) => {
    const selected = artisans.find((a) => a.id === artisanId);
    const params = new URLSearchParams(searchParams.toString());
    params.set("artisanId", artisanId.toString());
    if (selected) {
      params.set("artisanName", selected.name);
      params.set("artisanImage", selected.profileImage);
      params.set("artisanBadge", selected.badge ?? "");
      params.set("pricePerHour", selected.pricePerHour.toString());
    }
    router.push(`/user/book-service/verifyDetails?${params.toString()}`);
  };

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
    is_top_pro: artisan.badge === "TOP PRO",
  }));

  const handleChat = (artisanId: number) => {
    // Navigate to chat page
    const artisan = artisans.find((a) => a.id === artisanId);
    router.push(
      `/user/chat?artisanId=${artisanId}&name=${encodeURIComponent(artisan?.name || "")}`,
    );
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}

      <div className="bg-[#FFF0F0]">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 lg:px-8 py-6 flex items-center justify-between">
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
      </div>

      {/* Filters */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-4 pt-5">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <button className="px-4 py-2 bg-brand-orange text-white text-[13px] sm:text-[14px] font-poppins font-medium rounded-lg whitespace-nowrap flex items-center gap-2">
            Price
            <ChevronDown size={16} />
          </button>
          <button className="px-4 py-2 bg-[#F6F6F6] text-gray-700 text-[13px] sm:text-[14px] font-poppins font-medium rounded-lg border border-[#0000001A] whitespace-nowrap flex items-center gap-2">
            Rating
            <ChevronDown size={16} />
          </button>
          <button className="px-4 py-2 bg-[#F6F6F6] border border-[#0000001A] text-gray-700 text-[13px] sm:text-[14px] font-poppins font-medium rounded-lg whitespace-nowrap flex items-center gap-2">
            Today
            <ChevronDown size={16} />
          </button>
          <button className="w-10 h-10 bg-[#F6F6F6] border border-[#0000001A] rounded-lg flex items-center justify-center">
            <Image src="/filter.svg" alt="filter" width={20} height={20} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto  pb-24">
        {/* Post to Community */}
        <div className="bg-[#F6F6F6] rounded-2xl p-4 sm:p-5 mb-6 border border-[#0000001A] relative mx-4">
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
                    router.push(`/user/book-service/select-artisan/publicTask?${params.toString()}`);
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

        {/* Taskers Available */}
        <div className="mb-4 mx-4 flex justify-between items-center">
          <h2 className="text-[14px] sm:text-[15px] font-poppins font-semibold text-gray-600">
            {isLoading ? "Loading Krafters…" : `${artisans.length} Krafter${artisans.length !== 1 ? "s" : ""} Available`}
          </h2>
          {artisans.length > 0 && (
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

        {!isLoading && fetchDone && artisans.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <p className="text-[16px] font-poppins font-semibold text-gray-400">No Krafters found</p>
            <p className="text-[13px] font-poppins text-gray-300 mt-1">
              Try posting a public task so Krafters can come to you
            </p>
          </div>
        )}

        {/* Artisan Cards - List View */}
        {!isLoading && viewMode === "list" && artisans.length > 0 && (
          <div className="space-y-4">
            {artisans.map((artisan, index) => (
              <ArtisanCard
                key={artisan.id}
                artisan={artisan}
                index={index}
                onSelect={handleSelectArtisan}
                onChat={handleChat}
              />
            ))}
          </div>
        )}

        {/* Artisan Cards - Grid View */}
        {!isLoading && viewMode === "grid" && artisans.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 px-2 relative">
            {artisans.map((artisan) => (
              <ArtisanGridCard
                key={artisan.id}
                artisan={artisan}
                onSelect={handleSelectArtisan}
              />
            ))}
            <div
              onClick={() => setShowCompare(true)}
              className="flex items-center justify-center gap-2 bg-brand-orange w-66 h-10 rounded-full cursor-pointer hover:bg-orange-600 transition-colors absolute top-70 left-1/2 transform -translate-x-1/2"
            >
              <Image
                src="/double.svg"
                alt="toggle view"
                width={15}
                height={15}
              />
              <span className="text-xs font-poppins text-white">
                Compare Krafter ({artisans.length})
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Compare Modal */}
      {showCompare && (
        <CompareSheet
          allArtisans={mappedArtisans}
          onClose={() => setShowCompare(false)}
          onSelect={(app) => {
            setShowCompare(false);
            handleSelectArtisan(parseInt(app.id));
          }}
          fromRecommendations={artisansFromApi}
          serviceCategoryId={categoryId || undefined}
        />
      )}
    </main>
  );
};

export default SelectArtisanPage;
