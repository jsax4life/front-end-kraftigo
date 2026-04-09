"use client";

import Image from "next/image";
import UserNav from "@/components/shared/userNav";
import { MapPin, Search, ChevronRight, Home, User, Plus, Clock } from "lucide-react";
import Userabt from "@/components/shared/userabt";
import ProCard from "@/components/ui/proCard";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useProfileStore } from "@/store/useProfileStore";
import { useAuthPromptStore } from "@/store/useAuthPromptStore";
import { useHomeStore, normSrc } from "@/store/useHomeStore";

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
    price: "$41.29/hr",
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
    price: "$45.00/hr",
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

// ─── Component ────────────────────────────────────────────────────────────────

const Page = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { openPrompt } = useAuthPromptStore();
  const { customerProfile, fetchCustomerProfile } = useProfileStore();

  const {
    categories: apiCategories,
    prosOfWeek,
    upcoming,
    isLoading,
    hasFetched,
    error,
    fetchHomeData,
    recentSearches,
    addRecentSearch,
  } = useHomeStore();

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // ── Fetch profile & home data on mount ─────────────────────────────────────
  useEffect(() => {
    if (isAuthenticated) {
      if (!customerProfile) fetchCustomerProfile();
      if (!hasFetched) fetchHomeData();
    }
  }, [isAuthenticated, customerProfile, fetchCustomerProfile, hasFetched, fetchHomeData]);

  // ── Derived display values ──────────────────────────────────────────────────
  const displayName =
    user?.firstName ||
    "User";
  const avatar = user?.avatar;

  // Categories: prefer API data, fall back to static ONLY on confirmed API failure
  const displayCategories =
    apiCategories.length > 0
      ? apiCategories.map((c) => ({
          id: c.id,
          name: c.name,
          image: normSrc(c.imageUrl) || "/images/home3.jpg",
        }))
      : hasFetched && error
      ? STATIC_CATEGORIES.map((c) => ({ id: "", ...c }))
      : [];

  // Pros: fall back to static ONLY on confirmed API failure
  const displayPros =
    prosOfWeek.length > 0
      ? prosOfWeek.map((p) => ({
          name: p.displayName,
          rating: Math.round(p.rating),
          reviews: p.reviewCount,
          tasks: p.completedKrafts,
          description: `${p.distanceKm} km away · ${p.badges.join(", ")}`,
          price: `$${p.hourlyRate.toFixed(2)}/hr`,
          image: normSrc(p.profilePhotoUrl) ?? "/images/pro.jpg",
          badge: p.badges[0] ?? undefined,
        }))
      : hasFetched && error
      ? STATIC_PROS
      : [];

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleProtectedAction = (path: string) => {
    if (!isAuthenticated) {
      openPrompt();
    } else {
      router.push(path);
    }
  };

  const handleCustomKraft = () => {
    handleProtectedAction("/user/home/custom-kraft");
  };

  const filteredCategories = displayCategories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPros = displayPros.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="relative w-full min-h-screen bg-white pb-24">
      {/* Page Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-4xl mx-auto">
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
          <div className="flex items-center gap-5 mb-8">
            {/* Avatar with Dashed Border */}
            <div
              className="border-2 border-dashed border-brand-orange rounded-full w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center cursor-pointer shrink-0"
              onClick={() => handleProtectedAction("/user/profile")}
            >
              <div className="relative w-[70px] h-[70px] sm:w-[84px] sm:h-[84px] rounded-full overflow-hidden bg-gray-50 flex items-center justify-center shadow-sm">
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

            {/* Greetings and Title */}
            <div className="flex-1">
              <p className="text-[14px] sm:text-[16px] font-poppins text-[#667085] mb-1">
                Hello <span className="text-[#1D2939] font-bold">{displayName}</span> 👋
              </p>
              <h1 className="text-[28px] sm:text-[36px] lg:text-[42px] font-gerat font-[850] leading-tight text-[#1D2939]">
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

          {/* Categories */}
          <div className="mb-8 mt-15">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[18px] sm:text-[20px] font-gerat font-bold">
                Categories
              </h2>
              <button
                onClick={() => router.push("/user/home/categories")}
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
                    const params = new URLSearchParams({ category: category.name });
                    if (category.id) params.set("categoryId", category.id);
                    router.push(`/user/book-service?${params.toString()}`);
                  };
                  return (
                    <div
                      key={index}
                      className="cursor-pointer group"
                      onClick={handleCategoryClick}
                    >
                      <div className="relative rounded-xl overflow-hidden aspect-square mb-2">
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
                        {category.name}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          {/* Pro's Of The Week */}
          <div className="mb-8">
            <h2 className="text-[18px] sm:text-[20px] font-gerat font-bold mb-4">
              Pro&apos;s Of The Week
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
            ) : displayPros.length > 1 ? (
              <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
                <div className="flex gap-4">
                  {displayPros.map((pro, index) => (
                    <ProCard
                      key={index}
                      name={pro.name}
                      rating={pro.rating}
                      reviews={pro.reviews}
                      tasks={pro.tasks}
                      description={pro.description}
                      price={pro.price}
                      image={pro.image}
                      badge={pro.badge}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div>
                {displayPros.map((pro, index) => (
                  <ProCard
                    key={index}
                    name={pro.name}
                    rating={pro.rating}
                    reviews={pro.reviews}
                    tasks={pro.tasks}
                    description={pro.description}
                    price={pro.price}
                    image={pro.image}
                    badge={pro.badge}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Bookings */}
          <div className="mb-6">
            <h2 className="text-[18px] sm:text-[20px] font-gerat font-bold mb-4">
              Upcoming
            </h2>

            {isLoading && !hasFetched ? (
              // Skeleton
              <div className="animate-pulse bg-gray-100 rounded-xl h-28" />
            ) : upcoming.length > 0 ? (
              <div className="flex flex-col gap-3">
                {upcoming.map((booking) => (
                  <div
                    key={booking.bookingId}
                    className="bg-[#FF66001A] rounded-xl p-4 sm:p-5 border border-[#0000001A]"
                  >
                    <div className="flex gap-4">
                      {/* Booking Details */}
                      <div className="flex-1">
                        <h3 className="text-[16px] sm:text-[14px] font-poppins font-bold mb-2">
                          {booking.jobTitle}
                        </h3>
                        <div className="space-y-1 text-[12px] sm:text-[13px] text-gray-700 font-poppins">
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-gray-500" />
                            <span>{booking.addressSummary}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Image
                              src="/taskerCal.svg"
                              alt="calendar"
                              width={15}
                              height={15}
                            />
                            <span>{formatScheduledAt(booking.scheduledAt)}</span>
                          </div>
                          <div>
                            <span className="inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                              {booking.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Krafter Photo */}
                      <div className="relative w-[88px] h-[88px] sm:w-[100px] sm:h-[100px] rounded-xl overflow-hidden shrink-0">
                        <Image
                          src={normSrc(booking.krafter.profilePhotoUrl) ?? "/images/pro.jpg"}
                          alt={booking.krafter.displayName}
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
        </div>
      </div>

      {/* Search Modal */}
      {showSearchModal && (
        <div
          className="fixed inset-0 bg-[#C0C0C0] z-60"
          onClick={() => setShowSearchModal(false)}
        >
          <div className="p-4 pt-6" onClick={(e) => e.stopPropagation()}>
            <div className="relative mb-6">
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
                className="w-full pl-12 pr-4 py-4 rounded-full border-2 border-brand-orange bg-white focus:outline-none focus:border-brand-orange text-[14px] sm:text-[16px] font-poppins shadow-lg"
              />
            </div>

            {/* Conditional Content - Show Results or Recents */}
            {searchQuery.trim() ? (
              <div className="bg-white rounded-2xl p-4 shadow-lg border border-[#0000001A]">
                {/* Services Section */}
                <div className="mb-6">
                  <h3 className="text-[12px] font-poppins font-semibold mb-3 text-[#00000066]">
                    Services
                  </h3>
                  <div>
                    {filteredCategories.slice(0, 5).map((category, index) => {
                      return (
                        <button
                          key={index}
                          onClick={() => {
                            addRecentSearch(category.name);
                            const params = new URLSearchParams({ category: category.name });
                            if (category.id) params.set("categoryId", category.id);
                            handleProtectedAction(`/user/book-service?${params.toString()}`);
                            setShowSearchModal(false);
                          }}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 relative bg-gray-100 flex items-center justify-center">
                            {category.image ? (
                              <Image src={category.image} alt={category.name} fill className="object-cover" />
                            ) : (
                              <Home size={20} className="text-gray-400" />
                            )}
                          </div>
                          <span className="text-[14px] font-poppins text-gray-800">
                            {category.name}
                          </span>
                        </button>
                      );
                    })}
                    {filteredCategories.length === 0 && (
                      <p className="text-[14px] text-gray-500 font-poppins px-3 pb-3">No services found.</p>
                    )}
                  </div>
                </div>

                {/* Artisans Section */}
                <div>
                  <h3 className="text-[12px] font-poppins font-semibold mb-3 text-[#00000066]">
                    Artisans
                  </h3>
                  <div>
                    {filteredPros.slice(0, 5).map((artisan, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          addRecentSearch(artisan.name);
                          // Needs artisan profile route mapping - routing to custom for now as placeholder
                          handleProtectedAction("/user/home/custom-kraft");
                          setShowSearchModal(false);
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                           <Image
                            src={artisan.image}
                            alt={artisan.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <span className="text-[14px] font-poppins text-gray-800">
                          {artisan.name}
                        </span>
                      </button>
                    ))}
                    {filteredPros.length === 0 && (
                      <p className="text-[14px] text-gray-500 font-poppins px-3 pb-3">No artisans found.</p>
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
              </div>
            ) : (
              // Recents Section
              <div className="bg-white rounded-2xl p-4 shadow-lg border border-[#0000001A]">
                <h3 className="text-[12px] font-poppins font-semibold mb-3 text-[#00000066]">
                  Recents
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
                    <p className="text-[14px] text-gray-500 font-poppins px-3 pb-3">No recent searches.</p>
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
      )}

      {/* Bottom Navigation */}
      <UserNav />
    </main>
  );
};

export default Page;
