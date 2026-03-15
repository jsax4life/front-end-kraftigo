"use client";

import { ArrowLeft, X, ChevronRight, Lock } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import toast from "react-hot-toast";
import { usePaymentStore } from "@/store/usePaymentStore";
import stripePromise from "@/lib/stripe";

interface PaymentFlowModalProps {
  onClose: () => void;
}

// ─── Card Element appearance ───────────────────────────────────────────────────
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: "15px",
      fontFamily: "'Poppins', sans-serif",
      color: "#111827",
      "::placeholder": { color: "#9CA3AF" },
    },
    invalid: { color: "#EF4444" },
  },
};

// ─── Inner form — must be a child of <Elements> ────────────────────────────────
interface StripeCardFormProps {
  clientSecret: string;
  onSuccess: (paymentMethodId: string) => void;
  onCancel: () => void;
}

const StripeCardForm = ({ clientSecret, onSuccess, onCancel }: StripeCardFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameOnCard, setNameOnCard] = useState("");

  const handleDone = async () => {
    if (!stripe || !elements) return;
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    if (!nameOnCard.trim()) {
      toast.error("Please enter the name on card");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: { name: nameOnCard },
        },
      });

      if (error) {
        toast.error(error.message ?? "Card setup failed");
        return;
      }

      const pmId =
        typeof setupIntent?.payment_method === "string"
          ? setupIntent.payment_method
          : setupIntent?.payment_method?.id;

      if (pmId) {
        onSuccess(pmId);
      } else {
        toast.error("Could not retrieve payment method ID");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative bg-white w-full h-[90vh] rounded-t-2xl p-4 sm:p-6 pb-8 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[18px] sm:text-[20px] font-poppins font-bold">
          Add Debit/Credit Card
        </h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 p-2 -mr-2"
        >
          <X size={24} strokeWidth={3} />
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-6">
        {/* Name on card */}
        <div>
          <label className="block text-[14px] font-poppins font-bold text-gray-900 mb-2">
            Name on Card
          </label>
          <input
            type="text"
            placeholder="Full Name"
            value={nameOnCard}
            onChange={(e) => setNameOnCard(e.target.value)}
            className="w-full p-4 border border-gray-200 rounded-xl text-[14px] font-poppins outline-none placeholder:text-gray-400 focus:border-brand-orange bg-[#FAFAFA]"
          />
        </div>

        {/* Stripe Card Element */}
        <div>
          <label className="block text-[14px] font-poppins font-bold text-gray-900 mb-2">
            Card Details
          </label>
          <div className="w-full p-4 border border-gray-200 rounded-xl bg-[#FAFAFA] focus-within:border-brand-orange transition-colors">
            <CardElement options={CARD_ELEMENT_OPTIONS} />
          </div>
          <p className="text-[12px] font-poppins text-gray-400 mt-2 flex items-center gap-1">
            <Lock size={12} />
            Secured by Stripe. We never store your card details.
          </p>
        </div>
      </div>

      {/* Done Button */}
      <div className="mt-4 pt-2">
        <button
          className="w-full bg-brand-orange hover:bg-orange-600 text-white font-poppins text-[16px] py-3.5 rounded-xl transition-colors disabled:opacity-60"
          onClick={handleDone}
          disabled={!stripe || isSubmitting}
        >
          {isSubmitting ? "Saving card…" : "Save Card"}
        </button>
      </div>
    </div>
  );
};

