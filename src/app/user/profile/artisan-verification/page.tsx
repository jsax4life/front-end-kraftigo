"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Camera, 
  Plus, 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  Briefcase, 
  GraduationCap, 
  Upload,
  Info
} from "lucide-react";
import Header from "@/components/shared/Header";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import api from "@/lib/axios";
import { useProfileStore } from "@/store/useProfileStore";
import type { ArtisanProfile, ArtisanProfileUrlSubmitPayload } from "@/types";
import { getServiceSkillGroups, type ServiceSkillGroup } from "@/lib/api/services";
import {
  getVerificationMyStatus,
  getVerificationWire,
  type VerificationMyStatus,
  type KycStatus,
} from "@/lib/api/verification";
import {
  SecondarySkillsPickerModal,
  secondarySkillsMeetsRules,
  type SecondarySkillPick,
} from "@/components/krafter/SecondarySkillsPickerModal";
import toast from "react-hot-toast";

type ArtisanVerificationFormData = {
  legalFullName: string;
  displayName: string;
  profilePhoto: File | null;
  profilePhotoPreview: string;
  languages: string[];
  baseCity: string;
  postalCode: string;
  travelRadiusKm: number;
  /** Category UUID — same as krafter verification (`GET /api/services/skills/groups`). */
  primarySkillCategoryId: string;
  /** Display label for primary trade (category name). */
  primaryTrade: string;
  secondarySkillPicks: SecondarySkillPick[];
  yearsExperienceHomeCountry: number;
  yearsExperienceCurrentCountry: number;
  certifications: {
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate: string;
    documentUrl?: string;
  }[];
  toolsOwned: boolean;
  transportType: "NONE" | "CAR" | "VAN" | "BIKE";
  taxOrVatId: string;
  bio: string;
  countryOfResidence: string;
  governmentIdType: string;
  governmentIdNumber: string;
  governmentIdDocument: File | null;
  idCard: File | null;
  employmentStatus: "SELF_EMPLOYED" | "FREELANCING";
  portfolioPhotos: string[];
  portfolioPreviews: string[];
  uniqueSellingPoint: string;
};

/** Map GET /api/profile/artisan/me (camel or snake_case) into the wizard form. */
function buildFormPrefill(
  prev: ArtisanVerificationFormData,
  raw: ArtisanProfile | (Record<string, unknown> & Partial<ArtisanProfile>),
): ArtisanVerificationFormData {
  const a = raw as Record<string, unknown>;
  const str = (...keys: string[]): string | undefined => {
    for (const k of keys) {
      const v = a[k];
      if (typeof v === "string" && v.trim()) return v;
    }
    return undefined;
  };
  const num = (...keys: string[]): number | undefined => {
    for (const k of keys) {
      const v = a[k];
      if (typeof v === "number" && !Number.isNaN(v)) return v;
    }
    return undefined;
  };
  const bool = (...keys: string[]): boolean | undefined => {
    for (const k of keys) {
      const v = a[k];
      if (typeof v === "boolean") return v;
    }
    return undefined;
  };

  const langsRaw = a.languages;
  let languages = prev.languages;
  if (Array.isArray(langsRaw) && langsRaw.length > 0) {
    languages = langsRaw
      .map((l: unknown) => {
        if (typeof l === "string") return l;
        if (l && typeof l === "object" && l !== null && "name" in l) {
          return String((l as { name: string }).name);
        }
        return "";
      })
      .filter(Boolean);
  }

  const picksRaw = a.secondarySkillPicks ?? a.secondary_skill_picks;
  let secondarySkillPicks = prev.secondarySkillPicks;
  if (Array.isArray(picksRaw) && picksRaw.length > 0) {
    const first = picksRaw[0];
    if (first && typeof first === "object" && "skillId" in first) {
      secondarySkillPicks = (picksRaw as { skillId: string; categoryId: string; name: string }[]).map(
        (p) => ({
          skillId: String(p.skillId),
          categoryId: String(p.categoryId),
          name: String(p.name),
        }),
      );
    }
  }

  const primaryCat =
    str("primarySkillCategoryId", "primary_skill_category_id") ?? prev.primarySkillCategoryId;

  const certsRaw = a.certifications;
  let certifications = prev.certifications;
  if (Array.isArray(certsRaw) && certsRaw.length > 0) {
    certifications = certsRaw.map((c: unknown) => {
      if (!c || typeof c !== "object") {
        return { name: "", issuer: "", issueDate: "", expiryDate: "" };
      }
      const o = c as Record<string, unknown>;
      return {
        name: String(o.name ?? o.title ?? ""),
        issuer: String(o.issuer ?? o.organization ?? ""),
        issueDate: String(o.issueDate ?? o.issue_date ?? ""),
        expiryDate: String(o.expiryDate ?? o.expiry_date ?? ""),
        documentUrl: str("documentUrl", "document_url") ?? undefined,
      };
    });
  }

  const photoUrl = str("profilePhotoUrl", "profile_photo_url");
  const transportRaw = str("transportType", "transport_type");
  const transportType =
    transportRaw && ["NONE", "BIKE", "CAR", "VAN"].includes(transportRaw)
      ? (transportRaw as ArtisanVerificationFormData["transportType"])
      : prev.transportType;

  const govRaw = str("governmentIdType", "government_id_type") ?? "";
  let governmentIdType = prev.governmentIdType;
  if (govRaw) {
    const g = govRaw.toLowerCase().replace(/-/g, "_");
    if (g.includes("passport")) governmentIdType = "passport";
    else if (g.includes("driver") || g.includes("license")) governmentIdType = "driver_license";
    else if (g.includes("national")) governmentIdType = "national_id";
  }

  const country = str("countryOfResidence", "country_of_residence");
  const emp = str("employmentStatus", "employment_status");
  const employmentStatus =
    emp === "FREELANCING" || emp === "SELF_EMPLOYED" ? emp : prev.employmentStatus;

  return {
    ...prev,
    legalFullName: str("legalFullName", "legal_full_name") ?? prev.legalFullName,
    displayName: str("displayName", "display_name") ?? prev.displayName,
    profilePhotoPreview: photoUrl ?? prev.profilePhotoPreview,
    languages,
    baseCity: str("baseCity", "base_city") ?? prev.baseCity,
    postalCode: str("postalCode", "postal_code") ?? prev.postalCode,
    travelRadiusKm: num("travelRadiusKm", "travel_radius_km") ?? prev.travelRadiusKm,
    primarySkillCategoryId: primaryCat,
    primaryTrade: str("primaryTrade", "primary_trade") ?? prev.primaryTrade,
    secondarySkillPicks,
    yearsExperienceHomeCountry:
      num("yearsExperienceHomeCountry", "years_experience_home_country") ??
      prev.yearsExperienceHomeCountry,
    yearsExperienceCurrentCountry:
      num("yearsExperienceCurrentCountry", "years_experience_current_country") ??
      prev.yearsExperienceCurrentCountry,
    certifications,
    toolsOwned: bool("toolsOwned", "tools_owned") ?? prev.toolsOwned,
    transportType,
    taxOrVatId: str("taxOrVatId", "tax_or_vat_id") ?? prev.taxOrVatId,
    bio: str("bio", "description") ?? prev.bio,
    countryOfResidence: country
      ? country.toUpperCase().slice(0, 2)
      : prev.countryOfResidence,
    governmentIdType,
    governmentIdNumber: str("governmentIdNumber", "government_id_number") ?? prev.governmentIdNumber,
    employmentStatus,
    uniqueSellingPoint: str("uniqueSellingPoint", "unique_selling_point") ?? prev.uniqueSellingPoint,
  };
}

