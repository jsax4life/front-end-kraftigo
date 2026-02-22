"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";

const Page = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    // If authenticated, go to home
    if (isAuthenticated) {
      router.push("/user/home");
    } else {
      // Per user request: redirect to login if not authenticated or if an error happens
      // This ensures the user is forced into the login flow immediately
      router.push("/user/login");
    }
  }, [isAuthenticated, router]);

  // Return null because this is a redirect-only page
  return null;
};

export default Page;
