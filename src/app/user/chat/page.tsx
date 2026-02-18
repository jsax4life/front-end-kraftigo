"use client";

import UserNav from "@/components/shared/userNav";

const Page = () => {
  return (
    <main className="relative w-full min-h-screen bg-white pb-24">
      {/* Page Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-[28px] font-gerat font-bold mb-6">Chat</h1>

        {/* Dashboard content goes here */}
        <div className="space-y-4">
          <p className="text-gray-600 font-poppins">
            Welcome to your tasker dashboard!
          </p>
        </div>
      </div>

      {/* Bottom Navigation */}
      <UserNav />
    </main>
  );
};

export default Page;
