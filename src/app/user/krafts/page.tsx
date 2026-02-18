"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import UserNav from "@/components/shared/userNav";
import { ArrowLeft, Search, MapPin } from "lucide-react";
import Button from "@/components/ui/button";
import OffersModal from "@/components/shared/OffersModal";

const Page = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"upcoming" | "completed">("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const [showOffers, setShowOffers] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  // Mock data for Kraft Requests
  const kraftRequests = [
    {
      id: "1",
      title: "Garden Cleanup & Debris Cleanup",
      posted_date: "Oct 12",
      offers_count: 2,
    },
  ];

  // Mock data for Upcoming tasks
  const upcomingTasks = [
    {
      id: "task-1",
      title: "House Cleaning with Sarah M.",
      location: "Hauptstraße 123 - 10115, Berlin",
      time: "15th Jan, 2025 (In 15 Minutes)",
      image: "/images/pro.jpg",
      artisan_name: "Sarah M.",
    },
    {
        id: "task-2",
        title: "House Cleaning with Sarah M.",
        location: "Hauptstraße 123 - 10115, Berlin",
        time: "15th Jan, 2025 (In 15 Minutes)",
        image: "/images/pro.jpg",
        artisan_name: "Sarah M.",
      },
      {
        id: "task-3",
        title: "House Cleaning with Sarah M.",
        location: "Hauptstraße 123 - 10115, Berlin",
        time: "15th Jan, 2025 (In 15 Minutes)",
        image: "/images/pro.jpg",
        artisan_name: "Sarah M.",
      },
  ];

  const handleViewOffers = (job: any) => {
    setSelectedJob(job);
    setShowOffers(true);
  };

  return (
    <main className="relative w-full min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.back()} className="p-1">
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1">
            <h1 className="text-[28px] font-gerat font-bold">Krafts</h1>
          </div>
          <Button 
            variant="primary" 
            onClick={() => router.push("/user/home/custom-kraft")}
            className="px-4 py-2 text-[14px]"
          >
            Post a Kraft
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`flex-1 py-2.5 text-[14px] font-poppins font-semibold rounded-lg transition-all ${
              activeTab === "upcoming"
                ? "bg-brand-blue text-white"
                : "text-gray-500"
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`flex-1 py-2.5 text-[14px] font-poppins font-semibold rounded-lg transition-all ${
              activeTab === "completed"
                ? "bg-brand-blue text-white"
                : "text-gray-500"
            }`}
          >
            Completed
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange text-[14px] font-poppins text-black transition-all"
          />
        </div>

        {activeTab === "upcoming" && (
          <div className="space-y-8">
            {/* Kraft Requests Section */}
            <div>
              <h2 className="text-[18px] font-gerat font-bold mb-4 text-black">Kraft Requests</h2>
              {kraftRequests.map((job) => (
                <div
                  key={job.id}
                  className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4 text-black"
                >
                  <h3 className="text-[16px] font-gerat font-bold">{job.title}</h3>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-[13px] text-gray-600 font-poppins">
                      <Image src="/taskerCal.svg" alt="calendar" width={16} height={16} />
                      <span>Posted {job.posted_date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[13px] text-brand-orange font-poppins font-semibold">
                      <MapPin size={16} />
                      <span>{job.offers_count} Offers Received</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="primary"
                      onClick={() => handleViewOffers(job)}
                      className="flex-3"
                    >
                      View Offers
                    </Button>
                    <button className="flex-1 bg-brand-cream border border-gray-100 rounded-xl flex items-center justify-center py-3 text-brand-orange hover:bg-white transition-all">
                       <span className="font-poppins font-bold">Edit</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Monthly Groups */}
            <div>
              <h2 className="text-[18px] font-gerat font-bold mb-4 text-black">January</h2>
              <div className="space-y-4">
                {upcomingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white border border-gray-100 rounded-2xl p-4 flex gap-4 shadow-sm text-black hover:border-gray-200 transition-all cursor-pointer"
                  >
                    <div className="flex-1 space-y-2">
                      <h3 className="text-[14px] font-poppins font-bold">
                        {task.title}
                      </h3>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[12px] text-gray-600 font-poppins">
                          <MapPin size={14} className="text-gray-400" />
                          <span>{task.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[12px] text-gray-600 font-poppins">
                          <Image src="/taskerCal.svg" alt="calendar" width={14} height={14} />
                          <span>{task.time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <Image
                        src={task.image}
                        alt={task.artisan_name}
                        width={80}
                        height={80}
                        className="rounded-xl object-cover w-20 h-20"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Offers Modal */}
      {showOffers && (
        <OffersModal
          job={selectedJob}
          onClose={() => setShowOffers(false)}
        />
      )}

      {/* Bottom Navigation */}
      <UserNav />
    </main>
  );
};

export default Page;
