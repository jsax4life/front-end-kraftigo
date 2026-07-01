"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Share2, Check, Calendar, Star, Download } from "lucide-react";
import Image from "next/image";
import { getPaymentById } from "@/lib/api/payments";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import type { Payment } from "@/types";

const ReceiptContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("id");

  const [payment, setPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!paymentId) {
      setIsLoading(false);
      return;
    }

    getPaymentById(paymentId)
      .then(setPayment)
      .catch((err) => {
        console.error("Failed to load receipt details", err);
        setPayment(null);
      })
      .finally(() => setIsLoading(false));
  }, [paymentId]);

  const handleDownloadPdf = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <p className="text-gray-500 font-poppins mb-4">Receipt not found.</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-[#FF6600] text-white rounded-lg font-poppins"
        >
          Go Back
        </button>
      </div>
    );
  }

  const currency = payment.currency || "EUR";
  const totalPaid = Number(payment.breakdown?.totalPaid ?? payment.totalPaid ?? payment.amount ?? 0);
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(totalPaid);

  const paymentDate =
    payment.transactionDate ?? payment.createdAt ?? payment.created_at ?? new Date().toISOString();
  const dateFormatted = new Date(paymentDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const krafter = payment.krafter;
  const krafterName = krafter?.displayName ?? "Krafter";
  const krafterAvatar = krafter?.profilePhotoUrl ?? "/images/pro.jpg";
  const krafterRating = krafter?.rating;
  const krafterReviews = krafter?.reviewCount;
  const primaryBadge = krafter?.badges?.[0];

  const lineItems = payment.breakdown?.lineItems ?? [];
  const serviceFee = Number(payment.breakdown?.serviceFee ?? 0);
  const discountAmount = payment.breakdown?.discountAmount;
  const discountLabel = payment.breakdown?.discountLabel;
  const statusHeading = payment.statusLabel ?? "Transaction Successful";

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          main { padding-bottom: 0 !important; min-height: auto !important; }
        }
      `}} />
      <main className="min-h-screen bg-white flex flex-col pb-12">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 no-print">
          <button
            onClick={() => router.back()}
            className="text-[#1D2939] hover:bg-gray-100 p-2 -ml-2 rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <button className="text-[#1D2939] hover:bg-gray-100 p-2 -mr-2 rounded-full transition-colors">
            <Share2 size={24} />
          </button>
        </div>

        <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 mt-4">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-[84px] h-[84px] rounded-full bg-[#FFF4ED] flex items-center justify-center mb-6">
              <div className="w-[52px] h-[52px] rounded-full bg-[#FF6600] flex items-center justify-center text-white shadow-sm">
                <Check size={32} strokeWidth={3} />
              </div>
            </div>

            <h2 className="text-[20px] sm:text-[22px] font-poppins font-[850] text-[#1D2939] mb-1 tracking-tight">
              {statusHeading}
            </h2>
            <div className="text-[44px] font-mabry font-light text-[#1D2939] mb-3 leading-none">
              {formattedAmount}
            </div>
            <div className="flex items-center gap-1.5 text-[#667085] text-[13px] font-poppins">
              <Calendar size={14} />
              <span>{dateFormatted}</span>
            </div>
            {payment.jobTitle && (
              <p className="text-[14px] text-[#475467] font-poppins mt-2">{payment.jobTitle}</p>
            )}
            {payment.scheduledAt && (
              <p className="text-[12px] text-[#667085] font-poppins mt-1">
                Scheduled: {new Date(payment.scheduledAt).toLocaleString()}
              </p>
            )}
          </div>

          {krafter && (
            <div className="w-full bg-[#F9FAFB] rounded-2xl p-4 sm:p-5 border border-[#EAECF0] flex gap-4 items-center mb-10">
              <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0">
                <Image
                  src={krafterAvatar}
                  alt={krafterName}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "https://i.pravatar.cc/150?u=edith";
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="text-[16px] font-poppins font-bold text-[#1D2939] truncate">
                    {krafterName}
                  </h3>
                  {primaryBadge && (
                    <span className="bg-[#E7F8F0] text-[#00A651] text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase shrink-0">
                      {primaryBadge}
                    </span>
                  )}
                </div>
                {krafterRating != null && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="flex text-[#0200FF] gap-0.5">
                      {Array.from({ length: Math.min(5, Math.round(krafterRating)) }).map((_, i) => (
                        <Star key={i} size={14} fill="currentColor" />
                      ))}
                    </div>
                    {krafterReviews != null && (
                      <span className="text-[13px] text-[#667085] font-poppins shrink-0">
                        ({krafterReviews} reviews)
                      </span>
                    )}
                  </div>
                )}
                {krafter.completedKrafts != null && (
                  <span className="inline-flex items-center gap-1 bg-[#FFF9E6] text-[#B78800] text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    {krafter.completedKrafts} krafts completed
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="mb-10">
            <h3 className="text-[18px] font-poppins font-bold text-[#1D2939] mb-5">
              Price Breakdown
            </h3>
            <div className="space-y-4">
              {lineItems.length > 0 ? (
                lineItems.map((item, idx) => (
                  <div key={`${item.label}-${idx}`} className="flex justify-between items-center">
                    <span className="text-[14px] text-[#475467] font-poppins">{item.label}</span>
                    <span className="text-[14px] text-[#1D2939] font-poppins font-medium">
                      {formatMoney(item.amount)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex justify-between items-center">
                  <span className="text-[14px] text-[#475467] font-poppins">Service</span>
                  <span className="text-[14px] text-[#1D2939] font-poppins font-medium">
                    {formatMoney(totalPaid - serviceFee)}
                  </span>
                </div>
              )}

              {serviceFee > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-[14px] text-[#475467] font-poppins">Service fee</span>
                  <span className="text-[14px] text-[#1D2939] font-poppins font-medium">
                    {formatMoney(serviceFee)}
                  </span>
                </div>
              )}

              {discountAmount != null && discountAmount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-[14px] text-[#475467] font-poppins">
                    {discountLabel ?? "Discount"}
                  </span>
                  <span className="text-[14px] text-[#1D2939] font-poppins font-medium">
                    -{formatMoney(discountAmount)}
                  </span>
                </div>
              )}

              <div className="h-[1px] bg-[#EAECF0] w-full my-1" />

              <div className="flex justify-between items-center">
                <span className="text-[16px] font-poppins font-bold text-[#1D2939]">Total Paid</span>
                <span className="text-[16px] font-poppins font-bold text-[#1D2939]">
                  {formattedAmount}
                </span>
              </div>
            </div>
          </div>

          {payment.timeline && payment.timeline.length > 0 && (
            <div className="mb-10">
              <h3 className="text-[18px] font-poppins font-bold text-[#1D2939] mb-5">
                Payment timeline
              </h3>
              <div className="space-y-3">
                {payment.timeline.map((event, idx) => (
                  <div key={idx} className="flex justify-between text-[13px] font-poppins">
                    <span className="text-[#475467]">
                      {event.label ?? event.status ?? "Event"}
                    </span>
                    <span className="text-[#667085]">
                      {event.at ?? event.timestamp
                        ? new Date(event.at ?? event.timestamp ?? "").toLocaleString()
                        : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="w-[100vw] relative left-[50%] right-[50%] -ml-[50vw] -mr-[50vw] h-[1px] bg-[#EAECF0] mb-10" />

          <div className="mb-12">
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-[#475467] font-poppins shrink-0">
                Transaction reference:
              </span>
              <span className="text-[13px] text-[#475467] font-poppins truncate font-mono">
                {payment.transactionReference ?? payment.id}
              </span>
            </div>
          </div>

          <div className="space-y-4 no-print">
            <button
              onClick={handleDownloadPdf}
              className="w-full bg-[#FF6600] hover:bg-[#E55C00] text-white font-poppins text-[15px] font-medium py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Download size={18} /> Download PDF Receipt
            </button>
            <button className="w-full bg-[#0200FF] hover:bg-blue-700 text-white font-poppins text-[15px] font-medium py-3.5 rounded-xl transition-colors">
              Report this Transaction
            </button>
          </div>
        </div>
      </main>
    </>
  );
};

export default function ReceiptPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <ReceiptContent />
    </Suspense>
  );
}
