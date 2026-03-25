"use client";

import { useMemo, useState } from "react";
import { X, Search, ChevronRight, ChevronLeft } from "lucide-react";
import type { ServiceSkillGroup } from "@/lib/api/services";

export type SecondarySkillPick = {
  skillId: string;
  categoryId: string;
  name: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  skillGroups: ServiceSkillGroup[];
  value: SecondarySkillPick[];
  onChange: (next: SecondarySkillPick[]) => void;
  /** Exclude skills in this category (e.g. primary trade category) from being added as secondary */
  excludeCategoryId?: string;
  maxSkills?: number;
};

export function secondarySkillsMeetsRules(picks: SecondarySkillPick[]): boolean {
  // At least 2 distinct skills. They can come from the same or different categories.
  return picks.length >= 2;
}

export function SecondarySkillsPickerModal({
  open,
  onClose,
  skillGroups,
  value,
  onChange,
  excludeCategoryId,
  maxSkills = 12,
}: Props) {
  const [query, setQuery] = useState("");

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return skillGroups;
    return skillGroups
      .map((g) => ({
        ...g,
        skills: g.skills.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            (s.description && s.description.toLowerCase().includes(q)),
        ),
      }))
      .filter((g) => g.skills.length > 0);
  }, [skillGroups, query]);

  const toggleSkill = (categoryId: string, skillId: string, name: string) => {
    const exists = value.some((p) => p.skillId === skillId);
    if (exists) {
      onChange(value.filter((p) => p.skillId !== skillId));
      return;
    }
    if (excludeCategoryId && categoryId === excludeCategoryId) {
      return;
    }
    if (value.length >= maxSkills) return;
    onChange([...value, { skillId, categoryId, name }]);
  };

  const removePick = (skillId: string) => {
    onChange(value.filter((p) => p.skillId !== skillId));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative flex max-h-[92vh] w-full max-w-[500px] flex-col rounded-t-3xl bg-white shadow-2xl sm:max-h-[85vh] sm:rounded-3xl">
        <div className="flex shrink-0 items-center justify-between border-b border-[#F2F4F7] px-4 py-3">
          <button type="button" onClick={onClose} className="p-2 text-[#667085] hover:text-[#1D2939]">
            <span className="sr-only">Back</span>
            <ChevronLeft size={22} />
          </button>
          <h2 className="font-gerat text-[17px] font-bold text-[#1D2939]">Add a new skill</h2>
          <button type="button" onClick={onClose} className="p-2 text-[#667085] hover:text-[#1D2939]">
            <X size={22} />
          </button>
        </div>

        <div className="shrink-0 border-b border-[#F2F4F7] px-4 py-3">
          <div className="flex items-center gap-2 rounded-xl border border-[#E4E7EC] bg-[#F9FAFB] px-3 py-2">
            <Search size={18} className="text-[#98A2B3]" />
            <input
              type="search"
              placeholder="Search skills…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-w-0 flex-1 bg-transparent font-poppins text-[14px] text-[#1D2939] outline-none placeholder:text-[#98A2B3]"
            />
          </div>
        </div>

        {value.length > 0 && (
          <div className="max-h-28 shrink-0 overflow-y-auto border-b border-[#F2F4F7] px-4 py-3">
            <div className="flex flex-wrap gap-2">
              {value.map((p) => (
                <span
                  key={p.skillId}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#E4E7EC] bg-[#F6F6F6] px-2.5 py-1 font-poppins text-[12px] font-medium text-[#344054]"
                >
                  {p.name}
                  <button
                    type="button"
                    onClick={() => removePick(p.skillId)}
                    className="rounded p-0.5 text-[#667085] hover:bg-white hover:text-[#1D2939]"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-6">
          {filteredGroups.map((group) => (
            <div key={group.category.id} className="mb-4">
              <h3 className="sticky top-0 z-[1] bg-white px-2 py-2 font-gerat text-[13px] font-bold text-[#1D2939]">
                {group.category.name}
              </h3>
              <ul className="space-y-1">
                {group.skills.map((skill) => {
                  const selected = value.some((p) => p.skillId === skill.id);
                  const blocked =
                    Boolean(excludeCategoryId && group.category.id === excludeCategoryId) &&
                    !selected;
                  return (
                    <li key={skill.id}>
                      <button
                        type="button"
                        disabled={blocked && !selected}
                        onClick={() =>
                          toggleSkill(group.category.id, skill.id, skill.name)
                        }
                        className={`flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left transition-colors ${
                          selected ? "bg-orange-50" : "hover:bg-[#F9FAFB]"
                        } ${blocked ? "cursor-not-allowed opacity-40" : ""}`}
                      >
                        <div className="h-10 w-10 shrink-0 rounded-lg bg-[#FFF4ED]" />
                        <div className="min-w-0 flex-1">
                          <p className="font-gerat text-[14px] font-bold text-[#1D2939]">{skill.name}</p>
                          {skill.description ? (
                            <p className="line-clamp-2 font-poppins text-[12px] text-[#667085]">
                              {skill.description}
                            </p>
                          ) : (
                            <p className="font-poppins text-[12px] text-[#98A2B3]">
                              Tap to {selected ? "remove" : "add"}
                            </p>
                          )}
                        </div>
                        <ChevronRight size={18} className="shrink-0 text-[#98A2B3]" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
