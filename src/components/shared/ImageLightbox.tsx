"use client";

import { X } from "lucide-react";

type Props = {
  src: string;
  alt?: string;
  onClose: () => void;
};

/** Full-screen image viewer for task photos (tap thumbnail to open). */
export default function ImageLightbox({ src, alt = "Photo", onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      onClick={onClose}
    >
      <div className="flex justify-end p-4 shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          aria-label="Close photo viewer"
        >
          <X size={22} strokeWidth={2.5} />
        </button>
      </div>
      <div
        className="flex flex-1 items-center justify-center px-4 pb-8 min-h-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="max-h-[85vh] max-w-full w-auto object-contain rounded-lg shadow-2xl"
        />
      </div>
    </div>
  );
}
