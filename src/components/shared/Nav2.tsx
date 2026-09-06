"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { KRAFTER_SIGNUP_URL, setKrafterSignupIntent } from "@/lib/krafterSignupIntent";

const getNavClass = (isActive: boolean) =>
  `cursor-pointer transition-colors font-medium text-[16px] ${isActive ? "text-[#FF6600]" : "text-[#2A2A2A] hover:text-[#FF6600]"}`;

const getMobileNavClass = (isActive: boolean) =>
  `cursor-pointer transition-colors text-[15px] ${isActive ? "text-[#FF6600] font-semibold" : "text-[#2A2A2A] hover:text-[#FF6600]"}`;

const Nav2 = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
 
  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-50 bg-white flex items-center justify-between pt-6 md:pt-[42px] pb-4 md:pb-6 px-3 md:px-[68px]">
        <Image src="/craft.svg" alt="logo" width={100} height={100} className="w-[150px] md:w-[174px] h-[37px] md:h-[40px] object-contain" />
        
        {/* Desktop Links */}
        <div className="hidden md:flex gap-15">
          <Link href="https://www.kraftigo.com.de/about" target="_blank" className={getNavClass(pathname === '/about')}>About us</Link>
          <Link href={KRAFTER_SIGNUP_URL} onClick={() => setKrafterSignupIntent()} className={getNavClass(pathname === KRAFTER_SIGNUP_URL)}>Become a krafter</Link>
          <Link href="https://www.kraftigo.com.de/help" target="_blank" className={getNavClass(pathname === '/help')}>Get in touch</Link>
        </div>
        
        {/* Desktop Language Selector */}
        <div className="hidden md:flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity">
          <svg viewBox="0 0 512 512" className="w-[22px] h-[22px] rounded-full overflow-hidden shrink-0 mt-0.5">
            <rect width="512" height="170.66" y="0" fill="#000000" />
            <rect width="512" height="170.66" y="170.66" fill="#DD0000" />
            <rect width="512" height="170.66" y="341.33" fill="#FFCE00" />
          </svg>
          <span className="text-black font-medium text-[16px]">DE</span>
        </div>

        {/* Mobile Hamburger Menu */}
        <div 
          className="md:hidden flex items-center cursor-pointer"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12H21M3 6H21M3 18H21" stroke="#2A2A2A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </nav>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            {/* Sidebar */}
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed top-0 right-0 h-full w-[80%] max-w-[320px] bg-white z-50 p-6 pt-10 flex flex-col md:hidden shadow-xl"
            >
              {/* Close Button */}
              <div className="flex justify-end mb-12">
                <svg 
                  width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                  className="cursor-pointer"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <path d="M18 6L6 18M6 6L18 18" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              {/* Mobile Links */}
              <div className="flex flex-col gap-8 px-2">
                <Link href="https://www.kraftigo.com.de/about" target="_blank" className={getMobileNavClass(pathname === '/about')} onClick={() => setIsMobileMenuOpen(false)}>About us</Link>
                <Link href={KRAFTER_SIGNUP_URL} className={getMobileNavClass(pathname === KRAFTER_SIGNUP_URL)} onClick={() => { setKrafterSignupIntent(); setIsMobileMenuOpen(false); }}>Become a krafter</Link>
                <Link href="https://www .kraftigo.com.de/help" target="_blank" className={getMobileNavClass(pathname === '/help')} onClick={() => setIsMobileMenuOpen(false)}>Get in touch</Link>
              </div>

              <hr className="border-t border-[#0000001A] my-8" />

              {/* Mobile Language Selector */}
              <div className="flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity px-2">
                <span className="text-[#2A2A2A] text-[15px]">Language</span>
                <div className="flex items-center gap-2">
                  <svg viewBox="0 0 512 512" className="w-[18px] h-[18px] rounded-full overflow-hidden shrink-0 mt-0.5">
                    <rect width="512" height="170.66" y="0" fill="#000000" />
                    <rect width="512" height="170.66" y="170.66" fill="#DD0000" />
                    <rect width="512" height="170.66" y="341.33" fill="#FFCE00" />
                  </svg>
                  <span className="text-black text-[14px]">DE</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Nav2;