"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import ProgressStepper from "../components/ProgressStepper";
import PaymentFlowModal from "../../../../../components/shared/PaymentFlowModal";
import { usePaymentStore } from "@/store/usePaymentStore";
import Input from "../../../../../components/ui/input";
import { useCustomKraftsStore } from "@/store/useCustomKraftsStore";
import { useAddressStore } from "@/store/useAddressStore";
import { useServicesStore } from "@/store/useServicesStore";

// ─── Fixed fees (from backend pricing) ──────────────────────────────────────
const SERVICE_FEE = 5;
const URGENT_BOOST_FEE = 4.99;

const Page = () => {
  const router = useRouter();

  // ─── Stores ──────────────────────────────────────────────────────────────
  const {
    selectedKraft,
    publishKraft,
    isSubmitting,
    error,
    clearError,
  } = useCustomKraftsStore();
  const { addresses } = useAddressStore();
  const { categories } = useServicesStore();
  const {
    paymentMethods,
    selectedPaymentId,
    selectPayment,
    hasPaymentMethods,
  } = usePaymentStore();

  // ─── Resolve human-readable labels from IDs ─────────────────────────────
  const resolvedCategory = categories.find(
    (c) => c.id === selectedKraft?.roughCategoryId,
  )?.name ?? selectedKraft?.roughCategoryId ?? "—";
  const resolvedAddress =
    addresses.find((a) => a.id === selectedKraft?.addressId)?.address ?? "—";

  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // ─── Guard: redirect back if no draft exists ────────────────────────────
  useEffect(() => {
    if (!selectedKraft) {
      router.replace("/user/home/custom-kraft/description");
    }
  }, [selectedKraft, router]);

  // ─── Show store errors as toasts ────────────────────────────────────────
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  // ─── Set default payment method ─────────────────────────────────────────
  useEffect(() => {
    if (paymentMethods.length > 0 && !selectedPaymentId) {
      const defaultMethod =
        paymentMethods.find((m) => m.isDefault) || paymentMethods[0];
      selectPayment(defaultMethod.id);
    }
  }, [paymentMethods, selectedPaymentId, selectPayment]);

  // ─── Pricing ─────────────────────────────────────────────────────────────
  const offerAmount = selectedKraft?.offerAmount ?? 0;
  const boostFee = selectedKraft?.urgentBoost ? URGENT_BOOST_FEE : 0;
  const promoDiscount = promoApplied ? 5 : 0;
  const total = offerAmount + SERVICE_FEE + boostFee - promoDiscount;

  const handleApplyPromo = () => {
    if (promoCode.trim()) setPromoApplied(true);
  };

  const handleConfirmAndPay = async () => {
    if (!selectedKraft) return;
    if (!selectedPaymentId) {
      toast.error("Please select a payment method");
      return;
    }
    try {
      await publishKraft(selectedKraft.id);
      router.push("/user/home/custom-kraft/finished");
    } catch {
      // error handled by useEffect above
    }
  };

  const handleAddPayment = () => {
    setShowPaymentModal(true);
  };
  return (
    <div className="min-h-screen bg-white pb-36">
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-4xl mx-auto">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="mb-6 p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} className="text-gray-900" />
        </button>

        <h1 className="text-[24px] sm:text-[28px] font-gerat font-bold text-gray-900 mb-6">
          Request A Custom Kraft
        </h1>

        <ProgressStepper currentStep={4} />

        {/* ── Booking Summary ── */}
        <div className="bg-[#FF66000D] border border-[#FF660033] rounded-xl p-4 mb-6">
          <p className="text-[13px] font-poppins font-bold text-gray-900 mb-1">
            Rough Category:{" "}
            <span className="font-semibold">{resolvedCategory}</span>
          </p>
          <p className="text-[13px] font-poppins text-gray-700">
            {resolvedAddress}
          </p>
          <p className="text-[13px] font-poppins text-gray-500">
            {selectedKraft?.scheduledDate ?? ""}
            {selectedKraft?.scheduledTime ? ` · ${selectedKraft.scheduledTime}` : ""}
          </p>
        </div>

        {/* ── Kraft Details ── */}
        <section className="mb-6">
          <h2 className="text-[18px] font-poppins font-semibold text-gray-900 mb-3">
            Kraft Details
          </h2>

          {/* Photos */}
          {selectedKraft?.photos && selectedKraft.photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              {selectedKraft.photos.map((src, i) => (
                <div
                  key={i}
                  className="relative w-full h-24 rounded-xl overflow-hidden"
                >
                  <Image
                    src={src}
                    alt={`Photo ${i + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Description */}
          <div className="bg-[#F6F6F6] rounded-xl p-4">
            <p className="text-[13px] sm:text-[14px] font-poppins text-gray-700 leading-relaxed">
              {selectedKraft?.description ?? "—"}
            </p>
          </div>
        </section>

        {/* Price Breakdown */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 border-t border-[#0000001A]">
          <h3 className="text-[18px] sm:text-[20px] font-poppins font-semibold mb-4">
            Price Breakdown
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] sm:text-[14px] font-poppins text-gray-700">
                Offer Amount
              </span>
              <span className="text-[14px] sm:text-[15px] font-poppins font-semibold text-gray-900">
                €{offerAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] sm:text-[14px] font-poppins text-gray-700">
                Service fee
              </span>
              <span className="text-[14px] sm:text-[15px] font-poppins font-semibold text-gray-900">
                €{SERVICE_FEE.toFixed(2)}
              </span>
            </div>
            {boostFee > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[13px] sm:text-[14px] font-poppins text-gray-700">
                  Urgent Boost
                </span>
                <span className="text-[14px] sm:text-[15px] font-poppins font-semibold text-gray-900">
                  €{boostFee.toFixed(2)}
                </span>
              </div>
            )}
            {promoApplied && (
              <div className="flex items-center justify-between">
                <span className="text-[13px] sm:text-[14px] font-poppins text-[#4CAF50]">
                  Promo ({promoCode})
                </span>
                <span className="text-[14px] sm:text-[15px] font-poppins font-semibold text-[#4CAF50]">
                  −€{promoDiscount.toFixed(2)}
                </span>
              </div>
            )}
            <div className="pt-3 border-t border-[#0000001A] flex items-center justify-between">
              <span className="text-[15px] sm:text-[16px] font-poppins font-bold text-gray-900">
                Total Amount
              </span>
              <span className="text-[16px] sm:text-[18px] font-poppins font-bold text-gray-900">
                €{total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Promo Code */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8">
          <div className="flex items-center gap-1 relative">
            <Input
              placeholder="Promo Code"
              value={promoCode}
              onChange={setPromoCode}
              className="flex-1"
            />
            <button className="absolute right-2 top-1/2 mt-1 transform -translate-y-1/2 px-6 py-2 bg-[#FFE5D9] text-brand-orange text-[14px] sm:text-[15px] font-poppins font-semibold rounded-lg hover:bg-[#FFD5C2] transition-colors">
              Apply
            </button>
          </div>
        </div>

        {/* Payment Options */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-[#0000001A]">
          <h3 className="text-[18px] sm:text-[20px] font-poppins font-semibold mb-4">
            Payment Options
          </h3>

          {!hasPaymentMethods() ? (
            // No Payment Methods State
            <div className="space-y-4 py-5">
              <p className="text-[13px] sm:text-[14px] font-poppins text-gray-500 text-center py-4">
                You do not have any saved payment methods
              </p>
              <button
                onClick={handleAddPayment}
                className="w-full py-3 bg-blue-600 text-white text-[15px] sm:text-[16px] font-poppins font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <span className="text-xl">+</span>
                add new
              </button>
            </div>
          ) : (
            // With Payment Methods State
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="border border-[#0000001A] rounded-lg p-4 hover:border-brand-orange transition-colors cursor-pointer"
                  onClick={() => selectPayment(method.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="relative flex items-top">
                        <input
                          type="radio"
                          name="payment"
                          value={method.id}
                          checked={selectedPaymentId === method.id}
                          onChange={(e) => selectPayment(e.target.value)}
                          className="w-5 h-5 appearance-none border-2 border-gray-300 rounded-full checked:border-brand-orange checked:border-[6px] transition-all cursor-pointer"
                        />
                      </div>
                      <div className="flex-1">
                        {method.type === "googlepay" ? (
                          <div className="flex items-center gap-2">
                            <Image
                              src="/google2.svg"
                              alt="Google Pay"
                              width={50}
                              height={20}
                              className="h-5 w-auto"
                            />
                            Pay
                          </div>
                        ) : (
                          <div>
                            <p className="text-[14px] sm:text-[15px] font-poppins font-semibold text-gray-900">
                              {method.name}
                            </p>
                            {method.details && (
                              <div className="mt-1">
                                {method.details.holder && (
                                  <p className="text-[13px] font-poppins font-semibold text-gray-900">
                                    {method.details.holder}
                                  </p>
                                )}
                                {method.details.number && (
                                  <p className="text-[12px] font-poppins text-gray-600">
                                    {method.details.number}
                                  </p>
                                )}
                                {method.details.iban && (
                                  <p className="text-[12px] font-poppins text-gray-600">
                                    {method.details.iban}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    {method.details && (
                      <button className="text-brand-orange text-[13px] sm:text-[14px] font-poppins font-semibold hover:underline">
                        Change
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Add New Payment Button */}
              <button
                onClick={handleAddPayment}
                className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-600 text-[15px] sm:text-[16px] font-poppins font-semibold rounded-lg hover:border-brand-orange hover:text-brand-orange transition-colors flex items-center justify-center gap-2"
              >
                <span className="text-xl">+</span>
                Add new payment method
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Sticky Footer ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#0000001A] px-4 py-4 pb-safe max-w-4xl mx-auto">
        <p className="text-[11px] font-poppins text-gray-500 text-center mb-3">
          By clicking &apos;Confirm &amp; Pay&apos;, you agree to
          Krafitgo&apos;s{" "}
          <span className="underline cursor-pointer">Terms of Service</span> and{" "}
          <span className="underline cursor-pointer">Privacy Policy</span>.
          Payments are processed securely.
        </p>
        <button
          onClick={handleConfirmAndPay}
          disabled={isSubmitting}
          className="w-full py-4 bg-brand-orange text-white text-[16px] font-poppins font-semibold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-60"
        >
          {isSubmitting
            ? "Publishing…"
            : `Confirm & Pay €${total.toFixed(2)}`}
        </button>
      </div>
      {showPaymentModal && (
        <PaymentFlowModal onClose={() => setShowPaymentModal(false)} />
      )}
    </div>
  );
};

export default Page;