/** Same contract as portfolio: POST JSON { filename, mimetype, fileSize } → { uploadUrl, publicUrl }, then PUT file. */
function extractSignedUploadFields(data: Record<string, unknown>): {
  uploadUrl: string | null;
  publicUrl: string | null;
} {
  const d = data as Record<string, unknown> & {
    uploadUrl?: unknown;
    signedUrl?: unknown;
    presignedUrl?: unknown;
    publicUrl?: unknown;
    url?: unknown;
    documentUrl?: unknown;
    fileUrl?: unknown;
    portfolioUrl?: unknown;
    imageUrl?: unknown;
    urls?: unknown;
  };
  const uploadUrl =
    (typeof d.uploadUrl === "string" ? d.uploadUrl : null) ||
    (typeof d.signedUrl === "string" ? d.signedUrl : null) ||
    (typeof d.presignedUrl === "string" ? d.presignedUrl : null);
  const publicUrl =
    (Array.isArray(d.urls) && typeof d.urls[0] === "string" ? d.urls[0] : null) ||
    (typeof d.publicUrl === "string" ? d.publicUrl : null) ||
    (typeof d.url === "string" ? d.url : null) ||
    (typeof d.fileUrl === "string" ? d.fileUrl : null) ||
    (typeof d.documentUrl === "string" ? d.documentUrl : null) ||
    (typeof d.portfolioUrl === "string" ? d.portfolioUrl : null) ||
    (typeof d.imageUrl === "string" ? d.imageUrl : null);
  return { uploadUrl, publicUrl };
}

async function artisanSignedObjectUpload(
  initEndpoint: string,
  file: File,
  unexpectedResponseError: string,
): Promise<string> {
  const mimetype = file.type || "application/octet-stream";
  const initRes = await api.post<Record<string, unknown>>(initEndpoint, {
    filename: file.name,
    mimetype,
    fileSize: file.size,
  });
  const { uploadUrl, publicUrl } = extractSignedUploadFields(
    (initRes.data ?? {}) as Record<string, unknown>,
  );
  if (!uploadUrl || !publicUrl) {
    throw new Error(unexpectedResponseError);
  }
  try {
    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": mimetype },
      body: file,
    });
    if (!putRes.ok) {
      throw new Error(`Failed to upload file (HTTP ${putRes.status})`);
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!/failed to fetch/i.test(msg)) throw e;
  }
  return publicUrl;
}

const LANGUAGE_NAME_TO_CODE: Record<string, string> = {
  English: "en",
  French: "fr",
  German: "de",
  Spanish: "es",
  Italian: "it",
  Portuguese: "pt",
  Dutch: "nl",
  Swedish: "sv",
  Norwegian: "no",
  Danish: "da",
  Finnish: "fi",
  Polish: "pl",
  Greek: "el",
  Turkish: "tr",
  Arabic: "ar",
  Russian: "ru",
  Ukrainian: "uk",
  Romanian: "ro",
  Chinese: "zh",
  Japanese: "ja",
  Korean: "ko",
  Hausa: "ha",
  Yoruba: "yo",
  Igbo: "ig",
};

function buildLanguagesForUrlPayload(
  names: string[],
): { code: string; name: string; proficiency: string }[] {
  return names
    .map((n) => n.trim())
    .filter(Boolean)
    .map((name) => ({
      code: LANGUAGE_NAME_TO_CODE[name] ?? (name.slice(0, 2).toLowerCase() || "xx"),
      name,
      proficiency: "fluent",
    }));
}

function isHttpUrl(s: string) {
  return /^https?:\/\//i.test((s || "").trim());
}

async function resolveProfilePhotoUrlForSubmit(
  file: File | null,
  preview: string,
): Promise<string | undefined> {
  if (file) {
    return artisanSignedObjectUpload(
      "/api/profile/artisan/upload-portfolio",
      file,
      "Unexpected upload-portfolio response from server",
    );
  }
  if (isHttpUrl(preview)) return preview.trim();
  return undefined;
}

async function resolveIdCardUrlForSubmit(file: File | null): Promise<string | undefined> {
  if (!file) return undefined;
  return artisanSignedObjectUpload(
    "/api/profile/artisan/upload-certification",
    file,
    "Unexpected upload-certification response from server",
  );
}

const steps = [
  { id: 1, title: "Introduction" },
  { id: 2, title: "Verification" },
  { id: 3, title: "Complete Profile" },
  { id: 4, title: "Skills & More" },
  { id: 5, title: "Review" },
];

const initialFormData: ArtisanVerificationFormData = {
  legalFullName: "",
  displayName: "",
  profilePhoto: null,
  profilePhotoPreview: "",
  languages: [],
  baseCity: "",
  postalCode: "",
  travelRadiusKm: 10,
  primarySkillCategoryId: "",
  primaryTrade: "",
  secondarySkillPicks: [],
  yearsExperienceHomeCountry: 0,
  yearsExperienceCurrentCountry: 0,
  certifications: [],
  toolsOwned: false,
  transportType: "NONE",
  taxOrVatId: "",
  bio: "",
  countryOfResidence: "NG",
  governmentIdType: "passport",
  governmentIdNumber: "",
  governmentIdDocument: null,
  idCard: null,
  employmentStatus: "SELF_EMPLOYED",
  portfolioPhotos: [],
  portfolioPreviews: [],
  uniqueSellingPoint: "",
};

