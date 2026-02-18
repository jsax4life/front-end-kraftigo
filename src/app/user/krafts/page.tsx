"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import UserNav from "@/components/shared/userNav";
import { ArrowLeft, Search, MapPin } from "lucide-react";
import OffersModal from "@/components/shared/OffersModal";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ErrorBanner from "@/components/shared/ErrorBanner";
import { useBookingsStore } from "@/store/useBookingsStore";
import type { Booking } from "@/types";

const Page = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"upcoming" | "completed">("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const [showOffers, setShowOffers] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  const { fetchMyBookings, getUpcomingBookings, getCompletedBookings, bookings, isLoading, error, clearError, lastFetchStatus } =
    useBookingsStore();

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const upcomingBookings = getUpcomingBookings();
  const completedBookings = getCompletedBookings();
  const requestedBookings = bookings.filter(b => b.status === "REQUESTED");

  // Filter by search query
  const filterBySearch = (bookings: Booking[]) => {
    if (!searchQuery) return bookings;
    const q = searchQuery.toLowerCase();
    return bookings.filter(
      (b) =>
        b.service?.title?.toLowerCase().includes(q) ||
        b.location?.toLowerCase().includes(q) ||
        b.service?.artisan?.fullName?.toLowerCase().includes(q)
    );
  };

  const filteredUpcoming = filterBySearch(upcomingBookings);
  const filteredCompleted = filterBySearch(completedBookings);
  const filteredRequests = filterBySearch(requestedBookings);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const statusBadge = (status: Booking["status"]) => {
    if (status === "COMPLETED")
      return <span className="text-[11px] font-poppins font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">Completed</span>;
    if (status === "CANCELLED")
      return <span className="text-[11px] font-poppins font-semibold text-red-500 bg-red-50 px-2.5 py-1 rounded-full">You cancelled this Kraft</span>;
    if (status === "DISPUTED")
      return <span className="text-[11px] font-poppins font-semibold text-brand-orange bg-orange-50 px-2.5 py-1 rounded-full">Disputed</span>;
    if (status === "IN_PROGRESS")
      return <span className="text-[11px] font-poppins font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">In Progress</span>;
    if (status === "CONFIRMED")
      return <span className="text-[11px] font-poppins font-semibold text-brand-blue bg-blue-50 px-2.5 py-1 rounded-full">Confirmed</span>;
    return <span className="text-[11px] font-poppins font-semibold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full">{status}</span>;
  };

  // Fallback mock data
  const mockUpcoming = [
    { id: "mock-1", title: "House Cleaning with Sarah M.", location: "Hauptstraße 123 - 10115, Berlin", time: "15th Jan, 2025 (In 15 Minutes)", image: "/images/pro.jpg" },
    { id: "mock-2", title: "House Cleaning with Sarah M.", location: "Hauptstraße 123 - 10115, Berlin", time: "15th Jan, 2025 (In 15 Minutes)", image: "/images/pro.jpg" },
  ];
  const mockCompleted = [
    { id: "c1", title: "House Cleaning with Sarah M.", location: "Hauptstraße 123 - 10115, Berlin", time: "15th Jan, 2025", image: "/images/pro.jpg", status: "COMPLETED" as const },
    { id: "c2", title: "House Cleaning", location: "Hauptstraße 123 - 10115, Berlin", time: "15th Jan, 2025 4:00am", image: "/images/pro.jpg", status: "CANCELLED" as const },
    { id: "c3", title: "House Cleaning", location: "Hauptstraße 123 - 10115, Berlin", time: "15th Jan, 2025 4:00am", image: "/images/pro.jpg", status: "DISPUTED" as const },
  ];
  const mockRequests = [
    { id: "r1", title: "Garden Cleanup & Debris Cleanup", posted_date: "Oct 12", offers_count: 2 },
  ];

  // Logic to determine what list to show
  const showFallback = lastFetchStatus === 'error' || lastFetchStatus === 'empty' || (lastFetchStatus === 'success' && bookings.length === 0);
  
  const upcomingList = showFallback && filteredUpcoming.length === 0 ? mockUpcoming : filteredUpcoming;
  const completedList = showFallback && filteredCompleted.length === 0 ? mockCompleted : filteredCompleted;
  const requestsList = showFallback && filteredRequests.length === 0 ? mockRequests : filteredRequests;

  return (
    <main className="relative w-full min-h-screen bg-white pb-24">
      <div className="px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.back()} className="p-1">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-[28px] font-gerat font-bold">Krafts</h1>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-xl mb-5">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`flex-1 py-2.5 text-[14px] font-poppins font-semibold rounded-lg transition-all ${
              activeTab === "upcoming" ? "bg-brand-blue text-white" : "text-gray-500"
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`flex-1 py-2.5 text-[14px] font-poppins font-semibold rounded-lg transition-all ${
              activeTab === "completed" ? "bg-brand-blue text-white" : "text-gray-500"
            }`}
          >
            Completed
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl focus:outline-none text-[14px] font-poppins text-black"
          />
        </div>

        {/* Error Banner - Non-blocking warning */}
        {error && lastFetchStatus === 'error' && (
          <ErrorBanner 
            message={`Offline Mode: ${error}. Showing cached data.`} 
            onDismiss={clearError} 
            className="mb-4" 
          />
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-10">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {!isLoading && activeTab === "upcoming" && (
          <div className="space-y-6">
            {/* Kraft Requests */}
            {requestsList.length > 0 && (
              <div>
                <h2 className="text-[16px] font-poppins font-bold mb-3 text-black">Kraft Requests</h2>
                {requestsList.map((job: any) => {
                  const isReal = !!job.status;
                  const title = isReal 
                    ? `${job.service?.title ?? "Request"} with ${job.service?.artisan?.fullName ?? "Pro"}`
                    : job.title;
                  const date = isReal ? formatDate(job.created_at) : job.posted_date;
                  
                  return (
                    <div key={job.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm mb-3">
                      <h3 className="text-[15px] font-poppins font-bold text-black mb-2">{title}</h3>
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-1.5 text-[12px] text-gray-500 font-poppins">
                          <Image src="/taskerCal.svg" alt="calendar" width={14} height={14} />
                          <span>Posted {date}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[12px] text-brand-orange font-poppins font-semibold">
                          <MapPin size={14} />
                          <span>{isReal ? "Request Pending" : `${job.offers_count} Offers Received`}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setSelectedJob(job); setShowOffers(true); }}
                          className="flex-1 bg-brand-orange text-white py-3 rounded-xl text-[14px] font-poppins font-semibold hover:bg-orange-600 transition-colors"
                        >
                          View Offers
                        </button>
                        <button className="px-6 bg-[#FFF5F0] border border-gray-100 rounded-xl text-[14px] font-poppins font-bold text-gray-800 hover:bg-orange-50 transition-colors">
                          Edit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Upcoming Bookings */}
            <div>
              <h2 className="text-[16px] font-poppins font-bold mb-3 text-black">January</h2>
              <div className="space-y-3">
                {upcomingList.map((task: any) => {
                  const isReal = !!task.status; // real bookings have status
                  const title = isReal
                    ? `${task.service?.title ?? "Service"} with ${task.service?.artisan?.fullName ?? "Artisan"}`
                    : task.title;
                  const location = isReal ? task.location : task.location;
                  const time = isReal ? formatDate(task.scheduled_date) : task.time;
                  const image = isReal ? (task.service?.artisan?.avatar ?? "/images/pro.jpg") : task.image;

                  return (
                    <div
                      key={task.id}
                      onClick={() =>
                        router.push(
                          `/user/book-service/active-job?status=accepted${isReal ? `&id=${task.id}` : ""}`
                        )
                      }
                      className="bg-white border border-gray-100 rounded-2xl p-4 flex gap-3 shadow-sm cursor-pointer hover:border-brand-orange transition-colors"
                    >
                      <div className="flex-1 space-y-1.5">
                        <h3 className="text-[14px] font-poppins font-bold text-black">{title}</h3>
                        <div className="flex items-center gap-1.5 text-[12px] text-gray-500 font-poppins">
                          <MapPin size={13} className="text-gray-400 shrink-0" />
                          <span>{location}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[12px] text-gray-500 font-poppins">
                          <Image src="/taskerCal.svg" alt="calendar" width={13} height={13} className="shrink-0" />
                          <span>{time}</span>
                        </div>
                        {isReal && <div className="pt-1">{statusBadge(task.status)}</div>}
                      </div>
                      <div className="shrink-0">
                        <Image src={image} alt="artisan" width={80} height={80} className="rounded-xl object-cover w-20 h-20" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {!isLoading && activeTab === "completed" && (
          <div>
            <h2 className="text-[16px] font-poppins font-bold mb-3 text-black">December</h2>
            <div className="space-y-3">
              {completedList.map((task: any) => {
                const isReal = !!task.scheduled_date;
                const title = isReal
                  ? `${task.service?.title ?? "Service"} with ${task.service?.artisan?.fullName ?? "Artisan"}`
                  : task.title;
                const location = isReal ? task.location : task.location;
                const time = isReal ? formatDate(task.scheduled_date) : task.time;
                const image = isReal ? (task.service?.artisan?.avatar ?? "/images/pro.jpg") : task.image;
                const taskStatus = task.status;

                return (
                  <div
                    key={task.id}
                    onClick={() =>
                      taskStatus === "COMPLETED" &&
                      router.push(`/user/book-service/completed-job${isReal ? `?id=${task.id}` : ""}`)
                    }
                    className={`bg-white border border-gray-100 rounded-2xl p-4 flex gap-3 shadow-sm ${
                      taskStatus === "COMPLETED" ? "cursor-pointer hover:border-brand-orange transition-colors" : ""
                    }`}
                  >
                    <div className="flex-1 space-y-1.5">
                      <h3 className="text-[14px] font-poppins font-bold text-black">{title}</h3>
                      <div className="flex items-center gap-1.5 text-[12px] text-gray-500 font-poppins">
                        <MapPin size={13} className="text-gray-400 shrink-0" />
                        <span>{location}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[12px] text-gray-500 font-poppins">
                        <Image src="/taskerCal.svg" alt="calendar" width={13} height={13} className="shrink-0" />
                        <span>{time}</span>
                      </div>
                      <div className="pt-1">{statusBadge(taskStatus)}</div>
                    </div>
                    <div className="shrink-0">
                      <Image src={image} alt="artisan" width={80} height={80} className="rounded-xl object-cover w-20 h-20" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showOffers && (
        <OffersModal job={selectedJob} onClose={() => setShowOffers(false)} />
      )}

      <UserNav />
    </main>
  );
};

export default Page;
