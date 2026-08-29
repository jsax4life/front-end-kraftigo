"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useDisputesStore } from "@/store/useDisputesStore";
import DisputeEvidenceModal from "@/components/shared/DisputeEvidenceModal";
import { canSubmitDisputeEvidence } from "@/lib/bookingSafety";
import { DISPUTES_INVALIDATE_EVENT } from "@/lib/safetyInvalidation";
import type { SafetyDispute } from "@/lib/api/fraudPrevention";

function DisputeList() {
  const router = useRouter();
  const { disputes, isLoading, fetchMyDisputes } = useDisputesStore();
  const [evidence, setEvidence] = useState<SafetyDispute | null>(null);

  useEffect(() => {
    void fetchMyDisputes().catch(() => {});
  }, [fetchMyDisputes]);

  useEffect(() => {
    const onInvalidate = () => {
      void fetchMyDisputes().catch(() => {});
    };
    window.addEventListener(DISPUTES_INVALIDATE_EVENT, onInvalidate);
    return () => window.removeEventListener(DISPUTES_INVALIDATE_EVENT, onInvalidate);
  }, [fetchMyDisputes]);

  return (
    <main className="min-h-screen bg-white pb-24">
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button type="button" onClick={() => router.back()} className="p-1" aria-label="Back">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-[22px] font-gerat font-bold">Disputes</h1>
      </div>
      <div className="px-4 space-y-3">
        {isLoading && disputes.length === 0 ? (
          <p className="text-[13px] font-poppins text-gray-500">Loading disputes…</p>
        ) : disputes.length === 0 ? (
          <p className="text-[13px] font-poppins text-gray-500">You have no disputes yet.</p>
        ) : (
          disputes.map((d) => (
            <div key={d.id} className="rounded-2xl border border-gray-100 p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[14px] font-poppins font-semibold text-gray-900">{d.reason || "Dispute"}</p>
                <span className="text-[11px] font-poppins font-semibold uppercase tracking-wide text-brand-orange bg-orange-50 px-2 py-1 rounded-full">
                  {d.status.replace(/_/g, " ")}
                </span>
              </div>
              {d.description ? (
                <p className="text-[12px] font-poppins text-gray-600">{d.description}</p>
              ) : null}
              {canSubmitDisputeEvidence(d.status) && (
                <button
                  type="button"
                  className="text-[13px] font-poppins font-semibold text-brand-orange"
                  onClick={() => setEvidence(d)}
                >
                  Submit evidence
                </button>
              )}
            </div>
          ))
        )}
      </div>
      <DisputeEvidenceModal
        open={Boolean(evidence)}
        disputeId={evidence?.id ?? ""}
        disputeStatus={evidence?.status}
        onClose={() => setEvidence(null)}
      />
    </main>
  );
}

export default DisputeList;
