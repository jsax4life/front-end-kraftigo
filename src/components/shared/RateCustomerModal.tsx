"use client";

import React, { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import Button from "../ui/button";

interface RateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  customerAvatar: string;
  onSubmit: (rating: number, tags: string[], feedback: string) => void;
}

const RateCustomerModal = ({
  isOpen,
  onClose,
  customerName,
  customerAvatar,
  onSubmit,
}: RateCustomerModalProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");

  if (!isOpen) return null;

  const ratingLabels = [
    "Poor experience",
    "Below average",
    "Good experience",
    "Great experience",
    "Excellent experience",
  ];

  const tags = [
    "Clear Instructions",
    "Respectful",
    "Safe Environment",
    "On time",
    "Easy communication",
    "Accurate Brief",
  ];

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    onSubmit(rating, selectedTags, feedback);
    onClose();
  };

  const firstName = customerName.split(" ")[0];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 bottom-0 flex items-end justify-center">
      {/* Outer dashed-border card */}
      <div className="relative bg-white rounded-t-xl w-full max-w-md mx-auto p-4">
        {/* Close button */}
        <div className="flex justify-end mb-1">
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="max-h-[82vh] overflow-y-auto pb-0">
          <div className="px-5 pt-6 pb-4">
            {/* Customer Avatar */}
            <div className="flex justify-center mb-4">
              <div className="relative w-25 h-25 rounded-2xl overflow-hidden">
                <Image
                  src={customerAvatar}
                  alt={customerName}
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-1">
              <h2 className="text-[20px] font-bold text-gray-900 mb-2">
                How Did {firstName} Do?
              </h2>
              <p className="text-[13px] text-gray-500 leading-snug">
                Your feedback helps keep the kraftigo <br />
                communoty safe and reliable for everyone.
              </p>
            </div>

            {/* Star Rating */}
            <div className="flex justify-center gap-2 my-5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill={
                      star <= (hoveredRating || rating) ? "#FF6600" : "#D1D5DB"
                    }
                    stroke="none"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </button>
              ))}
            </div>

            {/* Rating Label */}
            <div className="text-center h-5 mb-5">
              {rating > 0 && (
                <p className="text-brand-orange font-medium text-[14px]">
                  {ratingLabels[rating - 1]}
                </p>
              )}
            </div>

            {/* Tags Section */}
            <div className="mb-5">
              <h3 className="text-[15px] font-bold text-gray-900 mb-3 text-center">
                What stood out to you?
              </h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-4 py-2 rounded-full text-[13px] font-medium border transition-colors ${
                      selectedTags.includes(tag)
                        ? "bg-[#FFF0E8] text-brand-orange border-brand-orange"
                        : "bg-white text-gray-700 border-gray-300"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback Textarea */}
            <div className="mb-5">
              <h3 className="text-[15px] font-bold text-gray-900 mb-3 text-center">
                Tell us more
              </h3>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tell us more about your experience (optional)"
                className="w-full h-24 p-3 bg-[#F6F6F6] border border-dashed border-gray-300 rounded-xl text-[13px] text-gray-400 resize-none focus:outline-none focus:border-brand-orange"
              />
            </div>
          </div>

          {/* Sticky Action Buttons */}
          <div className="px-3 pb-5 pt-1 space-y-3 border-t border-gray-100">
            <Button onClick={handleSubmit} variant="primary" fullWidth>
              Done
            </Button>

            <Button onClick={onClose} variant="secondary" fullWidth>
              Report Issue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RateCustomerModal;
