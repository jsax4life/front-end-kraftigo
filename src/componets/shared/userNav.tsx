"use client";

import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";

const UserNav = () => {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    {
      name: "Home",
      icon: "/home.svg",
      activeIcon: "/home.svg",
      path: "/user/home",
    },
    {
      name: "Tasks",
      icon: "/task.svg",
      activeIcon: "/task.svg",
      path: "/user/tasks",
    },
    {
      name: "Chat",
      icon: "/chat.svg",
      activeIcon: "/chat.svg",
      path: "/user/chat",
    },
    {
      name: "Support",
      icon: "/sopport.svg",
      activeIcon: "/sopport.svg",
      path: "/user/support",
    },
    {
      name: "Profile",
      icon: "/taskerpro.svg",
      activeIcon: "/taskerpro.svg",
      path: "/user/profile",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#0000001A] z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-around h-20">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <button
                key={item.name}
                onClick={() => router.push(item.path)}
                className="flex flex-col items-center justify-center gap-1 min-w-15 transition-colors relative"
              >
                <div
                  className={`relative w-6 h-6 ${
                    isActive ? "brightness-0 saturate-100" : ""
                  }`}
                  style={
                    isActive
                      ? {
                          filter:
                            "invert(48%) sepia(79%) saturate(2476%) hue-rotate(346deg) brightness(98%) contrast(97%)",
                        }
                      : {}
                  }
                >
                  <Image
                    src={isActive ? item.activeIcon : item.icon}
                    alt={item.name}
                    width={24}
                    height={24}
                    className="w-full h-full object-contain"
                  />
                  {/* Red notification dot for Chat */}
                  {item.name === "Chat" && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <span
                  className={`text-[12px] font-poppins ${
                    isActive
                      ? "text-brand-orange font-semibold"
                      : "text-gray-600"
                  }`}
                >
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default UserNav;
