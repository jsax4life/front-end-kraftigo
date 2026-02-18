"use client";

import { Check } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import Input from "@/components/ui/input";
import { useBookingsStore } from "@/store/useBookingsStore";
import toast from "react-hot-toast";
import { logger } from "@/utils/logger";

const Page = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceName = searchParams.get("service") || "House Cleaning";
  const address =
    searchParams.get("address") || "Hauptstraße 123 - 10115, Berlin";
  const date = searchParams.get("date") || "15th Jan, 2025";

  const [promoCode, setPromoCode] = useState("");
  const [selectedPayment, setSelectedPayment] = useState("card");
  const [hasPaymentMethods, setHasPaymentMethods] = useState(false); // Toggle this to test both states

  const hourlyRate = 41.29;
  const hours = Number(searchParams.get("hours") || "1");
  const serviceFee = 5.0;
  const discount = 10.0;
  const subtotal = hourlyRate * hours;
  const totalAmount = subtotal + serviceFee - discount;

  const { createBooking, isSubmitting } = useBookingsStore();

  const handleConfirmPayment = async () => {
    logger.log("Initiating booking creation", { serviceName, address, date });

    try {
      // Construct payload for API
      // Note: In a real app, serviceId and artisanId would be extracted from searchParams
      const payload = {
        service_id: searchParams.get("serviceId") || "mock-service-id",
        scheduled_date: new Date(date).toISOString(), // Ensure proper ISO format
        location: address,
        notes: `Hours: ${searchParams.get("hours") || "1"}, Frequency: ${searchParams.get("frequency") || "just-once"}`,
      };

      await createBooking(payload);
      
      toast.success("Booking confirmed successfully!");
      router.push("/user/book-service/confirmation");
    } catch (err: any) {
      logger.error("Booking creation failed:", err);
      toast.error(err.response?.data?.message || "Failed to create booking. Please try again.");
    }
  };

  const handleAddPayment = () => {
    // Navigate to add payment method page
    console.log("Add payment method");
  };

  const paymentMethods = [
    {
      id: "card",
      name: "Debit/Credit Card",
      details: {
        holder: "John Doe",
        number: "1234 **** **** **** 9898",
      },
    },
    {
      id: "sepa",
      name: "SEPA Direct Debit",
    },
    {
      id: "paypal",
      name: "PayPal",
    },
    {
      id: "googlepay",
      name: "Google Pay",
      logo: true,
    },
  ];

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
          {hasPaymentMethods ? "Complete Order" : "Verify Your Details"}
        </h2>
      </div>

      {/* Service Info */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-gerat font-bold mb-2">
              {serviceName}
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

        {!hasPaymentMethods ? (
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
                onClick={() => setSelectedPayment(method.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="relative flex items-top">
                      <input
                        type="radio"
                        name="payment"
                        value={method.id}
                        checked={selectedPayment === method.id}
                        onChange={(e) => setSelectedPayment(e.target.value)}
                        className="w-5 h-5 appearance-none border-2 border-gray-300 rounded-full checked:border-brand-orange checked:border-[6px] transition-all cursor-pointer"
                      />
                    </div>
                    <div className="flex-1">
                      {method.logo && method.id === "googlepay" ? (
                        <div className="flex items-center gap-2">
                          <Image
                            src="/google2.svg"
                            alt="Google Pay"
                            width={50}
                            height={20}
                            className="h-5 w-auto"
                          />{" "}
                          Pay
                        </div>
                      ) : (
                        <div>
                          <p className="text-[14px] sm:text-[15px] font-poppins font-semibold text-gray-900">
                            {method.name}
                          </p>
                          {method.details && (
                            <div className="mt-1">
                              <p className="text-[13px] font-poppins font-semibold text-gray-900">
                                {method.details.holder}
                              </p>
                              <p className="text-[12px] font-poppins text-gray-600">
                                {method.details.number}
                              </p>
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
          {isSubmitting ? "Processing..." : `Confirm & Pay $${totalAmount.toFixed(2)}`}
        </button>
      </div>
    </div>
  );
};

export default Page;
