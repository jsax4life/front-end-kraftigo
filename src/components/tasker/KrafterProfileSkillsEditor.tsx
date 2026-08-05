"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Hammer, Plus, Search, X } from "lucide-react";
import { getServiceSkillGroups, type ServiceSkillGroup } from "@/lib/api/services";
import { getKrafterSkillsStatus } from "@/lib/api/krafter-profile-completion";
import {
  extractServiceCategoryOfferings,
  mapOfferingsToSkillDrafts,
  type SkillOfferingDraft,
} from "@/lib/krafterSkillsDraft";
import type { ArtisanProfile } from "@/types";

export type { SkillOfferingDraft as KrafterSkillDraft };

type KrafterProfileSkillsEditorProps = {
  skills: SkillOfferingDraft[];
  onSkillsChange: (skills: SkillOfferingDraft[]) => void;
  artisanProfile?: ArtisanProfile | null;
};

async function loadSkillGroups(): Promise<ServiceSkillGroup[]> {
  return getServiceSkillGroups();
}

async function resolveExistingOfferings(
  artisanProfile?: ArtisanProfile | null,
): Promise<ReturnType<typeof extractServiceCategoryOfferings>> {
  const fromProfile = artisanProfile ? extractServiceCategoryOfferings(artisanProfile) : [];
  if (fromProfile.length > 0) return fromProfile;
  try {
    const skillsStatus = await getKrafterSkillsStatus();
    return extractServiceCategoryOfferings(skillsStatus);
  } catch {
    return [];
  }
}

