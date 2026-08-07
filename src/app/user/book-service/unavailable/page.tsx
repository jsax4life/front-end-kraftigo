"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Button from "@/components/ui/button";
import Loader from "@/components/ui/loader";

function UnavailableContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryName = searchParams.get("category")?.trim() || "This service";

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-lg mx-auto w-full flex-1 flex flex-col">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-8 p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors w-fit"
          aria-label="Go back"
        >
          <ArrowLeft size={24} className="text-gray-900" />
        </button>

        <div className="flex-1 flex flex-col items-center justify-center text-center pb-16">
          <div className="w-20 h-20 rounded-full bg-[#FFF5EE] flex items-center justify-center mb-6">
            <span className="text-3xl" aria-hidden>
              🚧
            </span>
          </div>
          <h1 className="text-[24px] sm:text-[28px] font-gerat font-bold text-gray-900 mb-3">
            Not available at the moment
          </h1>
          <p className="text-[15px] font-poppins text-gray-600 leading-relaxed max-w-sm mb-8">
            <span className="font-semibold text-gray-900">{categoryName}</span> is not part of
            our beta launch yet. We&apos;re starting with cleaning, moving help, and furniture
            assembly — more categories are coming soon.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
            <Button variant="primary" fullWidth onClick={() => router.push("/")}>
              Browse available services
            </Button>
            <Button variant="secondary" fullWidth onClick={() => router.push("/user/categories")}>
              View categories
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function BookServiceUnavailablePage() {
  return (
    <Suspense fallback={<Loader />}>
      <UnavailableContent />
    </Suspense>
  );
}
