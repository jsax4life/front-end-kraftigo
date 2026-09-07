import { useState, useEffect } from "react";
import { getLaunchAt } from "@/constants/launch";

const Counter = () => {
  const calculateTimeLeft = () => {
    const targetDate = getLaunchAt().getTime();
    const difference = targetDate - new Date().getTime();
    let newTimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

    if (difference > 0) {
      newTimeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }

    return newTimeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-6 sm:gap-10 mt-10 mb-8 sm:mt-14 sm:mb-12">
      <div className="flex flex-col items-center">
        <span className="text-[32px] sm:text-[36px] font-black font-garet leading-none text-[#000000CC]">{timeLeft.days}</span>
        <span className="text-[16px] sm:text-[22px] font-semibold text-[#000000CC] mt-2">Days</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-[32px] sm:text-[36px] font-black font-garet leading-none text-[#000000CC]">{timeLeft.hours}</span>
        <span className="text-[16px] sm:text-[22px] font-semibold text-[#000000CC] mt-2">Hours</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-[32px] sm:text-[36px] font-black font-garet leading-none text-[#000000CC]">{timeLeft.minutes}</span>
        <span className="text-[16px] sm:text-[22px] font-semibold text-[#000000CC] mt-2">Minutes</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-[32px] sm:text-[36px] font-black font-garet leading-none text-[#000000CC]">{timeLeft.seconds}</span>
        <span className="text-[16px] sm:text-[22px] font-semibold text-[#000000CC] mt-2">Seconds</span>
      </div>
    </div>
  );
}

export default Counter