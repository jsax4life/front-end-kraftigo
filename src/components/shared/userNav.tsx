"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthPromptStore } from "@/store/useAuthPromptStore";
import { useProfileStore } from "@/store/useProfileStore";
import { getVerificationWire } from "@/lib/api/verification";
import { useTranslations } from "next-intl";

const UserNav = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();
  const { openPrompt } = useAuthPromptStore();
  const { verificationStatus, fetchVerificationStatus } = useProfileStore();
  const t = useTranslations("navigation");

  // Keep status fresh so Profile tab can route correctly.
  React.useEffect(() => {
    if (isAuthenticated) fetchVerificationStatus();
  }, [isAuthenticated, fetchVerificationStatus]);

  const navItems = [
    {
      id: "home",
      name: t("home"),
      icon: "/home.svg",
      activeIcon: "/home.svg",
      path: "/",
    },
    {
      id: "krafts",
      name: t("krafts"),
      icon: "/task.svg",
      activeIcon: "/task.svg",
      path: "/user/krafts",
    },
    {
      id: "chat",
      name: t("chat"),
      icon: "/chat.svg",
      activeIcon: "/chat.svg",
      path: "/user/chat",
    },
    {
      id: "support",
      name: t("support"),
      icon: "/sopport.svg",
      activeIcon: "/sopport.svg",
      path: "/user/support",
    },
    {
      id: "profile",
      name: t("profile"),
      icon: "/taskerpro.svg",
      activeIcon: "/taskerpro.svg",
      path: "/user/profile",
    },
  ];

  const handleNavClick = (path: string) => {
    // If user is not authenticated, only allow home
    if (!isAuthenticated && path !== "/" && path !== "/") {
      openPrompt();
    } else {
      if (path === "/user/profile") {
        const forceCustomer =
          typeof window !== "undefined" &&
          window.localStorage.getItem("kraftigo_profile_mode") === "customer";
        const { verificationState, kycStatus } = getVerificationWire(verificationStatus);
        // If internal docs are submitted (pending admin) AND KYC is approved,
        // the user's primary profile becomes the krafter profile.
        if (!forceCustomer && verificationState === "PENDING" && kycStatus === "APPROVED") {
          router.push("/tasker/profile");
          return;
        }
      }
      router.push(path);
    }
  };

  return (
    <nav className="fixed bottom-0 w-full md:hidden h-[96px] bg-white border-t border-[#0000001A] z-50 left-1/2 -translate-x-1/2">
      <div className="flex items-end justify-between px-[20px] pb-[23px] w-full h-full gap-2">
        {navItems.map((item) => {
          const isActive = pathname === item.path || (pathname === "/" && item.path === "/");
          return (
            <button
              key={item.name}
              onClick={() => handleNavClick(item.path)}
              className="flex flex-col items-center justify-end h-full w-[73px] gap-[8px] relative transition-colors"
            >
              {/* Top border indicator */}
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[2px] bg-[#FF6600] rounded-[60px]" />
              )}
              
              <div
                className="relative w-[23.5px] h-[23.5px]"
                style={
                  isActive
                    ? {
                        filter:
                          "invert(48%) sepia(79%) saturate(2476%) hue-rotate(346deg) brightness(98%) contrast(97%)",
                      }
                    : {
                        opacity: 0.8,
                      }
                }
              >
                <Image
                  src={item.icon}
                  alt={item.name}
                  fill
                  className="object-contain"
                />
                {/* Red notification dot for Chat */}
                {item.id === "chat" && (
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              <span
                className={`text-[10px] font-sans text-center leading-[13px] ${
                  isActive
                    ? "text-[#FF6600] font-medium"
                    : "text-[rgba(0,0,0,0.8)] font-medium"
                }`}
              >
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default UserNav;
