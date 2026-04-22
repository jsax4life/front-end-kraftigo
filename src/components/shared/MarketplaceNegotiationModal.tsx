"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";

export type MarketplaceNegotiationMode = "offer" | "counter";

export interface MarketplaceNegotiationFormValues {
  amount: string;
  openToNegotiation: boolean;
  message: string;
}

interface MarketplaceNegotiationModalProps {
  open: boolean;
  mode: MarketplaceNegotiationMode;
  onClose: () => void;
  onSubmit: (values: MarketplaceNegotiationFormValues) => void | Promise<void>;
  isSubmitting?: boolean;
}

export default function MarketplaceNegotiationModal({
  open,
  mode,
  onClose,
  onSubmit,
  isSubmitting = false,
}: MarketplaceNegotiationModalProps) {
  const [amount, setAmount] = useState("");
  const [openToNegotiation, setOpenToNegotiation] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (open) {
      setAmount("");
      setOpenToNegotiation(true);
      setMessage("");
    }
  }, [open, mode]);

  if (!open) return null;

  const handleSubmit = async () => {
    await onSubmit({ amount, openToNegotiation, message });
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[100] flex items-end"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl w-full sm:max-w-md mx-auto max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-50">
          <h2 className="text-[20px] font-gerat font-bold">
            {mode === "counter" ? "Renegotiate price" : "Send your offer"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={22} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <Input
              placeholder="€ 0.00"
              label={mode === "counter" ? "Your counter price" : "Offer amount"}
              value={amount}
              onChange={setAmount}
              type="number"
            />
          </div>

          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-1 px-1">
              <Image src="/neg.svg" alt="" width={18} height={18} />
              <span className="text-[14px] sm:text-[15px] font-poppins font-semibold text-gray-800">
                Open to negotiation
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOpenToNegotiation((v) => !v)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                openToNegotiation ? "bg-brand-orange" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  openToNegotiation ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div>
            <Input
              placeholder="E.g. I can be there tomorrow morning"
              label="Add a message"
              value={message}
              onChange={setMessage}
              type="text"
            />
          </div>

          <div className="bg-[#FF66001A] border border-[#FF6600] text-[#FF6600] text-sm flex items-start gap-2 p-2 rounded-lg">
            <Image src="/warn.svg" alt="" width={25} height={25} />
            <p>
              Once submitted, the customer will be notified and can message you directly or accept your offer.
            </p>
          </div>

          <div className="pt-2">
            <Button variant="primary" fullWidth onClick={() => void handleSubmit()} disabled={isSubmitting}>
              {isSubmitting ? "Sending…" : mode === "counter" ? "Send counter offer" : "Submit offer"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
