"use client";

import { X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Button from "@/components/ui/button";
import { useTranslations } from "next-intl";

export const formatTime12h = (time24: string) => {
  if (!time24) return "";
  const [h, m] = time24.split(":");
  if (!h || !m) return time24;
  const hNum = parseInt(h, 10);
  const ampm = hNum >= 12 ? "PM" : "AM";
  const h12 = hNum % 12 || 12;
  return `${h12}:${m} ${ampm}`;
};

interface TimePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTime?: string;
  onSelectTime?: (time: string) => void;
}

const TimePickerModal = ({
  isOpen,
  onClose,
  selectedTime,
  onSelectTime,
}: TimePickerModalProps) => {
  const [hour, setHour] = useState("12");
  const [minute, setMinute] = useState("00");
  const [ampm, setAmpm] = useState("PM");

  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);
  const ampmRef = useRef<HTMLDivElement>(null);
  
  const t = useTranslations("shared.timePicker");

  useEffect(() => {
    if (isOpen) {
      if (selectedTime) {
        const [h, m] = selectedTime.split(":");
        if (h && m) {
          let h24 = parseInt(h, 10);
          const isPm = h24 >= 12;
          const h12 = h24 % 12 || 12;
          setHour(h12.toString());
          setMinute(m);
          setAmpm(isPm ? "PM" : "AM");
        }
      }
    }
  }, [isOpen, selectedTime]);

  useEffect(() => {
    if (isOpen && hourRef.current && minuteRef.current && ampmRef.current) {
      // Scroll to the selected values when opened
      const hEl = document.getElementById(`hour-${hour}`);
      if (hEl) {
        hourRef.current.scrollTo({ top: hEl.offsetTop - 80, behavior: "smooth" });
      }
      const mEl = document.getElementById(`minute-${minute}`);
      if (mEl) {
        minuteRef.current.scrollTo({ top: mEl.offsetTop - 80, behavior: "smooth" });
      }
      const aEl = document.getElementById(`ampm-${ampm}`);
      if (aEl) {
        ampmRef.current.scrollTo({ top: aEl.offsetTop - 80, behavior: "smooth" });
      }
    }
  }, [isOpen, hour, minute, ampm]);

  if (!isOpen) return null;

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));
  const ampmOptions = ["AM", "PM"];

  const handleDone = () => {
    if (onSelectTime) {
      let h24 = parseInt(hour, 10);
      if (ampm === "PM" && h24 < 12) h24 += 12;
      if (ampm === "AM" && h24 === 12) h24 = 0;
      
      const finalH = h24.toString().padStart(2, "0");
      onSelectTime(`${finalH}:${minute}`);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[150] flex items-end sm:items-center sm:justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#0000001A]">
          <h2 className="text-[18px] sm:text-[20px] font-poppins font-bold text-gray-900">
            {t("chooseTime")}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={22} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col items-center">
          <div className="flex w-full max-w-[260px] justify-between relative before:absolute before:top-1/2 before:-translate-y-1/2 before:w-full before:h-12 before:bg-[#F6F6F6] before:rounded-xl before:-z-10 z-0 gap-1 sm:gap-2">
            {/* Hours */}
            <div 
              ref={hourRef}
              className="h-48 w-16 sm:w-20 overflow-y-auto hide-scrollbar snap-y snap-mandatory relative z-10"
            >
              <div className="h-[72px]"></div> {/* Top padding */}
              {hours.map((h) => (
                <div
                  key={h}
                  id={`hour-${h}`}
                  onClick={() => setHour(h)}
                  className={`h-12 flex items-center justify-center snap-center cursor-pointer text-xl font-poppins transition-colors ${
                    hour === h ? "text-gray-900 font-bold" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {h}
                </div>
              ))}
              <div className="h-[72px]"></div> {/* Bottom padding */}
            </div>

            <div className="flex items-center justify-center text-2xl font-bold pb-2 z-10 text-gray-900">
              :
            </div>

            {/* Minutes */}
            <div 
              ref={minuteRef}
              className="h-48 w-16 sm:w-20 overflow-y-auto hide-scrollbar snap-y snap-mandatory relative z-10"
            >
              <div className="h-[72px]"></div> {/* Top padding */}
              {minutes.map((m) => (
                <div
                  key={m}
                  id={`minute-${m}`}
                  onClick={() => setMinute(m)}
                  className={`h-12 flex items-center justify-center snap-center cursor-pointer text-xl font-poppins transition-colors ${
                    minute === m ? "text-gray-900 font-bold" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {m}
                </div>
              ))}
              <div className="h-[72px]"></div> {/* Bottom padding */}
            </div>

            {/* AM/PM */}
            <div 
              ref={ampmRef}
              className="h-48 w-16 sm:w-20 overflow-y-auto hide-scrollbar snap-y snap-mandatory relative z-10"
            >
              <div className="h-[72px]"></div> {/* Top padding */}
              {ampmOptions.map((a) => (
                <div
                  key={a}
                  id={`ampm-${a}`}
                  onClick={() => setAmpm(a)}
                  className={`h-12 flex items-center justify-center snap-center cursor-pointer text-[17px] sm:text-[19px] font-poppins transition-colors ${
                    ampm === a ? "text-gray-900 font-bold" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {a}
                </div>
              ))}
              <div className="h-[72px]"></div> {/* Bottom padding */}
            </div>
          </div>
          <style dangerouslySetInnerHTML={{__html: `
            .hide-scrollbar::-webkit-scrollbar {
              display: none;
            }
            .hide-scrollbar {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}} />
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#0000001A] flex justify-center">
          <Button variant="primary" fullWidth onClick={handleDone} className="mt-6 w-full max-w-[260px]">
            {t("done")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TimePickerModal;
