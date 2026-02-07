"use client";

import TaskerNav from "@/componets/shared/taskerNav";
import TaskItem from "@/componets/ui/taskItem";
import { Calendar } from "lucide-react";

const Page = () => {
  const days = [
    { day: "Mon", date: "12" },
    { day: "Tue", date: "13", active: true },
    { day: "Wed", date: "14" },
    { day: "Thu", date: "15" },
    { day: "Fri", date: "16" },
    { day: "Sat", date: "17" },
    { day: "Sun", date: "18" },
  ];

  const tasks = [
    {
      time: "8:00 AM - 12:00 AM",
      title: "AC Maintenance",
      client: "Client: Michael C",
      location: "123 Maple Ave, Berlin",
      status: "Completed",
      statusColor: "bg-green-100 text-green-700",
      dotColor: "bg-green-500",
    },
    {
      time: "12:00 PM - 2:00 PM",
      title: "AC Maintenance",
      client: "Client: Michael R",
      location: "123 Maple Ave, Berlin",
      status: "In Progress",
      statusColor: "bg-orange-100 text-brand-orange",
      dotColor: "bg-brand-orange",
    },
    {
      time: "12:00 PM - 2:00 PM",
      title: "AC Maintenance",
      client: "Client: Michael R",
      location: "123 Maple Ave, Berlin",
      status: "Upcoming",
      statusColor: "bg-blue-100 text-blue-600",
      dotColor: "bg-gray-300",
    },
    {
      time: "12:00 PM - 2:00 PM",
      title: "AC Maintenance",
      client: "Client: Michael R",
      location: "123 Maple Ave, Berlin",
      status: "Upcoming",
      statusColor: "bg-blue-100 text-blue-600",
      dotColor: "bg-gray-300",
    },
  ];

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
            {tasks.map((task, index) => (
              <TaskItem
                key={index}
                time={task.time}
                title={task.title}
                client={task.client}
                location={task.location}
                status={task.status}
                statusColor={task.statusColor}
                dotColor={task.dotColor}
                isLast={index === tasks.length - 1}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <TaskerNav />
    </main>
  );
};

export default Page;
