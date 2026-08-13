"use client";

import { ArrowLeft, X, ChevronRight, Lock } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useElements, useStripe, CardElement, Elements } from "@stripe/react-stripe-js";
import toast from "react-hot-toast";
import { usePaymentStore } from "@/store/usePaymentStore";
import stripePromise from "@/lib/stripe";
import { useTranslations } from "next-intl";

interface PaymentFlowModalProps {
  onClose: () => void;
}

const CARD_ELEMENT_STYLE = {
  base: {
    fontSize: "16px",
    color: "#111827",
    fontFamily: "'Poppins', sans-serif",
    "::placeholder": { color: "#9ca3af" },
  },
  invalid: { color: "#EF4444" },
} as const;

// ─── Inner form — must be a child of <Elements> ────────────────────────────────
interface StripeCardFormProps {
  clientSecret: string;
  onSuccess: (paymentMethodId: string) => void;
  onCancel: () => void;
}

const StripeCardForm = ({
  clientSecret,
  onSuccess,
  onCancel,
}: StripeCardFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const t = useTranslations("modals.payment");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameOnCard, setNameOnCard] = useState("");
  const [elementReady, setElementReady] = useState(false);

  const handleCardReady = useCallback(() => {
    setElementReady(true);
  }, []);

  const handleDone = async () => {
    if (!stripe || !elements) return;

    const card = elements.getElement(CardElement);
    if (!card) {
      toast.error(t("errors.cardNotReady"));
      return;
    }

    if (!nameOnCard.trim()) {
      toast.error(t("errors.nameRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      const returnUrl =
        typeof window !== "undefined" ? window.location.href : "";

      const { error, setupIntent } = await stripe.confirmCardSetup(
        clientSecret,
        {
          payment_method: {
            card,
            billing_details: { name: nameOnCard.trim() },
          },
          return_url: returnUrl,
        },
      );

      if (error) {
        const isMissingIntent =
          error.code === "resource_missing" ||
          (error.message ?? "").toLowerCase().includes("no such setupintent");
        toast.error(
          isMissingIntent
            ? t("errors.stripeKeysMismatch")
            : (error.message ?? t("errors.cardSetupFailed")),
        );
        return;
      }

      const pmId =
        typeof setupIntent?.payment_method === "string"
          ? setupIntent.payment_method
          : setupIntent?.payment_method?.id;

      if (pmId) {
        onSuccess(pmId);
      } else {
        toast.error(t("errors.noMethodId"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveDisabled = !stripe || !elementReady || isSubmitting;

  return (
    <div className="relative bg-white w-full max-w-4xl h-[90vh] rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 pb-8 flex flex-col notranslate">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-gray-100 relative">
        <h3 className="text-[18px] sm:text-[20px] font-poppins font-bold">
          {t("buttons.addPaymentMethod")}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 p-2 -mr-2"
        >
          <X size={24} strokeWidth={3} />
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto space-y-6">
        {!stripe && (
          <p className="text-[12px] font-poppins text-gray-500">
            {t("info.connecting")}
          </p>
        )}

        <div>
          <label className="block text-[14px] font-poppins font-bold text-gray-900 mb-2">
            {t("labels.nameOnCard")}
          </label>
          <input
            type="text"
            placeholder={t("labels.fullName")}
            value={nameOnCard}
            onChange={(e) => setNameOnCard(e.target.value)}
            className="w-full p-4 border border-gray-200 rounded-xl text-[14px] font-poppins outline-none placeholder:text-gray-400 focus:border-brand-orange bg-[#FAFAFA]"
          />
        </div>

        <div>
          <label className="block text-[14px] font-poppins font-bold text-gray-900 mb-2">
            {t("labels.cardDetails")}
          </label>
          {!elementReady && stripe && (
            <p className="text-[12px] font-poppins text-gray-500 mb-2">
              Loading card field…
            </p>
          )}
          <div className="min-h-[52px] rounded-xl border border-gray-200 bg-[#FAFAFA] px-3 py-4 focus-within:border-brand-orange transition-colors">
            <CardElement
              options={{ style: CARD_ELEMENT_STYLE }}
              onReady={handleCardReady}
            />
          </div>
          <p className="text-[12px] font-poppins text-gray-400 mt-4 flex items-center gap-1">
            <Lock size={14} />
            {t("info.securedByStripe")}
          </p>
        </div>
      </div>

      {/* Done Button */}
      <div className="mt-4 pt-2">
        <button
          type="button"
          className={`w-full p-4 rounded-xl font-poppins font-bold text-white transition-colors ${
            saveDisabled ? "bg-gray-300" : "bg-black hover:bg-gray-800"
          }`}
          onClick={handleDone}
          disabled={saveDisabled}
        >
          {isSubmitting ? "..." : t("buttons.saveCard")}
        </button>
      </div>
    </div>
  );
};

// ─── Main Modal ───────────────────────────────────────────────────────────────
const PaymentFlowModal = ({ onClose }: PaymentFlowModalProps) => {
  const t = useTranslations("modals.payment");
  const {
    savedMethods,
    selectedPaymentId,
    selectPayment,
    fetchSavedMethods,
    initiateSaveCard,
    persistPaymentMethod,
    removeSavedMethod,
    isLoading,
  } = usePaymentStore();

  const [showAddMethod, setShowAddMethod] = useState(false);
  const [showStripeCard, setShowStripeCard] = useState(false);
  const [showAddPaypal, setShowAddPaypal] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isOpeningCard, setIsOpeningCard] = useState(false);
  const [stripeReady, setStripeReady] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    stripePromise.then((stripe) => {
      if (!cancelled) setStripeReady(stripe !== null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Load saved methods on mount
  useEffect(() => {
    fetchSavedMethods();
  }, [fetchSavedMethods]);

  const handleOpenCardForm = async () => {
    setShowAddMethod(false);
    setIsOpeningCard(true);
    try {
      const idempotencyKey = `card-setup-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const result = await initiateSaveCard(idempotencyKey);
      if (result?.clientSecret) {
        setClientSecret(result.clientSecret);
        setShowStripeCard(true);
      } else {
        toast.error(
          usePaymentStore.getState().error ?? "Could not start card setup",
        );
      }
    } finally {
      setIsOpeningCard(false);
    }
  };

  const handleCardSuccess = async (paymentMethodId: string) => {
    const isFirst = savedMethods.length === 0;
    const ok = await persistPaymentMethod(paymentMethodId, isFirst);
    if (ok) {
      toast.success("Card saved successfully!");
      const list = usePaymentStore.getState().savedMethods;
      const row =
        list.find((m) => m.paymentMethodId === paymentMethodId) ?? list[0];
      if (row) selectPayment(row.id);
    } else {
      toast.error(
        usePaymentStore.getState().error ?? "Failed to save payment method",
      );
    }
    setShowStripeCard(false);
    setClientSecret(null);
  };

  const handleDelete = async (id: string) => {
    const ok = await removeSavedMethod(id);
    if (ok) toast.success("Payment method removed");
  };

  const cardBrand = (brand: string) => {
    const b = brand.toLowerCase();
    if (b === "visa")
      return (
        <span className="text-[13px] font-poppins font-bold text-[#1A1F71]">
          VISA
        </span>
      );
    if (b === "mastercard")
      return (
        <div className="relative w-8 h-5 flex items-center">
          <div className="w-4.5 h-4.5 rounded-full bg-[#EB001B] absolute left-0 opacity-90" />
          <div className="w-4.5 h-4.5 rounded-full bg-[#F79E1B] absolute left-2.5 opacity-90 mix-blend-multiply" />
        </div>
      );
    return (
      <span className="text-[12px] font-poppins text-gray-600 capitalize">
        {brand}
      </span>
    );
  };

  // CardElement + confirmCardSetup only needs the publishable key here; the
  // SetupIntent clientSecret is used at confirm time (same account as backend).
  const stripeOptions = undefined;

  const stripeConfigError =
    stripeReady === false
      ? "Stripe is not configured. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to your environment (same Stripe account + mode as the API secret key)."
      : null;

  const handleAddNew = () => setShowAddMethod(true);

  return (
    <div className="fixed inset-0 z-100 bg-black/50 flex items-end sm:items-center justify-center animate-in fade-in duration-200">
      <div className="w-full max-w-4xl h-full sm:max-h-[90vh] bg-white sm:rounded-2xl flex flex-col relative sm:shadow-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-6">
        <button
          type="button"
          onClick={() => {
            if (showStripeCard) {
              setShowStripeCard(false);
              setClientSecret(null);
            } else if (showAddMethod) setShowAddMethod(false);
            else onClose();
          }}
          className="text-gray-900 p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-[20px] sm:text-[22px] font-gerat font-bold mt-2">
          {t("buttons.paymentMethodsTitle")}
        </h2>
      </div>

      {/* Body */}
      {isLoading && savedMethods.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
        </div>
      ) : savedMethods.length === 0 ? (
        <>
          <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-20">
            <Image src="/credit.svg" alt="credit" width={200} height={200} />
            <p className="text-gray-500 font-poppins text-[14px] sm:text-[15px] text-center max-w-xs mt-6">
              {t("info.noSavedCards")}
            </p>
          </div>
          <div className="p-4 pb-8">
            <button
              onClick={handleAddNew}
              className="w-full bg-[#0200FF] hover:bg-blue-700 text-white font-poppins text-[16px] font-medium py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {t("buttons.addNew")}
            </button>
          </div>
        </>
      ) : (
        <div className="flex-1 px-4 mt-4 overflow-y-auto no-scrollbar pb-32">
          <h3 className="text-[14px] sm:text-[15px] font-mabry font-bold text-gray-900 mb-4 px-1">
            {t("labels.savedCards")}
          </h3>
          <div className="space-y-4">
            {savedMethods.map((method) => {
              // Extract data safely
              const cardData =
                method.card ||
                (method as any).details ||
                (method as any).paymentMethod?.card ||
                ((method as any).brand ? method : null);
              const brand = (
                cardData?.brand ||
                (method as any).cardBrand ||
                ""
              ).toLowerCase();
              const last4 =
                cardData?.last4 ||
                cardData?.number?.slice(-4) ||
                (method as any).cardLast4 ||
                "****";

              return (
                <div
                  key={method.id}
                  onClick={() => selectPayment(method.id)}
                  className={`relative p-5 rounded-2xl border transition-all cursor-pointer ${
                    selectedPaymentId === method.id
                      ? "bg-[#F4F4F5] border-gray-300" 
                      : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {/* Top Row: Logo & Radio Button */}
                  <div className="flex justify-between items-start mb-4">
                    {/* Logo Badge (White background container) */}
                    <div className="bg-white w-[42px] h-[28px] rounded flex items-center justify-center shadow-sm border border-gray-100">
                      {brand === "mastercard" ? (
                        <div className="flex items-center">
                          <div className="w-3.5 h-3.5 rounded-full bg-[#EB001B] opacity-90" />
                          <div className="w-3.5 h-3.5 rounded-full bg-[#F79E1B] opacity-90 -ml-1.5 mix-blend-multiply" />
                        </div>
                      ) : brand === "visa" ? (
                        <span className="text-[12px] font-bold text-[#1A1F71] italic tracking-tight">
                          VISA
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                          {brand || "Card"}
                        </span>
                      )}
                    </div>

                    {/* Custom Radio Button */}
                    <div
                      className={`w-[22px] h-[22px] rounded-full border-[2px] flex items-center justify-center shrink-0 transition-colors ${
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

                  {/* Bottom Details Row */}
                  <div className="flex flex-col gap-1.5">
                    {/* Card Number */}
                    <p className="font-poppins text-[15px] text-gray-800 tracking-widest mt-1 leading-none">
                      **** **** **** {last4}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8">
            <button
              onClick={handleAddNew}
              className="w-full flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-500 hover:bg-gray-50 transition-all group"
            >
              {t("buttons.addNew")}
            </button>
          </div>
        </div>
      )}
      </div>

      {/* ── Add Payment Method Bottom Sheet ── */}
      {showAddMethod && (
        <div className="fixed inset-0 z-110 flex items-end sm:items-center justify-center animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowAddMethod(false)}
          />
          <div className="relative bg-white w-full max-w-4xl h-[90vh] rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 pb-8 animate-in slide-in-from-bottom-full duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[18px] sm:text-[20px] font-poppins font-bold">
                {t("buttons.addPaymentMethod")}
              </h3>
              <button
                onClick={() => setShowAddMethod(false)}
                className="text-gray-400 hover:text-gray-600 p-2 -mr-2"
              >
                <X size={24} strokeWidth={3} />
              </button>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleOpenCardForm}
                disabled={isOpeningCard}
                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-gray-400 transition-colors bg-white disabled:opacity-60"
              >
                <span className="font-poppins text-[14px] sm:text-[15px] text-gray-800">
                  {isOpeningCard ? "Preparing…" : "Debit/Credit Card"}
                </span>
                <ChevronRight className="text-gray-400" size={20} />
              </button>
              <button className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-gray-400 transition-colors bg-white opacity-50 cursor-not-allowed">
                <span className="font-poppins text-[14px] sm:text-[15px] text-gray-800">
                  SEPA Direct Debit
                </span>
                <ChevronRight className="text-gray-400" size={20} />
              </button>
              <button
                onClick={() => {
                  setShowAddMethod(false);
                  setShowAddPaypal(true);
                }}
                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-gray-400 transition-colors bg-white"
              >
                <span className="font-poppins text-[14px] sm:text-[15px] text-gray-800">
                  PayPal
                </span>
                <ChevronRight className="text-gray-400" size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Stripe Card Entry Bottom Sheet ── */}
      {showStripeCard && clientSecret && (
        <div className="fixed inset-0 z-120 flex items-end sm:items-center justify-center animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setShowStripeCard(false);
              setClientSecret(null);
            }}
          />
          <div className="relative w-full max-w-4xl pointer-events-auto animate-in slide-in-from-bottom-full duration-300 sm:slide-in-from-bottom-0">
            {stripeConfigError ? (
              <div className="relative bg-white w-full max-w-4xl rounded-t-2xl sm:rounded-2xl p-6">
                <p className="text-[14px] font-poppins text-red-600">
                  {stripeConfigError}
                </p>
              </div>
            ) : (
              <Elements
                key={clientSecret}
                stripe={stripePromise}
                options={stripeOptions}
              >
                <StripeCardForm
                  clientSecret={clientSecret}
                  onSuccess={handleCardSuccess}
                  onCancel={() => {
                    setShowStripeCard(false);
                    setClientSecret(null);
                  }}
                />
              </Elements>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentFlowModal;
