"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { X, Lock } from "lucide-react";
import type { Stripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import toast from "react-hot-toast";
import stripePromise from "@/lib/stripe";
import {
  patchBookingCheckoutPaymentMethod,
  resumeBookingCheckout,
} from "@/lib/api/bookings";
import { isPaymentIntentClientSecret } from "@/lib/bookingPaymentCheckout";
import type { SavedPaymentMethod } from "@/lib/api/payments";
import { usePaymentStore } from "@/store/usePaymentStore";

const NEW_CARD_CHOICE = "__new__";

function resolveInitialSavedRowId(
  savedMethods: SavedPaymentMethod[],
  storeSelectedId: string | null,
): string {
  if (!savedMethods.length) return NEW_CARD_CHOICE;
  if (storeSelectedId && savedMethods.some((m) => m.id === storeSelectedId)) {
    return storeSelectedId;
  }
  const def = savedMethods.find((m) => m.isDefault);
  return def?.id ?? savedMethods[0].id;
}

async function runConfirmCardPayment(
  stripe: Stripe,
  clientSecret: string,
  returnUrl: string,
  opts:
    | { paymentMethodId: string }
    | { card: import("@stripe/stripe-js").StripeCardElement; name: string },
): Promise<boolean> {
  const payload =
    "paymentMethodId" in opts
      ? { payment_method: opts.paymentMethodId, return_url: returnUrl }
      : {
          payment_method: {
            card: opts.card,
            billing_details: { name: opts.name },
          },
          return_url: returnUrl,
        };

  const { error, paymentIntent } = await stripe.confirmCardPayment(
    clientSecret,
    payload,
  );

  if (error) {
    const msg = error.message ?? "";
    if (msg.includes("confirmation_method") && msg.includes("manual")) {
      toast.error(
        "This PaymentIntent still uses Stripe manual confirmation (older hold). New holds use automatic confirmation in the browser; retry after a fresh checkout or contact support.",
      );
      return false;
    }
    toast.error(msg || "Payment could not be completed");
    return false;
  }

  const ok =
    paymentIntent?.status === "succeeded" ||
    paymentIntent?.status === "processing" ||
    paymentIntent?.status === "requires_capture";

  if (ok) {
    toast.success("Payment authorized. Your booking will update in a moment.");
    return true;
  }
  toast.error(
    "Payment is still pending. Refresh your Krafts list in a moment.",
  );
  return true;
}

/** Card form only — used inside “Use a different card” (Elements already wraps parent). */
function NewCardFields({
  clientSecret,
  returnUrl,
  onSuccess,
}: {
  clientSecret: string;
  returnUrl: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [elementReady, setElementReady] = useState(false);
  const [nameOnCard, setNameOnCard] = useState("");

  const handleCardReady = useCallback(() => {
    setElementReady(true);
  }, []);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    const card = elements.getElement(CardElement);
    if (!card) {
      toast.error("Card field is not ready yet.");
      return;
    }
    if (!nameOnCard.trim()) {
      toast.error("Please enter the name on card");
      return;
    }
    setIsSubmitting(true);
    try {
      const ok = await runConfirmCardPayment(stripe, clientSecret, returnUrl, {
        card,
        name: nameOnCard.trim(),
      });
      if (ok) onSuccess();
    } finally {
      setIsSubmitting(false);
    }
  };

  const payDisabled = !stripe || !elements || !elementReady || isSubmitting;

  return (
    <div className="space-y-4">
      <p className="text-[13px] font-poppins text-gray-600">
        This card is only used for this payment. It does not replace your saved
        cards unless you add it in payment settings later.
      </p>
      {!stripe && (
        <p className="text-[12px] font-poppins text-gray-500">
          Connecting to Stripe…
        </p>
      )}
      <div>
        <label className="block text-[14px] font-poppins font-bold text-gray-900 mb-2">
          Name on card
        </label>
        <input
          type="text"
          placeholder="Full name"
          value={nameOnCard}
          onChange={(e) => setNameOnCard(e.target.value)}
          className="w-full p-4 border border-gray-200 rounded-xl text-[14px] font-poppins outline-none placeholder:text-gray-400 focus:border-brand-orange bg-[#FAFAFA]"
        />
      </div>
      <div>
        <label className="block text-[14px] font-poppins font-bold text-gray-900 mb-2">
          Card
        </label>
        {!elementReady && stripe && (
          <p className="text-[12px] font-poppins text-gray-500 mb-2">
            Loading card field…
          </p>
        )}
        <div className="rounded-xl border border-gray-200 bg-[#FAFAFA] px-3 py-4 focus-within:border-brand-orange transition-colors">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#111827",
                  fontFamily: "'Poppins', sans-serif",
                  "::placeholder": { color: "#9ca3af" },
                },
                invalid: { color: "#EF4444" },
              },
            }}
            onReady={handleCardReady}
          />
        </div>
      </div>
      <p className="text-[12px] font-poppins text-gray-400 flex items-center gap-1">
        <Lock size={12} />
        Secured by Stripe
      </p>
      <button
        type="button"
        onClick={handlePay}
        disabled={payDisabled}
        className="w-full bg-brand-orange hover:bg-orange-600 text-white font-poppins text-[15px] py-3.5 rounded-xl transition-colors disabled:opacity-60"
      >
        {isSubmitting ? "Processing…" : "Pay with this card"}
      </button>
    </div>
  );
}

