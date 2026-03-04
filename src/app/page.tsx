"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

const Page = () => {
  const router = useRouter();
  return (
    <main className="relative w-full min-h-screen overflow-hidden flex items-center justify-center bg-white px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl mx-auto text-center space-y-8 sm:space-y-12">
        {/* Logo */}
        <div className="flex justify-center">
          <Image
            src="./craft.svg"
            alt="logo"
            width={244}
            height={79}
            className="w-48 sm:w-60 lg:w-72 h-auto"
          />
        </div>

        {/* Role Selection Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center max-w-2xl mx-auto">
          <button
            onClick={() => router.push("/tasker")}
            className="w-full sm:w-auto px-12 py-4 bg-brand-blue text-white font-qurova text-lg rounded-xl hover:bg-opacity-90 transition-all"
          >
            I&apos;m a Krafter
          </button>
          <button
            onClick={() => router.push("/user")}
            className="w-full sm:w-auto px-12 py-4 bg-brand-orange text-white font-qurova text-lg rounded-xl hover:bg-opacity-90 transition-all"
          >
            I&apos;m a User
          </button>
        </div>
      </div>
    </main>
  );
};

export default Page;
