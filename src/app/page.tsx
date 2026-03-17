"use client";

import Image from "next/image";
import UserNav from "@/components/shared/userNav";
import { Search, ChevronRight, Home, User } from "lucide-react";
import Userabt from "@/components/shared/userabt";
import ProCard from "@/components/ui/proCard";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthPromptStore } from "@/store/useAuthPromptStore";

const Page = () => {
  const categories = [
    { name: "Gardening", image: "/images/home3.jpg" },
    { name: "Moving", image: "/images/home5.jpg" },
    { name: "Laundry", image: "/images/home6.jpg" },
    { name: "Errands", image: "/images/home2.jpg" },
    { name: "Outside", image: "/images/home1.jpg" },
    { name: "Home repairs", image: "/images/home4.jpg" },
  ];

  const pros = [
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

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const recentSearches = [
    {
      id: 1,
      name: "House Cleaning",
      icon: Home,
      bgColor: "bg-[#0000FF33]",
      iconColor: "text-blue-900",
    },
    {
      id: 2,
      name: "Haircut",
      icon: User,
      bgColor: "bg-[#FF000033]",
      iconColor: "text-[#7C2828]",
    },
  ];

  const searchServices = [
    {
      id: 1,
      name: "House Cleaning",
      icon: Home,
      bgColor: "bg-[#0000FF33]",
      iconColor: "text-blue-900",
    },
    {
      id: 2,
      name: "Haircut",
      icon: User,
      bgColor: "bg-[#FF000033]",
      iconColor: "text-[#7C2828]",
    },
    {
      id: 3,
      name: "Hold Spot",
      icon: User,
      bgColor: "bg-[#FF000033]",
      iconColor: "text-[#7C2828]",
    },
  ];

  const searchArtisans = [
    {
      id: 1,
      name: "Heatherh Ropalanum.",
      image: "/images/pro.jpg",
    },
    {
      id: 2,
      name: "Hannah Kane",
      image: "/images/pro.jpg",
    },
    {
      id: 3,
      name: "Heather K",
      image: "/images/pro.jpg",
    },
  ];

  const handleCustomKraft = () => {
    // Navigate to custom kraft request page
    console.log("Request custom kraft");
    handleProtectedAction("/user/home/custom-kraft");
  };

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
              {categories.map((category, index) => (
                <div key={index} className="cursor-pointer group">
                  <div className="relative rounded-xl overflow-hidden aspect-square mb-2">
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 15vw"
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <p className="text-left text-[12px] sm:text-[14px] font-mabry font-semibold text-gray-800">
                    {category.name}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Pro's Of The Week */}
          <div className="mb-8">
            <h2 className="text-[18px] sm:text-[20px] font-gerat font-bold mb-4">
              Pro&apos;s Of The Week
            </h2>

            {pros.length > 1 ? (
              <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
                <div className="flex gap-4">
                  {pros.map((pro, index) => (
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
                {pros.map((pro, index) => (
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
                    {searchServices.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            handleProtectedAction(
                              `/user/book-service?service=${encodeURIComponent(item.name)}`,
                            );
                            setShowSearchModal(false);
                          }}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div
                            className={`${item.bgColor} ${item.iconColor} w-10 h-10 rounded-lg flex items-center justify-center shrink-0`}
                          >
                            <Icon size={20} />
                          </div>
                          <span className="text-[14px] font-poppins text-gray-800">
                            {item.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Artisans Section */}
                <div>
                  <h3 className="text-[12px] font-poppins font-semibold mb-3 text-[#00000066]">
                    Artisans
                  </h3>
                  <div>
                    {searchArtisans.map((artisan) => (
                      <button
                        key={artisan.id}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Image
                          src={artisan.image}
                          alt={artisan.name}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-lg object-cover shrink-0"
                        />
                        <span className="text-[14px] font-poppins text-gray-800">
                          {artisan.name}
                        </span>
                      </button>
                    ))}
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
                  {recentSearches.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          handleProtectedAction(
                            `/user/book-service?service=${encodeURIComponent(item.name)}`,
                          );
                          setShowSearchModal(false);
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div
                          className={`${item.bgColor} ${item.iconColor} w-10 h-10 rounded-lg flex items-center justify-center shrink-0`}
                        >
                          <Icon size={20} />
                        </div>
                        <span className="text-[14px] font-poppins text-gray-800">
                          {item.name}
                        </span>
                      </button>
                    );
                  })}
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