export default function ArtisanVerificationPage() {
  const router = useRouter();
  const { submitArtisanProfileUrl, isLoading, artisanProfile, fetchArtisanProfile } =
    useProfileStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prefillAppliedRef = useRef(false);

  // Identity verification status (internal docs + Didit KYC) used to preload/lock the ID upload step.
  const [myStatus, setMyStatus] = useState<VerificationMyStatus | null>(null);
  const [isLoadingMyStatus, setIsLoadingMyStatus] = useState(true);
  const [uploadingCertificationIndex, setUploadingCertificationIndex] = useState<number | null>(null);

  const [languageToAdd, setLanguageToAdd] = useState("");
  const [skillGroups, setSkillGroups] = useState<ServiceSkillGroup[]>([]);
  const [secondaryModalOpen, setSecondaryModalOpen] = useState(false);
  const secondaryIdsHydratedRef = useRef(false);

  const [formData, setFormData] = useState<ArtisanVerificationFormData>(() => ({ ...initialFormData }));

  const primaryTradeOptions = useMemo(
    () =>
      skillGroups
        .map((g) => ({ value: g.category.id, label: g.category.name }))
        .filter((o) => o.value && o.label),
    [skillGroups],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const groups = await getServiceSkillGroups();
        if (!cancelled) setSkillGroups(groups);
      } catch {
        toast.error("Failed to load trades and skills");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void fetchArtisanProfile();
  }, [fetchArtisanProfile]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const status = await getVerificationMyStatus();
        if (cancelled) return;
        setMyStatus(status);
      } catch {
        if (cancelled) return;
        setMyStatus(null);
      } finally {
        if (cancelled) return;
        setIsLoadingMyStatus(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!artisanProfile || prefillAppliedRef.current) return;
    prefillAppliedRef.current = true;
    setFormData((prev) => buildFormPrefill(prev, artisanProfile as ArtisanProfile));
  }, [artisanProfile]);

  useEffect(() => {
    if (!skillGroups.length) return;
    setFormData((prev) => {
      let next = prev;
      if (prev.primarySkillCategoryId && !prev.primaryTrade) {
        const g = skillGroups.find((sg) => sg.category.id === prev.primarySkillCategoryId);
        if (g) next = { ...next, primaryTrade: g.category.name };
      }
      if (!prev.primarySkillCategoryId && prev.primaryTrade?.trim()) {
        const match = skillGroups.find(
          (sg) => sg.category.name.toLowerCase() === prev.primaryTrade.trim().toLowerCase(),
        );
        if (match) {
          next = {
            ...next,
            primarySkillCategoryId: match.category.id,
            primaryTrade: match.category.name,
          };
        }
      }
      return next;
    });
  }, [skillGroups]);

  useEffect(() => {
    if (!artisanProfile || !skillGroups.length || secondaryIdsHydratedRef.current) return;
    setFormData((prev) => {
      if (prev.secondarySkillPicks.length > 0) return prev;
      const a = artisanProfile as unknown as Record<string, unknown>;
      const idsRaw = a.secondarySkillIds ?? a.secondary_skill_ids;
      if (!Array.isArray(idsRaw) || idsRaw.length === 0) return prev;
      const idSet = new Set(idsRaw.map((x) => String(x)));
      const picks: SecondarySkillPick[] = [];
      for (const g of skillGroups) {
        for (const sk of g.skills) {
          if (idSet.has(sk.id)) {
            picks.push({ skillId: sk.id, categoryId: g.category.id, name: sk.name });
          }
        }
      }
      if (!picks.length) return prev;
      secondaryIdsHydratedRef.current = true;
      return { ...prev, secondarySkillPicks: picks };
    });
  }, [artisanProfile, skillGroups]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: string, file: File | null) => {
    if (!file) return;
    const previewField = `${field}Preview`;
    setFormData(prev => ({
      ...prev,
      [field]: file,
      [previewField]: URL.createObjectURL(file)
    }));
  };

  const MAX_WORK_PHOTOS = 3;

  const uploadPortfolioAsset = (file: File) =>
    artisanSignedObjectUpload(
      "/api/profile/artisan/upload-portfolio",
      file,
      "Unexpected upload-portfolio response from server",
    );

  const [isUploadingPortfolio, setIsUploadingPortfolio] = useState(false);

  const addWorkPhotos = async (files: FileList | null) => {
    if (!files) return;
    const remaining = MAX_WORK_PHOTOS - formData.portfolioPhotos.length;
    if (remaining <= 0) {
      toast.error("You can add up to 3 photos.");
      return;
    }

    const incoming = Array.from(files).slice(0, remaining);
    try {
      setIsUploadingPortfolio(true);
      const urls: string[] = [];
      for (const f of incoming) {
        urls.push(await uploadPortfolioAsset(f));
      }

      setFormData((prev) => ({
        ...prev,
        portfolioPhotos: [...prev.portfolioPhotos, ...urls],
        portfolioPreviews: [...prev.portfolioPreviews, ...urls],
      }));
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      toast.error(err?.response?.data?.message || err?.message || "Failed to upload photos");
    } finally {
      setIsUploadingPortfolio(false);
    }
  };

  const removeWorkPhotoAt = (idx: number) => {
    setFormData((prev) => {
      const nextPhotos = [...prev.portfolioPhotos];
      const nextPreviews = [...prev.portfolioPreviews];
      const removedPreview = nextPreviews[idx];

      nextPhotos.splice(idx, 1);
      nextPreviews.splice(idx, 1);

      if (removedPreview?.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(removedPreview);
        } catch {
          // ignore
        }
      }

      return {
        ...prev,
        portfolioPhotos: nextPhotos,
        portfolioPreviews: nextPreviews,
      };
    });
  };

  // Video upload intentionally removed (photos only)

  const addCertification = () => {
    setFormData(prev => ({
      ...prev,
      certifications: [
        ...prev.certifications,
        { name: "", issuer: "", issueDate: "", expiryDate: "", documentUrl: "" },
      ],
    }));
  };

  const uploadCertificationDocument = async (certIndex: number, file: File) => {
    try {
      setUploadingCertificationIndex(certIndex);

      const documentUrl = await artisanSignedObjectUpload(
        "/api/profile/artisan/upload-certification",
        file,
        "Unexpected upload-certification response from server",
      );

      setFormData((prev) => {
        const nextCerts = [...prev.certifications];
        if (!nextCerts[certIndex]) return prev;
        nextCerts[certIndex] = {
          ...nextCerts[certIndex],
          documentUrl,
        };
        return { ...prev, certifications: nextCerts };
      });
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to upload certification document",
      );
    } finally {
      setUploadingCertificationIndex(null);
    }
  };

  const handleSubmit = async () => {
    try {
      if (formData.certifications.length > 0) {
        const hasDoc = formData.certifications.some(
          (c) => Boolean(c.documentUrl && c.documentUrl.trim().length > 0),
        );
        if (!hasDoc) {
          toast.error("Please upload at least one certification document.");
          return;
        }
      }

      // Backend requires `idCardUrl`, so if user didn't upload a new file
      // we must reuse the value returned from `GET /api/profile/artisan/me`.
      const idCardUrlFromMe: string | undefined = artisanProfile
        ? String(
            (artisanProfile as any).idCardUrl ??
              (artisanProfile as any).id_card_url ??
              (artisanProfile as any).idCardURL ??
              "",
          ).trim() || undefined
        : undefined;

      const [profilePhotoUrl, idCardUrl] = await Promise.all([
        resolveProfilePhotoUrlForSubmit(formData.profilePhoto, formData.profilePhotoPreview),
        resolveIdCardUrlForSubmit(formData.idCard),
      ]);

      const finalIdCardUrl = idCardUrl || idCardUrlFromMe;
      if (!finalIdCardUrl) {
        toast.error("idCardUrl should not be empty.");
        return;
      }

      const certificationsPayload = formData.certifications
        .filter((c) => c.name.trim() || c.issuer.trim())
        .map((c) => ({
          name: c.name,
          issuer: c.issuer,
          issueDate: c.issueDate,
          expiryDate: c.expiryDate,
          ...(c.documentUrl?.trim() ? { documentUrl: c.documentUrl.trim() } : {}),
        }));

      const payload: ArtisanProfileUrlSubmitPayload = {
        legalFullName: formData.legalFullName,
        displayName: formData.displayName,
        languages: buildLanguagesForUrlPayload(formData.languages),
        baseCity: formData.baseCity,
        postalCode: formData.postalCode,
        travelRadiusKm: formData.travelRadiusKm,
        primarySkillCategoryId: formData.primarySkillCategoryId,
        secondarySkillIds: formData.secondarySkillPicks.map((p) => p.skillId),
        yearsExperienceHomeCountry: formData.yearsExperienceHomeCountry,
        yearsExperienceCurrentCountry: formData.yearsExperienceCurrentCountry,
        certifications: certificationsPayload,
        portfolioPhotoUrls: [...formData.portfolioPhotos],
        toolsOwned: formData.toolsOwned,
        transportType: formData.transportType,
        taxOrVatId: formData.taxOrVatId,
        bio: formData.bio,
        countryOfResidence: formData.countryOfResidence,
        employmentStatus: formData.employmentStatus,
      };

      if (profilePhotoUrl) payload.profilePhotoUrl = profilePhotoUrl;
      payload.idCardUrl = finalIdCardUrl;

      await submitArtisanProfileUrl(payload);
      toast.success("Profile saved successfully!");
      setSubmitSuccess(true);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string | string[] } } };
      const msg = err?.response?.data?.message;
      toast.error(
        Array.isArray(msg) ? msg.join(", ") : msg || "Failed to save profile",
      );
    }
  };

  const renderIntroduction = () => (
    <div className="fixed inset-0 bg-[#00000080] z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-[500px] rounded-t-3xl sm:rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-500">
        <div className="p-8 text-center bg-brand-cream relative">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-brand-orange text-white rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
              <ShieldCheck size={40} />
            </div>
          </div>
          <h2 className="text-[28px] font-gerat font-bold text-[#1D2939] mb-2 leading-tight">
            Become a Crafter
          </h2>
          <p className="text-[14px] font-poppins text-[#667085] max-w-[300px] mx-auto">
            Join our community of skilled professionals and start earning today.
          </p>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h4 className="text-[16px] font-gerat font-bold text-[#1D2939]">Verify your Profile</h4>
                <p className="text-[13px] font-poppins text-[#667085]">Help customers trust you by verifying your details.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                <Briefcase size={24} />
              </div>
              <div>
                <h4 className="text-[16px] font-gerat font-bold text-[#1D2939]">License & Certifications</h4>
                <p className="text-[13px] font-poppins text-[#667085]">Share your professional background and tools.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                <Plus size={24} />
              </div>
              <div>
                <h4 className="text-[16px] font-gerat font-bold text-[#1D2939]">Setup your Skills</h4>
                <p className="text-[13px] font-poppins text-[#667085]">Define your services and set your own rates.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h4 className="text-[16px] font-gerat font-bold text-[#1D2939]">Final Approval</h4>
                <p className="text-[13px] font-poppins text-[#667085]">Our team will review and activate your account.</p>
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-col gap-4">
            <Button 
                variant="primary" 
                fullWidth 
                onClick={() => setCurrentStep(2)}
                className="py-4 text-[16px] font-gerat font-bold"
            >
              Let's Get Started
            </Button>
            <button 
                onClick={() => router.back()}
                className="text-[14px] font-poppins text-[#667085] hover:text-[#1D2939] transition-colors"
            >
                Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProfileStep = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-5">
      <div className="text-center">
        <h2 className="text-[24px] font-gerat font-bold text-[#1D2939]">Complete Your Profile</h2>
        <p className="text-[14px] font-poppins text-[#667085]">Tell us about yourself to build your craft reputation.</p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div 
            className="w-32 h-32 rounded-full border-4 border-brand-orange border-dashed flex items-center justify-center p-1 cursor-pointer group relative overflow-hidden transition-all hover:scale-105"
            onClick={() => fileInputRef.current?.click()}
        >
          {formData.profilePhotoPreview ? (
            <Image
              src={formData.profilePhotoPreview}
              alt="Preview"
              fill
              className="object-cover rounded-full"
              unoptimized={
                formData.profilePhotoPreview.startsWith("http://") ||
                formData.profilePhotoPreview.startsWith("https://")
              }
            />
          ) : (
            <div className="w-full h-full bg-gray-50 rounded-full flex flex-col items-center justify-center">
              <Camera size={32} className="text-gray-300 group-hover:text-brand-orange transition-colors" />
              <span className="text-[10px] text-gray-400 font-bold mt-1">UPLOAD</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Upload size={24} className="text-white" />
          </div>
        </div>
        <input 
          ref={fileInputRef}
          type="file" 
          hidden 
          accept="image/*"
          onChange={(e) => handleFileChange('profilePhoto', e.target.files?.[0] || null)}
        />
        <span className="text-[14px] font-poppins font-medium text-gray-500">Pick a clear, smiling photo!</span>
      </div>

      <div className="space-y-6 bg-white p-6 rounded-3xl border border-[#F2F4F7]">
        <Input 
          label="Legal Full Name" 
          placeholder="As shown on your ID" 
          value={formData.legalFullName}
          onChange={(v) => handleInputChange('legalFullName', v)}
          required
        />
        <Input 
          label="Display Name" 
          placeholder="How customers will see you" 
          value={formData.displayName}
          onChange={(v) => handleInputChange('displayName', v)}
          required
        />

        <Input 
          label="Postal Code" 
          placeholder="e.g. 10115" 
          value={formData.postalCode}
          onChange={(v) => handleInputChange('postalCode', v)}
          required
        />

        <div className="bg-white p-4 rounded-3xl border border-[#F2F4F7] space-y-3">
          <div>
            <p className="text-[12px] font-poppins font-semibold uppercase tracking-[0.14em] text-[#FF6600]">
              Other Details (Optional)
            </p>
            <p className="mt-1 text-[13px] font-poppins text-[rgba(0,0,0,0.55)]">
              These improve your chances at getting recurring roles but are not compulsory.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[14px] font-mabry text-gray-800">What do you do for work?</label>
            <textarea
              className="w-full h-24 px-4 py-3 bg-[#F6F6F6] rounded-xl border border-[#0000001A] outline-none text-[14px] font-poppins transition-all focus:ring-1 focus:ring-brand-orange"
              placeholder="E.g Student or Baker"
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label className="text-[14px] font-mabry text-gray-800">
                What languages do you speak?
              </label>
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#F9FAFB] text-[#FF6600] border border-[#E4E7EC]">
                ?
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mb-2">
              {formData.languages.map((lang, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[12px] font-bold flex items-center gap-1 animate-in zoom-in-50"
                >
                  {lang}
                  <X
                    size={14}
                    className="cursor-pointer"
                    onClick={() => {
                      const newLangs = [...formData.languages];
                      newLangs.splice(idx, 1);
                      handleInputChange('languages', newLangs);
                    }}
                  />
                </span>
              ))}
            </div>

            <Select
              label="Add language"
              value={languageToAdd}
              placeholder="Select language"
              onChange={(v) => {
                const normalized = v.trim();
                if (!normalized) return;
                const exists = formData.languages.some(
                  (x) => x.trim().toLowerCase() === normalized.toLowerCase(),
                );
                if (exists) {
                  setLanguageToAdd("");
                  return;
                }
                handleInputChange("languages", [...formData.languages, normalized]);
                setLanguageToAdd("");
              }}
              options={[
                { value: "English", label: "English" },
                { value: "French", label: "French" },
                { value: "German", label: "German" },
                { value: "Spanish", label: "Spanish" },
                { value: "Italian", label: "Italian" },
                { value: "Portuguese", label: "Portuguese" },
                { value: "Dutch", label: "Dutch" },
                { value: "Swedish", label: "Swedish" },
                { value: "Norwegian", label: "Norwegian" },
                { value: "Danish", label: "Danish" },
                { value: "Finnish", label: "Finnish" },
                { value: "Polish", label: "Polish" },
                { value: "Greek", label: "Greek" },
                { value: "Turkish", label: "Turkish" },
                { value: "Arabic", label: "Arabic" },
                { value: "Russian", label: "Russian" },
                { value: "Ukrainian", label: "Ukrainian" },
                { value: "Romanian", label: "Romanian" },
                { value: "Chinese", label: "Chinese" },
                { value: "Japanese", label: "Japanese" },
                { value: "Korean", label: "Korean" },
                { value: "Hausa", label: "Hausa" },
                { value: "Yoruba", label: "Yoruba" },
                { value: "Igbo", label: "Igbo" },
              ]}
            />
          </div>

          <Input
            label="Where do you live?"
            placeholder="E.g Bern, Germany"
            value={formData.baseCity}
            onChange={(v) => handleInputChange('baseCity', v)}
            required
          />

          <div className="space-y-2">
            <label className="text-[14px] font-mabry text-gray-800">What makes you unique?</label>
            <textarea
              className="w-full h-24 px-4 py-3 bg-[#F6F6F6] rounded-xl border border-[#0000001A] outline-none text-[14px] font-poppins transition-all focus:ring-1 focus:ring-brand-orange"
              placeholder="E.g I like to make people feel relaxed with relax people"
              value={formData.uniqueSellingPoint}
              onChange={(e) => handleInputChange('uniqueSellingPoint', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <label className="text-[14px] font-mabry text-gray-800">Travel Radius (Km)</label>
                <span className="text-brand-orange font-bold font-gerat">{formData.travelRadiusKm} km</span>
            </div>
            <input 
                type="range" 
                min="0" 
                max="100" 
                step="5"
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-orange"
                value={formData.travelRadiusKm}
                onChange={(e) => handleInputChange('travelRadiusKm', parseInt(e.target.value))}
            />
            <div className="flex justify-between text-[11px] text-gray-400 font-poppins">
                <span>0 km</span>
                <span>50 km</span>
                <span>100 km</span>
            </div>
        </div>
      </div>
    </div>
  );

  const { verificationState, kycStatus } = getVerificationWire(myStatus);
  const internalSubmittedAt = myStatus?.verification?.submittedAt ?? null;
  const internalReviewedAt = myStatus?.verification?.reviewedAt ?? null;
  const uploadsReadOnly = Boolean(internalSubmittedAt);
  const internalDocsLabel =
    verificationState === "PENDING"
      ? "Submitted to admin (in review)"
      : verificationState === "APPROVED"
        ? "Admin approved"
        : verificationState === "REJECTED"
          ? "Admin rejected"
          : "—";
  const kycVerifiedLabel =
    kycStatus === "APPROVED"
      ? "Didit KYC approved"
      : kycStatus === "PENDING"
        ? "Didit KYC in review"
        : kycStatus === "REJECTED"
          ? "Didit KYC rejected"
          : "Didit KYC not started";

  const renderDocumentsStep = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-5">
      <div className="text-center">
        <h2 className="text-[24px] font-gerat font-bold text-[#1D2939]">Identity Verification</h2>
        <p className="text-[14px] font-poppins text-[#667085]">Upload your documents to unlock trust with customers.</p>
      </div>

      <div className="bg-[#F9FAFB] p-4 rounded-3xl border border-[#F2F4F7] space-y-2">
        {isLoadingMyStatus ? (
          <p className="text-center font-poppins text-[13px] text-[rgba(0,0,0,0.55)]">
            Loading verification status…
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <p className="font-poppins text-[13px] text-[rgba(0,0,0,0.65)]">Internal docs</p>
              <p className="font-poppins text-[13px] font-bold text-[#1D2939]">
                {internalDocsLabel}
              </p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="font-poppins text-[13px] text-[rgba(0,0,0,0.65)]">Didit</p>
              <p className="font-poppins text-[13px] font-bold text-[#1D2939]">
                {kycVerifiedLabel}
              </p>
            </div>
            {uploadsReadOnly && (
              <p className="font-poppins text-[13px] leading-relaxed text-[rgba(0,0,0,0.55)]">
                We already received your identity documents. You can continue completing your
                Krafter profile without re-uploading.
              </p>
            )}
          </>
        )}
      </div>

      <div className="bg-white p-6 rounded-3xl border border-[#F2F4F7] space-y-6">
        <Select 
          label="ID Type" 
          value={formData.governmentIdType}
          onChange={(v) => handleInputChange('governmentIdType', v)}
          disabled={uploadsReadOnly}
          required={!uploadsReadOnly}
          options={[
            { value: "passport", label: "Passport" },
            { value: "driver_license", label: "Driver's License" },
            { value: "national_id", label: "National ID Card" },
          ]}
        />

        <Input 
          label="ID Number" 
          placeholder="Enter ID document number" 
          value={formData.governmentIdNumber}
          onChange={(v) => handleInputChange('governmentIdNumber', v)}
          disabled={uploadsReadOnly}
        />

        <div className="space-y-2">
            <label className="text-[14px] font-mabry text-gray-800">Government ID Document</label>
            <div
              className={`w-full aspect-video bg-[#F6F6F6] rounded-2xl border-2 border-dashed border-[#0000001A] flex flex-col items-center justify-center p-4 transition-colors group ${
                uploadsReadOnly ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-gray-100"
              }`}
              onClick={() => {
                if (uploadsReadOnly) return;
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*,application/pdf";
                input.onchange = (e) =>
                  handleFileChange(
                    "governmentIdDocument",
                    (e.target as HTMLInputElement).files?.[0] || null,
                  );
                input.click();
              }}
            >
              {formData.governmentIdDocument ? (
                <div className="flex flex-col items-center">
                  <CheckCircle2 size={40} className="text-green-500 mb-2" />
                  <span className="text-[12px] font-poppins text-gray-600 truncate max-w-[200px]">
                    {formData.governmentIdDocument.name}
                  </span>
                </div>
              ) : uploadsReadOnly ? (
                <div className="flex flex-col items-center">
                  <CheckCircle2 size={40} className="text-green-500 mb-2" />
                  <span className="text-[14px] font-poppins text-gray-600">
                    Documents submitted
                  </span>
                </div>
              ) : (
                <>
                  <Upload size={32} className="text-gray-300 group-hover:text-brand-orange transition-colors mb-2" />
                  <span className="text-[14px] font-poppins text-gray-400">Upload Front Page</span>
                </>
              )}
            </div>
        </div>

        <div className="space-y-2">
            <label className="text-[14px] font-mabry text-gray-800">Secondary ID (Optional)</label>
            <div
              className={`w-full aspect-video bg-[#F6F6F6] rounded-2xl border-2 border-dashed border-[#0000001A] flex flex-col items-center justify-center p-4 transition-colors group ${
                uploadsReadOnly ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-gray-100"
              }`}
              onClick={() => {
                if (uploadsReadOnly) return;
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*,application/pdf";
                input.onchange = (e) =>
                  handleFileChange(
                    "idCard",
                    (e.target as HTMLInputElement).files?.[0] || null,
                  );
                input.click();
              }}
            >
              {formData.idCard ? (
                <div className="flex flex-col items-center">
                  <CheckCircle2 size={40} className="text-green-500 mb-2" />
                  <span className="text-[12px] font-poppins text-gray-600">
                    Document Uploaded
                  </span>
                </div>
              ) : uploadsReadOnly ? (
                <div className="flex flex-col items-center">
                  <CheckCircle2 size={40} className="text-green-500 mb-2" />
                  <span className="text-[14px] font-poppins text-gray-600">
                    Documents submitted
                  </span>
                </div>
              ) : (
                <>
                  <Upload size={32} className="text-gray-300 group-hover:text-brand-orange transition-colors mb-2" />
                  <span className="text-[14px] font-poppins text-gray-400">
                    Take a photo of back/other page
                  </span>
                </>
              )}
            </div>
        </div>
      </div>
    </div>
  );

  const renderExpertiseStep = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-5">
      <div className="text-center">
        <h2 className="text-[24px] font-gerat font-bold text-[#1D2939]">Craft & Expertise</h2>
        <p className="text-[14px] font-poppins text-[#667085]">Define what you're good at and your experience.</p>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-[#F2F4F7] space-y-6">
        <Select
          label="Primary trade"
          value={formData.primarySkillCategoryId}
          onChange={(v) => {
            const g = skillGroups.find((sg) => sg.category.id === v);
            setFormData((prev) => ({
              ...prev,
              primarySkillCategoryId: v,
              primaryTrade: g?.category.name ?? "",
              secondarySkillPicks: prev.secondarySkillPicks.filter((p) => p.categoryId !== v),
            }));
          }}
          options={primaryTradeOptions}
          required
        />

        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <label className="text-[14px] font-mabry text-gray-800">Secondary skills</label>
            <span className="text-[11px] font-poppins text-[#667085]">
              Min. 2 skills
            </span>
          </div>
          <p className="text-[12px] font-poppins text-[#667085]">
            Choose skills outside your primary trade category. You need at least 2 secondary
            skills.
            {!secondarySkillsMeetsRules(formData.secondarySkillPicks) && (
              <span className="text-amber-700">Add at least two secondary skills.</span>
            )}
          </p>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.secondarySkillPicks.map((p) => (
              <span
                key={p.skillId}
                className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-[12px] font-bold text-orange-600"
              >
                {p.name}
                <button
                  type="button"
                  className="rounded p-0.5 hover:bg-orange-100"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      secondarySkillPicks: prev.secondarySkillPicks.filter((x) => x.skillId !== p.skillId),
                    }))
                  }
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            fullWidth
            className="border-[#E4E7EC] font-poppins! font-semibold"
            onClick={() => setSecondaryModalOpen(true)}
          >
            + Add secondary skills
          </Button>
        </div>

        <SecondarySkillsPickerModal
          open={secondaryModalOpen}
          onClose={() => setSecondaryModalOpen(false)}
          skillGroups={skillGroups}
          value={formData.secondarySkillPicks}
          onChange={(next) => setFormData((prev) => ({ ...prev, secondarySkillPicks: next }))}
          excludeCategoryId={formData.primarySkillCategoryId || undefined}
        />

        <div className="space-y-4">
            <label className="text-[14px] font-mabry text-gray-800">Employment Status</label>
            <div className="grid grid-cols-2 gap-3">
                {['SELF_EMPLOYED', 'FREELANCING'].map((status) => (
                    <button
                        key={status}
                        onClick={() => handleInputChange('employmentStatus', status)}
                        className={`py-3 rounded-xl text-[12px] font-gerat font-bold transition-all border ${
                            formData.employmentStatus === status 
                            ? 'bg-brand-orange text-white border-brand-orange shadow-md' 
                            : 'bg-[#F6F6F6] text-gray-600 border-transparent hover:border-gray-200'
                        }`}
                    >
                        {status.replace('_', ' ')}
                    </button>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <Input 
                label="Experience (before)"
                type="number"
                placeholder="Years" 
                value={formData.yearsExperienceHomeCountry.toString()}
                onChange={(v) => handleInputChange('yearsExperienceHomeCountry', parseInt(v) || 0)}
            />
            <Input 
                label="Experience (now)"
                type="number"
                placeholder="Years" 
                value={formData.yearsExperienceCurrentCountry.toString()}
                onChange={(v) => handleInputChange('yearsExperienceCurrentCountry', parseInt(v) || 0)}
            />
        </div>

        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="text-[14px] font-mabry text-gray-800">Certification</label>
                <button 
                    onClick={addCertification}
                    className="text-brand-orange flex items-center gap-1 text-[12px] font-bold hover:underline"
                >
                    <Plus size={14} /> Add more
                </button>
            </div>
            {formData.certifications.map((cert, index) => (
                <div key={index} className="p-4 bg-[#F9FAFB] rounded-2xl relative space-y-3">
                    <button 
                        onClick={() => {
                            const newCerts = [...formData.certifications];
                            newCerts.splice(index, 1);
                            handleInputChange('certifications', newCerts);
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm"
                    >
                        <X size={14} />
                    </button>
                    <Input 
                        placeholder="Certificate Name" 
                        value={cert.name}
                        onChange={(v) => {
                            const newCerts = [...formData.certifications];
                            newCerts[index].name = v;
                            handleInputChange('certifications', newCerts);
                        }}
                    />
                    <Input 
                        placeholder="Issuer" 
                        value={cert.issuer}
                        onChange={(v) => {
                            const newCerts = [...formData.certifications];
                            newCerts[index].issuer = v;
                            handleInputChange('certifications', newCerts);
                        }}
                    />
                    <div className="space-y-2">
                      <label className="text-[14px] font-mabry text-gray-800">
                        Certification document
                      </label>
                      <div
                        role="button"
                        tabIndex={0}
                        className={`w-full rounded-2xl border-2 border-dashed border-[#0000001A] flex flex-col items-center justify-center p-4 transition-colors group ${
                          uploadingCertificationIndex === index
                            ? "cursor-not-allowed opacity-60"
                            : "cursor-pointer hover:bg-gray-100"
                        }`}
                        onClick={() => {
                          if (uploadingCertificationIndex === index) return;
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = "image/*,application/pdf";
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) void uploadCertificationDocument(index, file);
                          };
                          input.click();
                        }}
                        onKeyDown={(e) => {
                          if (e.key !== "Enter" && e.key !== " ") return;
                          e.preventDefault();
                          if (uploadingCertificationIndex === index) return;
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = "image/*,application/pdf";
                          input.onchange = (evt) => {
                            const file = (evt.target as HTMLInputElement).files?.[0];
                            if (file) void uploadCertificationDocument(index, file);
                          };
                          input.click();
                        }}
                      >
                        {cert.documentUrl ? (
                          <div className="flex flex-col items-center gap-1">
                            <CheckCircle2 size={32} className="text-green-500" />
                            <p className="text-[12px] font-poppins text-gray-600">Uploaded</p>
                            <a
                              href={cert.documentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-poppins text-[#FF6600] underline underline-offset-4 hover:opacity-90"
                            >
                              View
                            </a>
                          </div>
                        ) : (
                          <>
                            <Upload
                              size={28}
                              className="text-gray-300 group-hover:text-brand-orange transition-colors"
                            />
                            <p className="text-[12px] font-poppins text-gray-400">
                              Upload certification document
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                </div>
            ))}
        </div>

        <div className="flex items-center justify-between p-4 bg-[#F6F6F6] rounded-2xl">
            <div className="flex items-center gap-2">
                <Briefcase size={20} className="text-gray-400" />
                <span className="text-[14px] font-poppins text-gray-700">Own professional tools?</span>
            </div>
            <button 
                onClick={() => handleInputChange('toolsOwned', !formData.toolsOwned)}
                className={`w-12 h-6 rounded-full transition-colors relative ${formData.toolsOwned ? 'bg-brand-orange' : 'bg-gray-300'}`}
            >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.toolsOwned ? 'left-7' : 'left-1'}`}></div>
            </button>
        </div>

        <Select 
            label="Transport Type" 
            value={formData.transportType}
            onChange={(v) => handleInputChange('transportType', v)}
            options={[
                { value: "NONE", label: "None" },
                { value: "BIKE", label: "Bike" },
                { value: "CAR", label: "Car" },
                { value: "VAN", label: "Van" },
            ]}
        />

        {/* Add Photos Of Your Work (up to 3 images) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[16px] font-gerat font-bold text-[#1D2939]">
                Add Photos Of Your Work
              </p>
              <p className="mt-1 text-[13px] font-poppins text-[#667085]">
                You may add up to 3 images.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((slotIdx) => {
              const preview = formData.portfolioPreviews[slotIdx];
              if (preview) {
                return (
                  <div
                    key={slotIdx}
                    className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 bg-gray-50"
                  >
                    <Image
                      src={preview}
                      alt="Work"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <button
                      type="button"
                      className="absolute top-1 right-1 w-7 h-7 rounded-full bg-white/90 border border-gray-100 flex items-center justify-center text-red-500 hover:bg-white"
                      onClick={() => removeWorkPhotoAt(slotIdx)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              }

              return (
                <button
                  key={slotIdx}
                  type="button"
                  className="aspect-square rounded-xl border-2 border-dashed border-gray-100 bg-gray-50 flex flex-col items-center justify-center gap-1 text-gray-300 hover:border-brand-orange hover:text-brand-orange transition-colors"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.multiple = true;
                    input.onchange = (e) => {
                      void addWorkPhotos((e.target as HTMLInputElement).files);
                    };
                    input.click();
                  }}
                >
                  <Upload size={26} />
                  <span className="text-[12px] font-poppins text-gray-500">Upload</span>
                </button>
              );
            })}
          </div>

          {/* Video removed (photos only) */}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentStep) {
      case 1: return renderIntroduction();
      case 2: return renderDocumentsStep();
      case 3: return renderProfileStep();
      case 4: return renderExpertiseStep();
      case 5: return (
        <div className="text-center space-y-8 animate-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <ShieldCheck size={48} />
            </div>
            <div className="space-y-2">
                <h2 className="text-[28px] font-gerat font-bold text-[#1D2939]">All Set!</h2>
                <p className="text-[14px] font-poppins text-[#667085] max-w-[280px] mx-auto">
                    Review your information below before submitting for approval.
                </p>
            </div>
            
            <div className="bg-white p-6 rounded-3xl border border-[#F2F4F7] text-left space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                    <span className="text-gray-400 font-poppins text-[13px]">Full Name</span>
                    <span className="font-gerat font-bold text-[14px]">{formData.legalFullName}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                    <span className="text-gray-400 font-poppins text-[13px]">Primary Trade</span>
                    <span className="font-gerat font-bold text-[14px] capitalize">{formData.primaryTrade}</span>
                </div>
                <div className="flex justify-between items-start gap-2 pb-4 border-b border-gray-50">
                    <span className="text-gray-400 font-poppins text-[13px] shrink-0">Secondary skills</span>
                    <span className="font-gerat font-bold text-[14px] text-right">
                      {formData.secondarySkillPicks.length
                        ? formData.secondarySkillPicks.map((p) => p.name).join(", ")
                        : "—"}
                    </span>
                </div>
            </div>

            <div className="p-4 bg-orange-50 rounded-2xl flex gap-3 text-left">
                <Info size={20} className="text-brand-orange shrink-0" />
                <p className="text-[12px] font-poppins text-brand-orange leading-relaxed">
                    By submitting, you agree that all information provided is accurate. Our team typically reviews applications within 2-3 business days.
                </p>
            </div>
        </div>
      );
      default: return null;
    }
  };

  return (
    submitSuccess ? (
      <main className="relative w-full min-h-screen bg-[#F9FAFB] pb-32">
        <div className="max-w-[500px] mx-auto px-4 py-10">
          <div className="bg-white p-8 rounded-3xl border border-[#F2F4F7] text-center space-y-4">
            <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <ShieldCheck size={48} />
            </div>
            <div className="space-y-2">
              <h2 className="text-[28px] font-gerat font-bold text-[#1D2939]">Submitted!</h2>
              <p className="text-[14px] font-poppins text-[#667085] max-w-[320px] mx-auto">
                Your profile information has been submitted successfully.
              </p>
            </div>

            <div className="pt-4">
              <Button
                variant="primary"
                fullWidth
                onClick={() => router.push("/")}
                disabled={isLoading}
                className="py-4 text-[16px] font-gerat font-bold"
              >
                Back to home
              </Button>
            </div>
          </div>
        </div>
      </main>
    ) : (
    <main className="relative w-full min-h-screen bg-[#F9FAFB] pb-32">
      <Header 
        title={currentStep === 1 ? "Become a Crafter" : steps.find(s => s.id === currentStep)?.title || "Verification"} 
        showBack={currentStep > 1}
        onBack={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
      />

      <div className="max-w-[500px] mx-auto px-4 py-8">
        {currentStep > 1 && (
            <div className="flex justify-center mb-8 gap-2">
                {steps.slice(1).map((s) => (
                    <div 
                        key={s.id} 
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                            currentStep === s.id ? 'w-8 bg-brand-orange' : 
                            currentStep > s.id ? 'w-4 bg-green-500' : 'w-4 bg-gray-200'
                        }`}
                    />
                ))}
            </div>
        )}

        {renderContent()}

        {currentStep > 1 && (
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-gray-100 z-40">
                <div className="max-w-[500px] mx-auto">
                    <Button
                        variant="primary"
                        fullWidth
                        disabled={isLoading}
                        onClick={() => {
                            if (currentStep === 5) {
                                handleSubmit();
                            } else if (currentStep === 4) {
                              if (!formData.primarySkillCategoryId) {
                                toast.error("Select a primary trade");
                                return;
                              }
                              if (!secondarySkillsMeetsRules(formData.secondarySkillPicks)) {
                                toast.error("Add at least two secondary skills.");
                                return;
                              }
                              setCurrentStep(currentStep + 1);
                              window.scrollTo(0, 0);
                            } else {
                              setCurrentStep(currentStep + 1);
                              window.scrollTo(0, 0);
                            }
                        }}
                    >
                        {isLoading ? "Submitting..." : currentStep === 5 ? "Submit Application" : "Continue"}
                    </Button>
                </div>
            </div>
        )}
      </div>
    </main>
    )
  );
}
