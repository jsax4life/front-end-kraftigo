"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Camera, X, User as UserIcon, HelpCircle, ChevronLeft } from "lucide-react";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Button from "@/components/ui/button";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/useAuthStore";
import { useProfileStore } from "@/store/useProfileStore";
import toast from "react-hot-toast";

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

const Page = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { artisanProfile, fetchArtisanProfile, createOrUpdateArtisanProfile, isLoading } = useProfileStore();
  
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [trade, setTrade] = useState("");
  const [location, setLocation] = useState("");
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
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const MAX_WORK_PHOTOS = 3;

  useEffect(() => {
    if (!artisanProfile) {
      fetchArtisanProfile();
    }
  }, [artisanProfile, fetchArtisanProfile]);

  useEffect(() => {
    if (artisanProfile) {
      setDisplayName(artisanProfile.displayName || artisanProfile.legalFullName || "");
      setBio(artisanProfile.bio || "");
      setTrade(artisanProfile.primaryTrade || "");
      setLocation(artisanProfile.baseCity || "");
      const p = artisanProfile as any;
      const nestedProfile = (p.profile && typeof p.profile === "object" ? p.profile : null) as
        | Record<string, unknown>
        | null;
      const nestedVerification =
        (p.verification && typeof p.verification === "object" ? p.verification : null) as
          | Record<string, unknown>
          | null;
      setUniquePoint(
        p.uniqueSellingPoint ||
          p.unique_selling_point ||
          p.uniquePoint ||
          p.unique_point ||
          (nestedProfile?.uniqueSellingPoint as string) ||
          (nestedProfile?.unique_selling_point as string) ||
          (nestedVerification?.uniqueSellingPoint as string) ||
          "",
      );
      setLanguages((artisanProfile.languages || []).map(l => l.name));
      const portfolioRaw =
        p.portfolioPhotoUrls ??
        p.portfolio_photo_urls ??
        p.portfolioPhotos ??
        p.portfolio_photos ??
        p.portfolio_images ??
        p.portfolio ??
        nestedProfile?.portfolioPhotoUrls ??
        nestedProfile?.portfolio_photo_urls ??
        nestedVerification?.portfolioPhotoUrls ??
        nestedVerification?.portfolio_photo_urls;
      const portfolio = Array.isArray(portfolioRaw)
        ? portfolioRaw
        : typeof portfolioRaw === "string"
          ? portfolioRaw.split(",")
          : [];
      setWorkPhotos(
        portfolio
          .map((item: unknown) => {
            if (typeof item === "string") return item.trim();
            if (item && typeof item === "object") {
              const obj = item as {
                url?: unknown;
                publicUrl?: unknown;
                public_url?: unknown;
                fileUrl?: unknown;
                imageUrl?: unknown;
                image_url?: unknown;
              };
              const value =
                obj.url ??
                obj.publicUrl ??
                obj.public_url ??
                obj.fileUrl ??
                obj.imageUrl ??
                obj.image_url;
              return typeof value === "string" ? value.trim() : "";
            }
            return "";
          })
          .filter((src): src is string => src.length > 0),
      );

      const certRaw = p.certifications ?? p.certs ?? p.licenses ?? [];
      const certList: CertificationRow[] = Array.isArray(certRaw)
        ? certRaw
            .map((item: unknown): CertificationRow | null => {
              if (!item || typeof item !== "object") return null;
              const o = item as Record<string, unknown>;
              const name = String(o.name ?? o.title ?? "").trim();
              const issuer = String(o.issuer ?? o.organization ?? "").trim();
              const issueDate = String(o.issueDate ?? o.issue_date ?? "").trim();
              const expiryDate = String(o.expiryDate ?? o.expiry_date ?? "").trim();
              const documentUrl = String(o.documentUrl ?? o.document_url ?? o.url ?? "").trim();
              if (!name && !issuer && !issueDate && !expiryDate && !documentUrl) return null;
              return { name, issuer, issueDate, expiryDate, documentUrl };
            })
            .filter((c): c is CertificationRow => c !== null)
        : [];
      setCertifications(certList);
    }
  }, [artisanProfile]);

  const handleSave = async () => {
    try {
      const profileData = {
        ...artisanProfile,
        displayName,
        bio,
        primaryTrade: trade,
        baseCity: location,
        uniqueSellingPoint: uniquePoint,
        portfolioPhotoUrls: workPhotos,
        languages: languages.map(l => ({ name: l, code: l.toLowerCase().slice(0, 2), proficiency: 'fluent' })),
        // Add more mapping here as backend schema expansion allows
      };
      
      await createOrUpdateArtisanProfile(profileData as any);
      toast.success("Profile updated successfully!");
      router.push("/tasker/profile");
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const removeLanguage = (lang: string) => {
    setLanguages(prev => prev.filter(l => l !== lang));
  };

  const addLanguage = (lang: string) => {
    if (lang !== "select" && !languages.includes(lang)) {
      setLanguages(prev => [...prev, lang]);
    }
  };

  const uploadPortfolioPhoto = async (file: File): Promise<string> => {
    const mimetype = file.type || "application/octet-stream";
    const initRes = await api.post<Record<string, unknown>>(
      "/api/profile/artisan/upload-portfolio",
      { filename: file.name, mimetype, fileSize: file.size },
    );
    const d = (initRes.data ?? {}) as Record<string, unknown> & {
      uploadUrl?: unknown;
      publicUrl?: unknown;
      requiredUploadHeaders?: unknown;
      url?: unknown;
      fileUrl?: unknown;
    };
    const uploadUrl = typeof d.uploadUrl === "string" ? d.uploadUrl : null;
    const publicUrl =
      (typeof d.publicUrl === "string" ? d.publicUrl : null) ||
      (typeof d.url === "string" ? d.url : null) ||
      (typeof d.fileUrl === "string" ? d.fileUrl : null);
    if (!uploadUrl || !publicUrl) throw new Error("Unexpected upload response");

    const putHeaders: Record<string, string> = { "Content-Type": mimetype };
    if (d.requiredUploadHeaders && typeof d.requiredUploadHeaders === "object") {
      for (const [k, v] of Object.entries(d.requiredUploadHeaders as Record<string, unknown>)) {
        if (typeof v === "string" && v.trim()) putHeaders[k] = v;
      }
    }
    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: putHeaders,
      body: file,
    });
    if (!putRes.ok) throw new Error(`Failed upload (HTTP ${putRes.status})`);
    return publicUrl;
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
        
        {/* Avatar Section */}
        <div className="flex flex-col items-center">
            <div className="relative w-32 h-32 rounded-full border-2 border-[#EAECF0] p-1 shadow-sm bg-white shrink-0 group">
              <div className="relative w-full h-full rounded-full overflow-hidden">
                {artisanProfile?.profilePhotoUrl || user?.avatar ? (
                  <Image 
                    src={artisanProfile?.profilePhotoUrl || user?.avatar || ""} 
                    alt="Profile" 
                    fill 
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-400">
                    <UserIcon size={40} />
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                 <Camera className="text-white" size={24} />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-white p-2 rounded-full shadow-md border border-gray-100">
                 <Camera size={16} className="text-[#1D2939]" />
              </div>
            </div>
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
                  className="rounded-2xl border border-[#EAECF0] bg-[#F9FAFB] p-4"
                >
                  <p className="text-[14px] font-poppins font-semibold text-[#1D2939]">
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

            <Input 
              label="Where do you Live?"
              placeholder="e.g Bern, Germany"
              value={location}
              onChange={setLocation}
            />

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
            disabled={isLoading}
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

export default Page;
