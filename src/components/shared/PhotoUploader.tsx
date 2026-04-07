"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, Upload, X } from "lucide-react";

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
}

export default function PhotoUploader({
  photos,
  onChange,
  maxPhotos = 10,
  title,
}: PhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [showOptions, setShowOptions] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const remaining = maxPhotos - photos.length;
    const newPhotos: Photo[] = Array.from(files)
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
  };

  const canAddMore = photos.length < maxPhotos;

  return (
    <div className="p-4 sm:p-5 border-b border-[#0000001A]">
      <h2 className="text-[20px] sm:text-[22px] font-poppins font-medium mb-3">
        {title}
      </h2>

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
            className="aspect-square bg-gray-200 rounded-xl overflow-hidden relative group"
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
              onClick={() => handleRemove(photo.id)}
              className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
