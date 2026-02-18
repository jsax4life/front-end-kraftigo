"use client";

import { useState } from "react";
import { X, Star, CheckCircle, Search, Filter } from "lucide-react";
import Image from "next/image";
import Button from "@/components/ui/button";
import CompareModal from "./CompareModal";
import { Application } from "@/types";

interface OffersModalProps {
  job: any;
  onClose: () => void;
}

const OffersModal = ({ job, onClose }: OffersModalProps) => {
  const [selectedForCompare, setSelectedForCompare] = useState<Application[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  // Mock data for applications
  const applications: Application[] = [
    {
      id: "app-1",
      job_id: job.id,
      artisan_id: "art-1",
      artisan_name: "Sarah M.",
      image: "/images/pro.jpg",
      rating: 4.9,
      reviews_count: 124,
      tasks_count: 156,
      price: "$45.00/hr",
      status: "pending",
      proposal_message: "Hi! I have over 5 years of experience in garden maintenance and landscaping. I can handle the debris cleanup efficiently.",
      description: "Hi! I have over 5 years of experience in garden maintenance and landscaping. I can handle the debris cleanup efficiently.",
      is_top_pro: true,
    },
    {
      id: "app-2",
      job_id: job.id,
      artisan_id: "art-2",
      artisan_name: "James L.",
      image: "/images/pro2.jpg",
      rating: 4.7,
      reviews_count: 85,
      tasks_count: 92,
      price: "$38.50/hr",
      status: "pending",
      proposal_message: "I am available this weekend for your garden cleanup. I have all the necessary tools and can start immediately.",
      description: "I am available this weekend for your garden cleanup. I have all the necessary tools and can start immediately.",
    },
    {
        id: "app-3",
        job_id: job.id,
        artisan_id: "art-3",
        artisan_name: "Michael R.",
        image: "/images/pro3.jpg",
        rating: 4.8,
        reviews_count: 42,
        tasks_count: 56,
        price: "$41.25/hr",
        status: "pending",
        proposal_message: "Experienced gardener with a focus on debris removal and site cleanup. Reliable and thorough work guaranteed.",
        description: "Experienced gardener with a focus on debris removal and site cleanup. Reliable and thorough work guaranteed.",
      },
  ];

  const toggleCompare = (app: Application) => {
    if (selectedForCompare.find((a) => a.id === app.id)) {
      setSelectedForCompare(selectedForCompare.filter((a) => a.id !== app.id));
    } else if (selectedForCompare.length < 2) {
      setSelectedForCompare([...selectedForCompare, app]);
    }
  };

  const handleSelectArtisan = (artisan: Application) => {
    // Navigate to booking confirmation or payment
    console.log("Selected artisan:", artisan);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white">
      {/* Header */}
      <div className="px-4 py-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-1">
              <X size={24} />
            </button>
            <h1 className="text-[20px] font-gerat font-bold">Offers Received ({applications.length})</h1>
          </div>
          {selectedForCompare.length === 2 && (
            <Button 
                variant="primary" 
                onClick={() => setShowCompare(true)}
                className="px-4 py-2"
            >
              Compare
            </Button>
          )}
        </div>

        {/* Search & Filter */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search Krafters"
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[14px] font-poppins focus:outline-none focus:border-brand-orange"
            />
          </div>
          <button className="p-2 border border-gray-100 rounded-xl hover:bg-gray-50">
            <Filter size={18} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Offers List */}
      <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)]">
        {applications.map((app) => (
          <div
            key={app.id}
            className={`border rounded-2xl p-4 transition-all ${
              selectedForCompare.find((a) => a.id === app.id)
                ? "border-brand-orange bg-brand-orange/5"
                : "border-gray-100 bg-white"
            }`}
          >
            <div className="flex gap-4">
              <div className="relative shrink-0">
                <Image
                  src={app.image}
                  alt={app.artisan_name}
                  width={64}
                  height={64}
                  className="rounded-full object-cover w-16 h-16"
                />
                {app.is_top_pro && (
                  <div className="absolute -bottom-1 -right-1 bg-brand-orange text-white p-1 rounded-full border-2 border-white">
                    <CheckCircle size={10} fill="currentColor" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-[16px] font-gerat font-bold">{app.artisan_name}</h3>
                  <button 
                    onClick={() => toggleCompare(app)}
                    className={`text-[12px] font-poppins font-semibold px-3 py-1 rounded-full border transition-all ${
                        selectedForCompare.find((a) => a.id === app.id)
                        ? "bg-brand-orange text-white border-brand-orange"
                        : "text-brand-orange border-brand-orange hover:bg-brand-orange/5"
                    }`}
                  >
                    {selectedForCompare.find((a) => a.id === app.id) ? "Selected" : "Compare"}
                  </button>
                </div>
                <div className="flex items-center gap-1 text-[13px] text-gray-600 font-poppins">
                  <Star size={14} className="text-brand-orange fill-brand-orange" />
                  <span className="font-semibold text-black">{app.rating}</span>
                  <span>({app.reviews_count} reviews)</span>
                  <span className="mx-1">•</span>
                  <span>{app.tasks_count} tasks</span>
                </div>
                <div className="text-[18px] font-gerat font-bold text-brand-orange pt-1">
                  {app.price}
                </div>
              </div>
            </div>
            
            <p className="mt-3 text-[13px] font-poppins text-gray-600 line-clamp-2">
              {app.description}
            </p>

            <div className="mt-4 flex gap-3">
              <Button 
                variant="primary" 
                fullWidth 
                onClick={() => handleSelectArtisan(app)}
                className="py-2.5"
              >
                Hire Now
              </Button>
              <button className="flex-1 bg-gray-50 border border-gray-100 rounded-xl py-2.5 text-[14px] font-poppins font-semibold text-gray-700 hover:bg-gray-100 transition-colors">
                Message
              </button>
            </div>
          </div>
        ))}
      </div>

      {showCompare && (
        <CompareModal
          artisans={selectedForCompare}
          onClose={() => setShowCompare(false)}
          onSelect={handleSelectArtisan}
        />
      )}
    </div>
  );
};

export default OffersModal;
