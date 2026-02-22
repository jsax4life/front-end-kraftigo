"use client";

import TaskerNav from "@/components/shared/taskerNav";
import TaskItem from "@/components/ui/taskItem";
import { Calendar } from "lucide-react";
import { useBookingStore } from "@/store/useBookingStore";
import { useEffect } from "react";

const Page = () => {
  const { bookings, isLoading, fetchTaskerBookings } = useBookingStore();

  useEffect(() => {
    fetchTaskerBookings();
  }, [fetchTaskerBookings]);

  const days = [
    { day: "Mon", date: "16" },
    { day: "Tue", date: "17" },
    { day: "Wed", date: "18" },
    { day: "Thu", date: "19" },
    { day: "Fri", date: "20" },
    { day: "Sat", date: "21", active: true },
    { day: "Sun", date: "22" },
  ];

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return { color: "bg-green-100 text-green-700", dot: "bg-green-500" };
      case 'CONFIRMED':
        return { color: "bg-orange-100 text-brand-orange", dot: "bg-brand-orange" };
      case 'PENDING':
        return { color: "bg-blue-100 text-blue-600", dot: "bg-blue-400" };
      case 'CANCELLED':
        return { color: "bg-red-100 text-red-600", dot: "bg-red-500" };
      default:
        return { color: "bg-gray-100 text-gray-600", dot: "bg-gray-400" };
    }
  };

  return (
    <main className="relative w-full min-h-screen bg-white pb-24">
      {/* Page Content */}
      <div className="w-full  sm:px-6 lg:px-8 ">
        <div className="max-w-4xl mx-auto">
          {/* Calendar Header */}
          <div className="bg-[#F6F6F6] pt-8 px-4 mb-6 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-[20px] sm:text-[24px] font-gerat font-bold">
                Schedule
              </h1>
              <Calendar className="" size={20} />
            </div>

            {/* Days of Week */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {days.map((item, index) => (
                <div
                  key={index}
                  className={`flex flex-col items-center py-2 sm:py-3 rounded-lg transition-colors ${
                    item.active
                      ? "bg-brand-orange text-white"
                      : " text-gray-700"
                  }`}
                >
                  <span className="text-[10px] sm:text-[12px] font-poppins mb-1">
                    {item.day}
                  </span>
                  <span className="text-[16px] sm:text-[20px] font-gerat font-bold">
                    {item.date}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tasks Timeline */}
          <div className="space-y-4 px-4">
            {isLoading ? (
               <div className="flex justify-center py-10">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange"></div>
               </div>
            ) : bookings.length > 0 ? (
              bookings.map((booking, index) => {
                const statusInfo = getStatusInfo(booking.status);
                return (
                  <TaskItem
                    key={booking.id}
                    time={booking.time}
                    title={booking.title}
                    client={`Client: ${booking.customerName}`}
                    location={booking.location}
                    status={booking.status}
                    statusColor={statusInfo.color}
                    dotColor={statusInfo.dot}
                    isLast={index === bookings.length - 1}
                  />
                );
              })
            ) : (
              <div className="text-center py-20">
                <p className="text-gray-500 font-poppins">No tasks found for this period.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <TaskerNav />
    </main>
  );
};

export default Page;
