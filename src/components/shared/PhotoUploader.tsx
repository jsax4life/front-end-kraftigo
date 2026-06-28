"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { AlertCircle, Camera, Upload, X } from "lucide-react";

export interface Photo {
  id: string;
  src: string;
  file?: File;
  mediaType?: 'image' | 'video';
}

interface PhotoUploaderProps {
  photos: Photo[];
  onChange: (photos: Photo[]) => void;
  maxPhotos?: number;
  title?: string;
  /** Strip outer section chrome when nested inside another panel/modal. */
  embedded?: boolean;
}

export default function PhotoUploader({
  photos,
  onChange,
  maxPhotos = 3,
  title,
  embedded = false,
}: PhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [limitError, setLimitError] = useState(false);

  const showLimitError = () => {
    setLimitError(true);
    setTimeout(() => setLimitError(false), 3000);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    if (photos.length >= maxPhotos) {
      showLimitError();
      setShowOptions(false);
      return;
    }

    const remaining = maxPhotos - photos.length;
    const allFiles = Array.from(files);

    if (allFiles.length > remaining) {
      showLimitError();
    }

    const newPhotos: Photo[] = allFiles
      .slice(0, remaining)
      .map((file) => ({
        id: `media-${Date.now()}-${Math.random()}`,
        src: URL.createObjectURL(file),
        file,
        mediaType: file.type.startsWith("video/") ? "video" : "image",
      }));
    onChange([...photos, ...newPhotos]);
    setShowOptions(false);
  };

  const handleRemove = (id: string) => {
    onChange(photos.filter((p) => p.id !== id));
    setLimitError(false);
  };

  const canAddMore = photos.length < maxPhotos;

  return (
    <div className={embedded ? "" : "p-4 sm:p-5 border-b border-[#0000001A]"}>
      {embedded ? (
        <div className="flex justify-end mb-2">
          <span className="text-[12px] font-poppins text-gray-400">
            {photos.length}/{maxPhotos}
          </span>
        </div>
      ) : (
      <div className="flex items-center justify-between mb-3">
        {title ? (
          <h2 className="text-[20px] sm:text-[22px] font-poppins font-medium">
            {title}
          </h2>
        ) : null}
        <span className={`text-[12px] font-poppins text-gray-400 ${title ? "" : "ml-auto"}`}>
          {photos.length}/{maxPhotos}
        </span>
      </div>
      )}

      {/* Limit Error Banner */}
      {limitError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 mb-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle size={16} className="shrink-0" />
          <span className="text-[13px] font-poppins">
            You can only upload up to {maxPhotos} photo{maxPhotos !== 1 ? "s" : ""}.
          </span>
        </div>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        {/* Upload Button */}
        {canAddMore && (
          <div className="relative aspect-square">
            <button
              onClick={() => setShowOptions((prev) => !prev)}
              className="w-full h-full bg-[#F6F6F6] border border-dashed border-[#0000001A] rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
            >
              <Camera size={24} className="text-gray-600" />
              <span className="text-[11px] sm:text-[12px] font-poppins text-gray-600 text-center px-1">
                Add Media
              </span>
            </button>

            {/* Options Dropdown */}
            {showOptions && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
                {/* From Device */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <Upload size={18} className="text-gray-600" />
                  <span className="text-[13px] font-poppins text-gray-700">
                    Upload from device
                  </span>
                </button>

                {/* Take Photo */}
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-t border-gray-100"
                >
                  <Camera size={18} className="text-gray-600" />
                  <span className="text-[13px] font-poppins text-gray-700">
                    Take photo/video
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Hidden Inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*,video/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {/* Uploaded Media */}
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="aspect-square bg-gray-200 rounded-xl overflow-hidden relative"
          >
            {photo.mediaType === "video" ? (
              <video
                src={photo.src}
                className="w-full h-full object-cover"
                controls
              />
            ) : (
              <Image
                src={photo.src}
                alt="Uploaded"
                width={200}
                height={200}
                className="w-full h-full object-cover"
              />
            )}
            <button
              type="button"
              onClick={() => handleRemove(photo.id)}
              aria-label="Remove photo"
              className="absolute top-1.5 right-1.5 z-10 w-7 h-7 bg-black/70 text-white rounded-full flex items-center justify-center shadow-md border border-white/80 hover:bg-red-600 transition-colors"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
