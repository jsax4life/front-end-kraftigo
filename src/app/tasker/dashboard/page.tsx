"use client";

import Image from "next/image";
import TaskerNav from "@/components/shared/taskerNav";
import About from "@/components/shared/about";
import Card from "@/components/ui/card";
import { MapPin, Dot } from "lucide-react";
import Button from "@/components/ui/button";
import Notify from "@/components/ui/notify";
import { useBookingsStore } from "@/store/useBookingsStore";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { DashboardOverviewSkeleton, ScheduleSkeleton, NotificationSkeleton } from "@/components/shared/Skeletons";
import { PendingApprovalBanner, ProfileCompletionWidget } from "@/components/shared/DashboardWidgets";
import FinishProfileModal from "@/components/shared/FinishProfileModal";
import { useState } from "react";
import { useProfileStore } from "@/store/useProfileStore";

const Page = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { artisanProfile, fetchArtisanProfile } = useProfileStore();
  const { bookings, isLoading, fetchArtisanBookings } = useBookingsStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchArtisanBookings();
    if (!artisanProfile) {
      fetchArtisanProfile();
    }
  }, [fetchArtisanBookings, fetchArtisanProfile, artisanProfile]);

  const upcomingTasks = bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'ACCEPTED' || b.status === 'IN_PROGRESS' || b.status === 'REQUESTED');
  const nextTask = upcomingTasks[0]; // Get the most recent one

  // Determination logic for profile status
  const isPendingApproval = user?.status === 'PENDING_VERIFICATION' && artisanProfile?.legalFullName; 
  const isProfileIncomplete = user?.status !== 'ACTIVE' || !artisanProfile?.legalFullName || !artisanProfile?.primaryTrade;
  
  const completedStepIds = ["verify"];
  if (artisanProfile?.legalFullName) completedStepIds.push("identity");
  if (artisanProfile?.primaryTrade) completedStepIds.push("skills");
  if (artisanProfile?.profilePhotoUrl) completedStepIds.push("personal");
  // Assume eligibility and payout are pending if not fully active
  if (user?.status === 'ACTIVE') {
    completedStepIds.push("eligibility", "payout");
  }

  const completedSteps = completedStepIds.length;
  const totalSteps = 6;
  const completedPercentage = Math.round((completedSteps / totalSteps) * 100);

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
                <Card img="/star.svg" title="Rating" val="5.0" />
                <Card img="/check.svg" title="Rate" val="100%" />
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
                      Next Task <Dot size={20} /> {nextTask.scheduled_time || 'TBD'}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-[16px] sm:text-[18px] lg:text-[20px] font-gerat">
                    {/* nextTask doesn't have customerName natively yet unless expanded, so mock mapping for UI for now */}
                    {"Customer"}
                  </p>
                  <p className="flex items-center text-[14px] sm:text-[16px] font-poppins text-gray-700">
                    {nextTask.service?.title || "Craft"} <Dot size={20} className="text-gray-400" /> 1.2
                    miles away
                  </p>
                  <span className="flex items-center gap-2 text-[14px] sm:text-[16px] font-poppins text-gray-600">
                    <MapPin size={18} className="shrink-0" />
                    <p>{nextTask.location}</p>
                  </span>
                  <Button
                    variant="primary"
                    fullWidth
                    className="font-qurova flex justify-center items-center gap-2"
                    onClick={() => router.push(`/tasker/schedule?openJob=${nextTask.id}`)}
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
              <div className="bg-gray-50 rounded-2xl p-8 text-center border border-dashed border-gray-200">
                <p className="text-gray-500 font-poppins">
                  No tasks scheduled for today.
                </p>
                <Button
                  variant="primary"
                  className="mt-4"
                  onClick={() => router.push("/tasker/schedule")}
                >
                  View Schedule
                </Button>
              </div>
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
            router.push("/user/profile/artisan-verification");
        }}
        onMaybeLater={() => setIsModalOpen(false)}
        completedPercentage={completedPercentage}
        completedStepIds={completedStepIds}
      />
    </main>
  );
};

export default Page;
