"use client";

import { useState } from "react";
import { X, Star } from "lucide-react";
import Image from "next/image";

interface RatingModalProps {
  artisan: { name: string; image: string }
  onClose: () => void
  onDone: (rating: number, tags: string[], comment: string, tipAmount: number) => void
  isSubmitting?: boolean
}


const TAGS = ["Punctual", "Hygiene", "Efficient", "Communication", "Hygiene"];
const TIPS = ["$10", "$20", "$50", "Custom"];

const RATING_LABELS: Record<number, string> = {
  1: "Poor Experience",
  2: "Below Average",
  3: "Excellent Experience",
  4: "Great Experience",
  5: "Outstanding!",
};

const RatingModal = ({ artisan, onClose, onDone, isSubmitting = false }: RatingModalProps) => {
  const [rating, setRating] = useState(3);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>(["Punctual"]);
  const [review, setReview] = useState("");
  const [selectedTip, setSelectedTip] = useState("");

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const displayRating = hoveredStar || rating;

  return (
    <div className="fixed inset-0 z-60 bg-white flex flex-col">
      {/* Header */}
      <div className="flex justify-end px-5 pt-5 pb-2 shrink-0">
        <button onClick={onClose}>
          <X size={22} className="text-gray-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {/* Artisan Photo */}
        <div className="flex justify-center mb-4">
          <Image
            src={artisan.image}
            alt={artisan.name}
            width={100}
            height={100}
            className="w-24 h-24 rounded-2xl object-cover"
          />
        </div>

        {/* Title */}
        <h2 className="text-[22px] font-gerat font-bold text-black text-center mb-1">
          How Did {artisan.name} Do?
        </h2>
        <p className="text-[13px] font-poppins text-gray-500 text-center mb-5">
          Tell us about your experience
        </p>

        {/* Stars */}
        <div className="flex justify-center gap-2 mb-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              onClick={() => setRating(star)}
            >
              <Star
                size={36}
                className={
                  star <= displayRating
                    ? "text-brand-orange fill-brand-orange"
                    : "text-gray-200 fill-gray-200"
                }
              />
            </button>
          ))}
        </div>

        {/* Rating label */}
        {displayRating > 0 && (
          <p className="text-[13px] font-poppins font-semibold text-brand-orange text-center mb-5">
            {RATING_LABELS[displayRating]}
          </p>
        )}

        {/* What stood out */}
        <p className="text-[14px] font-poppins font-bold text-black text-center mb-3">
          What stood out to you?
        </p>
        <div className="flex flex-wrap justify-center gap-2 mb-5">
          {TAGS.map((tag, i) => (
            <button
              key={`${tag}-${i}`}
              onClick={() => toggleTag(tag)}
              className={`px-4 py-2 rounded-full text-[13px] font-poppins font-medium border transition-colors ${
                selectedTags.includes(tag)
                  ? "bg-brand-orange text-white border-brand-orange"
                  : "bg-white text-gray-700 border-gray-200 hover:border-brand-orange"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Tell us more */}
        <p className="text-[14px] font-poppins font-bold text-black text-center mb-2">
          Tell us more
        </p>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Share your experience..."
          className="w-full h-20 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[13px] font-poppins text-gray-700 resize-none focus:outline-none focus:border-brand-orange mb-5"
        />

        {/* Send a tip */}
        <p className="text-[14px] font-poppins font-bold text-black text-center mb-3">
          Send a tip to {artisan.name}
        </p>
        <div className="flex gap-2 justify-center mb-6">
          {TIPS.map((tip) => (
            <button
              key={tip}
              onClick={() => setSelectedTip(tip === selectedTip ? "" : tip)}
              className={`flex-1 py-2.5 rounded-xl text-[13px] font-poppins font-semibold border transition-colors ${
                selectedTip === tip
                  ? "bg-brand-orange text-white border-brand-orange"
                  : "bg-white text-gray-700 border-gray-200 hover:border-brand-orange"
              }`}
            >
              {tip}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Buttons */}
      <div className="px-5 pb-8 space-y-3 shrink-0">
        <button
          disabled={isSubmitting}
          onClick={() => {
            const tipAmount = selectedTip === "Custom" ? 0 : parseInt(selectedTip.replace("$", "")) || 0;
            onDone(rating, selectedTags, review, tipAmount);
          }}
          className="w-full py-4 bg-brand-orange text-white rounded-2xl text-[15px] font-poppins font-semibold hover:bg-orange-600 transition-colors disabled:opacity-60"
        >
          {isSubmitting ? "Submitting..." : "Done"}
        </button>
        <button
          onClick={onClose}
          className="w-full py-4 bg-brand-blue text-white rounded-2xl text-[15px] font-poppins font-semibold hover:bg-blue-700 transition-colors"
        >
          Report Issue
        </button>
      </div>
    </div>
  );
};

export default RatingModal;
