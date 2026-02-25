"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { X, MessageCircle, AlertCircle, Pause } from "lucide-react";
import PhotoUploader, { Photo } from "@/components/shared/PhotoUploader";
import Button from "@/components/ui/button";
import RateCustomerModal from "@/components/shared/RateCustomerModal";

type JobStatus = "not-started" | "in-transit" | "in-progress" | "completed";

const ActiveJobPage = () => {
  const router = useRouter();
  const params = useParams();
  const jobId = params.jobId as string;

  const [currentStatus, setCurrentStatus] = useState<JobStatus>("not-started");
  const [showReportIssue, setShowReportIssue] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [timer, setTimer] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isPaused, setIsPaused] = useState(false);
  const [ongoingNotes, setOngoingNotes] = useState("");
  const [completionNotes, setCompletionNotes] = useState("");
  const [proofPhotos, setProofPhotos] = useState<Photo[]>([]);
  const [estimatedHours] = useState(2); // Default 2 hours

  // Mock data - replace with actual data from store/API
  const jobData = {
    title: "House Cleaning",
    customer: {
      name: "Edith R.",
      rating: 4.9,
      avatar: "/images/pro.jpg",
    },
    location: {
      address: "This is a long address to show next line address Wrapping",
      mapImage: "/images/map.png",
    },
  };

  const statusSteps = [
    { key: "not-started", label: "Not started", step: 1 },
    { key: "in-transit", label: "In Transit", step: 2 },
    { key: "in-progress", label: "In Progress", step: 3 },
    { key: "completed", label: "Completed", step: 4 },
  ];

  const getCurrentStepIndex = () => {
    return statusSteps.findIndex((s) => s.key === currentStatus);
  };

  const handleSetInTransit = () => {
    setCurrentStatus("in-transit");
    // TODO: Update status in backend
    console.log("Status updated to in-transit");
  };

  const handleStartJob = () => {
    setCurrentStatus("in-progress");
    setIsPaused(false);
    // TODO: Update status in backend
    console.log("Status updated to in-progress");
  };

  const handleCompleteJob = () => {
    if (proofPhotos.length === 0) {
      toast.error("Please upload at least one photo as proof of work");
      return;
    }
    // Show rating modal instead of navigating away
    setShowRatingModal(true);
  };

  const handleRatingSubmit = (
    rating: number,
    tags: string[],
    feedback: string,
  ) => {
    // TODO: Submit completion data to backend
    console.log("Job completed with rating:", rating);
    console.log("Tags:", tags);
    console.log("Feedback:", feedback);
    console.log("Completion notes:", completionNotes);
    console.log("Proof photos:", proofPhotos);

    // Navigate to success page or back to dashboard
    router.push("/tasker/dashboard");
  };

  const handlePauseTask = () => {
    setIsPaused(!isPaused);
  };

  // Check if working overtime
  const isOvertime = () => {
    const totalMinutes = timer.hours * 60 + timer.minutes;
    const estimatedMinutes = estimatedHours * 60;
    return totalMinutes > estimatedMinutes;
  };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (currentStatus === "in-progress" && !isPaused) {
      interval = setInterval(() => {
        setTimer((prev) => {
          let { hours, minutes, seconds } = prev;
          seconds++;

          if (seconds === 60) {
            seconds = 0;
            minutes++;
          }

          if (minutes === 60) {
            minutes = 0;
            hours++;
          }

          return { hours, minutes, seconds };
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentStatus, isPaused]);

  const handleMessageCustomer = () => {
    router.push("/tasker/chat");
  };

  const openMap = () => {
    // TODO: Open map in external app or full screen
    console.log("Opening map");
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-[24px] font-bold font-gerat text-gray-900">
              {jobData.title}
            </h1>
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={24} className="text-gray-600" />
            </button>
          </div>

          {/* Status Steps */}
          <div className="flex items-center gap-2">
            {statusSteps.map((status, index) => {
              const isActive = index === getCurrentStepIndex();
              const isPast = index < getCurrentStepIndex();

              return (
                <button
                  key={status.key}
                  className={`flex items-center justify-center gap-1 px-4 py-3 rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-brand-blue text-white"
                      : isPast
                        ? "bg-brand-orange text-white py-3.5"
                        : "bg-gray-200 text-gray-500 py-2.5"
                  }`}
                >
                  {isPast && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="white"
                      stroke="none"
                    >
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  )}
                  {isActive ? status.label : isPast ? "" : status.step}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Timer - Show when in progress or completed */}
        {(currentStatus === "in-progress" || currentStatus === "completed") && (
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="bg-gray-100 rounded-2xl p-4 text-center min-w-25">
              <div
                className={`text-4xl font-bold ${isOvertime() && currentStatus === "in-progress" ? "text-red-600" : "text-gray-900"}`}
              >
                {String(timer.hours).padStart(2, "0")}
              </div>
              <div className="text-sm text-gray-600 mt-1">Hours</div>
            </div>
            <div className="bg-gray-100 rounded-2xl p-4 text-center min-w-25">
              <div
                className={`text-4xl font-bold ${isOvertime() && currentStatus === "in-progress" ? "text-red-600" : "text-gray-900"}`}
              >
                {String(timer.minutes).padStart(2, "0")}
              </div>
              <div className="text-sm text-gray-600 mt-1">Minutes</div>
            </div>
            <div className="bg-gray-100 rounded-2xl p-4 text-center min-w-25">
              <div
                className={`text-4xl font-bold ${isOvertime() && currentStatus === "in-progress" ? "text-red-600" : "text-gray-900"}`}
              >
                {String(timer.seconds).padStart(2, "0")}
              </div>
              <div className="text-sm text-gray-600 mt-1">Seconds</div>
            </div>
          </div>
        )}

        {/* Total Earned - Only show when completed */}
        {currentStatus === "completed" && (
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600 mb-1">Total Earned</p>
            <p className="text-3xl font-bold text-green-600">+$840.00</p>
          </div>
        )}

        {/* Customer Card - Hide when completed */}
        {currentStatus !== "completed" && (
          <div className="bg-[#F6F6F6] border border-[#0000001A] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-200">
                  <Image
                    src={jobData.customer.avatar}
                    alt={jobData.customer.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-gray-900">
                    {jobData.customer.name}
                  </h3>
                  <div className="flex items-center gap-1">
                    <span className="text-[14px] font-semibold text-gray-900">
                      {jobData.customer.rating}
                    </span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="#000000"
                      stroke="none"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                </div>
              </div>
              <button
                onClick={handleMessageCustomer}
                className="w-12 h-12 bg-[#FFE5D9] rounded-full flex items-center justify-center hover:bg-[#FFD5C2] transition-colors"
              >
                <MessageCircle size={20} className="text-brand-orange" />
              </button>
            </div>
          </div>
        )}

        {/* Overtime Warning - Show when in progress and overtime */}
        {currentStatus === "in-progress" && isOvertime() && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#DC2626"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-[14px] text-red-600 font-medium">
              You are working overtime
            </p>
          </div>
        )}

        {/* Ongoing Notes - Only show when in progress */}
        {currentStatus === "in-progress" && (
          <div className="p-4 ">
            <h3 className="text-[16px] font-bold text-gray-900 mb-3">
              Ongoing Notes
            </h3>
            <textarea
              value={ongoingNotes}
              onChange={(e) => setOngoingNotes(e.target.value)}
              placeholder="Add Progress notes, missing parts, or observations..."
              className="w-full h-32 p-3 bg-[#F6F6F6] border border-[#0000001A] rounded-xl text-[14px] resize-none focus:outline-none focus:border-brand-orange"
            />
          </div>
        )}

        {/* Upload Proof of Work - Only show when completed */}
        {currentStatus === "completed" && (
          <div className=" p-4">
            <h3 className="text-[16px] font-bold text-gray-900 mb-3 text-center">
              Upload proof of work
            </h3>

            <PhotoUploader
              photos={proofPhotos}
              onChange={setProofPhotos}
              title=""
            />

            <p className="text-xs text-gray-500 text-center pt-3">
              At least 1 photo is required to complete the task
            </p>
          </div>
        )}

        {/* Completion Notes - Only show when completed */}
        {currentStatus === "completed" && (
          <div className=" p-4 ">
            <h3 className="text-[16px] font-bold text-gray-900 mb-3 text-center">
              Completion Notes
            </h3>
            <textarea
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              placeholder="Add Progress notes, missing parts, or observations..."
              className="w-full h-32 p-3 bg-[#F6F6F6] border border-[#0000001A] rounded-xl text-[14px] resize-none focus:outline-none focus:border-brand-orange"
            />
          </div>
        )}

        {/* Job Location - Only show when not in progress and not completed */}
        {currentStatus !== "in-progress" && currentStatus !== "completed" && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-[16px] font-bold text-gray-900">
                Job Location
              </h3>
              <p className="text-[14px] text-gray-600 text-right max-w-50">
                {jobData.location.address}
              </p>
            </div>

            {/* Map */}
            <div className="relative rounded-xl overflow-hidden">
              <Image
                src={jobData.location.mapImage}
                alt="Job location map"
                width={600}
                height={300}
                className="w-full h-48 object-cover"
              />
              <button
                onClick={openMap}
                className="absolute bottom-3 left-3 bg-brand-orange text-white px-4 py-2 rounded-full text-[13px] font-medium shadow-lg hover:opacity-90 transition-opacity"
              >
                Tap to open in maps
              </button>
            </div>
          </div>
        )}

        {/* Warning Message */}
        {(currentStatus === "not-started" ||
          currentStatus === "in-transit") && (
          <div className="bg-[#FFF4E6] border border-[#FFB84D] rounded-xl p-4 flex items-start gap-3">
            <AlertCircle
              size={20}
              className="text-brand-orange shrink-0 mt-0.5"
            />
            <p className="text-[13px] text-brand-orange leading-relaxed">
              Kindly let your client know you are in transit before your kraft
              officially starts.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          {currentStatus === "not-started" && (
            <Button onClick={handleSetInTransit} variant="primary" fullWidth>
              Set Status to in Transit
            </Button>
          )}

          {currentStatus === "in-transit" && (
            <Button onClick={handleStartJob} variant="primary" fullWidth>
              Start Kraft
            </Button>
          )}

          {currentStatus === "in-progress" && (
            <>
              <button
                onClick={handlePauseTask}
                className="w-full py-4 bg-[#FF66001A] border border-[#FF66001A] text-brand-orange text-[16px] font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-sm flex items-center justify-center gap-2"
              >
                <Pause size={20} />
                {isPaused ? "Resume Task" : "Pause Task"}
              </button>
              <Button
                onClick={() => setCurrentStatus("completed")}
                variant="primary"
                fullWidth
              >
                Mark Kraft as Completed
              </Button>
            </>
          )}

          {currentStatus === "completed" && (
            <Button onClick={handleCompleteJob} variant="primary" fullWidth>
              Mark Kraft as Completed
            </Button>
          )}

          <Button
            onClick={() => setShowReportIssue(true)}
            variant="secondary"
            fullWidth
          >
            Report Issue
          </Button>
        </div>
      </div>

      {/* Report Issue Modal */}
      {showReportIssue && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={() => setShowReportIssue(false)}
        >
          <div
            className="bg-white rounded-t-3xl w-full max-w-md mx-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[20px] font-bold">Report Issue</h2>
              <button
                onClick={() => setShowReportIssue(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={22} className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[14px] font-semibold text-gray-700 mb-2 block">
                  Issue Type
                </label>
                <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:border-brand-orange">
                  <option>Customer not available</option>
                  <option>Wrong address</option>
                  <option>Safety concern</option>
                  <option>Equipment issue</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="text-[14px] font-semibold text-gray-700 mb-2 block">
                  Description
                </label>
                <textarea
                  placeholder="Describe the issue..."
                  className="w-full h-32 p-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] resize-none focus:outline-none focus:border-brand-orange"
                />
              </div>

              <button
                onClick={() => {
                  // TODO: Submit issue report
                  setShowReportIssue(false);
                  toast.success("Issue reported successfully");
                }}
                className="w-full py-3 bg-brand-orange text-white text-[16px] font-semibold rounded-xl hover:opacity-90 transition-opacity"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rate Customer Modal */}
      <RateCustomerModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        customerName={jobData.customer.name}
        customerAvatar={jobData.customer.avatar}
        onSubmit={handleRatingSubmit}
      />
    </div>
  );
};

export default ActiveJobPage;