// ─── Main Modal ───────────────────────────────────────────────────────────────
const PaymentFlowModal = ({ onClose }: PaymentFlowModalProps) => {
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

  // Load saved methods on mount
  useEffect(() => {
    fetchSavedMethods();
  }, [fetchSavedMethods]);

  // ─── Open Stripe card form ────────────────────────────────────────────────
  const handleOpenCardForm = async () => {
    setShowAddMethod(false);
    // Backend requires a unique idempotency key to prevent duplicate SetupIntents
    const idempotencyKey = `card-setup-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const result = await initiateSaveCard(idempotencyKey);
    if (result?.clientSecret) {
      setClientSecret(result.clientSecret);
      setShowStripeCard(true);
    }
  };

  // ─── After Stripe confirms the card ──────────────────────────────────────
  const handleCardSuccess = async (paymentMethodId: string) => {
    const isFirst = savedMethods.length === 0;
    const ok = await persistPaymentMethod(paymentMethodId, isFirst);
    if (ok) {
      toast.success("Card saved successfully!");
      await fetchSavedMethods(); // refresh list
      if (isFirst) selectPayment(paymentMethodId);
    }
    setShowStripeCard(false);
    setClientSecret(null);
  };

  // ─── Delete a saved method ────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    const ok = await removeSavedMethod(id);
    if (ok) toast.success("Payment method removed");
  };

  // ─── Brand logo helper ────────────────────────────────────────────────────
  const cardBrand = (brand: string) => {
    const b = brand.toLowerCase();
    if (b === "visa") return <span className="text-[13px] font-poppins font-bold text-[#1A1F71]">VISA</span>;
    if (b === "mastercard") return (
      <div className="relative w-8 h-5 flex items-center">
        <div className="w-4.5 h-4.5 rounded-full bg-[#EB001B] absolute left-0 opacity-90" />
        <div className="w-4.5 h-4.5 rounded-full bg-[#F79E1B] absolute left-2.5 opacity-90 mix-blend-multiply" />
      </div>
    );
    return <span className="text-[12px] font-poppins text-gray-600 capitalize">{brand}</span>;
  };

  return (
    <div className="fixed inset-0 z-100 bg-white flex flex-col animate-in fade-in duration-200">
      {/* Header */}
      <div className="px-4 py-6">
        <button
          type="button"
          onClick={() => {
            if (showStripeCard) { setShowStripeCard(false); setClientSecret(null); }
            else if (showAddMethod) setShowAddMethod(false);
            else onClose();
          }}
          className="text-gray-900 p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-[20px] sm:text-[22px] font-gerat font-bold mt-2">
          Payment Methods
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
              You have not added any payment methods
            </p>
          </div>
          <div className="p-4 pb-8">
            <button
              onClick={() => setShowAddMethod(true)}
              className="w-full bg-[#0200FF] hover:bg-blue-700 text-white font-poppins text-[16px] font-medium py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <span className="text-xl font-light leading-none">+</span> add new
            </button>
          </div>
        </>
      ) : (
        <div className="flex-1 px-4 mt-4 overflow-y-auto no-scrollbar pb-32">
          <h3 className="text-[14px] sm:text-[15px] font-qurova font-bold text-gray-900 mb-4 px-1">
            Saved Payment Methods
          </h3>
          <div className="space-y-4">
            {savedMethods.map((method) => (
              <div
                key={method.id}
                onClick={() => selectPayment(method.id)}
                className={`p-5 rounded-xl border cursor-pointer transition-colors ${
                  selectedPaymentId === method.id
                    ? "bg-[#F8F9FA] border-gray-300"
                    : "bg-white border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  {/* Brand logo */}
                  <div>{method.card ? cardBrand(method.card.brand) : <span className="text-[13px] font-poppins text-gray-600 capitalize">{method.type}</span>}</div>

                  {/* Radio */}
                  <div className={`w-5.5 h-5.5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedPaymentId === method.id ? "border-black" : "border-gray-300"}`}>
                    {selectedPaymentId === method.id && <div className="w-2.5 h-2.5 bg-black rounded-full" />}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    {method.card && (
                      <>
                        <p className="font-qurova font-bold text-[15px] text-gray-900">
                          •••• •••• •••• {method.card.last4}
                        </p>
                        <p className="text-[12px] font-poppins text-gray-500 mt-0.5">
                          Expires {method.card.expMonth}/{method.card.expYear}
                        </p>
                      </>
                    )}
                    {method.isDefault && (
                      <span className="text-[11px] font-poppins font-semibold text-brand-orange mt-1 block">Default</span>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(method.id); }}
                    className="text-red-400 text-[13px] font-poppins hover:text-red-600 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <button
              onClick={() => setShowAddMethod(true)}
              className="w-full bg-[#0200FF] hover:bg-blue-700 text-white font-poppins text-[15px] py-3.5 rounded-[10px] transition-colors"
            >
              add new
            </button>
          </div>
        </div>
      )}

      {/* ── Add Payment Method Bottom Sheet ── */}
      {showAddMethod && (
        <div className="fixed inset-0 z-110 flex flex-col justify-end animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddMethod(false)} />
          <div className="relative bg-white w-full h-[90vh] rounded-t-2xl p-4 sm:p-6 pb-8 animate-in slide-in-from-bottom-full duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[18px] sm:text-[20px] font-poppins font-bold">
                Add a Payment Method
              </h3>
              <button onClick={() => setShowAddMethod(false)} className="text-gray-400 hover:text-gray-600 p-2 -mr-2">
                <X size={24} strokeWidth={3} />
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleOpenCardForm}
                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-gray-400 transition-colors bg-white"
              >
                <span className="font-poppins text-[14px] sm:text-[15px] text-gray-800">Debit/Credit Card</span>
                <ChevronRight className="text-gray-400" size={20} />
              </button>

              {/* SEPA — stub */}
              <button className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-gray-400 transition-colors bg-white opacity-50 cursor-not-allowed">
                <span className="font-poppins text-[14px] sm:text-[15px] text-gray-800">SEPA Direct Debit</span>
                <ChevronRight className="text-gray-400" size={20} />
              </button>

              {/* PayPal */}
              <button
                onClick={() => { setShowAddMethod(false); setShowAddPaypal(true); }}
                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-gray-400 transition-colors bg-white"
              >
                <span className="font-poppins text-[14px] sm:text-[15px] text-gray-800">PayPal</span>
                <ChevronRight className="text-gray-400" size={20} />
              </button>

              {/* Google Pay — stub */}
              <button className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-gray-400 transition-colors bg-white opacity-50 cursor-not-allowed">
                <div className="flex items-center gap-2">
                  <Image src="/google2.svg" alt="Google Pay" width={50} height={20} className="h-4 w-auto object-contain" />
                  <span className="font-poppins text-[14px] sm:text-[15px] text-gray-800">Pay</span>
                </div>
                <ChevronRight className="text-gray-400" size={20} />
              </button>
            </div>

            <div className="flex items-start justify-center gap-2 mt-8 px-4">
              <Lock size={16} className="text-gray-600 shrink-0 mt-0.5" />
              <p className="font-poppins text-gray-600 text-[12px] sm:text-[13px] text-center max-w-xs leading-relaxed">
                Your payment details are encrypted and never shared with Krafters.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Stripe Card Entry Bottom Sheet ── */}
      {showStripeCard && clientSecret && (
        <div className="fixed inset-0 z-120 flex flex-col justify-end animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setShowStripeCard(false); setClientSecret(null); }} />
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <StripeCardForm
              clientSecret={clientSecret}
              onSuccess={handleCardSuccess}
              onCancel={() => { setShowStripeCard(false); setClientSecret(null); }}
            />
          </Elements>
        </div>
      )}

      {/* ── PayPal stub ── */}
      {showAddPaypal && (
        <div className="fixed inset-0 z-120 flex flex-col justify-end animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddPaypal(false)} />
          <div className="relative bg-white w-full h-[90vh] rounded-t-2xl p-4 sm:p-6 pb-8 animate-in slide-in-from-bottom-full duration-300 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[18px] sm:text-[20px] font-poppins font-medium">Connect Paypal</h3>
              <button onClick={() => setShowAddPaypal(false)} className="text-gray-400 hover:text-gray-600 p-2 -mr-2">
                <X size={24} strokeWidth={3} />
              </button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center -mt-20">
              <div className="flex flex-col items-center gap-1">
                <Image src="/craft.svg" alt="Kraftigo" width={100} height={35} className="w-30 h-auto mb-2" />
                <div className="flex flex-col items-center py-2 h-16 w-10">
                  <div className="w-0.5 h-4 bg-brand-orange border-l border-brand-orange border-dashed" />
                  <div className="relative flex items-center justify-center w-6 h-6 my-1">
                    <div className="absolute inset-0 border-[3px] border-brand-orange rounded-full" />
                  </div>
                  <div className="w-0.5 h-4 bg-brand-orange border-l border-brand-orange border-dashed" />
                </div>
                <Image src="/paypal.svg" alt="PayPal" width={100} height={25} className="w-25 h-auto mt-2" />
              </div>
              <p className="font-poppins text-[13px] text-gray-500 mt-10">Launching PayPal…</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentFlowModal;
