"use client";

import Image from "next/image";
import { Search, ChevronRight, Home, User} from "lucide-react";
import Userabt from "@/components/shared/userabt";
import ProCard from "@/components/ui/proCard";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthPromptStore } from "@/store/useAuthPromptStore";


// ─── Static fallbacks (shown when unauthenticated or API not yet resolved) ────

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
  const { isAuthenticated } = useAuthStore();
  const { openPrompt } = useAuthPromptStore();

  const handleProtectedAction = (path: string) => {
    if (!isAuthenticated) {
      openPrompt();
    } else {
      router.push(path);
    }
  };

  useEffect(() => {
  if (isAuthenticated) {
    router.push("/user/home");
  }
}, [isAuthenticated, router]);

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // ── Derive display data ──────────────────────────────────────────────────

  // Categories: strictly static data for the landing page
  const displayCategories = STATIC_CATEGORIES.map((c) => ({ id: "", ...c }));

  // Pros: strictly static data for the landing page
  const displayPros = STATIC_PROS;

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
    <main className="relative w-full min-h-screen bg-white pb-10">
      {/* Page Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-4xl mx-auto pt-10">
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
                <User size={32} className="text-gray-300" />
              </div>
            </div>

            {/* Greetings and Title */}
            <div className="flex-1">
              <p className="text-[14px] sm:text-[16px] font-poppins text-[#667085] mb-1">
                Hello <span className="text-[#1D2939] font-bold">User</span> 👋
              </p>
              <h1 className="text-[28px] sm:text-[36px] lg:text-[42px] font-gerat font-[850] leading-tight text-[#1D2939]">
                What do you <br className="sm:hidden" /> need today?
              </h1>
            </div>
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

            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {displayCategories.map((category, index) => {
                const handleCategoryClick = () => {
                  const params = new URLSearchParams({ category: category.name });
                  if (category.id) params.set("categoryId", category.id);
                  handleProtectedAction(`/user/book-service?${params.toString()}`);
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
                      {/* Subtle overlay on hover */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 rounded-xl" />
                    </div>
                    <p className="text-left text-[12px] sm:text-[14px] font-mabry font-semibold text-gray-800 group-hover:text-brand-orange group-hover:underline group-hover:underline-offset-2 transition-all duration-200">
                      {category.name}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pro's Of The Week */}
          <div className="mb-8">
            <h2 className="text-[18px] sm:text-[20px] font-gerat font-bold mb-4">
              Pro&apos;s Of The Week
            </h2>

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
              // Recents Section (Disabled for public landing page)
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-[#0000001A] text-center">
                <Search className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <h3 className="text-[16px] font-poppins font-semibold mb-2 text-gray-800">
                  Search for services
                </h3>
                <p className="text-[14px] text-gray-500 font-poppins mb-6">
                  Start typing to find what you need.
                </p>
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
    </main>
  );
};

export default Page;
