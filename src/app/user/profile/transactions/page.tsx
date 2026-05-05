"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter } from "lucide-react";
import Header from "@/components/shared/Header";
import { getMyPayments } from "@/lib/api/payments";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import type { Payment } from "@/types";

const statusStyles: Record<string, string> = {
  HELD: "bg-orange-50 text-brand-orange border-orange-100",
  PENDING: "bg-orange-50 text-brand-orange border-orange-100",
  ESCROWED: "bg-orange-50 text-brand-orange border-orange-100",
  RELEASED: "bg-green-50 text-[#00A651] border-green-100",
  REFUNDED: "bg-red-50 text-[#F04438] border-red-100",
};

const statusLabel: Record<string, string> = {
  HELD: "Held",
  PENDING: "Pending",
  ESCROWED: "Escrowed",
  RELEASED: "Paid",
  REFUNDED: "Refunded",
};

const readPaymentId = (p: Payment) => String(p.id ?? "");
const readContextId = (p: Payment) =>
  String((p as any).booking_id ?? (p as any).contextId ?? (p as any).context_id ?? "");
const readContextType = (p: Payment) =>
  String((p as any).contextType ?? (p as any).context_type ?? "PAYMENT");
const readCreatedAt = (p: Payment) =>
  String((p as any).created_at ?? (p as any).createdAt ?? "");
const readCurrency = (p: Payment) =>
  String((p as any).currency ?? "EUR").toUpperCase();
const readAmount = (p: Payment) => {
  const value = Number((p as any).amount ?? 0);
  if (!Number.isFinite(value)) return 0;
  return value;
};

const TransactionsPage = () => {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    getMyPayments()
      .then((data) => setPayments(data ?? []))
      .catch(() => setPayments([]))
      .finally(() => setIsLoading(false));
  }, []);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  };

  const formatAmount = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(amount);

  const filteredPayments = payments.filter((p) =>
    readContextId(p).toLowerCase().includes(searchQuery.toLowerCase()) ||
    readPaymentId(p).toLowerCase().includes(searchQuery.toLowerCase())
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

        {isLoading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#667085] font-poppins">
              {searchQuery ? "No transactions found matching your search." : "No transactions yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-[12px] font-poppins font-bold text-[#98A2B3] uppercase tracking-widest ml-1 mb-2">
              Recent Transactions
            </h3>
            {filteredPayments.map((p) => (
              <div
                key={readPaymentId(p)}
                onClick={() => router.push(`/user/profile/receipt?id=${readPaymentId(p)}`)}
                className="bg-white p-5 rounded-2xl border border-[#F2F4F7] shadow-sm flex gap-4 items-center hover:border-brand-orange transition-all cursor-pointer group"
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 relative bg-gray-50 border border-[#F2F4F7] flex items-center justify-center">
                  <span className="text-[10px] font-poppins font-bold text-gray-400 text-center px-1 leading-tight">
                    {readPaymentId(p).slice(-6).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1.5">
                    <h3 className="text-[15px] font-gerat font-bold text-[#1D2939] truncate pr-2">
                      {readContextType(p).replaceAll("_", " ")} #{readContextId(p).slice(-8).toUpperCase() || "—"}
                    </h3>
                    <span className="text-[16px] font-poppins font-bold text-[#1D2939] shrink-0">
                      {formatAmount(readAmount(p), readCurrency(p))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[12px] text-[#667085] font-poppins font-medium">
                      {formatDate(readCreatedAt(p))}
                    </p>
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${statusStyles[p.status] ?? "bg-gray-50 text-gray-500 border-gray-100"}`}>
                      {statusLabel[p.status] ?? p.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default TransactionsPage;
