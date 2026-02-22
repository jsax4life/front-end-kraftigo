"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Filter } from "lucide-react";
import Image from "next/image";
import Header from "@/components/shared/Header";

const transactions = [
  {
    id: "TX-90210",
    title: "House Cleaning with Sarah M.",
    price: "$41.29",
    date: "26th Jan, 2025 · 4:00am",
    status: "Paid",
    icon: "/images/home3.jpg"
  },
  {
    id: "TX-90211",
    title: "Power Cleaning with David H.",
    price: "$120.00",
    date: "24th Jan, 2025 · 1:30pm",
    status: "Paid",
    icon: "/images/home2.jpg"
  },
  {
    id: "TX-90212",
    title: "Pipe Fixing with Hannah K.",
    price: "$85.50",
    date: "20th Jan, 2025 · 10:00am",
    status: "Pending",
    icon: "/images/home1.jpg"
  },
  {
    id: "TX-90213",
    title: "Power Cleaning with Sarah M.",
    price: "$41.29",
    date: "15th Jan, 2025 · 4:00am",
    status: "Failed",
    icon: "/images/home4.jpg"
  }
];

const statusStyles: any = {
  "Paid": "bg-green-50 text-[#00A651] border-green-100",
  "Pending": "bg-orange-50 text-brand-orange border-orange-100",
  "Failed": "bg-red-50 text-[#F04438] border-red-100"
};

const TransactionsPage = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTransactions = transactions.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#F9FAFB] flex flex-col">
      <Header title="Transaction History" showLogout={false} />

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-10">
          <h2 className="text-[32px] font-gerat font-[850] text-[#1D2939] leading-tight">
            Transactions
          </h2>
          <p className="text-[14px] text-[#667085] font-poppins mt-2">
            View and manage your payment history
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-3 mb-10">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#98A2B3]" size={20} />
            <input 
              type="text" 
              placeholder="Search transactions" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-[#F2F4F7] bg-white focus:outline-none focus:border-brand-orange text-[14px] font-poppins shadow-sm"
            />
          </div>
          <button className="w-14 h-[58px] bg-white border border-[#F2F4F7] rounded-2xl flex items-center justify-center shadow-sm text-[#667085] hover:bg-gray-50 transition-all">
            <Filter size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <h3 className="text-[12px] font-poppins font-bold text-[#98A2B3] uppercase tracking-widest ml-1 mb-2">Recent Transactions</h3>
          {filteredTransactions.map((t) => (
            <div 
              key={t.id}
              onClick={() => router.push(`/user/profile/receipt?id=${t.id}`)}
              className="bg-white p-5 rounded-2xl border border-[#F2F4F7] shadow-sm flex gap-4 items-center hover:border-brand-orange transition-all cursor-pointer group"
            >
              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 relative bg-gray-50 border border-[#F2F4F7]">
                <Image src={t.icon} alt={t.title} fill className="object-cover group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1.5">
                  <h3 className="text-[15px] font-gerat font-bold text-[#1D2939] truncate pr-2">
                    {t.title}
                  </h3>
                  <span className="text-[16px] font-poppins font-bold text-[#1D2939] shrink-0">
                    {t.price}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                   <p className="text-[12px] text-[#667085] font-poppins font-medium">{t.date}</p>
                   <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${statusStyles[t.status]}`}>
                     {t.status}
                   </span>
                </div>
              </div>
            </div>
          ))}
          
          {filteredTransactions.length === 0 && (
            <div className="text-center py-20">
              <p className="text-[#667085] font-poppins">No transactions found matching your search.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default TransactionsPage;
