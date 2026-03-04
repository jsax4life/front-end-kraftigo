"use client";

import { Check } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useState, useEffect } from "react";
import Input from "@/components/ui/input";
import { useBookingsStore } from "@/store/useBookingsStore";
import { usePaymentStore } from "@/store/usePaymentStore";
import toast from "react-hot-toast";
import { logger } from "@/utils/logger";
import PaymentFlowModal from "@/components/shared/PaymentFlowModal";

const Page = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("categoryId") || "";
  const categoryName = searchParams.get("category") || "Service";
  const address =
    searchParams.get("address") || "Hauptstraße 123 - 10115, Berlin";
  const date = searchParams.get("date") || new Date().toISOString();
  const [promoCode, setPromoCode] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const { createBooking, isSubmitting } = useBookingsStore();
  const { paymentMethods, selectedPaymentId, selectPayment, hasPaymentMethods } = usePaymentStore();

  // Set initial selected payment to default or first method
  useEffect(() => {
    if (paymentMethods.length > 0 && !selectedPaymentId) {
      const defaultMethod = paymentMethods.find(m => m.isDefault) || paymentMethods[0];
      selectPayment(defaultMethod.id);
    }
  }, [paymentMethods, selectedPaymentId, selectPayment]);

  const hourlyRate = 41.29;
  const hours = Number(searchParams.get("hours") || "1");
  const serviceFee = 5.0;
  const discount = 10.0;
  const subtotal = hourlyRate * hours;
  const totalAmount = subtotal + serviceFee - discount;

  const handleConfirmPayment = async () => {
    logger.log("Initiating booking creation", { categoryId, categoryName, address, date });

    try {
      // Get address coordinates (you'll need to implement geocoding or get from address store)
      // For now, using default Berlin coordinates
      const latitude = 52.52;
      const longitude = 13.40;
      
      // Convert time to HH:mm format (remove AM/PM if present)
      const rawTime = searchParams.get("time") || "09:00";
      let formattedTime = rawTime;
      
      // If time has AM/PM, convert to 24-hour format
      if (rawTime.includes("AM") || rawTime.includes("PM")) {
        const timeParts = rawTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (timeParts) {
          let hours = parseInt(timeParts[1]);
          const minutes = timeParts[2];
          const period = timeParts[3].toUpperCase();
          
          if (period === "PM" && hours !== 12) {
            hours += 12;
          } else if (period === "AM" && hours === 12) {
            hours = 0;
          }
          
          formattedTime = `${hours.toString().padStart(2, '0')}:${minutes}`;
        }
      }
      
      // Construct payload for API in the format backend expects
      const payload = {
        serviceCategoryId: searchParams.get("categoryId") || "",
        jobTitle: categoryName, // Use category name as job title
        jobDescription: searchParams.get("taskDetails") || "",
        consentAcknowledged: true,
        address: address,
        latitude: latitude,
        longitude: longitude,
        preferredDate: new Date(date).toISOString().split('T')[0], // YYYY-MM-DD format
        preferredTime: formattedTime, // HH:mm format
      };

      logger.log("Booking payload:", payload);

      await createBooking(payload);

      toast.success("Booking confirmed successfully!");
      router.push("/user/book-service/confirmation");
    } catch (err: any) {
      logger.error("Booking creation failed:", err);
      
      // Handle specific error cases
      if (err.response?.status === 401) {
        toast.error("Please log in to create a booking");
        router.push("/user/login");
      } else {
        toast.error(
          err.response?.data?.message ||
            "Failed to create booking. Please try again.",
        );
      }
    }
  };

  const handleAddPayment = () => {
    // Open payment modal to add new payment method
    setShowPaymentModal(true);
  };

  return (
    <div className="min-h-screen bg-white pb-8">
      {/* Header */}
      <div className="bg-[#FFF0F0] pb-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 lg:px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="w-9 h-9 bg-brand-orange rounded-full flex items-center justify-center">
              <Check size={20} className="text-white" />
            </span>
            <span className="w-9 h-9 bg-brand-orange rounded-full flex items-center justify-center">
              <Check size={20} className="text-white" />
            </span>
            <span className="w-9 h-9 bg-brand-orange rounded-full flex items-center justify-center">
              <Check size={20} className="text-white" />
            </span>
            <span className="w-9 h-9 bg-brand-orange rounded-full flex items-center justify-center">
              <Check size={20} className="text-white" />
            </span>
            <span className="w-fit px-3 py-2.5 text-xs sm:text-sm bg-brand-orange text-white rounded-full flex items-center justify-center">
              Finish
            </span>
          </div>
          <button
            className="text-brand-orange text-[14px] sm:text-[16px] font-poppins font-semibold"
            onClick={() => router.back()}
          >
            Back
          </button>
        </div>
        <h2 className="text-[18px] sm:text-[20px] font-poppins font-semibold px-4 sm:px-8 lg:px-8 max-w-4xl mx-auto">
          {hasPaymentMethods() ? "Complete Order" : "Verify Your Details"}
        </h2>
      </div>

      {/* Service Info */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-gerat font-bold mb-2">
              {categoryName}
            </h1>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[13px] sm:text-[14px] font-poppins font-semibold text-gray-900">
                Edit Ropalanum.
              </span>
              <span className="bg-[#E8F5E9] text-[#2E7D32] text-[10px] sm:text-[11px] font-poppins font-semibold px-2 py-0.5 rounded">
                TOP PRO
              </span>
            </div>
            <p className="text-[13px] sm:text-[14px] text-gray-700 font-poppins">
              {address}
            </p>
            <p className="text-[13px] sm:text-[14px] text-gray-700 font-poppins">
              {date}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-brand-orange text-[16px] sm:text-[18px] font-poppins font-bold">
              ${hourlyRate.toFixed(2)}/hr
            </span>
            <Image
              src="/images/pro.jpg"
              alt="artisan profile"
              width={70}
              height={70}
              className="w-20 h-20 rounded-lg object-cover"
            />
          </div>
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 border-t border-[#0000001A]">
        <h3 className="text-[18px] sm:text-[20px] font-poppins font-semibold mb-4">
          Price Breakdown
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] sm:text-[14px] font-poppins text-gray-700">
              Hourly Rate (${hourlyRate.toFixed(2)}/hr x {hours}hrs)
            </span>
            <span className="text-[14px] sm:text-[15px] font-poppins font-semibold text-gray-900">
              ${subtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] sm:text-[14px] font-poppins text-gray-700">
              Service fee
            </span>
            <span className="text-[14px] sm:text-[15px] font-poppins font-semibold text-gray-900">
              ${serviceFee.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] sm:text-[14px] font-poppins text-[#4CAF50]">
              Discount (Welcome 10)
            </span>
            <span className="text-[14px] sm:text-[15px] font-poppins font-semibold text-[#4CAF50]">
              -${discount.toFixed(2)}
            </span>
          </div>
          <div className="pt-3 border-t border-[#0000001A] flex items-center justify-between">
            <span className="text-[15px] sm:text-[16px] font-poppins font-bold text-gray-900">
              Total Amount
            </span>
            <span className="text-[16px] sm:text-[18px] font-poppins font-bold text-gray-900">
              ${totalAmount.toFixed(2)}
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

      {/* Terms and Confirm Button */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-[#0000001A] mt-3">
        <p className="text-[11px] sm:text-[12px] font-poppins text-gray-600 text-center mb-4">
          By Clicking &apos;Confirm & Pay&apos;, you agree to Kraftigos Terms of
          Service and privacy Policy. Payments are processed securely
        </p>
        <button
          onClick={handleConfirmPayment}
          disabled={isSubmitting}
          className="w-full py-3 bg-brand-orange text-white text-[16px] sm:text-[17px] font-poppins font-semibold rounded-lg hover:bg-brand-orange-dark transition-colors disabled:opacity-60"
        >
          {isSubmitting
            ? "Processing..."
            : `Confirm & Pay $${totalAmount.toFixed(2)}`}
        </button>
      </div>

      {showPaymentModal && (
        <PaymentFlowModal onClose={() => setShowPaymentModal(false)} />
      )}
    </div>
  );
};

export default Page;
