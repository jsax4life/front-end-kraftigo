"use client";

import { Toaster, ToastBar, toast, resolveValue, type ToasterProps, type Toast } from "react-hot-toast";
import { X } from "lucide-react";
import type { ReactElement } from "react";

function renderToast(t: Toast): ReactElement {
  if (t.type === "custom") {
    return <>{resolveValue(t.message, t)}</>;
  }

  return (
    <div className="pointer-events-auto relative max-w-[min(100vw-1.5rem,24rem)] rounded-lg border border-gray-200 bg-white pr-10 shadow-lg">
      <ToastBar toast={t} />
      <button
        type="button"
        onClick={() => toast.dismiss(t.id)}
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
        aria-label="Dismiss notification"
      >
        <X size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}

export default function DismissibleToaster(props: ToasterProps) {
  return <Toaster {...props}>{renderToast}</Toaster>;
}
