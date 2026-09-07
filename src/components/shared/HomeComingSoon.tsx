"use client";

import { useState } from "react";
import Nav2 from "./Nav2";
import Counter from "../ui/counter";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import Button from "@/components/ui/button";
import { getLaunchAt } from "@/constants/launch";
import { useLaunchCountdown } from "@/hooks/useLaunchCountdown";
import { motion, AnimatePresence } from "framer-motion";
import {
  KRAFTER_SIGNUP_URL,
  setKrafterSignupIntent,
} from "@/lib/krafterSignupIntent";
import toast from "react-hot-toast";

export default function HomeComingSoon() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("home.comingSoon");
  const launchAt = useMemo(() => getLaunchAt(), []);
  const { isPast } = useLaunchCountdown(launchAt);

  const handleKrafterSignup = () => {
    setKrafterSignupIntent();
    router.push(KRAFTER_SIGNUP_URL);
  };

  const handleJoinWaitlist = async () => {
    if (!email || !firstName || !lastName) {
      toast.error("Please fill in all fields.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/waitlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: `${firstName} ${lastName}`.trim(),
          email: email,
          country: "Germany",
          city: "Soest",
          role: "CUSTOMER",
          serviceInterest: "General",
          agreesToContact: true,
        }),
      });

      if (response.status === 201) {
        setIsSubmitted(true);
      } else if (response.status === 409) {
        toast.error("Email is already on the waitlist.");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isPast) return;
    const id = window.setTimeout(() => {
      window.location.reload();
    }, 1500);
    return () => window.clearTimeout(id);
  }, [isPast]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-white flex flex-col">
      <Nav2 />

      {/* Background Images */}
      <Image
        src="/bottom2.svg"
        alt="workers"
        width={100}
        height={100}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 w-[120%] max-w-[450px] md:w-[350px] lg:w-[420px] object-contain z-0"
      />
      <Image
        src="/phone2.svg"
        alt="phone"
        width={100}
        height={100}
        className="hidden md:block absolute -bottom-1 right-0 w-[280px] lg:w-[250px] object-contain z-0"
      />

      <div className="flex flex-col items-center md:justify-center flex-grow pt-[100px] md:pt-[140px] relative z-10 pb-[280px] md:pb-10">
        <div className="text-center max-w-2xl px-4 md:px-0">
          <h1 className="text-[40px] md:text-[56px] font-garet font-bold text-[#000000E5] text-center">
          {t("title")}
        </h1>
        <p className="text-[16px] md:text-[18px] text-[#00000099] text-center max-w-[620px] mt-4 font-medium leading-[1.6]">
          {t("subtitle")}
        </p>
        </div>

        <Counter />

        <div className="flex flex-col items-center md:z-20 px-5 md:px-0 w-full max-w-[500px]">
          <AnimatePresence mode="wait">
            {!isSubmitted ? (
              <motion.div
                key="form"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center w-full"
              >
                <h2 className="text-[18px] font-bold text-[#000000E5] text-center mb-6">
                    {t("joinWaitlistHeader")}
                  </h2>

                {/* Waitlist Input */}
                <div className="w-full sm:w-[420px] flex flex-col gap-3 mb-6">
                  <div
                    className={`w-full h-[52px] rounded-xl flex items-center px-5 border transition-colors ${email.length > 0 ? "bg-white border-[#E5E5E5]" : "bg-[#F6F6F6] border-[#0000001A] focus-within:border-gray-300"}`}
                  >
                    <input
                      type="email"
                      placeholder={t("emailPlaceholder")}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-transparent w-full h-full outline-none text-[#4A4A4A] placeholder:text-[#888888] text-[15px]"
                    />
                  </div>

                  <AnimatePresence>
                    {email.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col gap-3 overflow-hidden"
                      >
                        <div className="flex gap-3">
                          <div className="flex-1 h-[52px] bg-[#F6F6F6] rounded-xl flex items-center px-4 border border-transparent focus-within:bg-white focus-within:border-[#FF6600] transition-colors">
                            <input
                              type="text"
                              placeholder={t("firstNamePlaceholder")}
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              className="bg-transparent w-full h-full outline-none text-[#4A4A4A] placeholder:text-[#888888] text-[15px]"
                            />
                          </div>
                          <div className="flex-1 h-[52px] bg-[#F6F6F6] rounded-xl flex items-center px-4 border border-transparent focus-within:bg-white focus-within:border-[#FF6600] transition-colors">
                            <input
                              type="text"
                              placeholder={t("lastNamePlaceholder")}
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              className="bg-transparent w-full h-full outline-none text-[#4A4A4A] placeholder:text-[#888888] text-[15px]"
                            />
                          </div>
                        </div>
                        <Button
                          onClick={handleJoinWaitlist}
                          disabled={isLoading}
                          className={`w-full h-[52px] bg-[#FF6600] text-white font-medium text-[16px] rounded-xl hover:bg-[#E55D00] transition-colors mt-1 ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                        >
                          {isLoading ? t("joiningBtn") : t("joinWaitlistBtn")}
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Avatars */}
                <div className="flex flex-row items-center gap-3 sm:gap-4 mt-2">
                  <motion.div
                    className="flex items-center gap-3 relative md:z-10"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    <div className="flex items-center">
                      <img
                        src="/images/1.png"
                        alt="User"
                        className="w-10 h-10 rounded-full border-2 border-white"
                      />
                      <span className="w-10 h-10 rounded-full bg-[#014F2A] flex items-center justify-center text-white font-bold text-sm -ml-5 border-2 border-white">
                        M
                      </span>
                      <img
                        src="/images/3.png"
                        alt="User"
                        className="w-10 h-10 rounded-full border-2 border-white -ml-5"
                      />
                      <img
                        src="/images/4.png"
                        alt="User"
                        className="w-10 h-10 rounded-full border-2 border-white -ml-5"
                      />
                      <span className="w-10 h-10 rounded-full bg-[#FF6600] flex items-center justify-center text-white font-bold text-sm -ml-5 border-2 border-white">
                        0
                      </span>
                    </div>
                  </motion.div>
                  <p className="text-[14px] text-[#000000CC]">
                    {t("waitlistCount")}
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
                className="flex flex-col items-center w-full relative mt-4 "
              >
                <span className="font-bold text-[14px] mb-6 text-[#2A2A2A]">
                  {t("successTitle")}
                </span>

                <div className="relative w-full sm:w-[420px] flex flex-col items-center ">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160%] max-w-[650px] z-0 pointer-events-none">
                    <motion.img
                      src="/grafiti.svg"
                      alt="confetti"
                      className="w-full h-full"
                      initial={{ scale: 0, opacity: 0, rotate: -15, y: 0 }}
                      animate={{
                        scale: [0, 1.2, 1, 1],
                        opacity: [0, 1, 1, 0],
                        y: [0, -20, 0, 1000],
                        rotate: [-15, 5, 0, 15],
                      }}
                      transition={{
                        duration: 4,
                        times: [0, 0.1, 0.3, 1],
                        ease: "easeInOut",
                      }}
                    />
                  </div>
                  <motion.img
                    src="/banner.svg"
                    alt="Banner"
                    className="relative z-10 w-full object-contain cursor-pointer hover:scale-[1.02] transition-transform"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  />
                  <motion.button
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mt-6 w-[90%] sm:w-[380px] h-[52px] bg-[#FF6600] text-white font-medium text-[16px] rounded-xl hover:bg-[#E55D00] transition-colors relative z-10"
                    onClick={handleKrafterSignup}
                  >
                    {t("krafterCta")}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
