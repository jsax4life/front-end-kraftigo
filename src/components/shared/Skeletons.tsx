import React from "react";
import Skeleton from "../ui/Skeleton";

export const ProfileInfoSkeleton = () => (
  <div className="flex items-center gap-5 mb-10">
    <Skeleton className="w-20 h-20 rounded-full shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
    <Skeleton className="w-10 h-10 rounded-full" />
  </div>
);

export const CardSkeleton = () => (
  <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#0000000D] space-y-4">
    <Skeleton className="h-4 w-24 mb-6" />
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex items-center justify-between py-4 border-b border-[#F2F4F7] last:border-0">
        <div className="flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="w-5 h-5" />
      </div>
    ))}
  </div>
);

export const UserabtSkeleton = () => (
  <div className="flex items-center justify-between py-2">
    <div className="flex items-center gap-2 flex-1">
      <Skeleton className="w-4 h-4 rounded-full" />
      <Skeleton className="h-4 w-40" />
      <Skeleton className="w-4 h-4 rounded-full" />
    </div>
    <div className="flex items-center gap-3">
      <Skeleton className="w-10 h-10 rounded-full" />
      <Skeleton className="w-10 h-10 rounded-full" />
      <Skeleton className="w-10 h-10 rounded-full" />
    </div>
  </div>
);

export const DashboardOverviewSkeleton = () => (
  <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4 mt-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-white rounded-2xl p-4 flex flex-col items-center space-y-2">
        <Skeleton className="w-8 h-8 rounded-full" />
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-6 w-8" />
      </div>
    ))}
  </div>
);

export const ScheduleSkeleton = () => (
  <div className="space-y-4 mt-4">
    <Skeleton className="w-full aspect-video rounded-xl" />
    <div className="space-y-2">
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  </div>
);

export const NotificationSkeleton = () => (
    <div className="space-y-3">
        {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 flex gap-4">
                <Skeleton className="w-12 h-12 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                </div>
            </div>
        ))}
    </div>
)

export const ProCardSkeleton = () => (
  <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
    <div className="flex gap-4">
      <Skeleton className="w-16 h-16 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
    <div className="flex justify-between items-center pt-2">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-8 w-24 rounded-full" />
    </div>
  </div>
);
