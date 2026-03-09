"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft, Home, Wallet, History, CreditCard } from "lucide-react";
import TaskerNav from "@/components/shared/taskerNav";

const SimpleLineChart = () => {
  return (
    <div className="w-full h-32 relative mt-4">
      <svg viewBox="0 0 400 120" className="w-full h-full">
        {/* Background Grid Lines (Horizontal) */}
        {[0, 40, 80].map((y) => (
          <line 
            key={y} 
            x1="0" y1={y} x2="400" y2={y} 
            stroke="#F2F4F7" 
            strokeWidth="1" 
          />
        ))}
        
        {/* Dash lines - matching screenshot */}
        <path 
          d="M 10 90 L 60 70 L 110 85 L 160 60 L 210 50 L 260 40 L 310 55 L 360 45 L 400 50" 
          fill="none" 
          stroke="#FF6600" 
          strokeWidth="1.5" 
          strokeDasharray="4 4" 
          opacity="0.5"
        />
        <path 
          d="M 10 110 L 60 85 L 110 95 L 160 75 L 210 65 L 260 45 L 310 70 L 360 55 L 400 65" 
          fill="none" 
          stroke="#FF6600" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        
        {/* Points with shadows */}
        {[
          {x: 60, y: 85}, 
          {x: 110, y: 95}, 
          {x: 160, y: 75}, 
          {x: 210, y: 65}, 
          {x: 260, y: 45}, 
          {x: 310, y: 70}
        ].map((p, i) => (
          <circle 
            key={i} 
            cx={p.x} cy={p.y} r="3" 
            fill="#1D2939" 
            stroke="white" 
            strokeWidth="1.5" 
          />
        ))}
        
        {/* Labels */}
        <text x="45" y="115" fontSize="10" fill="#98A2B3" fontFamily="Poppins">Mon</text>
        <text x="95" y="115" fontSize="10" fill="#98A2B3" fontFamily="Poppins">Tue</text>
        <text x="145" y="115" fontSize="10" fill="#98A2B3" fontFamily="Poppins">Wed</text>
        <text x="195" y="115" fontSize="10" fill="#98A2B3" fontFamily="Poppins">Thu</text>
        <text x="245" y="115" fontSize="10" fill="#98A2B3" fontFamily="Poppins">Fri</text>
        <text x="295" y="115" fontSize="10" fill="#98A2B3" fontFamily="Poppins">Sat</text>
      </svg>
    </div>
  );
};

