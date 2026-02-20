"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/components/ui/loader";

const Page = () => {
  const router = useRouter();

  useEffect(() => {
    // Check for draft in localStorage
    const draft = localStorage.getItem("customKraftDraft");

    if (draft) {
      // If draft exists, could show a modal asking to continue
      // For now, just redirect to description
      router.replace("/user/home");
    } else {
      router.replace("/user/home/custom-kraft/description");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <Loader />
    </div>
  );
};

export default Page;
