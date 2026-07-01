"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, ChevronDown, Calendar } from "lucide-react";
import { getMyPayments } from "@/lib/api/payments";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import type { Payment } from "@/types";
import Image from "next/image";

const statusStyles: Record<string, string> = {
  HELD: "bg-[#EEF0FF] text-[#5A64FF]",
  PENDING: "bg-[#EEF0FF] text-[#5A64FF]",
  ESCROWED: "bg-[#EEF0FF] text-[#5A64FF]",
  RELEASED: "bg-[#FFF4ED] text-[#FF6600]",
  REFUNDED: "bg-[#98A2B3] text-white",
  CANCELLED: "bg-[#FEECEB] text-[#F04438]",
};

const legacyStatusLabel: Record<string, string> = {
  HELD: "Upcoming",
  PENDING: "Upcoming",
  ESCROWED: "Upcoming",
  RELEASED: "Completed",
  REFUNDED: "Refunded",
  CANCELLED: "Cancelled",
};

const readPaymentId = (p: Payment) => String(p.id ?? "");
const readTransactionDate = (p: Payment) =>
  p.transactionDate ?? p.created_at ?? p.createdAt ?? "";
const readCurrency = (p: Payment) => String(p.currency ?? "EUR").toUpperCase();
const readTotalPaid = (p: Payment) => {
  const value = Number(p.totalPaid ?? p.amount ?? 0);
  return Number.isFinite(value) ? value : 0;
};
const readStatusLabel = (p: Payment) =>
  p.statusLabel ?? legacyStatusLabel[p.status] ?? p.status;

const TransactionsPage = () => {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getMyPayments()
      .then((data) => setPayments(data ?? []))
      .catch(() => setPayments([]))
      .finally(() => setIsLoading(false));
  }, []);

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      const day = d.getDate();
      const suffix =
        ["th", "st", "nd", "rd"][
          day % 10 > 3 ? 0 : day % 100 - (day % 10) !== 10 ? day % 10 : 0
        ] || "th";
      const month = d.toLocaleDateString("en-GB", { month: "short" });
      const year = d.getFullYear();
      const time = d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      return `${day}${suffix} ${month}, ${year}, ${time}`;
    } catch {
      return iso;
    }
  };

  const formatAmount = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.back()}
            className="text-[#1D2939] hover:bg-gray-100 p-2 -ml-2 rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <button className="text-[#1D2939] hover:bg-gray-100 p-2 -mr-2 rounded-full transition-colors">
            <Download size={24} />
          </button>
        </div>

        <h1 className="text-[20px] sm:text-[24px] font-poppins font-bold text-[#1D2939] mb-6">
          Transaction History
        </h1>

        <div className="flex gap-3 mb-8">
          <button className="bg-[#FF6600] text-white px-4 py-2.5 rounded-xl text-[13px] font-poppins font-medium flex items-center justify-between gap-2 shadow-sm min-w-[120px]">
            Last 30 Days <ChevronDown size={16} />
          </button>
          <button className="bg-[#F9FAFB] border border-[#EAECF0] text-[#1D2939] px-4 py-2.5 rounded-xl text-[13px] font-poppins font-medium flex items-center justify-between gap-2 min-w-[120px]">
            All services <ChevronDown size={16} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#667085] font-poppins">No transactions yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((p) => {
              const isRefunded = p.status === "REFUNDED";
              const title = p.jobTitle?.trim() || "Service booking";
              const krafterName = p.krafter?.displayName;

              return (
                <div
                  key={readPaymentId(p)}
                  onClick={() => router.push(`/user/profile/receipt?id=${readPaymentId(p)}`)}
                  className="bg-[#F9FAFB] p-4 rounded-xl border border-[#EAECF0] flex gap-4 items-start hover:border-gray-300 transition-all cursor-pointer"
                >
                  <div
                    className={`w-[48px] h-[48px] rounded-xl flex items-center justify-center shrink-0 overflow-hidden ${
                      isRefunded ? "bg-[#E4E7EC]" : "bg-[#FFEFE5]"
                    }`}
                  >
                    {p.krafter?.profilePhotoUrl ? (
                      <Image
                        src={p.krafter.profilePhotoUrl}
                        alt={krafterName ?? "Krafter"}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Image
                        src="/card.svg"
                        alt="Transaction"
                        width={70}
                        height={70}
                        className="w-20 h-20"
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3
                        className={`text-[14px] sm:text-[15px] font-poppins font-bold truncate pr-2 ${
                          isRefunded ? "text-gray-500 line-through" : "text-[#1D2939]"
                        }`}
                      >
                        {title}
                      </h3>
                      <span
                        className={`text-[14px] sm:text-[15px] font-mabry font-bold shrink-0 ${
                          isRefunded ? "text-gray-500" : "text-[#1D2939]"
                        }`}
                      >
                        {formatAmount(readTotalPaid(p), readCurrency(p))}
                      </span>
                    </div>

                    {krafterName && (
                      <p className="text-[12px] text-[#667085] font-poppins mb-1 truncate">
                        {krafterName}
                        {p.krafter?.rating != null ? ` · ${p.krafter.rating.toFixed(1)}★` : ""}
                      </p>
                    )}

                    <div className="flex items-center gap-1.5 text-[#667085] mb-2 text-[12px] font-poppins">
                      <Calendar size={14} />
                      <span className={isRefunded ? "text-gray-400" : ""}>
                        {formatDate(readTransactionDate(p))}
                      </span>
                    </div>

                    <div>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-poppins font-semibold ${
                          statusStyles[p.status] ?? "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {readStatusLabel(p)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};

export default TransactionsPage;
