"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, X, User as UserIcon, HelpCircle, ChevronLeft, MapPin, Plus } from "lucide-react";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Button from "@/components/ui/button";
import ProfileCollapsibleSection, { ProfileInfoRow } from "@/components/shared/ProfileCollapsibleSection";
import KrafterProfileSkillsEditor, {
  skillsToApiOfferings,
  validateSkillOfferings,
} from "@/components/tasker/KrafterProfileSkillsEditor";
import KrafterLegalDetailsSection from "@/components/tasker/KrafterLegalDetailsSection";
import KrafterProfileReadOnlySections from "@/components/tasker/KrafterProfileReadOnlySections";
import ServiceRadius from "@/components/ui/serviceRadius";
import { SearchCombobox } from "@/components/ui/SearchCombobox";
import { useAuthStore } from "@/store/useAuthStore";
import { useProfileStore } from "@/store/useProfileStore";
import toast from "react-hot-toast";
import { AddressAutocompleteInput } from "@/components/ui/AddressAutocompleteInput";
import { resolveKrafterLocationCoords } from "@/lib/geoapify";
import { hasKrafterProfileCoords } from "@/lib/taskLocation";
import {
  getArtisanProfileCoords,
  readUserField,
} from "@/lib/artisanProfileDisplay";
import {
  GENDER_SELECT_OPTIONS,
  normalizeGenderApiValue,
  isValidGenderSelection,
  type GenderApiValue,
} from "@/lib/genderOptions";
import NationalityFieldHint from "@/components/shared/NationalityFieldHint";
import {
  extractServiceCategoryOfferings,
  mapOfferingsToSkillDrafts,
  type SkillOfferingDraft,
} from "@/lib/krafterSkillsDraft";

const Tag = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
  <div className="flex items-center gap-1.5 bg-[#F6F6F6] text-[#667085] px-3 py-1.5 rounded-lg border border-[#0000001A] group">
    <span className="text-[13px] font-poppins font-medium">{label}</span>
    <button type="button" onClick={onRemove} className="hover:text-red-500">
      <X size={14} />
    </button>
  </div>
);

type CertificationRow = {
  name: string;
  issuer: string;
  issueDate?: string;
  expiryDate?: string;
  documentUrl?: string;
};

const emptyCert = (): CertificationRow => ({
  name: "",
  issuer: "",
  issueDate: "",
  expiryDate: "",
});

const PageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const focusLocation = searchParams.get("focus") === "location";
  const { user } = useAuthStore();
  const {
    artisanProfile,
    fetchArtisanProfile,
    saveKrafterPersonal,
    submitPersonalDetails,
    submitSkills,
    getUploadUrlForProfilePic,
    getUploadUrlForPortfolioMedia,
    getUploadUrlForCert,
    updateKrafterProfilePhotoUrl,
    isLoading,
  } = useProfileStore();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [nationality, setNationality] = useState("");
  const [bio, setBio] = useState("");
  const [trade, setTrade] = useState("");
  const [location, setLocation] = useState("");
  const [locationCoords, setLocationCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [travelRadiusKm, setTravelRadiusKm] = useState(10);
  const [uniquePoint, setUniquePoint] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [workPhotos, setWorkPhotos] = useState<string[]>([]);
  const [savedCertifications, setSavedCertifications] = useState<CertificationRow[]>([]);
  const [newCertifications, setNewCertifications] = useState<CertificationRow[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<SkillOfferingDraft[]>([]);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [nationalities, setNationalities] = useState<string[]>([]);
  const [demonymToCode, setDemonymToCode] = useState<Record<string, string>>({});
  const [codeToDemonym, setCodeToDemonym] = useState<Record<string, string>>({});
  const [nationalitiesLoading, setNationalitiesLoading] = useState(true);

  const profilePhotoInputRef = useRef<HTMLInputElement>(null);
  const locationSectionRef = useRef<HTMLDivElement>(null);
  const skillsInitializedRef = useRef(false);
  const MAX_WORK_PHOTOS = 3;

  const needsLocationUpdate =
    artisanProfile != null && !hasKrafterProfileCoords(artisanProfile);
  const highlightLocation = focusLocation || needsLocationUpdate;
  const hasProfilePhoto = Boolean(profilePhotoUrl || user?.avatar);

  useEffect(() => {
    fetchArtisanProfile();
  }, [fetchArtisanProfile]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/nationalities");
        const data: Array<{ demonym: string; code: string }> = await res.json();
        if (!Array.isArray(data)) return;
        const toCode: Record<string, string> = {};
        const toDemonym: Record<string, string> = {};
        const list: string[] = [];
        data.forEach(({ demonym, code }) => {
          list.push(demonym);
          toCode[demonym] = code;
          toDemonym[code] = demonym;
        });
        setNationalities(list);
        setDemonymToCode(toCode);
        setCodeToDemonym(toDemonym);
      } catch {
        setNationalities(["German", "Nigerian", "British"]);
        setDemonymToCode({ German: "DE", Nigerian: "NG", British: "GB" });
        setCodeToDemonym({ DE: "German", NG: "Nigerian", GB: "British" });
      } finally {
        setNationalitiesLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!highlightLocation || !locationSectionRef.current) return;
    const timer = window.setTimeout(() => {
      locationSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 150);
    return () => window.clearTimeout(timer);
  }, [highlightLocation, artisanProfile]);

  useEffect(() => {
    if (!artisanProfile) return;

    setFirstName(readUserField(artisanProfile, "firstName", "first_name") ?? user?.firstName ?? "");
    setLastName(readUserField(artisanProfile, "lastName", "last_name") ?? user?.lastName ?? "");

    const genderRaw = readUserField(artisanProfile, "gender");
    setGender(normalizeGenderApiValue(genderRaw));

    setDateOfBirth(readUserField(artisanProfile, "dateOfBirth", "date_of_birth") ?? "");

    const nationalityCode = readUserField(artisanProfile, "nationality");
    if (nationalityCode) {
      setNationality(codeToDemonym[nationalityCode] ?? nationalityCode);
    }

    setBio(artisanProfile.bio || "");
    setTrade(artisanProfile.occupationDescription || artisanProfile.primaryTrade || "");
    setLocation(artisanProfile.baseCity?.trim() ?? "");
    setLocationCoords(getArtisanProfileCoords(artisanProfile));
    setTravelRadiusKm(artisanProfile.travelRadiusKm ?? 10);
    setUniquePoint(artisanProfile.uniqueSellingPoint || "");
    setLanguages((artisanProfile.languages || []).map((l) => l.name));
    setProfilePhotoUrl(artisanProfile.profilePhotoUrl || null);
    setWorkPhotos(artisanProfile.portfolioPhotoUrls || []);
    setSavedCertifications(
      (artisanProfile.certifications || []).map((c) => ({
        name: c.name,
        issuer: c.issuer,
        issueDate: c.issueDate,
        expiryDate: c.expiryDate,
        documentUrl: c.documentUrl,
      })),
    );
    setNewCertifications([]);
  }, [artisanProfile, user, codeToDemonym]);

  useEffect(() => {
    if (!artisanProfile || skillsInitializedRef.current) return;
    const offerings = extractServiceCategoryOfferings(artisanProfile);
    if (offerings.length > 0) {
      setSelectedSkills(mapOfferingsToSkillDrafts(offerings));
      skillsInitializedRef.current = true;
    }
  }, [artisanProfile]);

  const buildLanguagePayload = () =>
    languages.map((name) => {
      const existing = artisanProfile?.languages?.find((l) => l.name === name);
      return (
        existing ?? {
          name,
          code: name.toLowerCase().slice(0, 2),
          proficiency: "fluent",
        }
      );
    });

  const handleSave = async () => {
    const skillError = validateSkillOfferings(selectedSkills);
    if (skillError) {
      toast.error(skillError);
      return;
    }

    const resolvedCoords = await resolveKrafterLocationCoords(location, locationCoords);
    if (highlightLocation && !resolvedCoords) {
      toast.error("Please search for your city or area and pick a suggestion from the list.");
      locationSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const incompleteNewCerts = newCertifications.filter(
      (c) => c.name.trim() || c.issuer.trim() || c.documentUrl,
    );
    for (const cert of incompleteNewCerts) {
      if (!cert.name.trim() || !cert.issuer.trim() || !cert.documentUrl) {
        toast.error("Complete all fields and upload a document for each new certification.");
        return;
      }
    }

    setIsSaving(true);
    try {
      if (
        firstName.trim() &&
        lastName.trim() &&
        isValidGenderSelection(gender) &&
        dateOfBirth &&
        nationality
      ) {
        await saveKrafterPersonal({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          gender: gender as GenderApiValue,
          dateOfBirth,
          nationality: demonymToCode[nationality] ?? nationality,
        });
      }

      const certsToAppend = newCertifications.filter(
        (c): c is CertificationRow & { documentUrl: string } =>
          Boolean(c.name.trim() && c.issuer.trim() && c.documentUrl),
      );

      await submitPersonalDetails({
        bio,
        occupationDescription: trade,
        whereYouLive: location.trim(),
        travelRadiusKm,
        ...(resolvedCoords
          ? { latitude: resolvedCoords.latitude, longitude: resolvedCoords.longitude }
          : {}),
        uniqueSellingPoint: uniquePoint,
        portfolioPhotoUrls: workPhotos,
        profilePhotoUrl: profilePhotoUrl || undefined,
        ...(certsToAppend.length > 0 ? { certifications: certsToAppend } : {}),
        languages: buildLanguagePayload(),
      });

      if (selectedSkills.length > 0) {
        await submitSkills({
          serviceCategoryOfferings: skillsToApiOfferings(selectedSkills),
        });
      }

      await fetchArtisanProfile();
      toast.success("Profile updated successfully!");
      router.push("/tasker/profile");
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast.error(ax.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const removeLanguage = (lang: string) => {
    setLanguages((prev) => prev.filter((l) => l !== lang));
  };

  const addLanguage = (lang: string) => {
    if (lang !== "select" && !languages.includes(lang)) {
      setLanguages((prev) => [...prev, lang]);
    }
  };

  const uploadPortfolioPhoto = async (file: File): Promise<string> => {
    const { uploadUrl, publicUrl, requiredUploadHeaders } = await getUploadUrlForPortfolioMedia({
      filename: file.name,
      mimetype: file.type || "application/octet-stream",
      fileSize: file.size,
    });
    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: requiredUploadHeaders,
      body: file,
    });
    if (!putRes.ok) throw new Error(`Upload failed (HTTP ${putRes.status})`);
    return publicUrl;
  };

  const uploadCertDocument = async (file: File): Promise<string> => {
    const { uploadUrl, publicUrl, requiredUploadHeaders } = await getUploadUrlForCert({
      filename: file.name,
      mimetype: file.type || "application/octet-stream",
      fileSize: file.size,
    });
    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: requiredUploadHeaders,
      body: file,
    });
    if (!putRes.ok) throw new Error(`Upload failed (HTTP ${putRes.status})`);
    return publicUrl;
  };

  const uploadProfilePhoto = async (file: File): Promise<string> => {
    const { uploadUrl, publicUrl, requiredUploadHeaders } = await getUploadUrlForProfilePic({
      filename: file.name,
      mimetype: file.type || "image/jpeg",
      fileSize: file.size,
    });
    const response = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: requiredUploadHeaders,
    });
    if (!response.ok) throw new Error("Profile photo upload failed");
    return publicUrl;
  };

  const handleProfilePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setIsUploadingAvatar(true);
      const publicUrl = await uploadProfilePhoto(file);
      setProfilePhotoUrl(publicUrl);
      await updateKrafterProfilePhotoUrl({ profilePhotoUrl: publicUrl });
      await fetchArtisanProfile();
      toast.success("Profile photo updated!");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : err instanceof Error
            ? err.message
            : "Failed to upload profile photo";
      toast.error(msg || "Failed to upload profile photo");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const addPortfolioPhoto = async (file: File | null) => {
    if (!file || workPhotos.length >= MAX_WORK_PHOTOS) return;
    try {
      setIsUploadingPhotos(true);
      const url = await uploadPortfolioPhoto(file);
      setWorkPhotos((prev) => [...prev, url].slice(0, MAX_WORK_PHOTOS));
      toast.success("Portfolio photo added.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to upload portfolio photo");
    } finally {
      setIsUploadingPhotos(false);
    }
  };

  const replacePortfolioPhotoAt = async (index: number, file: File | null) => {
    if (!file) return;
    try {
      setIsUploadingPhotos(true);
      const url = await uploadPortfolioPhoto(file);
      setWorkPhotos((prev) => prev.map((x, i) => (i === index ? url : x)));
      toast.success("Portfolio photo replaced.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to replace portfolio photo");
    } finally {
      setIsUploadingPhotos(false);
    }
  };

  const updateNewCert = (index: number, patch: Partial<CertificationRow>) => {
    setNewCertifications((prev) =>
      prev.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    );
  };

  const uploadNewCertDocument = async (index: number, file: File | null) => {
    if (!file) return;
    try {
      setIsUploadingPhotos(true);
      const url = await uploadCertDocument(file);
      updateNewCert(index, { documentUrl: url });
      toast.success("Certification document uploaded.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to upload certification");
    } finally {
      setIsUploadingPhotos(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="w-full flex items-center justify-between py-6 px-4 bg-white border-b border-[#F2F4F7]">
        <button type="button" onClick={() => router.back()} className="p-1 hover:opacity-70 transition-opacity">
          <ChevronLeft className="w-8 h-8 text-[#1D2939]" strokeWidth={1.5} />
        </button>
        <div className="text-center">
          <h1 className="text-[20px] font-gerat font-bold text-[#1D2939]">Personal Information</h1>
          <p className="text-[12px] font-poppins text-[#667085]">Manage information about yourself</p>
        </div>
        <div className="w-10" />
      </div>

      <div className="px-4 py-8 space-y-4 max-w-4xl mx-auto pb-32">
        <div className="flex flex-col items-center">
          <input
            ref={profilePhotoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleProfilePhotoSelected}
          />
          <button
            type="button"
            disabled={isUploadingAvatar}
            onClick={() => {
              if (!isUploadingAvatar) profilePhotoInputRef.current?.click();
            }}
            className="relative w-32 h-32 rounded-full border-2 border-[#EAECF0] p-1 shadow-sm bg-white shrink-0 group cursor-pointer disabled:opacity-70 disabled:cursor-wait"
            aria-label={hasProfilePhoto ? "Change profile photo" : "Add profile photo"}
          >
            <div className="relative w-full h-full rounded-full overflow-hidden">
              {profilePhotoUrl || user?.avatar ? (
                <Image
                  src={profilePhotoUrl || user?.avatar || ""}
                  alt="Profile"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-400">
                  {isUploadingAvatar ? (
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-orange border-t-transparent" />
                  ) : (
                    <UserIcon size={40} />
                  )}
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-white p-2 rounded-full shadow-md border border-gray-100 pointer-events-none">
              <Camera size={16} className="text-[#1D2939]" />
            </div>
          </button>
          <p className="mt-3 text-[12px] font-poppins text-[#667085] text-center max-w-xs">
            Tap your photo to update it
          </p>
        </div>

        {artisanProfile ? <KrafterLegalDetailsSection profile={artisanProfile} /> : null}

        <ProfileCollapsibleSection
          title="Profile information"
          subtitle="Your public profile and personal details"
          defaultOpen
        >
          <div className="space-y-6 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="First name" value={firstName} onChange={setFirstName} />
              <Input label="Last name" value={lastName} onChange={setLastName} />
            </div>
            <Select
              label="Gender"
              placeholder="Select gender"
              value={gender}
              onChange={setGender}
              options={GENDER_SELECT_OPTIONS}
            />
            <Input label="Date of birth" type="date" value={dateOfBirth} onChange={setDateOfBirth} />
            <SearchCombobox
              label="Nationality"
              value={nationality}
              onChange={setNationality}
              options={nationalities}
              isLoading={nationalitiesLoading}
              placeholder="Search nationality"
              emptyMessage="No nationality found."
            />
            <NationalityFieldHint />
            <ProfileInfoRow label="Phone" value={readUserField(artisanProfile, "phone")} />
            <ProfileInfoRow label="Email" value={readUserField(artisanProfile, "email")} />
            <ProfileInfoRow label="Display name (auto)" value={artisanProfile?.displayName} />
            <ProfileInfoRow
              label="Legal full name (derived)"
              value={artisanProfile?.legalFullName || artisanProfile?.displayFullName}
            />

            <div className="space-y-2">
              <label className="text-[14px] font-poppins text-gray-800">Bio</label>
              <textarea
                className="w-full p-4 rounded-xl bg-[#F6F6F6] border border-[#0000001A] outline-none min-h-[100px] font-poppins text-[14px] placeholder:text-gray-400"
                placeholder="Tell customers about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            <Input
              label="Occupation / what you do"
              placeholder="e.g. Student or IT support"
              value={trade}
              onChange={setTrade}
            />

            <div className="space-y-3">
              <Select
                label="Languages"
                placeholder="Select"
                value="select"
                onChange={addLanguage}
                options={[
                  { value: "select", label: "Select" },
                  { value: "French", label: "French" },
                  { value: "English", label: "English" },
                  { value: "German", label: "German" },
                  { value: "Spanish", label: "Spanish" },
                ]}
              />
              <div className="flex flex-wrap gap-2">
                {languages.map((lang) => (
                  <Tag key={lang} label={lang} onRemove={() => removeLanguage(lang)} />
                ))}
              </div>
            </div>

            <div
              ref={locationSectionRef}
              className={`rounded-2xl p-5 scroll-mt-24 transition-colors ${
                highlightLocation
                  ? "bg-[#FFF4ED] border-2 border-brand-orange/40"
                  : "bg-[#F9FAFB] border border-[#EAECF0]"
              }`}
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="shrink-0 rounded-full bg-brand-orange/10 p-2 text-brand-orange">
                  <MapPin size={18} strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-[16px] font-gerat font-bold text-[#1D2939]">Base city</h3>
                  <p className="text-[13px] text-[#667085] font-poppins mt-1">
                    Saved as whereYouLive / baseCity. Pick a suggestion to update coordinates.
                  </p>
                </div>
              </div>
              <AddressAutocompleteInput
                label="City or area"
                placeholder="Search city, postcode, or street"
                value={location}
                onChange={(val) => {
                  setLocation(val);
                  setLocationCoords(null);
                }}
                onSelectSuggestion={(suggestion) => {
                  setLocation(suggestion.label.split(",")[0]?.trim() || suggestion.label);
                  if (
                    suggestion.latitude != null &&
                    suggestion.longitude != null &&
                    Number.isFinite(suggestion.latitude) &&
                    Number.isFinite(suggestion.longitude)
                  ) {
                    setLocationCoords({
                      latitude: suggestion.latitude,
                      longitude: suggestion.longitude,
                    });
                  }
                }}
              />
              {locationCoords ? (
                <p className="mt-2 text-[12px] font-poppins text-green-700">
                  Coordinates: {locationCoords.latitude.toFixed(5)}, {locationCoords.longitude.toFixed(5)}
                </p>
              ) : null}
              {artisanProfile?.postalCode ? (
                <p className="mt-2 text-[11px] font-poppins text-[#667085]">
                  Postal code on file: {artisanProfile.postalCode} (from onboarding)
                </p>
              ) : null}
            </div>

            <ServiceRadius radius={travelRadiusKm} setRadius={setTravelRadiusKm} />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[14px] font-poppins text-gray-800">Unique selling point</label>
                <HelpCircle size={14} className="text-gray-400" />
              </div>
              <textarea
                className="w-full p-4 rounded-xl bg-[#F6F6F6] border border-[#0000001A] outline-none min-h-[100px] font-poppins text-[14px] placeholder:text-gray-400"
                placeholder="What makes you stand out..."
                value={uniquePoint}
                onChange={(e) => setUniquePoint(e.target.value)}
              />
            </div>
          </div>
        </ProfileCollapsibleSection>

        <ProfileCollapsibleSection title="Skills & rates" subtitle="Services you offer">
          <KrafterProfileSkillsEditor
            skills={selectedSkills}
            onSkillsChange={setSelectedSkills}
            artisanProfile={artisanProfile}
          />
        </ProfileCollapsibleSection>

        <ProfileCollapsibleSection title="Portfolio photos" subtitle="Up to 3 images">
          <div className="pt-2">
            <div className="flex flex-wrap gap-4">
              {workPhotos.map((src, idx) => (
                <div
                  key={`${src}-${idx}`}
                  className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden group border border-[#EAECF0]"
                >
                  <Image src={src} alt="work" fill className="object-cover" unoptimized />
                  <button
                    type="button"
                    onClick={() => setWorkPhotos((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1.5 right-1.5 z-10 w-6 h-6 bg-black/60 hover:bg-red-500 rounded-full flex items-center justify-center"
                    aria-label="Remove photo"
                  >
                    <X size={12} className="text-white" />
                  </button>
                  <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      className="px-2 py-1 text-[10px] rounded-md bg-white text-[#1D2939] font-poppins font-semibold"
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0] || null;
                          void replacePortfolioPhotoAt(idx, file);
                        };
                        input.click();
                      }}
                    >
                      Replace
                    </button>
                  </div>
                </div>
              ))}
              {workPhotos.length < MAX_WORK_PHOTOS && (
                <button
                  type="button"
                  disabled={isUploadingPhotos}
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0] || null;
                      void addPortfolioPhoto(file);
                    };
                    input.click();
                  }}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-dashed border-[#EAECF0] flex flex-col items-center justify-center gap-1 text-[#667085] hover:bg-gray-50"
                >
                  <Plus size={20} />
                  <span className="text-[11px] font-poppins">Add photo</span>
                </button>
              )}
            </div>
            <p className="text-[11px] font-poppins text-[#667085] mt-3">
              Saving replaces your full portfolio photo list (max {MAX_WORK_PHOTOS}).
            </p>
          </div>
        </ProfileCollapsibleSection>

        <ProfileCollapsibleSection title="Certifications" subtitle="Existing + add new">
          <div className="pt-2 space-y-4">
            {savedCertifications.length > 0 ? (
              <div className="space-y-3">
                <p className="text-[11px] font-poppins font-semibold uppercase tracking-wide text-[#98A2B3]">
                  On your profile
                </p>
                {savedCertifications.map((cert, idx) => (
                  <div
                    key={`saved-${cert.name}-${idx}`}
                    className="rounded-2xl border border-[#EAECF0] bg-[#F9FAFB] p-4"
                  >
                    <p className="text-[14px] font-poppins font-semibold text-[#1D2939]">{cert.name}</p>
                    {cert.issuer ? (
                      <p className="text-[12px] font-poppins text-[#667085] mt-1">Issuer: {cert.issuer}</p>
                    ) : null}
                    {cert.documentUrl ? (
                      <a
                        href={cert.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block mt-2 text-[12px] font-poppins font-semibold text-brand-orange hover:underline"
                      >
                        View document
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] font-poppins text-[#667085]">No certifications on file yet.</p>
            )}

            {newCertifications.map((cert, idx) => (
              <div key={`new-cert-${idx}`} className="rounded-2xl border border-[#EAECF0] p-4 space-y-3 bg-white">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-poppins font-semibold text-[#1D2939]">New certification</p>
                  <button
                    type="button"
                    onClick={() => setNewCertifications((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-red-500 hover:text-red-600"
                  >
                    <X size={16} />
                  </button>
                </div>
                <Input
                  label="Name"
                  value={cert.name}
                  onChange={(v) => updateNewCert(idx, { name: v })}
                />
                <Input
                  label="Issuer"
                  value={cert.issuer}
                  onChange={(v) => updateNewCert(idx, { issuer: v })}
                />
                <Input
                  label="Issue date"
                  type="date"
                  value={cert.issueDate ?? ""}
                  onChange={(v) => updateNewCert(idx, { issueDate: v })}
                />
                <Input
                  label="Expiry date"
                  type="date"
                  value={cert.expiryDate ?? ""}
                  onChange={(v) => updateNewCert(idx, { expiryDate: v })}
                />
                <button
                  type="button"
                  disabled={isUploadingPhotos}
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "application/pdf,image/*";
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0] || null;
                      void uploadNewCertDocument(idx, file);
                    };
                    input.click();
                  }}
                  className="w-full py-2.5 rounded-xl border border-[#EAECF0] text-[13px] font-poppins font-semibold text-brand-orange hover:bg-orange-50"
                >
                  {cert.documentUrl ? "Replace document" : "Upload document"}
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setNewCertifications((prev) => [...prev, emptyCert()])}
              className="w-full py-3 flex items-center justify-center gap-2 border border-dashed border-[#EAECF0] rounded-xl text-[13px] font-poppins font-semibold text-[#667085] hover:bg-gray-50"
            >
              <Plus size={16} />
              Add certification
            </button>
            <p className="text-[11px] font-poppins text-[#667085]">
              New certifications are appended on save. Existing ones cannot be removed here.
            </p>
          </div>
        </ProfileCollapsibleSection>

        {artisanProfile ? <KrafterProfileReadOnlySections profile={artisanProfile} /> : null}

        <section className="pt-4">
          <Button
            variant="primary"
            fullWidth
            onClick={handleSave}
            disabled={isLoading || isUploadingAvatar || isUploadingPhotos || isSaving}
            className="py-4 text-[16px] font-gerat rounded-2xl"
          >
            {isSaving || isLoading ? "Saving..." : "Save changes"}
          </Button>
        </section>
      </div>
    </main>
  );
};

const Page = () => (
  <Suspense fallback={<main className="min-h-screen bg-white" />}>
    <PageContent />
  </Suspense>
);

export default Page;
