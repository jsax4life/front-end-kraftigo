"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Stripe } from "@stripe/stripe-js";
import { Elements, useStripe } from "@stripe/react-stripe-js";
import toast from "react-hot-toast";
import stripePromise from "@/lib/stripe";
import { reauthorizeCompletionPayment } from "@/lib/api/fraudPrevention";
import { apiErrorMessage } from "@/lib/apiErrorMessage";
import { usePaymentStore } from "@/store/usePaymentStore";
import { useBookingsStore } from "@/store/useBookingsStore";
import Button from "@/components/ui/button";

type Props = {
  open: boolean;
  bookingId: string;
  onClose: () => void;
  onAuthorized?: () => void;
};

function ReauthorizeForm({
  bookingId,
  onClose,
  onAuthorized,
}: {
  bookingId: string;
  onClose: () => void;
  onAuthorized?: () => void;
}) {
  const stripe = useStripe();
  const { savedMethods, fetchSavedMethods } = usePaymentStore();
  const refetchBookingSilent = useBookingsStore((s) => s.refetchBookingSilent);
  const [methodId, setMethodId] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetchSavedMethods();
  }, [fetchSavedMethods]);

  useEffect(() => {
    if (!methodId && savedMethods.length > 0) {
      const def = savedMethods.find((m) => m.isDefault) ?? savedMethods[0];
      setMethodId(def.id);
    }
  }, [savedMethods, methodId]);

  const submit = async () => {
    if (!stripe || busy) return;
    if (!methodId) {
      toast.error("Select a saved card to reauthorize.");
      return;
    }
    setBusy(true);
    try {
      const auth = await reauthorizeCompletionPayment(bookingId, methodId);
      const { error, paymentIntent } = await stripe.confirmCardPayment(auth.clientSecret, {
        payment_method: savedMethods.find((m) => m.id === methodId)?.paymentMethodId,
      });
      if (error) {
        toast.error(error.message || "Could not confirm the new authorization.");
        return;
      }
      const ok =
        paymentIntent?.status === "succeeded" ||
        paymentIntent?.status === "processing" ||
        paymentIntent?.status === "requires_capture";
      if (!ok) {
        toast.error("Authorization is still pending. Ask the Krafter to retry Complete after it settles.");
        return;
      }
      await refetchBookingSilent(bookingId);
      toast.success("Payment reauthorized. Ask your Krafter to retry Complete.");
      onAuthorized?.();
      onClose();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not reauthorize this payment."));
      await refetchBookingSilent(bookingId);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-[13px] font-poppins text-gray-600 leading-relaxed">
        The original card hold expired. Authorize again, then the Krafter retries Complete. That
        retry resumes capture and does not pay out twice.
      </p>
      {savedMethods.length === 0 ? (
        <p className="text-[13px] font-poppins text-amber-800">
          Save a card in Payment methods first, then return here.
        </p>
      ) : (
        <select
          value={methodId}
          onChange={(e) => setMethodId(e.target.value)}
          disabled={busy}
          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] font-poppins"
        >
          {savedMethods.map((m) => (
            <option key={m.id} value={m.id}>
              {(m.card?.brand ?? "Card").toUpperCase()} •••• {m.card?.last4 ?? m.id.slice(-4)}
            </option>
          ))}
        </select>
      )}
      <Button
        type="button"
        variant="primary"
        fullWidth
        disabled={busy || !stripe || savedMethods.length === 0}
        onClick={() => void submit()}
      >
        {busy ? "Authorizing…" : "Reauthorize with Stripe"}
      </Button>
    </div>
  );
}

export default function ReauthorizeCompletionModal({
  open,
  bookingId,
  onClose,
  onAuthorized,
}: Props) {
  const [stripe, setStripe] = useState<Stripe | null>(null);

  useEffect(() => {
    void stripePromise.then(setStripe);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md p-6">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-[20px] font-gerat font-bold">Reauthorize payment</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-100" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        {stripe ? (
          <Elements stripe={stripe}>
            <ReauthorizeForm bookingId={bookingId} onClose={onClose} onAuthorized={onAuthorized} />
          </Elements>
        ) : (
          <p className="text-[13px] font-poppins text-gray-500">Loading Stripe…</p>
        )}
      </div>
    </div>
  );
}
