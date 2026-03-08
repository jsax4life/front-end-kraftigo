"use client";

import TaskerNav from "@/components/shared/taskerNav";
import Select from "@/components/ui/select";
import JobCard from "@/components/ui/JobCard";
import RequestCard from "@/components/ui/RequestCard";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useJobStore } from "@/store/useJobStore";
import { dummyJobs } from "@/data/dummyJobs";
import { dummyRequests } from "@/data/dummyRequests";
import { X } from "lucide-react";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import Image from "next/image";
import { useBookingsStore } from "@/store/useBookingsStore";
import toast from "react-hot-toast";

const RequestsPage = () => {
  const router = useRouter();
  const { respondToBooking } = useBookingsStore();

  const [activeTab, setActiveTab] = useState<"marketplace" | "requests">("marketplace");
  const [selectedDistance, setSelectedDistance] = useState<string>("all");
  const [selectedPrice, setSelectedPrice] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTime, setSelectedTime] = useState<string>("all");

  // "offer" = sending a new offer from marketplace
  // "counter" = renegotiating an incoming request
  const [modalMode, setModalMode] = useState<"offer" | "counter">("offer");
  const [openNegotaitionModal, setOpenNegotiationModal] = useState<boolean>(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    openToNegotiation: true,
    message: "",
  });

  const { jobs } = useJobStore();
  const marketplaceJobs =
    jobs.length > 0 ? jobs.filter((job) => job.status === "open") : dummyJobs;

  const openModal = (mode: "offer" | "counter", requestId?: string) => {
    setModalMode(mode);
    setSelectedRequestId(requestId ?? null);
    setFormData({ amount: "", openToNegotiation: true, message: "" });
    setOpenNegotiationModal(true);
  };

  const handleSendOffer = (jobId: string) => openModal("offer");

  const handleBookmark = (jobId: string) => {
    console.log("Bookmark job:", jobId);
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await respondToBooking(requestId, { action: "ACCEPT" });
      toast.success("Booking accepted!");
    } catch {
      toast.error("Could not accept booking. Try again.");
      // API not connected yet — fall back to old flow
      const request = dummyRequests.find((r) => r.id === requestId);
      if (request) {
        const params = new URLSearchParams({
          requestId: request.id,
          customerName: request.customerName,
          offerAmount: request.offerAmount.toString(),
          description: request.description,
        });
        // router.push(`/tasker/requests/accept-request?${params.toString()}`);
      }
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      await respondToBooking(requestId, { action: "DECLINE" });
      toast.success("Booking declined.");
    } catch {
      toast.error("Could not decline booking. Try again.");
    }
  };

  const handleRenegotiate = (requestId: string) => openModal("counter", requestId);

  const handleSubmitModal = async () => {
    const price = parseFloat(formData.amount);
    if (!price || price <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    if (modalMode === "counter" && selectedRequestId) {
      setIsSubmitting(true);
      try {
        await respondToBooking(selectedRequestId, {
          action: "COUNTER",
          counterPrice: price,
        });
        toast.success("Counter offer sent!");
        setOpenNegotiationModal(false);
      } catch {
        toast.error("Failed to send counter offer. Try again.");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Marketplace offer — TODO: wire to marketplace offer API
      router.push("/tasker/requests/finish");
    }
  };

  return (
    <main className="relative w-full min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <button className="mb-4">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold mb-4">Job Requests</h1>

        {/* Tab Toggle */}
        <div className="flex gap-2 mb-4 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("marketplace")}
            className={`flex-1 py-1 text-sm px-6 rounded-lg font-medium transition-colors ${
              activeTab === "marketplace"
                ? "bg-brand-blue text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            Marketplace
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`flex-1 py-1 text-sm px-6 rounded-lg font-medium transition-colors ${
              activeTab === "requests"
                ? "bg-brand-orange text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            Requests
          </button>
        </div>

        {/* Filters - Only show for Marketplace tab */}
        {activeTab === "marketplace" && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            <div className="min-w-35">
              <Select
                value={selectedDistance}
                onChange={setSelectedDistance}
                options={[
                  { value: "all", label: "Distance" },
                  { value: "5", label: "5 km" },
                  { value: "10", label: "10 km" },
                  { value: "20", label: "20 km" },
                ]}
                placeholder="Distance"
                className="bg-brand-orange text-white"
              />
            </div>

            <div className="min-w-35">
              <Select
                value={selectedPrice}
                onChange={setSelectedPrice}
                options={[
                  { value: "all", label: "Price" },
                  { value: "0-100", label: "$0 - $100" },
                  { value: "100-200", label: "$100 - $200" },
                  { value: "200+", label: "$200+" },
                ]}
                placeholder="Price"
              />
            </div>

            <div className="min-w-35">
              <Select
                value={selectedCategory}
                onChange={setSelectedCategory}
                options={[
                  { value: "all", label: "Category" },
                  { value: "cleaning", label: "Cleaning" },
                  { value: "plumbing", label: "Plumbing" },
                  { value: "electrical", label: "Electrical" },
                ]}
                placeholder="Category"
              />
            </div>

            <div className="min-w-35">
              <Select
                value={selectedTime}
                onChange={setSelectedTime}
                options={[
                  { value: "all", label: "Time" },
                  { value: "today", label: "Today" },
                  { value: "week", label: "This Week" },
                  { value: "month", label: "This Month" },
                ]}
                placeholder="Time"
              />
            </div>
          </div>
        )}
      </div>

      {/* Content - Marketplace Jobs */}
      {activeTab === "marketplace" && (
        <div className="px-4 space-y-4 mt-4">
          {marketplaceJobs.map((job) => (
            <JobCard
              key={job.id}
              id={job.id}
              title={job.job_title}
              location={job.location}
              bidsCount={12}
              description={job.description}
              category={job.category}
              priceRange={{
                min: job.budget_optional ? job.budget_optional - 50 : 150,
                max: job.budget_optional || 200,
              }}
              image="/images/home1.jpg"
              onSendOffer={handleSendOffer}
              onBookmark={handleBookmark}
            />
          ))}
        </div>
      )}

      {/* Content - Requests */}
      {activeTab === "requests" && (
        <div className="px-4 space-y-4 mt-4">
          {dummyRequests.map((request) => (
            <RequestCard
              key={request.id}
              id={request.id}
              customerName={request.customerName}
              customerAvatar={request.customerAvatar}
              rating={request.rating}
              reviewsCount={request.reviewsCount}
              offerAmount={request.offerAmount}
              description={request.description}
              showRenegotiate={request.showRenegotiate}
              onAccept={handleAcceptRequest}
              onDecline={handleDeclineRequest}
              onRenegotiate={handleRenegotiate}
            />
          ))}
        </div>
      )}

      {openNegotaitionModal && (
        <div
          className="fixed inset-0 bg-black/50 z-60 flex items-end"
          onClick={() => setOpenNegotiationModal(false)}
        >
          <div
            className="bg-white rounded-t-3xl w-full sm:max-w-md mx-auto max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-50">
              <h2 className="text-[20px] font-gerat font-bold">
                {modalMode === "counter" ? "Renegotiate Price" : "Send Your Offer"}
              </h2>
              <button
                onClick={() => setOpenNegotiationModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={22} className="text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <Input
                  placeholder="€ 0.00"
                  label={modalMode === "counter" ? "Your counter price" : "Offer amount"}
                  value={formData.amount}
                  onChange={(value) => setFormData({ ...formData, amount: value })}
                  type="number"
                />
              </div>

              {/* Open to Negotiation Toggle */}
              <div className="flex items-center justify-between pb-3">
                <div className="flex items-center gap-1 px-1">
                  <Image src="/neg.svg" alt="icon" width={18} height={18} />
                  <span className="text-[14px] sm:text-[15px] font-poppins font-semibold text-gray-800">
                    Open to negotiation
                  </span>
                </div>
                <button
                  onClick={() =>
                    setFormData({
                      ...formData,
                      openToNegotiation: !formData.openToNegotiation,
                    })
                  }
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    formData.openToNegotiation
                      ? "bg-brand-orange"
                      : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      formData.openToNegotiation
                        ? "translate-x-6"
                        : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div>
                <Input
                  placeholder="E.g i can be there in not t ime"
                  label="Add a message"
                  value={formData.message}
                  onChange={(value) =>
                    setFormData({ ...formData, message: value })
                  }
                  type="text"
                />
              </div>
              <div className="bg-[#FF66001A] border border-[#FF6600] text-[#FF6600] text-sm flex items-start gap-2 p-2 rounded-lg">
                <Image
                  src="/warn.svg"
                  alt="icon"
                  width={25}
                  height={25}
                  className="text-brand-orange"
                />
                <p>
                  Once submitted, the customer will be notified and can message
                  you directly or accept your offer
                </p>
              </div>

              <div className="pt-4">
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleSubmitModal}
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Sending..."
                    : modalMode === "counter"
                    ? "Send Counter Offer"
                    : "Submit Offer"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <TaskerNav />
    </main>
  );
};

export default RequestsPage;
