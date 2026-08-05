"use client";

import { AlertTriangle, X } from "lucide-react";
import { useEffect, useState } from "react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";

interface DeleteAccountModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (payload: {
    password?: string;
    confirmation?: "DELETE_MY_KRAFTIGO_ACCOUNT";
  }) => Promise<void>;
  /** Pre-select social confirmation flow for Google-only accounts. */
  defaultMode?: "password" | "social";
}

const SOCIAL_CONFIRMATION = "DELETE_MY_KRAFTIGO_ACCOUNT";

export default function DeleteAccountModal({
  open,
  onClose,
  onConfirm,
  defaultMode = "password",
}: DeleteAccountModalProps) {
  const [mode, setMode] = useState<"password" | "social">(defaultMode);
  const [password, setPassword] = useState("");
  const [confirmationText, setConfirmationText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) setMode(defaultMode);
  }, [open, defaultMode]);

  if (!open) return null;

  const resetAndClose = () => {
    if (isSubmitting) return;
    setPassword("");
    setConfirmationText("");
    setError(null);
    setMode("password");
    onClose();
  };

  const handleSubmit = async () => {
    setError(null);
    if (mode === "password") {
      if (!password.trim()) {
        setError("Enter your password to continue.");
        return;
      }
    } else if (confirmationText.trim() !== SOCIAL_CONFIRMATION) {
      setError(`Type ${SOCIAL_CONFIRMATION} exactly.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(
        mode === "password"
          ? { password: password.trim() }
          : { confirmation: "DELETE_MY_KRAFTIGO_ACCOUNT" },
      );
      resetAndClose();
    } catch {
      // parent shows toast message
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={resetAndClose}
    >
      <div
        className="w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl bg-white p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-600 shrink-0" />
            <h2 id="delete-account-title" className="text-[18px] font-poppins font-semibold text-[#1D2939]">
              Close account
            </h2>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            className="p-1 rounded-full text-gray-400 hover:bg-gray-100"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-3 mb-4">
          <p className="text-[13px] font-poppins text-red-900">
            This action is permanent. Your account data will be anonymized and the account will be
            deactivated. You will be logged out from all sessions.
          </p>
          <p className="text-[12px] font-poppins text-red-800 mt-2">
            Deletion may be blocked if you still have active bookings/applications.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            type="button"
            onClick={() => setMode("password")}
            className={`py-2 rounded-lg text-[13px] font-poppins font-medium border transition-colors ${
              mode === "password"
                ? "bg-brand-orange/10 text-brand-orange border-brand-orange"
                : "bg-white text-gray-700 border-gray-200"
            }`}
          >
            Password account
          </button>
          <button
            type="button"
            onClick={() => setMode("social")}
            className={`py-2 rounded-lg text-[13px] font-poppins font-medium border transition-colors ${
              mode === "social"
                ? "bg-brand-orange/10 text-brand-orange border-brand-orange"
                : "bg-white text-gray-700 border-gray-200"
            }`}
          >
            Social login
          </button>
        </div>

        {mode === "password" ? (
          <Input
            label="Confirm your password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="Enter password"
          />
        ) : (
          <Input
            label={`Type ${SOCIAL_CONFIRMATION} to confirm`}
            value={confirmationText}
            onChange={setConfirmationText}
            placeholder={SOCIAL_CONFIRMATION}
          />
        )}

        {error ? (
          <p className="text-[12px] font-poppins text-red-600 mt-2" role="alert">
            {error}
          </p>
        ) : null}

        <div className="grid grid-cols-2 gap-3 mt-5">
          <Button type="button" variant="secondary" onClick={resetAndClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
            className="!bg-red-600 hover:!bg-red-700"
          >
            {isSubmitting ? "Closing..." : "Close account"}
          </Button>
        </div>
      </div>
    </div>
  );
}

