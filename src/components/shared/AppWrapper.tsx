"use client";

import React from "react";

/**
 * AppWrapper enforces a native mobile feel across all devices.
 * - Prevents horizontal scrolling project-wide. 
 * - Centers the application on larger screens to maintain a mobile-first aspect ratio.
 * - Ensures smooth vertical scrolling and "native" touch behaviors.
 */
interface AppWrapperProps {
  children: React.ReactNode;
}

export const AppWrapper = ({ children }: AppWrapperProps) => {
  return (
    <div className="min-h-screen bg-gray-50 flex justify-center selection:bg-brand-orange selection:text-white">
      <div 
        className="w-full min-h-screen bg-white relative flex flex-col shadow-2xl md:max-w-[480px] overflow-x-hidden border-x border-gray-100"
        id="app-root-container"
      >
        {children}
      </div>
    </div>
  );
};

export default AppWrapper;