export default function KrafterProfileSkillsEditor({
  skills,
  onSkillsChange,
  artisanProfile,
}: KrafterProfileSkillsEditorProps) {
  const [skillGroups, setSkillGroups] = useState<ServiceSkillGroup[]>([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(true);
  const [groupsLoadError, setGroupsLoadError] = useState<string | null>(null);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [skillSearch, setSkillSearch] = useState("");
  const prefillDoneRef = useRef(false);

  const applyPrefill = useCallback(
    (groups: ServiceSkillGroup[], offerings: ReturnType<typeof extractServiceCategoryOfferings>) => {
      if (prefillDoneRef.current || offerings.length === 0) return;
      if (skills.length > 0) {
        prefillDoneRef.current = true;
        return;
      }
      onSkillsChange(mapOfferingsToSkillDrafts(offerings, groups));
      prefillDoneRef.current = true;
    },
    [onSkillsChange, skills.length],
  );

  useEffect(() => {
    let cancelled = false;
    prefillDoneRef.current = false;
    void (async () => {
      setIsLoadingSkills(true);
      setGroupsLoadError(null);
      try {
        const [groups, offerings] = await Promise.all([
          loadSkillGroups(),
          resolveExistingOfferings(artisanProfile),
        ]);
        if (cancelled) return;
        setSkillGroups(groups);
        if (groups.length === 0) {
          setGroupsLoadError("Could not load skill categories. Pull to refresh or try again.");
        }
        applyPrefill(groups, offerings);
      } catch (error) {
        console.error("Failed to load skills", error);
        if (!cancelled) {
          setGroupsLoadError("Failed to load skill categories.");
        }
      } finally {
        if (!cancelled) setIsLoadingSkills(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [artisanProfile?.id, applyPrefill]);

  const ensureGroupsLoaded = async () => {
    if (skillGroups.length > 0) return;
    setIsLoadingSkills(true);
    setGroupsLoadError(null);
    try {
      const groups = await loadSkillGroups();
      setSkillGroups(groups);
      if (groups.length === 0) {
        setGroupsLoadError("No skill categories available.");
      }
    } catch {
      setGroupsLoadError("Failed to load skill categories.");
    } finally {
      setIsLoadingSkills(false);
    }
  };

  const openSkillModal = async () => {
    if (skills.length >= 5) return;
    setSkillSearch("");
    setIsSkillModalOpen(true);
    await ensureGroupsLoaded();
  };

  const addSkill = (categoryId: string, categoryName: string, iconUrl?: string | null) => {
    if (skills.length >= 5 || skills.some((s) => s.categoryId === categoryId)) return;
    onSkillsChange([
      ...skills,
      {
        categoryId,
        categoryName,
        iconUrl,
        rateType: "HOURLY",
        price: "",
        experienceYears: "",
      },
    ]);
    setIsSkillModalOpen(false);
  };

  const removeSkill = (categoryId: string) => {
    onSkillsChange(skills.filter((s) => s.categoryId !== categoryId));
  };

  const toggleRateType = (index: number, type: "HOURLY" | "FLAT") => {
    const updated = [...skills];
    updated[index] = { ...updated[index], rateType: type };
    onSkillsChange(updated);
  };

  const updateSkillField = (
    index: number,
    field: "price" | "experienceYears",
    value: string,
  ) => {
    const updated = [...skills];
    updated[index] = { ...updated[index], [field]: value };
    onSkillsChange(updated);
  };

  const filteredGroups = skillGroups.filter((group) => {
    const q = skillSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      group.category.name.toLowerCase().includes(q) ||
      group.skills.some((s) => s.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4 pt-2">
      <p className="text-[12px] font-poppins text-[#667085]">
        Add up to 5 service categories with hourly or flat rates (minimum €10).
      </p>

      {groupsLoadError ? (
        <p className="text-[12px] font-poppins text-[#B54708] bg-[#FFF4ED] border border-[#FECDCA] rounded-xl px-3 py-2">
          {groupsLoadError}
        </p>
      ) : null}

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          readOnly
          placeholder={skills.length >= 5 ? "Max 5 skills reached" : "Search for a skill..."}
          onClick={() => void openSkillModal()}
          className={`w-full p-4 pl-12 rounded-2xl bg-[#F6F6F6] border border-[#EAECF0] outline-none font-poppins text-[15px] ${
            skills.length >= 5 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          }`}
        />
      </div>

      {skills.length > 0 && skills.length < 5 && (
        <button
          type="button"
          onClick={() => void openSkillModal()}
          className="w-full py-3 flex items-center bg-[#F6F6F6] justify-center gap-2 border-2 border-[#0000001A] rounded-xl hover:bg-gray-50 transition-colors"
        >
          <div className="bg-[#919191] p-1 rounded-full">
            <Plus size={14} className="text-white" />
          </div>
          <span className="text-[14px] font-poppins font-medium text-[#1D2939]">Add another skill</span>
        </button>
      )}

      {isLoadingSkills && skills.length === 0 ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange" />
        </div>
      ) : skills.length > 0 ? (
        <div className="space-y-4">
          {skills.map((skill, idx) => (
            <div
              key={skill.categoryId}
              className="p-3 space-y-4 border border-[#EAECF0] rounded-2xl bg-[#F9FAFB]"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-[16px] font-poppins font-bold text-[#1D2939]">{skill.categoryName}</h3>
                <button
                  type="button"
                  onClick={() => removeSkill(skill.categoryId)}
                  className="p-1 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  aria-label={`Remove ${skill.categoryName}`}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex gap-2 p-1 bg-[#F6F6F6] rounded-2xl border border-gray-100">
                <button
                  type="button"
                  onClick={() => toggleRateType(idx, "HOURLY")}
                  className={`flex-1 py-1.5 rounded-xl text-[13px] font-poppins font-bold transition-all ${
                    skill.rateType === "HOURLY"
                      ? "bg-brand-blue text-white shadow-md"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  Hourly
                </button>
                <button
                  type="button"
                  onClick={() => toggleRateType(idx, "FLAT")}
                  className={`flex-1 py-1.5 rounded-xl text-[13px] font-poppins font-bold transition-all ${
                    skill.rateType === "FLAT"
                      ? "bg-brand-blue text-white shadow-md"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  Flat rate
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <span className="block text-[12px] font-poppins text-gray-600 mb-1.5">Hourly / flat rate (€)</span>
                  <span className="absolute left-4 top-[calc(50%+10px)] -translate-y-1/2 text-[16px] font-poppins text-gray-400">
                    €
                  </span>
                  <input
                    type="number"
                    min="10"
                    step="0.01"
                    placeholder="10.00"
                    className="w-full p-3 pl-10 rounded-2xl bg-white border border-[#EAECF0] outline-none font-poppins text-[16px] font-bold text-[#1D2939]"
                    value={skill.price}
                    onChange={(e) => updateSkillField(idx, "price", e.target.value)}
                  />
                </div>
                <div className="relative">
                  <span className="block text-[12px] font-poppins text-gray-600 mb-1.5">Experience (years)</span>
                  <input
                    type="number"
                    placeholder="Years"
                    min="0"
                    className="w-full p-3 rounded-2xl bg-white border border-[#EAECF0] outline-none font-poppins text-[15px] text-[#1D2939]"
                    value={skill.experienceYears}
                    onChange={(e) => updateSkillField(idx, "experienceYears", e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => void openSkillModal()}
          className="w-full py-3 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors rounded-2xl border border-dashed border-[#EAECF0]"
        >
          <div className="bg-[#919191] p-1 rounded-full">
            <Plus size={14} className="text-white" />
          </div>
          <span className="text-[14px] font-poppins text-[#919191]">No skills yet — tap to add</span>
        </button>
      )}

      {isSkillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
          <div className="bg-white w-full h-[90vh] sm:max-w-xl sm:h-auto sm:max-h-[80vh] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[#F2F4F7] flex items-center justify-between">
              <h2 className="text-[20px] font-gerat font-bold text-[#1D2939]">Add a skill</h2>
              <button type="button" onClick={() => setIsSkillModalOpen(false)} className="p-1 hover:opacity-70">
                <X size={24} />
              </button>
            </div>
            <div className="p-4 border-b border-[#F2F4F7]">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search for skills..."
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  className="w-full p-4 pl-12 rounded-2xl bg-[#F6F6F6] border border-[#EAECF0] outline-none font-poppins text-[15px]"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {isLoadingSkills ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange" />
                </div>
              ) : filteredGroups.length === 0 ? (
                <p className="text-center text-gray-500 font-poppins text-sm py-8">
                  {groupsLoadError ?? "No skills found."}
                </p>
              ) : (
                filteredGroups.map((group) => {
                  const isSelected = skills.some((s) => s.categoryId === group.category.id);
                  const isDisabled = isSelected || skills.length >= 5;
                  return (
                    <button
                      key={group.category.id}
                      type="button"
                      onClick={() =>
                        addSkill(group.category.id, group.category.name, group.category.iconUrl)
                      }
                      disabled={isDisabled}
                      className={`w-full flex items-center gap-4 px-2 py-3 border-b border-[#F2F4F7] last:border-0 text-left transition-all ${
                        isDisabled ? "opacity-50 cursor-default" : "hover:bg-orange-50/40"
                      }`}
                    >
                      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-orange-50 flex items-center justify-center border border-[#F2F4F7]">
                        {group.category.iconUrl ? (
                          <Image
                            src={group.category.iconUrl}
                            alt={group.category.name}
                            width={56}
                            height={56}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Hammer size={22} className="text-brand-orange" strokeWidth={1.5} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-gerat font-bold text-[#1D2939]">{group.category.name}</p>
                        {group.category.description ? (
                          <p className="text-[12px] font-poppins text-[#667085] line-clamp-1 mt-0.5">
                            {group.category.description}
                          </p>
                        ) : null}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function skillsToApiOfferings(skills: SkillOfferingDraft[]) {
  return skills.map((s) => ({
    serviceCategoryId: s.categoryId,
    pricingType: s.rateType,
    ...(s.rateType === "HOURLY"
      ? { hourlyRate: Number(s.price) || 0 }
      : { flatRate: Number(s.price) || 0 }),
    experienceYears: Number(s.experienceYears) || 0,
    ...(s.photoUrl ? { photoUrl: s.photoUrl } : {}),
  }));
}

export function validateSkillOfferings(skills: SkillOfferingDraft[]): string | null {
  if (skills.length === 0) return null;
  if (skills.length > 5) return "You can add at most 5 skills.";
  for (const skill of skills) {
    const rate = Number(skill.price);
    if (!Number.isFinite(rate) || rate < 10) {
      return `Set a rate of at least €10 for ${skill.categoryName}.`;
    }
  }
  return null;
}
