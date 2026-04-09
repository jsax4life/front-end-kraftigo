"use client";

import Image from "next/image";
import TaskerNav from "@/components/shared/taskerNav";
import About from "@/components/shared/about";
import Card from "@/components/ui/card";
import { MapPin, Dot } from "lucide-react";
import Button from "@/components/ui/button";
import Notify from "@/components/ui/notify";
import { useBookingsStore } from "@/store/useBookingsStore";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import {
  DashboardOverviewSkeleton,
  ScheduleSkeleton,
  NotificationSkeleton,
} from "@/components/shared/Skeletons";
import {
  PendingApprovalBanner,
  ProfileCompletionWidget,
} from "@/components/shared/DashboardWidgets";
import FinishProfileModal from "@/components/shared/FinishProfileModal";
import { useProfileStore } from "@/store/useProfileStore";
import { startDiditKycSession, getVerificationMyStatus, hasOpenDiditKycSession } from "@/lib/api/verification";

const DashboardContent = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    artisanProfile,
    fetchArtisanProfile,
    profileCompletionSummary,
    fetchKrafterProfileCompletionSummary,
  } = useProfileStore();
  const { bookings, isLoading, fetchArtisanBookings } = useBookingsStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStartingKyc, setIsStartingKyc] = useState(false);
  const searchParams = useSearchParams();

  // Auto-open modal when returning from a completion page
  useEffect(() => {
    if (searchParams.get("modal") === "open") {
      setIsModalOpen(true);
      // Remove the param from the URL without triggering a navigation
      const url = new URL(window.location.href);
      url.searchParams.delete("modal");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  useEffect(() => {
    fetchArtisanBookings();
    if (!artisanProfile) {
      fetchArtisanProfile();
    }
    // Fetch checklist summary silently on mount
    fetchKrafterProfileCompletionSummary();
  }, [fetchArtisanBookings, fetchArtisanProfile, artisanProfile, fetchKrafterProfileCompletionSummary]);

  const upcomingTasks = bookings.filter(
    (b) =>
      b.status === "CONFIRMED" ||
      b.status === "ACCEPTED" ||
      b.status === "IN_PROGRESS" ||
      b.status === "REQUESTED",
  );
  const nextTask = upcomingTasks[0]; // Get the most recent one

  // Determination logic for profile status
  const isPendingApproval =
    profileCompletionSummary?.workEligibility?.hasSubmittedAwaitingReview;
  const isProfileIncomplete =
    profileCompletionSummary ? !profileCompletionSummary.allComplete : true;

  // Dynamically build completed steps from the backend summary payload
  const completedStepIds: string[] = [];
  const pendingStepIds: string[] = [];
  
  if (profileCompletionSummary?.initialOnboarding?.isComplete) completedStepIds.push("register");
  if (profileCompletionSummary?.personalDetails?.isComplete) completedStepIds.push("personal");
  if (profileCompletionSummary?.skills?.isComplete) completedStepIds.push("skills");
  
  if (profileCompletionSummary?.workEligibility?.hasSubmittedAwaitingReview) {
    pendingStepIds.push("eligibility");
  } else if (profileCompletionSummary?.workEligibility?.isComplete) {
    completedStepIds.push("eligibility");
  }
  
  if (profileCompletionSummary?.legalIdentity?.kycStatus === "APPROVED") completedStepIds.push("identity");
  if (profileCompletionSummary?.payout?.isComplete) completedStepIds.push("payout");

  // Fallback visual logic until the API handles everything for all users smoothly
  // e.g., if we still want to force register to be checked on this dashboard:
  if (!completedStepIds.includes("register")) completedStepIds.push("register");

  const completedSteps = completedStepIds.length;
  const totalSteps = 6;
  const completedPercentage = Math.round((completedSteps / totalSteps) * 100);

  const handleStepClick = async (stepId: string) => {
    // Don't navigate if step is already done
    if (completedStepIds.includes(stepId)) return;

    // Legal identity goes straight to Didit — no intermediate page needed
    if (stepId === "identity") {
      setIsStartingKyc(true);
      try {
        // Check current KYC status first
        const status = await getVerificationMyStatus();
        const kycStatus = status?.kycStatus;

        // Already approved — nothing to do
        if (kycStatus === "APPROVED") {
          const { toast } = await import("react-hot-toast");
          toast.success("Your identity is already verified!");
          setIsStartingKyc(false);
          return;
        }

        // PENDING = there's already an open session — call start again to resume it
        const isResuming = hasOpenDiditKycSession(status);
        const { verificationUrl } = await startDiditKycSession();

        const { toast } = await import("react-hot-toast");
        toast.success(isResuming ? "Resuming your verification session..." : "Starting identity verification...");

        window.location.href = verificationUrl;
      } catch (err: any) {
        const { toast } = await import("react-hot-toast");
        toast.error(err?.response?.data?.message || "Failed to start identity verification. Please try again.");
      } finally {
        setIsStartingKyc(false);
      }
      return;
    }

    setIsModalOpen(false);

    const routeMap: Record<string, string> = {
      register: "/tasker/switch-acct",
      personal: "/tasker/profile/complete",
      skills: "/tasker/profile/complete?step=5",
      eligibility: "/tasker/dashboard/work-eligible",
      payout: "/tasker/dashboard/paymentMethod",
    };

    const route = routeMap[stepId];
    if (route) router.push(route);
  };

  return (
    <main className="relative w-full min-h-screen bg-white pb-24">
      {/* Banner at the very top if pending */}
      {isPendingApproval && <PendingApprovalBanner />}

      {/* Page Content */}
      <div className="bg-[#F6F6F6] pb-6">
        <div className="flex justify-center mb-4 relative z-20 pt-6">
          <Image
            src="/taskerLogo.svg"
            alt="kraftigö logo"
            width={173}
            height={58}
            className="w-32 sm:w-40 h-auto object-contain"
          />
        </div>
        <div className="mb-6">
          <About />
        </div>
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-4">
            <p className="font-[850] text-[18px] sm:text-[20px] lg:text-[24px] font-gerat">
              Overview
            </p>
            {isLoading ? (
              <DashboardOverviewSkeleton />
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
                <Card
                  img="/meun.svg"
                  title="Tasks"
                  val={bookings.length.toString()}
                />
                <Card img="/star.svg" title="Rating" val="0.0" />
                <Card img="/check.svg" title="Rate" val="0%" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 pt-8 pb-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Completion Widget */}
          {isProfileIncomplete && (
            <ProfileCompletionWidget
              totalSteps={totalSteps}
              completedSteps={completedSteps}
              onClick={() => setIsModalOpen(true)}
            />
          )}

          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <p className="font-[850] text-[18px] sm:text-[20px] lg:text-[24px] font-gerat">
                Todays Schedule
              </p>
              <p
                onClick={() => router.push("/tasker/schedule")}
                className="text-brand-orange font-poppins text-[14px] sm:text-[16px] cursor-pointer hover:underline"
              >
                View all
              </p>
            </div>

            {isLoading ? (
              <ScheduleSkeleton />
            ) : nextTask ? (
              <>
                <div className="relative mb-4">
                  <Image
                    src="/images/map.png"
                    alt="map"
                    width={600}
                    height={600}
                    className="rounded-xl w-full h-auto object-cover"
                  />
                  <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4">
                    <p className="bg-brand-orange text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-full text-[12px] sm:text-[14px] font-poppins flex items-center gap-1 shadow-lg">
                      Next Task <Dot size={20} />{" "}
                      {nextTask.scheduled_time || "TBD"}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-[16px] sm:text-[18px] lg:text-[20px] font-gerat">
                    {/* nextTask doesn't have customerName natively yet unless expanded, so mock mapping for UI for now */}
                    {"Customer"}
                  </p>
                  <p className="flex items-center text-[14px] sm:text-[16px] font-poppins text-gray-700">
                    {nextTask.service?.title || "Craft"}{" "}
                    <Dot size={20} className="text-gray-400" /> 1.2 miles away
                  </p>
                  <span className="flex items-center gap-2 text-[14px] sm:text-[16px] font-poppins text-gray-600">
                    <MapPin size={18} className="shrink-0" />
                    <p>{nextTask.location}</p>
                  </span>
                  <Button
                    variant="primary"
                    fullWidth
                    className="font-mabry flex justify-center items-center gap-2"
                    onClick={() =>
                      router.push(`/tasker/schedule?openJob=${nextTask.id}`)
                    }
                  >
                    <Image
                      src="/up.svg"
                      alt="upIcon"
                      width={100}
                      height={100}
                      className="w-4.5 h-4.5"
                    />
                    <p className="mt-1.5">Start Navigation</p>
                  </Button>
                </div>
              </>
            ) : (
              <Image
                src="/noschd.svg"
                alt="noschedule"
                width={350}
                height={350}
                className="mx-auto"
              />
            )}
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 pt-7 pb-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <p className="font-[850] text-[18px] sm:text-[20px] lg:text-[24px] font-gerat">
              Notification
            </p>
            <p className="text-brand-orange font-poppins text-[14px] sm:text-[16px] cursor-pointer hover:underline">
              View all
            </p>
          </div>
          <div className="space-y-3">
            {isLoading ? <NotificationSkeleton /> : <Notify />}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <TaskerNav />

      <FinishProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onComplete={() => {
          setIsModalOpen(false);
          router.push("/tasker/profile/complete");
        }}
        completedPercentage={completedPercentage}
        completedStepIds={completedStepIds}
        pendingStepIds={pendingStepIds}
        onStepClick={handleStepClick}
      />
    </main>
  );
};

const Page = () => {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
};

export default Page;