const ActivityItem = ({ title, date, amount, status }: { 
  title: string, 
  date: string, 
  amount: string, 
  status: "Completed" | "Processing" | "Cancelled" 
}) => {
  const statusColor = {
    Completed: "text-[#00A651]",
    Processing: "text-brand-blue",
    Cancelled: "text-[#F04438]"
  }[status];

  return (
    <div className="flex items-center justify-between py-4 border-b border-[#F2F4F7] last:border-0 hover:bg-gray-50 px-2 transition-colors">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-brand-blue/10 text-brand-blue rounded-xl">
           <Home size={22} strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-[14px] font-poppins font-medium text-[#1D2939] leading-tight">{title}</p>
          <p className="text-[12px] font-poppins text-[#667085] mt-0.5">{date}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-[15px] font-poppins font-bold ${statusColor}`}>+${amount}</p>
        <p className="text-[10px] font-poppins text-[#98A2B3] mt-0.5 uppercase tracking-wider">{status}</p>
      </div>
    </div>
  );
};

const EarningsPage = () => {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="w-full flex items-center justify-between py-6 px-4 bg-white border-b border-[#F2F4F7]">
        <button onClick={() => router.back()} className="p-1 hover:opacity-70 transition-opacity">
          <ChevronLeft className="w-8 h-8 text-[#1D2939]" strokeWidth={1.5} />
        </button>
        <div className="text-center pr-10 flex-1">
           <h1 className="text-[20px] font-gerat font-bold text-[#1D2939]">Earnings</h1>
        </div>
      </div>

      <div className="px-5 py-8 space-y-8 max-w-2xl mx-auto pb-32">
        
        {/* Weekly Earnings Card */}
        <section className="bg-white rounded-3xl p-6 border border-[#EAECF0] shadow-sm">
           <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[13px] font-poppins text-[#667085]">Weekly Earnings</p>
                <h3 className="text-[32px] font-gerat font-bold text-[#1D2939] leading-tight">$840.00</h3>
                <p className="text-[11px] font-poppins text-[#98A2B3]">Oct 18 - Oct 24, 2026</p>
              </div>
              <button className="flex items-center gap-2 bg-[#F6F6F6] text-[#475467] font-poppins text-[12px] font-medium px-4 py-2 rounded-xl border border-[#D0D5DD]">
                 Weekly <ChevronLeft size={14} className="-rotate-90" />
              </button>
           </div>
           <SimpleLineChart />
        </section>

        {/* Mini Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-[#F9FAFB] p-5 rounded-2xl border border-[#EAECF0]">
              <p className="text-[12px] font-poppins text-[#667085] mb-2 font-medium">Tasks Completed</p>
              <p className="text-[32px] font-gerat font-bold text-[#1D2939]">28</p>
           </div>
           <div className="bg-[#F9FAFB] p-5 rounded-2xl border border-[#EAECF0]">
              <p className="text-[12px] font-poppins text-[#667085] mb-2 font-medium">Avg Hourly Rate</p>
              <p className="text-[32px] font-gerat font-bold text-[#1D2939]">$34</p>
           </div>
        </div>

        {/* Withdrawal Section */}
        <section className="space-y-6 pt-4">
           <div className="space-y-1">
             <h2 className="text-[18px] font-gerat font-bold text-[#475467]">Available For Withdrawal</h2>
             <p className="text-[36px] font-gerat font-bold text-brand-orange leading-tight">$300.00</p>
             <p className="text-[13px] font-poppins text-[#667085]">Ready to transfer to your bank</p>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-[#EAECF0] shadow-sm">
                 <p className="text-[12px] font-poppins text-[#667085] mb-1 font-medium">Pending Clearance</p>
                 <p className="text-[24px] font-gerat font-bold text-[#1D2939]">$540</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-[#EAECF0] shadow-sm">
                 <p className="text-[12px] font-poppins text-[#667085] mb-1 font-medium">Lifetime Earnings</p>
                 <p className="text-[24px] font-gerat font-bold text-[#1D2939]">$55,400.50</p>
              </div>
           </div>

           <div className="space-y-3 pt-2">
              <button className="w-full bg-brand-orange py-4 rounded-2xl text-white font-gerat font-bold text-[16px] hover:bg-orange-600 transition-colors">
                Withdraw Funds
              </button>
              <button className="w-full bg-brand-blue py-4 rounded-2xl text-white font-gerat font-bold text-[16px] hover:bg-blue-700 transition-colors">
                Manage Payments
              </button>
           </div>
        </section>

        {/* Recent Activity */}
        <section className="pt-4 pb-12">
           <div className="flex items-center justify-between mb-4">
              <h2 className="text-[18px] font-gerat font-bold text-[#1D2939]">Recent Activity</h2>
              <button className="text-brand-orange text-[14px] font-poppins font-bold">View all</button>
           </div>
           <div className="space-y-1">
              <ActivityItem 
                title="House Cleaning - IKEA" 
                date="Oct 24, 2025 · 2:30 PM" 
                amount="540" 
                status="Completed" 
              />
              <ActivityItem 
                title="House Cleaning - IKEA" 
                date="Oct 21, 2025 · 2:30 PM" 
                amount="540" 
                status="Processing" 
              />
              <ActivityItem 
                title="House Cleaning - IKEA" 
                date="Oct 20, 2025 · 2:30 PM" 
                amount="540" 
                status="Cancelled" 
              />
              <ActivityItem 
                title="House Cleaning - IKEA" 
                date="Oct 20, 2025 · 2:30 PM" 
                amount="540" 
                status="Cancelled" 
              />
              <ActivityItem 
                title="House Cleaning - IKEA" 
                date="Oct 20, 2025 · 2:30 PM" 
                amount="540" 
                status="Cancelled" 
              />
           </div>
        </section>

      </div>
      <TaskerNav />
    </main>
  );
};

export default EarningsPage;
