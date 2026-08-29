"use client";

import { useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/ui/button";
import {
  DISPUTE_EVIDENCE_ALLOWED_TYPES,
  DISPUTE_EVIDENCE_MAX_BYTES,
  DISPUTE_EVIDENCE_MAX_FILES,
  validateDisputeEvidence,
} from "@/lib/api/fraudPrevention";
import { apiErrorMessage } from "@/lib/apiErrorMessage";
import { canSubmitDisputeEvidence } from "@/lib/bookingSafety";
import { useDisputesStore } from "@/store/useDisputesStore";

type Props = {
  open: boolean;
  disputeId: string;
  disputeStatus?: string | null;
  onClose: () => void;
  onSubmitted?: () => void;
};

export default function DisputeEvidenceModal({
  open,
  disputeId,
  disputeStatus,
  onClose,
  onSubmitted,
}: Props) {
  const submitEvidence = useDisputesStore((s) => s.submitEvidence);
  const isSubmitting = useDisputesStore((s) => s.isSubmitting);
  const [statement, setStatement] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  if (!open) return null;

  const locked = !canSubmitDisputeEvidence(disputeStatus ?? "OPEN");

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next = [...files, ...Array.from(list)].slice(0, DISPUTE_EVIDENCE_MAX_FILES);
    setFiles(next);
  };

  const submit = async () => {
    if (isSubmitting || locked) return;
    const payload = { statement, attachments: files };
    const validation = validateDisputeEvidence(payload);
    if (validation) {
      toast.error(validation);
      return;
    }
    try {
      await submitEvidence(disputeId, payload);
      toast.success("Evidence submitted. It cannot be edited after this.");
      setStatement("");
      setFiles([]);
      onSubmitted?.();
      onClose();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not submit evidence."));
    }
  };

  return (
    <div className="fixed inset-0 z-70 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-[20px] font-gerat font-bold">Submit evidence</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-100" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        {locked ? (
          <p className="text-[13px] font-poppins text-gray-600">
            Evidence can only be added while the dispute is open or under review.
          </p>
        ) : (
          <div className="space-y-4">
            <p className="text-[12px] font-poppins text-gray-500">
              Append-only. JPEG, PNG, WebP, PDF, MP4, or MOV. Max 5 files, 10 MB each.
            </p>
            <textarea
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              minLength={5}
              maxLength={5000}
              className="w-full h-32 p-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-poppins resize-none"
              placeholder="Statement (5–5,000 characters)"
            />
            <input
              type="file"
              multiple
              accept={[...DISPUTE_EVIDENCE_ALLOWED_TYPES].join(",")}
              onChange={(e) => addFiles(e.target.files)}
            />
            {files.length > 0 && (
              <ul className="text-[12px] font-poppins text-gray-600 space-y-1">
                {files.map((f) => (
                  <li key={`${f.name}-${f.size}`}>
                    {f.name} ({Math.round(f.size / 1024)} KB)
                    {f.size > DISPUTE_EVIDENCE_MAX_BYTES ? " — too large" : ""}
                  </li>
                ))}
              </ul>
            )}
            <Button type="button" variant="primary" fullWidth disabled={isSubmitting} onClick={() => void submit()}>
              {isSubmitting ? "Uploading…" : "Submit evidence"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
