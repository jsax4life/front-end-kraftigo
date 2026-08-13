"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import ProgressStepper from "../components/ProgressStepper";
import PaymentFlowModal from "@/components/shared/PaymentFlowModal";
import { usePaymentStore } from "@/store/usePaymentStore";
import Input from "@/components/ui/input";
import { useCustomKraftsStore } from "@/store/useCustomKraftsStore";
import { useAddressStore } from "@/store/useAddressStore";
import { useServicesStore } from "@/store/useServicesStore";
import { useTranslations } from "next-intl";
import {
  isSavedPaymentMethodRequiredError,
  SAVED_PAYMENT_METHOD_REQUIRED_TOAST,
} from "@/lib/paymentCardRequired";

// ─── Fixed fees (from backend pricing) ──────────────────────────────────────
const SERVICE_FEE = 5;
const URGENT_BOOST_FEE = 4.99;

const Page = () => {
  const router = useRouter();

  // ─── Stores ──────────────────────────────────────────────────────────────
  const { selectedKraft, publishKraft, isSubmitting, error, clearError } =
    useCustomKraftsStore();
  const { addresses, loadAddresses } = useAddressStore();
  const { categories, fetchCategories } = useServicesStore();
  const { savedMethods, selectedPaymentId, selectPayment, fetchSavedMethods } =
    usePaymentStore();
  const t = useTranslations("customKraft");
  const td = useTranslations("customKraft.reviewStep");
  const tn = useTranslations("customKraft.nav");

  // ─── Resolve human-readable labels from IDs ─────────────────────────────
  const resolvedCategory =
    categories.find((c) => c.id === selectedKraft?.roughCategoryId)?.name ??
    selectedKraft?.roughCategoryId ??
    "—";
  const resolvedAddress =
    addresses.find((a) => a.id === selectedKraft?.addressId)?.address ?? "—";

  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // ─── Guard: redirect back if no draft exists ────────────────────────────
  useEffect(() => {
    if (!selectedKraft) {
      router.replace("/user/custom-kraft/description");
    }
  }, [selectedKraft, router]);

  // Ensure we have addresses + categories loaded to resolve IDs
  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Fetch saved payment methods from the API on mount
  useEffect(() => {
    fetchSavedMethods();
  }, [fetchSavedMethods]);

  // ─── Show store errors as toasts ────────────────────────────────────────
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  // Auto-select the default payment method once methods are loaded
  useEffect(() => {
    if (savedMethods.length > 0 && !selectedPaymentId) {
      const defaultMethod =
        savedMethods.find((m) => m.isDefault) ?? savedMethods[0];
      selectPayment(defaultMethod.id);
    }
  }, [savedMethods, selectedPaymentId, selectPayment]);

  // ─── Pricing ─────────────────────────────────────────────────────────────
  const offerAmount = Number(selectedKraft?.offerAmount || 0);
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
      router.push("/user/custom-kraft/finished");
    } catch (err) {
      if (isSavedPaymentMethodRequiredError(err)) {
        toast.error(SAVED_PAYMENT_METHOD_REQUIRED_TOAST, { duration: 6500 });
        setShowPaymentModal(true);
      }
      // Other failures: store `error` is set; useEffect above shows the toast.
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
          {t("requestACustomKraft")}
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
          {(selectedKraft?.scheduledDate || selectedKraft?.scheduledTime) && (
            <p className="text-[13px] font-poppins text-gray-500">
              {selectedKraft.scheduledDate ?? ""}
              {selectedKraft.scheduledTime
                ? ` · ${selectedKraft.scheduledTime}`
                : ""}
            </p>
          )}
        </div>

        {/* ── Kraft Details ── */}
        <section className="mb-6">
          <h2 className="text-[18px] font-poppins font-semibold text-gray-900 mb-3">
            {td("kraftDetails")}
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
            {td("priceBreakdown")}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] sm:text-[14px] font-poppins text-gray-700">
                {td("offerAmount")}
              </span>
              <span className="text-[14px] sm:text-[15px] font-poppins font-semibold text-gray-900">
                €{offerAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] sm:text-[14px] font-poppins text-gray-700">
                {td("serviceFee")}
              </span>
              <span className="text-[14px] sm:text-[15px] font-poppins font-semibold text-gray-900">
                €{SERVICE_FEE.toFixed(2)}
              </span>
            </div>
            {boostFee > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[13px] sm:text-[14px] font-poppins text-gray-700">
                  {td("urgentBoost", { fallback: "Urgent Boost" })}
                </span>
                <span className="text-[14px] sm:text-[15px] font-poppins font-semibold text-gray-900">
                  €{boostFee.toFixed(2)}
                </span>
              </div>
            )}
            {promoApplied && (
              <div className="flex items-center justify-between">
                <span className="text-[13px] sm:text-[14px] font-poppins text-[#4CAF50]">
                  {td("promo")} ({promoCode})
                </span>
                <span className="text-[14px] sm:text-[15px] font-poppins font-semibold text-[#4CAF50]">
                  −€{promoDiscount.toFixed(2)}
                </span>
              </div>
            )}
            <div className="pt-3 border-t border-[#0000001A] flex items-center justify-between">
              <span className="text-[15px] sm:text-[16px] font-poppins font-bold text-gray-900">
                {td("totalAmount")}
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
              placeholder={td("promo")}
              value={promoCode}
              onChange={setPromoCode}
              className="flex-1"
            />
            <button className="absolute right-2 top-1/2 mt-1 transform -translate-y-1/2 px-6 py-2 bg-[#FFE5D9] text-brand-orange text-[14px] sm:text-[15px] font-poppins font-semibold rounded-lg hover:bg-[#FFD5C2] transition-colors">
              {td("apply")}
            </button>
          </div>
        </div>

        {/* Payment Options */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-[#0000001A]">
          <h3 className="text-[18px] sm:text-[20px] font-poppins font-semibold mb-4">
            {td("paymentOptions")}
          </h3>

          {!savedMethods.length ? (
            // No Payment Methods State
            <div className="space-y-4 py-5">
              <p className="text-[13px] sm:text-[14px] font-poppins text-gray-500 text-center py-4">
                {td("noSavedMethods")}
              </p>
              <button
                onClick={handleAddPayment}
                className="w-full py-3 bg-blue-600 text-white text-[15px] sm:text-[16px] font-poppins font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <span className="text-xl">+</span>
                {td("addNew")}
              </button>
            </div>
          ) : (
            // With Payment Methods State
            <div className="space-y-4">
              {savedMethods.map((method) => {
                const methodLoose = method as unknown as Record<string, unknown>;
                const paymentMethodLoose =
                  methodLoose.paymentMethod && typeof methodLoose.paymentMethod === "object"
                    ? (methodLoose.paymentMethod as Record<string, unknown>)
                    : null;
                const cardLike = (value: unknown): Record<string, unknown> | null =>
                  value && typeof value === "object" ? (value as Record<string, unknown>) : null;
                // 1. Extract data safely
                const cardData =
                  cardLike(method.card) ||
                  cardLike(methodLoose.details) ||
                  cardLike(paymentMethodLoose?.card) ||
                  (typeof methodLoose.brand === "string" ? methodLoose : null);
                const isCard = cardData != null;

                // We only get last4 from Stripe for security
                const last4 =
                  (typeof cardData?.last4 === "string" ? cardData.last4 : undefined) ||
                  (typeof cardData?.number === "string" ? cardData.number.slice(-4) : undefined) ||
                  (typeof methodLoose.cardLast4 === "string" ? methodLoose.cardLast4 : undefined) ||
                  "****";
                // const holderName =
                //   cardData?.holder ||
                //   cardData?.name ||
                //   (method as any).name ||
                //   (method as any).billingDetails?.name ||
                //   "John Doe";

                // 2. Determine the Title based on the payment type
                let methodTitle = "Debit/Credit Card";
                if (!isCard) {
                  if (method.type === "sepa_debit")
                    methodTitle = "SEPA Direct Debit";
                  else if (method.type === "paypal") methodTitle = "PayPal";
                  else methodTitle = method.type; // Fallback
                }

                return (
                  <div
                    key={method.id}
                    onClick={() => selectPayment(method.id)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                      selectedPaymentId === method.id
                        ? "bg-[#F4F4F5] border-gray-300" // Selected state border
                        : "bg-[#F4F4F5] border-transparent hover:border-gray-200" // Unselected state
                    }`}
                  >
                    {/* Top Row: Title & Radio Button */}
                    <div className="flex justify-between items-start">
                      <span className="font-poppins text-[15px] text-gray-800 capitalize">
                        {methodTitle}
                      </span>

                      {/* Custom Radio Button */}
                      <div
                        className={`w-[20px] h-[20px] rounded-full border-[2px] flex items-center justify-center shrink-0 transition-colors ${
                          selectedPaymentId === method.id
                            ? "border-black"
                            : "border-gray-400"
                        }`}
                      >
                        {selectedPaymentId === method.id && (
                          <div className="w-2.5 h-2.5 bg-black rounded-full" />
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Card Details & "Change" Button */}
                    {isCard && (
                      <div className="mt-4 flex justify-between items-end">
                        {/* Left Side: Name and Number */}
                        <div className="flex flex-col gap-1.5">
                          {/* <h4 className="font-poppins font-bold text-[15px] text-gray-900 leading-none">
                            {holderName}
                          </h4> */}
                          <p className="font-poppins text-[14px] text-gray-800 tracking-widest leading-none mt-1">
                            **** **** **** {last4}
                          </p>
                          {method.isDefault && (
                            <span className="text-[11px] font-poppins font-semibold text-brand-orange mt-1">
                              Default
                            </span>
                          )}
                        </div>

                        {/* Right Side: Change Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevents clicking this from triggering the selectPayment radio
                            // TODO: Add your logic here to open the Stripe Modal to update the card
                            console.log("Change button clicked for", method.id);
                          }}
                          className="font-poppins font-bold text-[13px] text-brand-orange hover:text-orange-600 transition-colors"
                        >
                          {td("change")}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {/* Add New Payment Button */}
              <button
                onClick={handleAddPayment}
                className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-600 text-[15px] sm:text-[16px] font-poppins font-semibold rounded-lg hover:border-brand-orange hover:text-brand-orange transition-colors flex items-center justify-center gap-2"
              >
                <span className="text-xl">+</span>
                {td("addNewPaymentMethod")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Sticky Footer ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#0000001A] px-4 py-4 pb-safe max-w-4xl mx-auto">
        <p className="text-[11px] font-poppins text-gray-500 text-center mb-3">
          {td("termsPrivacyText")}
        </p>
        <button
          onClick={handleConfirmAndPay}
          disabled={isSubmitting}
          className="w-full py-4 bg-brand-orange text-white text-[16px] font-poppins font-semibold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-60"
        >
          {isSubmitting ? td("publishing") : `${td("confirmAndPay")} €${total.toFixed(2)}`}
        </button>
      </div>
      {showPaymentModal && (
        <PaymentFlowModal onClose={() => setShowPaymentModal(false)} />
      )}
    </div>
  );
};

export default Page;
