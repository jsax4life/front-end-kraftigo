"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import Userabt from "./userabt";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add("overflow-hidden");

      const preventScroll = (e: Event) => {
        e.preventDefault();
      };

      window.addEventListener("wheel", preventScroll, { passive: false });
      window.addEventListener("touchmove", preventScroll, { passive: false });

      return () => {
        document.body.classList.remove("overflow-hidden");
        window.removeEventListener("wheel", preventScroll);
        window.removeEventListener("touchmove", preventScroll);
      };
    } else {
      document.body.classList.remove("overflow-hidden");
    }
  }, [isMenuOpen]);

  const menuItems = [
    { label: "Home", icon: "/home.svg", href: "/user/home" },
    { label: "Krafts", icon: "/task.svg", href: "/user/krafts" },
    { label: "Chat", icon: "/chat.svg", href: "/user/chat" },
    { label: "Support", icon: "/sopport.svg", href: "/user/support" },
    { label: "Profile", icon: "/taskerpro.svg", href: "/user/profile" },
  ];

  return (
    <div className="relative flex justify-between items-center border-b border-[#0000001A] py-3 bg-white z-50">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center justify-center rounded-full transition-colors z-50 relative"
        >
          {isMenuOpen ? (
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FF66001A]">
              <X size={20} className="text-[#1D2939]" />
            </div>
          ) : (
            <Image
              src="/navmenu.svg"
              alt="menu"
              width={36}
              height={36}
              className="w-9 h-auto object-contain"
            />
          )}
        </button>
        <Image
          src="/craft.svg"
          alt="kraftigö logo"
          width={108}
          height={58}
          priority
          className="w-28 h-auto object-contain z-50 relative"
        />
      </div>
      <div className="z-50 relative">
        <Userabt />
      </div>

      {/* Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 mt-25"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 mt-4 w-70 bg-white rounded-[20px] shadow-2xl p-4 flex flex-col gap-2 z-50">
          {menuItems.map((item, index) => {
            const isActive =
              pathname === item.href ||
              (pathname === "/" && item.href === "/user/home") ||
              pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={index}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors ${
                  isActive
                    ? "bg-[#FF66001A] text-brand-orange"
                    : "text-[#1D2939] hover:bg-gray-50"
                }`}
              >
                <Image
                  src={item.icon}
                  alt={item.label}
                  width={20}
                  height={20}
                  className={isActive ? "text-brand-orange" : "text-[#1D2939]"}
                />
                <span className="font-mabry font-medium text-[15px]">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Navbar;
