"use client";

import { ArrowLeft, Search, ChevronRight } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";

const Page = () => {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  // Category data mapping
  const categoryData: Record<
    string,
    {
      name: string;
      image: string;
      services: Array<{
        id: number;
        name: string;
        description: string;
        price: string;
        icon: string;
      }>;
    }
  > = {
    "gardening-outdoor": {
      name: "Gardening & Outdoor Help",
      image: "/images/home3.jpg",
      services: [
        {
          id: 1,
          name: "Gardening help",
          description: "Includes planting, watering, weeding",
          price: "$45/hr",
          icon: "🌱",
        },
        {
          id: 2,
          name: "Landscaping help",
          description: "Includes planting, watering, weeding",
          price: "$45/hr",
          icon: "🌱",
        },
        {
          id: 3,
          name: "Lawn Maintainance",
          description: "Includes planting, watering, weeding",
          price: "$45/hr",
          icon: "🌱",
        },
        {
          id: 4,
          name: "Planting Help",
          description: "Includes planting, watering, weeding",
          price: "$45/hr",
          icon: "🌱",
        },
      ],
    },
    moving: {
      name: "Moving",
      image: "/images/home5.jpg",
      services: [
        {
          id: 1,
          name: "Full Moving Service",
          description: "Packing, loading, and unloading",
          price: "$60/hr",
          icon: "📦",
        },
        {
          id: 2,
          name: "Loading/Unloading",
          description: "Help with heavy lifting",
          price: "$45/hr",
          icon: "📦",
        },
        {
          id: 3,
          name: "Packing Help",
          description: "Professional packing services",
          price: "$40/hr",
          icon: "📦",
        },
      ],
    },
    laundry: {
      name: "Laundry",
      image: "/images/home6.jpg",
      services: [
        {
          id: 1,
          name: "Wash & Fold",
          description: "Complete laundry service",
          price: "$35/hr",
          icon: "👕",
        },
        {
          id: 2,
          name: "Ironing Service",
          description: "Professional ironing",
          price: "$30/hr",
          icon: "👕",
        },
        {
          id: 3,
          name: "Dry Cleaning Pickup",
          description: "Pickup and delivery",
          price: "$25/hr",
          icon: "👕",
        },
      ],
    },
    errands: {
      name: "Errands",
      image: "/images/home2.jpg",
      services: [
        {
          id: 1,
          name: "Grocery Shopping",
          description: "Shop for groceries and deliver",
          price: "$30/hr",
          icon: "🛒",
        },
        {
          id: 2,
          name: "Package Delivery",
          description: "Pick up and deliver packages",
          price: "$25/hr",
          icon: "🛒",
        },
        {
          id: 3,
          name: "General Errands",
          description: "Various errand services",
          price: "$28/hr",
          icon: "🛒",
        },
      ],
    },
    "home-repairs": {
      name: "Home repairs",
      image: "/images/home4.jpg",
      services: [
        {
          id: 1,
          name: "General Repairs",
          description: "Fix various household items",
          price: "$55/hr",
          icon: "🔧",
        },
        {
          id: 2,
          name: "Plumbing Help",
          description: "Basic plumbing repairs",
          price: "$65/hr",
          icon: "🔧",
        },
        {
          id: 3,
          name: "Electrical Help",
          description: "Basic electrical work",
          price: "$70/hr",
          icon: "🔧",
        },
        {
          id: 4,
          name: "Furniture Assembly",
          description: "Assemble furniture and fixtures",
          price: "$45/hr",
          icon: "🔧",
        },
      ],
    },
  };

  const category = categoryData[slug];

  // Handle invalid slug
  if (!category) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Category not found</h1>
          <button
            onClick={() => router.push("/user/home/categories")}
            className="text-brand-orange hover:underline"
          >
            Back to Categories
          </button>
        </div>
      </div>
    );
  }

  const handleServiceClick = (serviceName: string) => {
    // Navigate to booking page with service details
    console.log("Navigate to booking:", serviceName);
    router.push(
      `/user/book-service?service=${encodeURIComponent(serviceName)}`
    );
  };

  const handleCustomKraft = () => {
    // Navigate to custom kraft request page
    console.log("Request custom kraft");
    router.push("/user/home/custom-kraft");
  };

  const handleSearch = () => {
    // Navigate to search or open search modal
    console.log("Open search");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-[280px] sm:h-[320px]">
        {/* Background Image */}
        <Image
          src={category.image}
          alt={category.name}
          fill
          className="object-cover"
          priority
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Header Buttons */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 sm:p-6">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-900" />
          </button>
          <button
            onClick={handleSearch}
            className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
          >
            <Search size={20} className="text-gray-900" />
          </button>
        </div>

        {/* Content */}
        <div className="absolute bottom-6 left-4 sm:left-6 right-4 sm:right-6">
          {/* Badge */}
          <div className="mb-3">
            <span className="bg-[#6B46C1] text-white text-[11px] sm:text-[12px] font-poppins font-semibold px-3 py-1.5">
              Experts Available
            </span>
          </div>

          {/* Title */}
          <h1 className="text-[32px] sm:text-[40px] lg:text-[48px] font-gerat font-bold text-white leading-tight mb-4">
            {category.name}
          </h1>

         
        </div>
      </div>

      {/* Service Types Section */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-4xl mx-auto">
        <h2 className="text-[20px] sm:text-[22px] font-poppins font-semibold text-gray-900 mb-4">
          Select a service type
        </h2>

        {/* Service Cards */}
        <div className="space-y-0">
          {category.services.map((service, index) => (
            <button
              key={service.id}
              onClick={() => handleServiceClick(service.name)}
              className="w-full flex items-center gap-4 py-4 hover:bg-gray-50 transition-colors group border-b border-[#0000001A]"
            >
              {/* Icon */}
              <div className="w-14 h-14 bg-[#FFE5D9] rounded-xl flex items-center justify-center shrink-0 text-2xl">
                {service.icon}
              </div>

              {/* Content */}
              <div className="flex-1 text-left">
                <h3 className="text-[16px] sm:text-[17px] font-poppins font-bold text-gray-900 mb-1">
                  {service.name}
                </h3>
                <p className="text-[13px] sm:text-[14px] font-poppins text-gray-600 mb-1">
                  {service.description}
                </p>
                <p className="text-[13px] sm:text-[14px] font-poppins font-semibold text-brand-orange bg-[#FF66001A] px-3 py-1 rounded-full w-fit">
                  Starting at {service.price}
                </p>
              </div>

              {/* Chevron */}
              <ChevronRight
                size={20}
                className="text-gray-400 group-hover:text-brand-orange transition-colors shrink-0"
              />
            </button>
          ))}
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
