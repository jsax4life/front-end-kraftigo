"use client";

import Image from "next/image";
import UserNav from "@/componets/shared/userNav";
import { MapPin, Search, ChevronRight, Home, User } from "lucide-react";
import Userabt from "@/componets/shared/userabt";
import ProCard from "@/componets/ui/proCard";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
    {
      id: 3,
      name: "Body Massage",
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

          {/* Location, Language, Profile Section */}
          <div className=" mb-4">
            <Userabt />

            {/* Profile Picture */}
            <div className="border-2 border-dashed border-brand-orange rounded-full w-14 h-14 sm:w-16 sm:h-16 lg:w-18 lg:h-18 flex items-center justify-center">
              <Image
                src="/images/abt.jpg"
                alt="propic"
                width={300}
                height={300}
                className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full object-cover"
              />
            </div>
          </div>

          {/* What do you need today? */}
          <div className="mb-6">
            <h1 className="text-[28px] sm:text-[32px] lg:text-[36px] font-gerat font-[850] leading-tight mb-4">
              What do you <br className="lg:hidden" /> need today?
            </h1>

            {/* Search Bar */}
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
              <button className="text-[14px] font-poppins hover:underline flex items-center gap-1">
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
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <p className="text-left text-[12px] sm:text-[14px] font-qurova font-semibold text-gray-800">
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

            {/* Conditional Scroll Container */}
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

          {/* Upcoming */}
          <div className="mb-6">
            <h2 className="text-[18px] sm:text-[20px] font-gerat font-bold mb-4">
              Upcoming
            </h2>

            <div className="bg-[#FF66001A] rounded-xl p-4 sm:p-5 border border-[#0000001A]">
              <div className="flex gap-4">
                {/* Appointment Details */}
                <div className="flex-1">
                  <h3 className="text-[16px] sm:text-[14px] font-poppins font-bold mb-2">
                    House Cleaning with Sarah M.
                  </h3>
                  <div className="space-y-1 text-[12px] sm:text-[13px] text-gray-700 font-poppins">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-gray-500" />
                      <span>Hauptstraße 123 - 10115, Berlin</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Image
                        src="/taskerCal.svg"
                        alt="calender"
                        width={15}
                        height={15}
                      />
                      <span>16th Jan, 2025 (In 5 Minutes)</span>
                    </div>
                  </div>
                </div>
                {/* Appointment Image */}
                <Image
                  src="/images/pro.jpg"
                  alt="Sarah M."
                  width={100}
                  height={100}
                  className="w-23 h-23 sm:w-25 sm:h-25 rounded-xl object-cover shrink-0"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-[#C0C0C0] z-60">
          <div className="p-4 pt-6">
            {/* Search Input */}
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
              // Search Results
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
                            router.push(
                              `/user/book-service?service=${encodeURIComponent(item.name)}`
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
