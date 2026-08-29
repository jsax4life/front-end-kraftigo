"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import Button from "@/components/ui/button";
import { getLaunchAt } from "@/constants/launch";
import { useLaunchCountdown } from "@/hooks/useLaunchCountdown";
import {
  KRAFTER_SIGNUP_SHORT_URL,
  KRAFTER_SIGNUP_URL,
  setKrafterSignupIntent,
} from "@/lib/krafterSignupIntent";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

type CountdownUnitProps = {
  value: string;
  label: string;
};

function CountdownUnit({ value, label }: CountdownUnitProps) {
  return (
    <div className="flex min-w-[4.5rem] flex-col items-center rounded-2xl border border-white/60 bg-white/90 px-3 py-4 shadow-[0_8px_32px_rgba(255,102,0,0.12)] backdrop-blur-sm sm:min-w-[5.5rem] sm:px-4 sm:py-5">
      <span className="font-mabry text-[28px] font-bold leading-none text-[#1D2939] sm:text-[36px]">
        {value}
      </span>
      <span className="mt-2 font-poppins text-[10px] font-semibold uppercase tracking-[0.14em] text-[rgba(0,0,0,0.45)] sm:text-[11px]">
        {label}
      </span>
    </div>
  );
}

export default function HomeComingSoon() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("home.comingSoon");
  const launchAt = useMemo(() => getLaunchAt(), []);
  const { days, hours, minutes, seconds, isPast } = useLaunchCountdown(launchAt);

  const launchLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(launchAt),
    [launchAt, locale],
  );

  const handleKrafterSignup = () => {
    setKrafterSignupIntent();
    router.push(KRAFTER_SIGNUP_URL);
  };

  useEffect(() => {
    if (!isPast) return;
    const id = window.setTimeout(() => {
      window.location.reload();
    }, 1500);
    return () => window.clearTimeout(id);
  }, [isPast]);

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#faf8f5]">
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full opacity-90 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(255, 102, 0, 0.38) 0%, rgba(0, 0, 255, 0.12) 55%, transparent 72%)",
        }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-5 py-16 text-center">
        <Image
          src="/taskerLogo.svg"
          alt="Kraftigo"
          width={173}
          height={58}
          priority
          className="mb-10 h-auto w-[140px] sm:w-[173px]"
        />

        <p className="font-poppins text-[12px] font-bold uppercase tracking-[0.22em] text-brand-orange">
          {t("eyebrow")}
        </p>
        <h1 className="mt-3 max-w-xl font-gerat text-[34px] font-[850] leading-[1.05] tracking-[-0.03em] text-[rgba(0,0,0,0.88)] sm:text-[44px]">
          {t("title")}
        </h1>
        <p className="mt-4 max-w-lg font-poppins text-[15px] leading-relaxed text-[rgba(0,0,0,0.58)] sm:text-[16px]">
          {t("subtitle")}
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <CountdownUnit value={pad2(days)} label={t("days")} />
          <CountdownUnit value={pad2(hours)} label={t("hours")} />
          <CountdownUnit value={pad2(minutes)} label={t("minutes")} />
          <CountdownUnit value={pad2(seconds)} label={t("seconds")} />
        </div>

        <p className="mt-6 font-poppins text-[13px] text-[rgba(0,0,0,0.5)]">
          {isPast ? t("launchingNow") : t("launchOn", { date: launchLabel })}
        </p>

        <div className="mt-10 w-full max-w-md space-y-4">
          <Button
            type="button"
            fullWidth
            className="font-poppins! text-[16px] font-semibold"
            onClick={handleKrafterSignup}
          >
            {t("krafterCta")}
          </Button>
          <p className="font-poppins text-[13px] leading-relaxed text-[rgba(0,0,0,0.55)]">
            {t("krafterHint")}{" "}
            <Link
              href={KRAFTER_SIGNUP_SHORT_URL}
              onClick={() => setKrafterSignupIntent()}
              className="font-semibold text-brand-orange underline-offset-4 hover:underline"
            >
              kraftigo.app{KRAFTER_SIGNUP_SHORT_URL}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
