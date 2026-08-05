import { formatReviewStatusLabel, reviewStarsLabel, type MyReview } from "@/lib/reviewDisplay";

type SubmittedReviewSummaryProps = {
  review: MyReview;
  /** e.g. "Krafter" or customer first name */
  revieweeLabel?: string;
};

export default function SubmittedReviewSummary({
  review,
  revieweeLabel,
}: SubmittedReviewSummaryProps) {
  const who = revieweeLabel ?? review.revieweeName ?? "them";

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-4 space-y-2">
      <p className="text-[14px] font-poppins font-semibold text-[#1D2939]">
        You rated {who}
      </p>
      <p className="text-[18px] text-amber-500 tracking-wide" aria-label={`${review.rating} out of 5 stars`}>
        {reviewStarsLabel(review.rating)}
        <span className="sr-only">{review.rating} out of 5</span>
      </p>
      {review.comment ? (
        <p className="text-[13px] font-poppins text-[#475467] leading-relaxed">&ldquo;{review.comment}&rdquo;</p>
      ) : null}
      {review.standoutTags && review.standoutTags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {review.standoutTags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] font-poppins font-medium text-[#667085] bg-white/80 border border-emerald-100 px-2 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
      <p className="text-[11px] font-poppins font-semibold uppercase tracking-wide text-emerald-800/80 pt-1">
        {formatReviewStatusLabel(review.status)}
      </p>
    </div>
  );
}
