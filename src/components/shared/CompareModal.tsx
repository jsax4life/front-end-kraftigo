"use client";

import { useState, useEffect } from "react";
import { X, Star } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import { Application } from "@/types";
import { useBookingsStore } from "@/store/useBookingsStore";
import { formatDistanceDisplay, readDistanceFields } from "@/utils/distance";
import { formatHourlyRate } from "@/utils/currency";
import { DistanceBadge } from "@/components/ui/DistanceBadge";

interface CompareSheetProps {
  allArtisans: Application[];
  onClose: () => void;
  onSelect: (artisan: Application) => void;
  /** When true and two Krafters are selected, call POST /api/bookings/compare-krafters */
  fromRecommendations?: boolean;
  serviceCategoryId?: string;
  taskLatitude?: number;
  taskLongitude?: number;
}

// ─── Empty Slot Placeholder ───────────────────────────────────────────────────
const EmptySlot = ({ onPick }: { onPick: () => void }) => (
  <div className="flex flex-col items-center gap-3 pb-10 px-3 sm:px-8 ">
    <div className="w-full aspect-5/3 bg-gray-100 rounded-2xl " />
    <p className="text-[13px] font-poppins text-gray-500 text-center">
      Select a Krafter to compare
    </p>
    <button
      onClick={onPick}
      className="w-full py-3 bg-brand-blue text-white rounded-2xl text-[14px] font-poppins font-semibold"
    >
      Select Krafter
    </button>
  </div>
);

// ─── Filled Slot ─────────────────────────────────────────────────────────────
const FilledSlot = ({
  artisan,
  onRemove,
}: {
  artisan: Application;
  onRemove: () => void;
}) => (
  <div className="flex flex-col items-center gap-2 px-3 sm:px-8">
      <div className="relative w-full aspect-5/3 rounded-2xl overflow-hidden bg-gray-100">
      <Image
        src={artisan.image}
        alt={artisan.artisan_name}
        fill
        className="object-cover"
      />
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center"
      >
        <X size={12} className="text-white" />
      </button>
    </div>
    <p className="text-[15px] font-poppins font-bold text-black text-center">
      {artisan.artisan_name}
    </p>
    {artisan.is_top_pro && (
      <span className="text-[10px] font-poppins font-bold text-brand-orange border border-brand-orange rounded-full px-2 py-0.5">
        TOP PRO
      </span>
    )}
    <div className="flex items-center gap-1 text-[11px] font-poppins text-gray-500">
      {/* <span>{artisan.rating} ★ ({artisan.reviews_count})</span> */}
      <span className="text-[14px]">&nbsp;{artisan.tasks_count} Krafts</span>
    </div>
    <p className="text-[15px] font-mabry font-bold text-black -mt-2">{artisan.price}</p>
  </div>
);

// ─── Compare Row ─────────────────────────────────────────────────────────────
const CompareRow = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="mb-1">
    <div className="py-2 px-4 mb-3">
      <p className="text-[13px] font-poppins font-semibold text-black text-center">
        {label}
      </p>
    </div>
    <div className="grid grid-cols-2 gap-4 px-2 pb-4 relative">{children}</div>
  </div>
);

