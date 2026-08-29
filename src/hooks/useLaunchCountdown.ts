"use client";

import { useEffect, useState } from "react";
import { getLaunchAt } from "@/constants/launch";

export type LaunchCountdownParts = {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
};

function computeParts(target: Date, nowMs: number): LaunchCountdownParts {
  const totalMs = target.getTime() - nowMs;
  if (totalMs <= 0) {
    return { totalMs: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }
  const sec = Math.floor(totalMs / 1000);
  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec % 86400) / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;
  return { totalMs, days, hours, minutes, seconds, isPast: false };
}

export function useLaunchCountdown(target: Date = getLaunchAt()): LaunchCountdownParts {
  const [parts, setParts] = useState<LaunchCountdownParts>(() =>
    computeParts(target, Date.now()),
  );

  useEffect(() => {
    const tick = () => setParts(computeParts(target, Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [target]);

  return parts;
}
