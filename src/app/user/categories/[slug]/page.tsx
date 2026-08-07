"use client";

import { ArrowLeft, Search, ChevronRight } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { useEffect, useMemo } from "react";
import { useServicesStore } from "@/store/useServicesStore";
import type { ServiceCategory } from "@/types";
import { useTranslations, useLocale } from "next-intl";
import { useTranslateContent } from "@/hooks/useTranslateContent";
import {
  BETA_UNAVAILABLE_ROUTE,
  buildCategoryBookingUrl,
  isBetaBookableCategory,
} from "@/constants/betaLaunch";

const Page = () => {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const t = useTranslations("categories.details");
  const locale = useLocale();
  
  const { services = [], categories = [], isLoading, error, fetchServices, fetchCategories } = useServicesStore();

  // Find current category based on slug or ID
  const currentCategory: ServiceCategory | undefined = useMemo(() => {
    return categories.find(cat => 
      cat.slug === slug || cat.id === slug
    );
  }, [slug, categories]);

  const { translatedTexts: translatedCategoryName } = useTranslateContent(
    currentCategory ? [currentCategory.name] : [],
    locale
  );

  const serviceStringsToTranslate = useMemo(() => {
    const titles = services.map(s => s.title);
    const descs = services.map(s => s.description || "");
    return [...titles, ...descs];
  }, [services]);

  const { translatedTexts: translatedServices } = useTranslateContent(
    serviceStringsToTranslate,
    locale
  );

  useEffect(() => {
    // Fetch categories if not already loaded
    if (categories.length === 0) {
      fetchCategories();
    }
  }, [categories.length, fetchCategories]);

  useEffect(() => {
    // Fetch services for this category when category is found
    if (currentCategory) {
      fetchServices({ category: currentCategory.id });
    }
  }, [currentCategory, fetchServices]);

  useEffect(() => {
    if (!currentCategory) return;
    if (!isBetaBookableCategory(currentCategory.id, currentCategory.name)) {
      const params = new URLSearchParams({
        categoryId: currentCategory.id,
        category: currentCategory.name,
      });
      router.replace(`${BETA_UNAVAILABLE_ROUTE}?${params.toString()}`);
    }
  }, [currentCategory, router]);

  const handleServiceClick = (serviceId: string, serviceTitle: string) => {
    if (!currentCategory) return;
    router.push(
      buildCategoryBookingUrl(currentCategory.id, currentCategory.name, {
        serviceId,
        service: serviceTitle,
      }),
    );
  };

  const handleSearch = () => {
    // Navigate to search or open search modal
    console.log("Open search");
  };

  // Handle invalid slug or loading
  if (isLoading && !currentCategory) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-[15px] font-poppins text-gray-500">
            {t("loading")}
          </p>
        </div>
      </div>
    );
  }

  if (!currentCategory && !isLoading && categories.length > 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t("notFound")}</h1>
          <button
            onClick={() => router.push("/user/categories")}
            className="text-brand-orange hover:underline"
          >
            {t("back")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-[280px] sm:h-[320px]">
        {/* Background Image */}
        <Image
          src={currentCategory?.icon || "/images/home.png"}
          alt={currentCategory?.name || "Category"}
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
              {services.length > 0 ? t("servicesAvailable", { count: services.length }) : t("expertsAvailable")}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-[32px] sm:text-[40px] lg:text-[48px] font-gerat font-bold text-white leading-tight mb-4">
            {translatedCategoryName[0] || currentCategory?.name}
          </h1>

         
        </div>
      </div>

      {/* Service Types Section */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-4xl mx-auto">
        <h2 className="text-[20px] sm:text-[22px] font-poppins font-semibold text-gray-900 mb-4">
          {t("selectService")}
        </h2>

        {/* Service Cards */}
        <div className="space-y-0">
          {isLoading ? (
            <div className="py-8 text-center">
              <p className="text-[15px] font-poppins text-gray-500">
                {t("loadingServices")}
              </p>
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <p className="text-[15px] font-poppins text-red-500">
                {error}
              </p>
            </div>
          ) : services.length > 0 ? (
            services.map((service) => (
              <button
                key={service.id}
                onClick={() => handleServiceClick(service.id, service.title)}
                className="w-full flex items-center gap-4 py-4 hover:bg-gray-50 transition-colors group border-b border-[#0000001A]"
              >
                {/* Icon/Image */}
                <div className="w-14 h-14 bg-[#FFE5D9] rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                  {service.images && service.images.length > 0 ? (
                    <Image
                      src={service.images[0]}
                      alt={service.title}
                      width={56}
                      height={56}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <span className="text-2xl">🔧</span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 text-left">
                  <h3 className="text-[16px] sm:text-[17px] font-poppins font-bold text-gray-900 mb-1">
                    {translatedServices[services.findIndex(s => s.id === service.id)] || service.title}
                  </h3>
                  <p className="text-[13px] sm:text-[14px] font-poppins text-gray-600 mb-1 line-clamp-2">
                    {translatedServices[services.length + services.findIndex(s => s.id === service.id)] || service.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] sm:text-[14px] font-poppins font-semibold text-brand-orange bg-[#FF66001A] px-3 py-1 rounded-full w-fit">
                      {t("pricePerHour", { price: service.price_per_hour })}
                    </p>
                    {service.artisan && (
                      <p className="text-[12px] font-poppins text-gray-500">
                        {t("byArtisan", { name: service.artisan.fullName })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Chevron */}
                <ChevronRight
                  size={20}
                  className="text-gray-400 group-hover:text-brand-orange transition-colors shrink-0"
                />
              </button>
            ))
          ) : (
            <div className="py-8 text-center">
              <p className="text-[15px] font-poppins text-gray-500 mb-2">
                {t("noServices")}
              </p>
              <p className="text-[13px] font-poppins text-gray-400">
                {t("checkBack")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;