// ─── Picker Overlay ───────────────────────────────────────────────────────────
const ArtisanPicker = ({
  artisans,
  selectedArtisanIds,
  onPick,
  onClose,
}: {
  artisans: Application[];
  selectedArtisanIds: string[];
  onPick: (a: Application) => void;
  onClose: () => void;
}) => (
  <div className="fixed inset-0 z-70 bg-white flex flex-col fixed bottom-0 md:bottom-auto md:top-1/2 left-0 md:left-1/2 right-0 md:right-auto md:-translate-x-1/2 md:-translate-y-1/2 z-60 bg-white  md:rounded-[32px] max-h-[92vh] md:h-[60vh] w-full md:max-w-[600px]">
    <div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-gray-100">
      <h2 className="text-[18px] font-gerat font-bold">Select a Krafter</h2>
      <button onClick={onClose}>
        <X size={22} className="text-gray-400" />
      </button>
    </div>
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      {artisans.map((app) => (
        (() => {
          const artisanKey = String(app.artisan_id || app.id || "");
          const alreadySelected = selectedArtisanIds.includes(artisanKey);
          return (
        <button
          key={app.id}
          onClick={() => onPick(app)}
          disabled={alreadySelected}
          className={`w-full flex items-center gap-3 p-4 border border-gray-100 rounded-2xl transition-colors text-left ${
            alreadySelected ? "opacity-50 cursor-not-allowed" : "hover:border-brand-orange"
          }`}
        >
          <Image
            src={app.image}
            alt={app.artisan_name}
            width={52}
            height={52}
            className="rounded-full object-cover w-13 h-13 shrink-0"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-poppins font-bold text-black">
                {app.artisan_name}
              </span>
              {app.is_top_pro && (
                <span className="text-[10px] font-poppins font-bold text-brand-orange border border-brand-orange rounded-full px-2 py-0.5">
                  TOP PRO
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              {/* {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={11}
                  className={
                    s <= app.rating
                      ? "text-brand-orange fill-brand-orange"
                      : "text-gray-300 fill-gray-300"
                  }
                />
              ))} */}
              <span className="text-[12px] font-poppins text-gray-500 ml-1">
                {/*({app.reviews_count})*/} {app.tasks_count} Krafts
              </span>
            </div>
            <p className="text-[14px] font-mabry font-bold text-black mt-1">
              {app.price}
            </p>
            {alreadySelected && (
              <p className="text-[11px] font-poppins text-amber-700 mt-1">Already selected</p>
            )}
          </div>
        </button>
          );
        })()
      ))}
    </div>
  </div>
);

/** Map API compare response item to Application for display */
function mapCompareItemToApplication(item: any, fallback: Application): Application {
  if (!item) return fallback;
  const id = item?.id ?? item?.artisanId ?? item?.krafterId ?? fallback.id;
  const name = item?.fullName ?? item?.name ?? item?.artisanName ?? fallback.artisan_name;
  const image = item?.avatar ?? item?.image ?? item?.profilePhotoUrl ?? fallback.image;
  const price =
    item?.price ?? (item?.pricePerHour != null ? formatHourlyRate(item.pricePerHour) : fallback.price);
  const distance = readDistanceFields(item);
  return {
    ...fallback,
    id: String(id),
    artisan_id: String(id),
    artisan_name: name,
    image: image || fallback.image,
    price: price || fallback.price,
    rating: Number(item?.rating ?? fallback.rating) || 0,
    reviews_count: Number(item?.reviewsCount ?? item?.reviews_count ?? fallback.reviews_count) || 0,
    tasks_count: Number(item?.completedJobs ?? item?.tasks_count ?? fallback.tasks_count) || 0,
    description: item?.bio ?? item?.description ?? item?.reviewSnippet ?? fallback.description,
    distance: distance.distanceKm ?? fallback.distance,
    distanceLabel: distance.distanceLabel ?? fallback.distanceLabel,
  };
}

// ─── Main CompareSheet ────────────────────────────────────────────────────────
const CompareSheet = ({
  allArtisans,
  onClose,
  onSelect,
  fromRecommendations = false,
  serviceCategoryId,
  taskLatitude,
  taskLongitude,
}: CompareSheetProps) => {
  const { compareKrafters } = useBookingsStore();
  const [slots, setSlots] = useState<[Application | null, Application | null]>([
    null,
    null,
  ]);
  const [pickingSlot, setPickingSlot] = useState<0 | 1 | null>(null);
  const [showFullCompare, setShowFullCompare] = useState(false);
  const [comparisonFromApi, setComparisonFromApi] = useState<any>(null);
  const [compareLoading, setCompareLoading] = useState(false);

  const bothFilled = slots[0] !== null && slots[1] !== null;

  // When both slots filled and from recommendations, fetch compare from API
  useEffect(() => {
    if (
      !bothFilled ||
      !fromRecommendations ||
      !serviceCategoryId ||
      !slots[0]?.artisan_id ||
      !slots[1]?.artisan_id ||
      taskLatitude == null ||
      taskLongitude == null ||
      !Number.isFinite(taskLatitude) ||
      !Number.isFinite(taskLongitude)
    ) {
      setComparisonFromApi(null);
      return;
    }
    const krafterIds = [slots[0].artisan_id, slots[1].artisan_id];
    setCompareLoading(true);
    setComparisonFromApi(null);
    compareKrafters({
      krafterIds,
      serviceCategoryId,
      latitude: taskLatitude,
      longitude: taskLongitude,
    })
      .then((data) => {
        setComparisonFromApi(data);
      })
      .catch(() => {
        setComparisonFromApi(null);
      })
      .finally(() => {
        setCompareLoading(false);
      });
  }, [
    bothFilled,
    fromRecommendations,
    serviceCategoryId,
    slots[0]?.artisan_id,
    slots[1]?.artisan_id,
    taskLatitude,
    taskLongitude,
    compareKrafters,
  ]);

  const handlePick = (artisan: Application) => {
    if (pickingSlot === null) return;
    const pickedId = String(artisan.artisan_id || artisan.id || "");
    const otherSlot = pickingSlot === 0 ? slots[1] : slots[0];
    const otherId = otherSlot ? String(otherSlot.artisan_id || otherSlot.id || "") : "";
    if (pickedId && otherId && pickedId === otherId) {
      toast.error("Pick a different Krafter for comparison.");
      return;
    }
    const newSlots = [...slots] as [Application | null, Application | null];
    newSlots[pickingSlot] = artisan;
    setSlots(newSlots);
    setPickingSlot(null);
    // Auto-show full compare once both are filled
    if (pickingSlot === 1 && newSlots[0] !== null) {
      setShowFullCompare(true);
    } else if (pickingSlot === 0 && newSlots[1] !== null) {
      setShowFullCompare(true);
    }
  };

  const removeSlot = (idx: 0 | 1) => {
    const newSlots = [...slots] as [Application | null, Application | null];
    newSlots[idx] = null;
    setSlots(newSlots);
    setShowFullCompare(false);
  };

  const skills = ["Assembly", "Mounting"];

  // Use API comparison result if we have two items; else use slots (dummy/local)
  const displaySlots: [Application | null, Application | null] = (() => {
    if (compareLoading || !comparisonFromApi) return slots;
    const list = Array.isArray(comparisonFromApi)
      ? comparisonFromApi
      : comparisonFromApi?.krafters ?? comparisonFromApi?.comparisons ?? Object.values(comparisonFromApi);
    if (Array.isArray(list) && list.length >= 2 && slots[0] && slots[1]) {
      return [
        mapCompareItemToApplication(list[0], slots[0]),
        mapCompareItemToApplication(list[1], slots[1]),
      ];
    }
    return slots;
  })();

  return (
    <>
      {/* Bottom Sheet Backdrop */}
      <div className="fixed inset-0 z-60 bg-black/40" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed bottom-0 md:bottom-auto md:top-1/2 left-0 md:left-1/2 right-0 md:right-auto md:-translate-x-1/2 md:-translate-y-1/2 z-60 bg-white rounded-t-[32px] md:rounded-[32px] max-h-[92vh] md:h-[90vh] w-full md:max-w-[600px] flex flex-col  md:px-0 shadow-2xl overflow-hidden">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0 md:hidden">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 mt-0 sm:mt-7 shrink-0">
          <h2 className="text-[22px] font-gerat font-bold text-black">
            Compare Krafters
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={22} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pb-8">
          {!showFullCompare ? (
            /* ── Empty / Partial State ── */
            <div className="grid grid-cols-2 gap-4 mt-2">
              {([0, 1] as const).map((idx) =>
                slots[idx] ? (
                  <FilledSlot
                    key={idx}
                    artisan={slots[idx]!}
                    onRemove={() => removeSlot(idx)}
                  />
                ) : (
                  <EmptySlot key={idx} onPick={() => setPickingSlot(idx)} />
                )
              )}
            </div>
          ) : (
            /* ── Full Comparison State ── */
            <>
              {compareLoading && (
                <p className="text-[13px] font-poppins text-gray-500 text-center py-2">
                  Loading comparison…
                </p>
              )}
              {/* Photos + names */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {displaySlots.map((artisan, idx) =>
                  artisan ? (
                    <div key={idx} className="flex flex-col items-center text-center sm:px-5">
                      <div className="relative rounded-2xl overflow-hidden mb-3 bg-gray-100">
                        <Image
                          src={artisan.image}
                          alt={artisan.artisan_name}
                          width={200}
                          height={200}
                          className="w-[137px] h-[137px] object-cover"
                        />
                        <button
                          onClick={() => removeSlot(idx as 0 | 1)}
                          className="absolute top-2 right-2 w-6 h-6 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors z-10"
                        >
                          <X size={12} className="text-white" />
                        </button>
                      </div>
                      <p className="text-[15px] font-poppins font-bold text-black mb-1">
                        {artisan.artisan_name}
                      </p>
                      {artisan.is_top_pro && (
                        <span className="text-[10px] font-poppins font-bold text-brand-orange border border-brand-orange rounded-full px-2 py-0.5 mb-1">
                          TOP PRO
                        </span>
                      )}
                      <div className="flex items-center gap-1 text-[11px] font-poppins text-gray-500">
                        <span>
                          {/* {artisan.rating} ★ ({artisan.reviews_count}) &nbsp;{" "} */}
                          {artisan.tasks_count} Krafts
                        </span>
                      </div>
                      <p className="text-[14px] font-mabry font-bold text-black mt-1">
                        {artisan.price}
                      </p>
                    </div>
                  ) : null
                )}
              </div>

              {/* Distance */}
              <div className="bg-[#F6F6F6] mb-2">
                <CompareRow label="Distance">
                  {displaySlots.map((a, i) =>
                    a ? (
                      <div key={i} className="flex justify-center">
                        {(() => {
                          const d = formatDistanceDisplay(
                            readDistanceFields({
                              distanceKm: a.distance,
                              distanceLabel: a.distanceLabel,
                            }),
                          );
                          return d ? (
                            <DistanceBadge label={d} size="sm" align="center" />
                          ) : (
                            <p className="text-[15px] font-poppins text-gray-700">—</p>
                          );
                        })()}
                      </div>
                    ) : null
                  )}
                </CompareRow>
              </div>

              {/* Hourly Rate */}
             <div className="bg-[#F6F6F6] mb-2">
               <CompareRow label="Hourly Rate">
                {displaySlots.map((a, i) =>
                  a ? (
                    <div key={i} className="text-center">
                      <p className="text-[18px] font-mabry font-bold text-brand-orange">
                        {a.price}
                      </p>
                    </div>
                  ) : null
                )}
              </CompareRow>

             </div>
              {/* Top Skills */}
              <CompareRow label="Top Skills">
                <div className="absolute left-1/2 top-0 bottom-4 w-px bg-[#0000001A] transform -translate-x-1/2"></div>
                {displaySlots.map((a, i) =>
                  a ? (
                    <div
                      key={i}
                      className="flex flex-wrap gap-1 justify-center content-start"
                    >
                      {skills.map((skill) => (
                        <span
                          key={skill}
                          className="text-[11px] font-poppins text-gray-700 bg-[#F6F6F6] rounded-sm px-3 py-1.5"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : null
                )}
              </CompareRow>

              {/* Krafts Completed */}
              <div className="bg-[#F6F6F6] mb-2">
                <CompareRow label="Krafts Completed">
                {displaySlots.map((a, i) =>
                  a ? (
                    <div key={i} className="text-center">
                      <p className="text-[15px] font-mabry font-semibold text-black">
                        {a.tasks_count} Krafts
                      </p>
                    </div>
                  ) : null
                )}
              </CompareRow>
              </div>

              {/* Relevant Review */}
              <CompareRow label="Relevant Review">
                <div className="absolute left-1/2 top-0 bottom-4 w-px bg-[#0000001A] transform -translate-x-1/2"></div>
                {displaySlots.map((a, i) =>
                  a ? (
                    <div key={i} className="text-center">
                      <p className="text-[12px] font-poppins text-gray-600 leading-relaxed">
                        {a.description}
                      </p>
                    </div>
                  ) : null
                )}
              </CompareRow>

              {/* Select Buttons */}
              <div className="grid grid-cols-2 gap-3 mt-4 px-2 sm:px-8">
                {displaySlots.map((artisan, i) =>
                  artisan ? (
                    <button
                      key={i}
                      onClick={() => onSelect(artisan)}
                      className="py-4 bg-brand-orange text-white rounded-2xl text-[14px] font-poppins font-semibold hover:bg-orange-600 transition-colors"
                    >
                      Select {artisan.artisan_name.split(" ")[0]}
                    </button>
                  ) : null
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Artisan Picker Overlay */}
      {pickingSlot !== null && (
        <ArtisanPicker
          artisans={allArtisans}
          selectedArtisanIds={slots
            .map((s) => (s ? String(s.artisan_id || s.id || "") : ""))
            .filter(Boolean)}
          onPick={handlePick}
          onClose={() => setPickingSlot(null)}
        />
      )}
    </>
  );
};

export default CompareSheet;