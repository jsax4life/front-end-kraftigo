"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, X, ChevronLeft, ChevronRight, Clock, AlertCircle, Calendar as CalendarIcon } from "lucide-react";
import Button from "@/components/ui/button";
import { useBookingsStore } from "@/store/useBookingsStore";
import type { Booking } from "@/types";
import toast from "react-hot-toast";

const ReschedulePage = () => {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;
  
  const { bookings, updateBooking, isLoading } = useBookingsStore();
  const booking = bookings.find(b => b.id === bookingId);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 1, 24)); 
  const [selectedTime, setSelectedTime] = useState("6:00pm");
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (booking) {
      // In a real app, you might parse the existing date/time
      setSelectedTime(booking.scheduled_time || "6:00pm");
    }
  }, [booking]);

  // Calendar logic
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const weekDays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1; // Adjust for Monday start
  };

  const handleDayClick = (day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newDate);
  };

  const timeOptions = [
    "8:00am", "9:00am", "10:00am", "11:00am", "12:00pm", 
    "1:00pm", "2:00pm", "3:00pm", "4:00pm", "5:00pm", "6:00pm", "7:00pm"
  ];

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const isSelected = selectedDate.getDate() === d && 
                         selectedDate.getMonth() === currentDate.getMonth() && 
                         selectedDate.getFullYear() === currentDate.getFullYear();
      
      // Mock some "highlighted" days like in screenshot (3, 9, 20 are orange-ish)
      const isHighlighted = [3, 9, 20].includes(d) && currentDate.getMonth() === 1;

      days.push(
        <button
          key={d}
          onClick={() => handleDayClick(d)}
          className={`aspect-square flex items-center justify-center text-[14px] font-poppins font-medium rounded-full transition-all ${
            isSelected
              ? "bg-blue-600 text-white" 
              : isHighlighted 
              ? "bg-[#FFE5D9] text-[#FF6600]"
              : d === 1 && currentDate.getMonth() === 1 ? "bg-[#FFE5D9] text-[#FF6600]" : "text-gray-900 hover:bg-gray-100"
          }`}
        >
          {d}
        </button>
      );
    }
    return days;
  };

  const handleConfirm = async () => {
      try {
          const dateStr = formatDate(selectedDate);
          await updateBooking(bookingId, { scheduled_date: dateStr, scheduled_time: selectedTime });
          toast.success("Successfully rescheduled!");
          router.push("/user/krafts");
      } catch (error: any) {
          toast.error(error.message || "Failed to reschedule");
      }
  };

  const formatDate = (date: Date) => {
    const day = date.getDate();
    const month = monthNames[date.getMonth()].substring(0, 3);
    const year = date.getFullYear();
    
    // Add ordinal suffix
    const j = day % 10, k = day % 100;
    if (j === 1 && k !== 11) return `${day}st ${month}, ${year}`;
    if (j === 2 && k !== 12) return `${day}nd ${month}, ${year}`;
    if (j === 3 && k !== 13) return `${day}rd ${month}, ${year}`;
    return `${day}th ${month}, ${year}`;
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-6 border-b border-[#F2F4F7]">
        <button onClick={() => router.back()} className="hover:opacity-70 p-2">
          <ArrowLeft className="w-6 h-6 text-[#1D2939]" />
        </button>
        <span className="text-[20px] font-gerat font-bold text-[#1D2939]">
          {booking?.service?.title || "Reschedule"}
        </span>
        <button onClick={() => router.push("/user/krafts")} className="hover:opacity-70 p-2">
          <X className="w-6 h-6 text-[#1D2939]" strokeWidth={1.5} />
        </button>
      </div>

      <div className="px-4 py-8 max-w-lg mx-auto pb-32">
        <div className="flex items-center justify-between mb-2">
            <h1 className="text-[24px] font-gerat font-bold text-[#1D2939]">Reschedule Appointment</h1>
        </div>
        <p className="text-[14px] font-poppins text-[#667085] mb-1">Need to change the date or time?</p>
        <p className="text-[14px] font-poppins text-[#667085] mb-8 leading-tight">
            Please select your preferred new schedule for this kraft.
        </p>

        {/* Date Selection */}
        <div className="mb-8">
            <h2 className="text-[16px] font-poppins font-bold text-[#1D2939] mb-4">Select new date</h2>
            
            <div className="bg-white rounded-2xl">
                {/* Month Nav */}
                <div className="flex items-center justify-between mb-6 px-2">
                    <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}>
                        <ChevronLeft className="w-5 h-5 text-gray-400" />
                    </button>
                    <span className="font-gerat font-bold text-[16px]">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </span>
                    <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Weekdays */}
                <div className="grid grid-cols-7 gap-1 mb-4">
                    {weekDays.map(d => (
                        <div key={d} className="text-center text-[13px] text-gray-400 font-poppins">{d}</div>
                    ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-7 gap-1">
                    {renderCalendar()}
                </div>
            </div>
        </div>

        {/* Time Selection */}
        <div className="mb-8">
            <h2 className="text-[16px] font-poppins font-bold text-[#1D2939] mb-4">Select new Time</h2>
            <div className="relative">
                <button 
                    onClick={() => setShowTimePicker(!showTimePicker)}
                    className="w-full flex items-center justify-between p-4 bg-white border border-[#0000001A] rounded-2xl hover:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-gray-400" />
                        <span className="text-[15px] font-poppins text-[#1D2939]">{selectedTime}</span>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${showTimePicker ? "rotate-90" : ""}`} />
                </button>

                {showTimePicker && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#0000001A] rounded-2xl shadow-xl z-20 max-h-48 overflow-y-auto">
                        {timeOptions.map(t => (
                            <button 
                                key={t}
                                onClick={() => {
                                    setSelectedTime(t);
                                    setShowTimePicker(false);
                                }}
                                className={`w-full text-left p-4 hover:bg-gray-50 font-poppins text-[14px] ${selectedTime === t ? "text-brand-orange font-bold bg-orange-50" : "text-gray-700"}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>

        {/* Reschedule Policy */}
        <div className="bg-[#FFF4F0] p-4 rounded-xl border border-[#FF660020] mb-8">
            <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-[#FF6600] shrink-0" />
                <div className="space-y-1">
                    <p className="text-[14px] font-poppins font-bold text-[#FF6600]">Reschedule Policy</p>
                    <p className="text-[13px] font-poppins text-[#FF6600] leading-tight">
                        Rescheduling 24 hours of the agreed time may incur a $9.99 late notice fee. <span className="underline cursor-pointer">Learn more</span>
                    </p>
                </div>
            </div>
        </div>

        {/* Comparison Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-[#F9FAFB] p-4 rounded-2xl border border-[#00000008]">
                <p className="text-[11px] font-poppins text-[#98A2B3] mb-2">Old Date</p>
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white rounded-md shadow-sm">
                         <CalendarIcon size={16} className="text-red-500" />
                    </div>
                    <p className="text-[12px] font-poppins text-[#1D2939] font-semibold leading-tight">
                        {booking?.scheduled_date} · {booking?.scheduled_time}
                    </p>
                </div>
            </div>
            <div className="bg-[#FFF9F6] p-4 rounded-2xl border border-[#FF660015]">
                <p className="text-[11px] font-poppins text-[#FF660060] mb-2">New Proposed Date</p>
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white rounded-md shadow-sm">
                         <CalendarIcon size={16} className="text-red-500" />
                    </div>
                    <p className="text-[12px] font-poppins text-[#FF6600] font-bold leading-tight">
                        {formatDate(selectedDate)}, {selectedTime}
                    </p>
                </div>
            </div>
        </div>

        {/* Action Button */}
        <button 
            onClick={handleConfirm}
            disabled={isLoading}
            className="w-full bg-brand-orange text-white py-4 rounded-xl text-[16px] font-poppins font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200 disabled:opacity-50"
        >
            {isLoading ? "Processing..." : "Confirm reschedule"}
        </button>
      </div>

      <style jsx>{`
        ::-webkit-scrollbar {
          width: 4px;
        }
        ::-webkit-scrollbar-thumb {
          background: #E4E7EC;
          border-radius: 10px;
        }
      `}</style>
    </main>
  );
};

export default ReschedulePage;
