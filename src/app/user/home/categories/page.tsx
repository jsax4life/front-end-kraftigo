"use client";

import { ArrowLeft, ChevronRight, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const Page = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    { id: 1, name: "Gardening & Outdoor Help", slug: "gardening-outdoor" },
    { id: 2, name: "Moving", slug: "moving" },
    { id: 3, name: "Laundry", slug: "laundry" },
    { id: 4, name: "Errands", slug: "errands" },
    { id: 5, name: "Home repairs", slug: "home-repairs" },
  ];

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCategoryClick = (slug: string) => {
    // Navigate to category detail page
    console.log("Navigate to category:", slug);
    router.push(`/user/home/categories/${slug}`);
  };

  const handleCustomKraft = () => {
    // Navigate to custom kraft request page
    console.log("Request custom kraft");
    router.push("/user/home/custom-kraft");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-6 p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} className="text-gray-900" />
        </button>

        <h1 className="text-[28px] sm:text-[32px] font-gerat font-bold text-gray-900 mb-6">
          Categories
        </h1>

        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
            <Search size={20} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[#F6F6F6] border border-[#0000001A] rounded-xl text-[15px] sm:text-[16px] font-poppins text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:bg-white transition-all"
          />
        </div>

        {/* Categories List */}
        <div className="space-y-0 border-t border-[#0000001A]">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.slug)}
                className="w-full flex items-center justify-between py-4 border-b border-[#0000001A] hover:bg-gray-50 transition-colors group"
              >
                <span className="text-[16px] sm:text-[17px] font-poppins text-gray-900 group-hover:text-brand-orange transition-colors">
                  {category.name}
                </span>
                <ChevronRight
                  size={20}
                  className="text-gray-400 group-hover:text-brand-orange transition-colors"
                />
              </button>
            ))
          ) : (
            <div className="py-8 text-center">
              <p className="text-[15px] font-poppins text-gray-500">
                No categories found
              </p>
            </div>
          )}
        </div>

        {/* Bottom Section */}
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
  );
};

export default Page;
