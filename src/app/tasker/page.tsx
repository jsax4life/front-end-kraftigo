"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Button from "@/components/ui/button";
import TaskerLoad from "@/components/shared/taskerLoad";
import { useAuthStore } from "@/store/useAuthStore";

const Page = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const isLoading = false;

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/tasker/dashboard");
    }
  }, [isAuthenticated, router]);

  return (
    <main className="relative w-full min-h-screen bg-white flex items-center justify-center">
      {isLoading ? (
        <TaskerLoad />
      ) : (
        <div className="relative w-full max-w-md lg:max-w-4xl mx-auto min-h-screen flex flex-col py-8 px-6">
          {/* Logo */}
          <div className="flex justify-center mb-8 relative z-20 mt-10">
            <Image
              src="/taskerLogo.svg"
              alt="kraftigö logo"
              width={173}
              height={58}
              className="w-32 sm:w-40 h-auto object-contain"
            />
          </div>

          {/* Main Content - Images Section */}
          <div className="flex-1 flex items-center justify-center relative mb-8">
            {/* Container for main image and circular profiles */}
            <div className="relative w-full max-w-sm">
              <div className="relative z-10 rounded-tl-full rounded-tr-full overflow-hidden shadow-lg mx-7 -mt-20 ">
                <Image
                  src="/images/log5.jpg"
                  alt="Delivery service"
                  width={400}
                  height={500}
                  className="w-100 h-75 object-cover"
                />
              </div>

              {/* Top Left */}
              <div className="absolute -top-34 right-4 w-17 h-17 rounded-full overflow-hidden shadow-lg z-20">
                <Image
                  src="/images/log1.jpg"
                  alt="Profile 1"
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Top Right */}
              <div className="absolute -top-27 left-2 w-15 h-15  rounded-full overflow-hidden shadow-lg z-20">
                <Image
                  src="/images/log2.jpg"
                  alt="Profile 2"
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Middle Left */}
              <div className="absolute -top-25 left-1/2 w-8 h-8  rounded-full overflow-hidden shadow-lg z-0">
                <Image
                  src="/images/log3.jpg"
                  alt="Profile 3"
                  width={56}
                  height={56}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Bottom Right */}
              <div className="absolute top-0 right-6 w-12 h-12  rounded-full overflow-hidden  shadow-lg z-20">
                <Image
                  src="/images/log4.jpg"
                  alt="Profile 4"
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Bottom Left (small) */}
              <div className="absolute top-6 -left-9 w-9 h-9  rounded-full overflow-hidden shadow-lg z-20">
                <Image
                  src="/images/log6.jpg"
                  alt="Profile 5"
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Buttons Section */}
          <div className="space-y-3 relative z-10 w-full max-w-md mx-auto -mt-30">
            <Button
              className="cursor-pointer hover:scale-105"
              variant="secondary"
              onClick={() => router.push("/krafter/verification")}
              fullWidth
            >
              Create account
            </Button>

            <Button
              className="cursor-pointer hover:scale-105"
              variant="primary"
              onClick={() => router.push("/tasker/login")}
              fullWidth
            >
              Sign in
            </Button>
          </div>
        </div>
      )}
    </main>
  );
};

export default Page;
