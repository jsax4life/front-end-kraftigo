"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, X, User as UserIcon, HelpCircle, ChevronLeft, MapPin } from "lucide-react";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Button from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { useProfileStore } from "@/store/useProfileStore";
import toast from "react-hot-toast";
import { AddressAutocompleteInput } from "@/components/ui/AddressAutocompleteInput";
import { resolveKrafterLocationCoords } from "@/lib/geoapify";
import { hasKrafterProfileCoords } from "@/lib/taskLocation";
import { getKrafterWorkMediaFromStatus } from "@/lib/api/krafter-profile-completion";

const Tag = ({ label, onRemove }: { label: string, onRemove: () => void }) => (
  <div className="flex items-center gap-1.5 bg-[#F6F6F6] text-[#667085] px-3 py-1.5 rounded-lg border border-[#0000001A] group">
    <span className="text-[13px] font-poppins font-medium">{label}</span>
    <button onClick={onRemove} className="hover:text-red-500">
      <X size={14} />
    </button>
  </div>
);

const SectionTitle = ({ label, desc }: { label: string, desc?: string }) => (
  <div className="mb-6">
    <h2 className="text-[18px] font-gerat font-bold text-[#1D2939] leading-tight">{label}</h2>
    {desc && <p className="text-[14px] text-[#667085] font-poppins mt-1">{desc}</p>}
  </div>
);

const PageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const focusLocation = searchParams.get("focus") === "location";
  const { user } = useAuthStore();
  const {
    artisanProfile,
    fetchArtisanProfile,
    personalDetailsStatus,
    fetchKrafterPersonalDetailsStatus,
    submitPersonalDetails,
    getUploadUrlForProfilePic,
    getUploadUrlForPortfolioMedia,
    updateKrafterProfilePhotoUrl,
    isLoading,
  } = useProfileStore();
  
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [trade, setTrade] = useState("");
  const [location, setLocation] = useState("");
  const [locationCoords, setLocationCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [uniquePoint, setUniquePoint] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [workPhotos, setWorkPhotos] = useState<string[]>([]);
  type CertificationRow = {
    name: string;
    issuer: string;
    issueDate?: string;
    expiryDate?: string;
    documentUrl?: string;
  };
  const [certifications, setCertifications] = useState<CertificationRow[]>([]);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);
  const locationSectionRef = useRef<HTMLDivElement>(null);
  const MAX_WORK_PHOTOS = 3;

  const needsLocationUpdate =
    artisanProfile != null && !hasKrafterProfileCoords(artisanProfile);
  const highlightLocation = focusLocation || needsLocationUpdate;

  const hasProfilePhoto = Boolean(profilePhotoUrl || user?.avatar);

  useEffect(() => {
    fetchKrafterPersonalDetailsStatus();
    fetchArtisanProfile();
  }, [fetchKrafterPersonalDetailsStatus, fetchArtisanProfile]);

  useEffect(() => {
    if (!highlightLocation || !locationSectionRef.current) return;
    const timer = window.setTimeout(() => {
      locationSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 150);
    return () => window.clearTimeout(timer);
  }, [highlightLocation, personalDetailsStatus]);

  // Prefill all fields from GET /api/profile/krafter/complete-profile/personal-details
  useEffect(() => {
    if (personalDetailsStatus?.personal) {
      const d = personalDetailsStatus.personal;
      const fallback = personalDetailsStatus.suggestedDisplayName ||
        (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '');
      setDisplayName(d.displayName || fallback);
      setBio(d.bio || '');
      setTrade(d.occupationDescription || '');
      setLocation(d.whereYouLive || '');
      if (
        typeof d.latitude === "number" &&
        typeof d.longitude === "number" &&
        Number.isFinite(d.latitude) &&
        Number.isFinite(d.longitude)
      ) {
        setLocationCoords({ latitude: d.latitude, longitude: d.longitude });
      }
      setUniquePoint(d.uniqueSellingPoint || '');
      setLanguages((d.languages || []).map(l => l.name));
      setProfilePhotoUrl(d.profilePhotoUrl || null);

      const workMedia = getKrafterWorkMediaFromStatus(personalDetailsStatus);
      setWorkPhotos(workMedia.portfolioPhotoUrls);
      if (workMedia.certifications.length > 0) {
        setCertifications(
          workMedia.certifications.map(c => ({
            name: c.name,
            issuer: c.issuer,
            issueDate: c.issueDate ?? undefined,
            expiryDate: c.expiryDate ?? undefined,
            documentUrl: c.documentUrl,
          }))
        );
      }
    }
  }, [personalDetailsStatus, user]);

  const handleSave = async () => {
    try {
      const resolvedCoords = await resolveKrafterLocationCoords(
        location,
        locationCoords,
      );

      if (highlightLocation && !resolvedCoords) {
        toast.error(
          "Please search for your city or area and pick a suggestion from the list.",
        );
        locationSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        return;
      }

      await submitPersonalDetails({
        displayName,
        bio,
        occupationDescription: trade,
        whereYouLive: location,
        ...(resolvedCoords
          ? {
              latitude: resolvedCoords.latitude,
              longitude: resolvedCoords.longitude,
            }
          : {}),
        uniqueSellingPoint: uniquePoint,
        portfolioPhotoUrls: workPhotos,
        profilePhotoUrl: profilePhotoUrl || undefined,
        certifications: certifications.length > 0
          ? certifications
              .filter((c): c is typeof c & { documentUrl: string } => !!c.documentUrl)
          : undefined,
        languages: languages.map(l => ({ name: l, code: l.toLowerCase().slice(0, 2), proficiency: 'fluent' })),
      });
      toast.success("Profile updated successfully!");
      router.push("/tasker/profile");
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const removeLanguage = (lang: string) => {
    setLanguages(prev => prev.filter(l => l !== lang));
  };

  const removePortfolioPhoto = (idx: number) => {
    setWorkPhotos(prev => prev.filter((_, i) => i !== idx));
  };

  const removeCertification = (idx: number) => {
    setCertifications(prev => prev.filter((_, i) => i !== idx));
  };

  const addLanguage = (lang: string) => {
    if (lang !== "select" && !languages.includes(lang)) {
      setLanguages(prev => [...prev, lang]);
    }
  };

  const uploadPortfolioPhoto = async (file: File): Promise<string> => {
    const { uploadUrl, publicUrl, requiredUploadHeaders } = await getUploadUrlForPortfolioMedia({
      filename: file.name,
      mimetype: file.type || 'application/octet-stream',
      fileSize: file.size,
    });
    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
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
    e.target.value = '';
    if (!file) return;
    try {
      setIsUploadingAvatar(true);
      const publicUrl = await uploadProfilePhoto(file);
      setProfilePhotoUrl(publicUrl);
      await updateKrafterProfilePhotoUrl({ profilePhotoUrl: publicUrl });
      toast.success('Profile photo updated!');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : err instanceof Error
            ? err.message
            : 'Failed to upload profile photo';
      toast.error(msg || 'Failed to upload profile photo');
    } finally {
      setIsUploadingAvatar(false);
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
      const msg = e instanceof Error ? e.message : "Failed to replace portfolio photo";
      toast.error(msg);
    } finally {
      setIsUploadingPhotos(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="w-full flex items-center justify-between py-6 px-4 bg-white border-b border-[#F2F4F7]">
        <button onClick={() => router.back()} className="p-1 hover:opacity-70 transition-opacity">
          <ChevronLeft className="w-8 h-8 text-[#1D2939]" strokeWidth={1.5} />
        </button>
        <div className="text-center">
           <h1 className="text-[20px] font-gerat font-bold text-[#1D2939]">Personal Information</h1>
           <p className="text-[12px] font-poppins text-[#667085]">Manage information about yourself</p>
        </div>
        <div className="w-10"></div> {/* Spacer for balance */}
      </div>

      <div className="px-4 py-8 space-y-12 max-w-2xl mx-auto pb-32">
        
        {/* Avatar Section — presigned upload + PATCH /api/profile/krafter/profile-photo */}
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
            {isUploadingAvatar && (profilePhotoUrl || user?.avatar) && (
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <Camera className="text-white" size={24} />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-white p-2 rounded-full shadow-md border border-gray-100 pointer-events-none">
              <Camera size={16} className="text-[#1D2939]" />
            </div>
          </button>
          <p className="mt-3 text-[12px] font-poppins text-[#667085] text-center max-w-xs">
            {hasProfilePhoto
              ? "Tap your photo to change it"
              : "Tap your photo to add a profile picture"}
          </p>
        </div>

        {/* Profile Information */}
        <section>
          <SectionTitle label="Profile Information" />
          <div className="space-y-4">
            <Input 
              label="Display Name"
              placeholder="Edith R"
              value={displayName}
              onChange={setDisplayName}
            />
            <div className="space-y-2">
              <label className="text-[14px] font-poppins text-gray-800">Bio</label>
              <textarea 
                className="w-full p-4 rounded-xl bg-[#F6F6F6] border border-[#0000001A] outline-none min-h-[100px] font-poppins text-[14px] placeholder:text-gray-400"
                placeholder="Tell us about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Portfolio Photos */}
        <section>
          <SectionTitle label="Portfolio photos" />
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] font-poppins text-[#667085]">
              Up to {MAX_WORK_PHOTOS} photos
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
             {workPhotos.map((src, idx) => (
               <div key={`${src}-${idx}`} className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden group border border-[#EAECF0]">
                  <Image src={src} alt="work" fill className="object-cover" unoptimized />
                  {/* Always-visible remove button */}
                  <button
                    type="button"
                    onClick={() => removePortfolioPhoto(idx)}
                    className="absolute top-1.5 right-1.5 z-10 w-6 h-6 bg-black/60 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors"
                    aria-label="Remove photo"
                  >
                    <X size={12} className="text-white" />
                  </button>
                  <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
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
              {workPhotos.length === 0 && (
                <div className="w-full rounded-xl border border-dashed border-[#0000001A] bg-[#F9FAFB] p-4 text-center text-[12px] font-poppins text-[#667085]">
                  No portfolio photos yet.
                </div>
              )}
          </div>
        </section>

        {/* Certifications */}
        <section>
          <SectionTitle label="Certifications" />
          {certifications.length > 0 ? (
            <div className="space-y-3">
              {certifications.map((cert, idx) => (
                <div
                  key={`${cert.name}-${cert.issuer}-${idx}`}
                  className="relative rounded-2xl border border-[#EAECF0] bg-[#F9FAFB] p-4"
                >
                  {/* Remove X */}
                  <button
                    type="button"
                    onClick={() => removeCertification(idx)}
                    className="absolute top-3 right-3 w-6 h-6 bg-red-50 hover:bg-red-100 rounded-full flex items-center justify-center transition-colors group/x"
                    aria-label="Remove certification"
                  >
                    <X size={13} className="text-red-400 group-hover/x:text-red-600 transition-colors" />
                  </button>
                  <p className="text-[14px] font-poppins font-semibold text-[#1D2939] pr-8">
                    {cert.name || "Certification"}
                  </p>
                  {cert.issuer && (
                    <p className="text-[12px] font-poppins text-[#667085] mt-1">
                      Issuer: {cert.issuer}
                    </p>
                  )}
                  {(cert.issueDate || cert.expiryDate) && (
                    <p className="text-[12px] font-poppins text-[#667085] mt-1">
                      {cert.issueDate ? `Issued: ${cert.issueDate}` : ""}
                      {cert.issueDate && cert.expiryDate ? " • " : ""}
                      {cert.expiryDate ? `Expires: ${cert.expiryDate}` : ""}
                    </p>
                  )}
                  {cert.documentUrl && (
                    <a
                      href={cert.documentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block mt-2 text-[12px] font-poppins font-semibold text-brand-orange hover:underline"
                    >
                      View document
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#0000001A] bg-[#F9FAFB] p-4 text-center text-[12px] font-poppins text-[#667085]">
              No certifications added yet.
            </div>
          )}
        </section>

        {/* Other Details */}
        <section>
          <SectionTitle 
            label="Other Details (Optional)" 
            desc="These improve your chances at getting recurring roles but are not compulsory" 
          />
          <div className="space-y-6">
            <Input 
              label="What do you do for work?"
              placeholder="e.g Student or Baker"
              value={trade}
              onChange={setTrade}
            />
            
            <div className="space-y-3">
              <Select 
                label="What languages do you speak?"
                placeholder="Select"
                value="select"
                onChange={addLanguage}
                options={[
                  { value: 'select', label: 'Select' },
                  { value: 'French', label: 'French' },
                  { value: 'English', label: 'English' },
                  { value: 'German', label: 'German' },
                  { value: 'Spanish', label: 'Spanish' },
                ]}
              />
              <div className="flex flex-wrap gap-2">
                {languages.map(lang => (
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
                  <h3 className="text-[16px] font-gerat font-bold text-[#1D2939] leading-tight">
                    Your location
                  </h3>
                  <p className="text-[13px] text-[#667085] font-poppins mt-1 leading-relaxed">
                    {needsLocationUpdate
                      ? "We need your city or address to show distances on jobs and help customers find nearby Krafters."
                      : "Update where you are based so job and customer distances stay accurate."}
                  </p>
                </div>
              </div>

              <AddressAutocompleteInput
                label="City or area"
                placeholder="Search city, postcode, or street — then pick a result"
                value={location}
                onChange={(val) => {
                  setLocation(val);
                  setLocationCoords(null);
                }}
                onSelectSuggestion={(suggestion) => {
                  setLocation(suggestion.label);
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
                  Location selected — tap Save at the bottom when you are done.
                </p>
              ) : location.trim() ? (
                <p className="mt-2 text-[12px] font-poppins text-[#B54708]">
                  Pick a suggestion from the dropdown so we can save your coordinates.
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[14px] font-poppins text-gray-800">What makes you unique?</label>
                <HelpCircle size={14} className="text-gray-400" />
              </div>
              <textarea 
                className="w-full p-4 rounded-xl bg-[#F6F6F6] border border-[#0000001A] outline-none min-h-[100px] font-poppins text-[14px] placeholder:text-gray-400"
                placeholder="Eg. I like to make people feel relaxed with Relax people"
                value={uniquePoint}
                onChange={(e) => setUniquePoint(e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="pt-8">
           <Button 
            variant="primary" 
            fullWidth 
            onClick={handleSave} 
            disabled={isLoading || isUploadingAvatar}
            className="py-4 text-[16px] font-gerat rounded-2xl"
           >
              {isLoading ? "Saving..." : "Save"}
           </Button>
        </section>

      </div>
      
      {/* Absolute Question Mark Fab if needed */}
      <button className="fixed bottom-32 right-6 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-xl font-bold border border-gray-100 hover:shadow-xl transition-shadow z-50">
        ?
      </button>

    </main>
  );
};

const Page = () => (
  <Suspense fallback={<main className="min-h-screen bg-white" />}>
    <PageContent />
  </Suspense>
);

export default Page;