/** Standalone: no saved methods — full sheet with card fields. */
function NewCardStandalone({
  clientSecret,
  returnUrl,
  onSuccess,
  onCancel,
}: {
  clientSecret: string;
  returnUrl: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="relative bg-white w-full max-h-[90vh] rounded-t-2xl p-4 sm:p-6 pb-8 flex flex-col shadow-xl pointer-events-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[18px] sm:text-[20px] font-poppins font-bold text-gray-900">
          Confirm payment
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 p-2 -mr-2"
          aria-label="Close"
        >
          <X size={24} strokeWidth={3} />
        </button>
      </div>
      <p className="text-[13px] font-poppins text-amber-900 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-4">
        No saved card on file. Add your card below to authorize this booking, or
        save a card from your profile first.
      </p>
      <NewCardFields
        clientSecret={clientSecret}
        returnUrl={returnUrl}
        onSuccess={onSuccess}
      />
      <button
        type="button"
        onClick={onCancel}
        className="w-full mt-3 py-3 rounded-xl border border-gray-200 text-[15px] font-poppins font-semibold text-gray-700 hover:bg-gray-50"
      >
        Not now
      </button>
    </div>
  );
}

/** Saved card(s) and optional new card in one sheet. */
function SavedOrNewCheckout({
  stripe,
  bookingId,
  clientSecret,
  onClientSecretUpdate,
  savedMethods,
  storeSelectedId,
  selectPayment,
  returnUrl,
  onSuccess,
  onCancel,
}: {
  stripe: Stripe;
  bookingId: string;
  clientSecret: string;
  onClientSecretUpdate: (clientSecret: string) => void;
  savedMethods: SavedPaymentMethod[];
  storeSelectedId: string | null;
  selectPayment: (id: string) => void;
  returnUrl: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [choice, setChoice] = useState<string>(() =>
    resolveInitialSavedRowId(savedMethods, storeSelectedId),
  );
  const [savingPm, setSavingPm] = useState(false);
  const [checkoutSyncing, setCheckoutSyncing] = useState(false);
  const checkoutSyncGenRef = useRef(0);

  useEffect(() => {
    setChoice(resolveInitialSavedRowId(savedMethods, storeSelectedId));
  }, [savedMethods, storeSelectedId]);

  const selectedRow = useMemo(
    () =>
      choice === NEW_CARD_CHOICE
        ? null
        : (savedMethods.find((m) => m.id === choice) ?? null),
    [choice, savedMethods],
  );

  const handleChoiceChange = (next: string) => {
    setChoice(next);
    if (next === NEW_CARD_CHOICE) {
      checkoutSyncGenRef.current += 1;
      setCheckoutSyncing(false);
      return;
    }
    selectPayment(next);
    const row = savedMethods.find((m) => m.id === next);
    const pmId = row?.paymentMethodId;
    if (!pmId || !bookingId) return;
    const gen = ++checkoutSyncGenRef.current;
    setCheckoutSyncing(true);
    void patchBookingCheckoutPaymentMethod(bookingId, {
      savedPaymentMethodId: pmId,
    })
      .then((r) => {
        if (gen !== checkoutSyncGenRef.current) return;
        onClientSecretUpdate(r.clientSecret);
      })
      .catch((err: unknown) => {
        if (gen !== checkoutSyncGenRef.current) return;
        const ax = err as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        toast.error(
          ax.response?.data?.message ||
            ax.message ||
            "Could not switch card for this checkout. Try again.",
        );
      })
      .finally(() => {
        if (gen === checkoutSyncGenRef.current) setCheckoutSyncing(false);
      });
  };

  const handleAuthorizeSaved = async () => {
    if (!selectedRow?.paymentMethodId) return;
    setSavingPm(true);
    try {
      const ok = await runConfirmCardPayment(stripe, clientSecret, returnUrl, {
        paymentMethodId: selectedRow.paymentMethodId,
      });
      if (ok) onSuccess();
    } finally {
      setSavingPm(false);
    }
  };

  const labelFor = (m: SavedPaymentMethod) => {
    const last4 = m.card?.last4 ?? "••••";
    const brand = m.card?.brand ? `${m.card.brand} · ` : "";
    return `${brand}•••• ${last4}${m.isDefault ? " (default)" : ""}`;
  };

  return (
    <div className="relative bg-white w-full max-h-[90vh] rounded-t-2xl p-4 sm:p-6 pb-8 flex flex-col shadow-xl pointer-events-auto overflow-y-auto no-scrollbar">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h3 className="text-[18px] sm:text-[20px] font-poppins font-bold text-gray-900">
          Confirm payment
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 p-2 -mr-2"
          aria-label="Close"
        >
          <X size={24} strokeWidth={3} />
        </button>
      </div>
      <p className="text-[13px] font-poppins text-gray-600 mb-4">
        Authorize the hold for this booking. Use a saved card or enter a
        different card if you prefer (for example if your saved card has no
        available balance).
      </p>

      <fieldset className="space-y-2 mb-4">
        <legend className="sr-only">Payment method</legend>
        {savedMethods.map((m) => (
          <label
            key={m.id}
            className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
              choice === m.id
                ? "border-brand-orange bg-orange-50/50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <input
              type="radio"
              name="booking-payment-method"
              checked={choice === m.id}
              onChange={() => handleChoiceChange(m.id)}
              className="w-4 h-4 accent-brand-orange shrink-0"
            />
            <span className="text-[14px] font-poppins text-gray-900">
              {labelFor(m)}
            </span>
          </label>
        ))}
        <label
          className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
            choice === NEW_CARD_CHOICE
              ? "border-brand-orange bg-orange-50/50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <input
            type="radio"
            name="booking-payment-method"
            checked={choice === NEW_CARD_CHOICE}
            onChange={() => handleChoiceChange(NEW_CARD_CHOICE)}
            className="w-4 h-4 accent-brand-orange shrink-0"
          />
          <span className="text-[14px] font-poppins font-semibold text-gray-900">
            Use a different card
          </span>
        </label>
      </fieldset>

      {choice !== NEW_CARD_CHOICE && selectedRow && (
        <div className="space-y-4">
          {checkoutSyncing && (
            <p className="text-[12px] font-poppins text-gray-600 flex items-center gap-2">
              <span className="inline-block w-3.5 h-3.5 border-2 border-brand-orange border-t-transparent rounded-full animate-spin shrink-0" />
              Updating checkout for the card you selected…
            </p>
          )}
          <p className="text-[12px] font-poppins text-gray-500">
            Your bank may still ask you to confirm this payment (for example 3D
            Secure).
          </p>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3.5 rounded-xl border border-gray-200 text-[15px] font-poppins font-semibold text-gray-700 hover:bg-gray-50"
            >
              Not now
            </button>
            <button
              type="button"
              onClick={handleAuthorizeSaved}
              disabled={savingPm || checkoutSyncing}
              className="flex-1 bg-brand-orange hover:bg-orange-600 text-white font-poppins text-[15px] py-3.5 rounded-xl transition-colors disabled:opacity-60"
            >
              {savingPm ? "Processing…" : "Authorize with saved card"}
            </button>
          </div>
        </div>
      )}

      {choice === NEW_CARD_CHOICE && (
        <Elements
          key={`${clientSecret}-new-card`}
          stripe={stripe}
          options={{ clientSecret }}
        >
          <NewCardFields
            clientSecret={clientSecret}
            returnUrl={returnUrl}
            onSuccess={onSuccess}
          />
          <button
            type="button"
            onClick={onCancel}
            className="w-full mt-3 py-3 rounded-xl border border-gray-200 text-[15px] font-poppins font-semibold text-gray-700 hover:bg-gray-50"
          >
            Not now
          </button>
        </Elements>
      )}
    </div>
  );
}

export interface BookingPaymentConfirmModalProps {
  open: boolean;
  bookingId: string;
  initialClientSecret?: string | null;
  returnUrl?: string;
  onClose: () => void;
  onComplete: () => void;
}

export default function BookingPaymentConfirmModal({
  open,
  bookingId,
  initialClientSecret,
  returnUrl: returnUrlProp,
  onClose,
  onComplete,
}: BookingPaymentConfirmModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stripeJs, setStripeJs] = useState<Stripe | null | undefined>(
    undefined,
  );
  const [paymentMethodsReady, setPaymentMethodsReady] = useState(false);

  const savedMethods = usePaymentStore((s) => s.savedMethods);
  const selectedPaymentId = usePaymentStore((s) => s.selectedPaymentId);
  const fetchSavedMethods = usePaymentStore((s) => s.fetchSavedMethods);
  const selectPayment = usePaymentStore((s) => s.selectPayment);

  const returnUrl =
    returnUrlProp ??
    (typeof window !== "undefined" ? window.location.href : "");

  useEffect(() => {
    if (!open) {
      setPaymentMethodsReady(false);
      return;
    }
    let cancelled = false;
    void fetchSavedMethods().finally(() => {
      if (!cancelled) setPaymentMethodsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [open, fetchSavedMethods]);

  useEffect(() => {
    if (!open || !clientSecret) {
      setStripeJs(undefined);
      return;
    }
    let cancelled = false;
    stripePromise.then((s) => {
      if (!cancelled) setStripeJs(s);
    });
    return () => {
      cancelled = true;
    };
  }, [open, clientSecret]);

  useEffect(() => {
    if (!open) {
      setClientSecret(null);
      setLoadError(null);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const trimmed = initialClientSecret?.trim();
        if (trimmed && isPaymentIntentClientSecret(trimmed)) {
          if (!cancelled) setClientSecret(trimmed);
        } else {
          const r = await resumeBookingCheckout(bookingId);
          if (!cancelled) setClientSecret(r.clientSecret);
        }
      } catch (err: unknown) {
        const ax = err as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        const msg =
          ax.response?.data?.message ||
          ax.message ||
          "Could not start payment. Try again or contact support.";
        if (!cancelled) setLoadError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [open, bookingId, initialClientSecret]);

  const handleSuccess = () => {
    onComplete();
    onClose();
  };

  const applyCheckoutClientSecret = useCallback((secret: string) => {
    setClientSecret(secret);
  }, []);

  if (!open) return null;

  const elementsOptions = clientSecret ? { clientSecret } : undefined;

  const stripeConfigError =
    clientSecret && stripeJs === null
      ? "Stripe is not configured. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to your environment (same Stripe account as the server / PaymentIntent)."
      : null;

  const readyForCheckout = Boolean(
    clientSecret &&
    elementsOptions &&
    !stripeConfigError &&
    stripeJs &&
    paymentMethodsReady,
  );

  return (
    <div className="fixed inset-0 z-130 flex flex-col justify-end sm:justify-center sm:items-center sm:p-4 bg-black/50 animate-in fade-in duration-200">
      <button
        type="button"
        className="absolute inset-0 cursor-default sm:cursor-pointer"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-md z-131 pointer-events-auto">
        {loading && !clientSecret && (
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-10 flex justify-center">
            <div className="w-9 h-9 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {loadError && !clientSecret && (
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 space-y-4">
            <p className="text-[14px] font-poppins text-gray-800">
              {loadError}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-gray-100 font-poppins font-semibold text-[15px]"
            >
              Close
            </button>
          </div>
        )}
        {clientSecret && elementsOptions && stripeConfigError && (
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 space-y-4">
            <p className="text-[14px] font-poppins text-gray-800">
              {stripeConfigError}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-gray-100 font-poppins font-semibold text-[15px]"
            >
              Close
            </button>
          </div>
        )}
        {readyForCheckout && savedMethods.length > 0 && stripeJs && (
          <SavedOrNewCheckout
            stripe={stripeJs}
            bookingId={bookingId}
            clientSecret={clientSecret!}
            onClientSecretUpdate={applyCheckoutClientSecret}
            savedMethods={savedMethods}
            storeSelectedId={selectedPaymentId}
            selectPayment={selectPayment}
            returnUrl={returnUrl}
            onSuccess={handleSuccess}
            onCancel={onClose}
          />
        )}
        {readyForCheckout && savedMethods.length === 0 && stripeJs && (
          <Elements
            key={clientSecret!}
            stripe={stripeJs}
            options={elementsOptions!}
          >
            <NewCardStandalone
              clientSecret={clientSecret!}
              returnUrl={returnUrl}
              onSuccess={handleSuccess}
              onCancel={onClose}
            />
          </Elements>
        )}
        {clientSecret &&
          elementsOptions &&
          !stripeConfigError &&
          stripeJs !== undefined &&
          stripeJs !== null &&
          !paymentMethodsReady && (
            <div className="bg-white rounded-t-2xl sm:rounded-2xl p-10 flex justify-center">
              <div className="w-9 h-9 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        {clientSecret &&
          elementsOptions &&
          !stripeConfigError &&
          stripeJs === undefined && (
            <div className="bg-white rounded-t-2xl sm:rounded-2xl p-10 flex justify-center">
              <div className="w-9 h-9 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
            </div>
          )}
      </div>
    </div>
  );
}
