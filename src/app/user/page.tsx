"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";
import { useAuthStore } from "@/store/useAuthStore";

const Page = () => {
  const router = useRouter();
  const { isLoading } = useAuthStore();
  const showGoogleLogin = !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  return (
    <main className="relative w-full min-h-screen overflow-hidden bg-white flex items-center justify-center">
      <div className="relative w-full max-w-md lg:max-w-4xl mx-auto h-screen flex flex-col py-8">
        <div className="flex justify-center mb-8 relative z-20 mt-20">
          <Image
            src="/craft.svg"
            alt="kraftigö logo"
            width={173}
            height={58}
            className="w-32 sm:w-40 h-auto object-contain"
          />
        </div>

        {/* Background Image */}
        <div className="absolute -bottom-25  left-1/2 transform -translate-x-1/2 z-0 w-full max-w-md ">
          <div
            className="w-full h-auto"
            style={{
              maskImage:
                "linear-gradient(to bottom, rgba(0,0,0,1) 5%, rgba(0,0,0,0) 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, rgba(0,0,0,1) 5%, rgba(0,0,0,0) 100%)",
            }}
          >
            <Image
              src="/images/home.png"
              alt="artisan background"
              width={600}
              height={622}
              className="w-full h-145  object-contain object-bottom  "
            />
          </div>
        </div>

        <div className="mt-auto relative z-10 w-full max-w-md mx-auto px-6 lg:px-10">
          <div className="space-y-3">
            <Button
              variant="primary"
              onClick={() => router.push("/user/createacc")}
              fullWidth
            >
              Create account
            </Button>

            <Button
              variant="secondary"
              fullWidth
              onClick={() => router.push("/user/login")}
            >
              Sign in
            </Button>

            <div className="text-center text-[16px] my-4 font-qurova">
              Or continue with
            </div>
            <div className="flex gap-4 justify-center pb-4">
              {showGoogleLogin && <GoogleLoginButton />}
              <button className="w-14 h-14 bg-black rounded-xl flex items-center justify-center hover:bg-gray-900 transition-all">
                <Image src="/apple.svg" alt="Apple" width={24} height={24} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Page;
