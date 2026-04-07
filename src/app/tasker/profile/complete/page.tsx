"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  X,
  Plus,
  Search,
  HelpCircle,
  Home,
  Hammer,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Button from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { useProfileStore } from "@/store/useProfileStore";
import toast from "react-hot-toast";
import PhotoUploader, { Photo } from "@/components/shared/PhotoUploader";
import ServiceRadius from "@/components/ui/serviceRadius";
import { getServiceSkillGroups, type ServiceSkillGroup } from "@/lib/api/services";

const Tag = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
  <div className="flex items-center gap-1.5 bg-[#F6F6F6] text-[#667085] px-3 py-1.5 rounded-lg border border-[#0000001A]">
    <span className="text-[13px] font-poppins font-medium">{label}</span>
    <button onClick={onRemove} className="hover:text-red-500">
      <X size={14} />
    </button>
  </div>
);

const SectionTitle = ({ label, desc }: { label: string; desc?: string }) => (
  <div className="mb-6">
    <h2 className="text-[20px] font-poppins  text-[#1D2939] leading-tight">
      {label}
    </h2>
    {desc && <p className="text-[14px] font-poppins mt-1">{desc}</p>}
  </div>
);

const CompleteProfileForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const {
    isLoading,
    personalDetailsStatus,
    fetchKrafterPersonalDetailsStatus,
    submitPersonalDetails,
    submitSkills,
    getUploadUrlForProfilePic,
    getUploadUrlForCert,
    getUploadUrlForPortfolioMedia,
  } = useProfileStore();

  const initialStep = Math.max(
    4,
    Math.min(6, Number(searchParams.get("step")) || 1),
  );
  const [step, setStep] = useState(initialStep);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const profilePhotoInputRef = useRef<HTMLInputElement>(null);
  const certInputRef = useRef<HTMLInputElement>(null);

  // Step 1 Data
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [trade, setTrade] = useState("");
  const [location, setLocation] = useState("");
  const [uniquePoint, setUniquePoint] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [radius, setRadius] = useState(10);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [certifications, setCertifications] = useState<any[]>([]);

  // Step 2 Data (Skills)
  const [selectedSkills, setSelectedSkills] = useState<any[]>([]);
  const [skillGroups, setSkillGroups] = useState<ServiceSkillGroup[]>([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);

  useEffect(() => {
    fetchKrafterPersonalDetailsStatus();
  }, [fetchKrafterPersonalDetailsStatus]);

  useEffect(() => {
    if (step === 5) {
      const loadSkills = async () => {
        setIsLoadingSkills(true);
        try {
          const groups = await getServiceSkillGroups();
          setSkillGroups(groups);
        } catch (error) {
          console.error("Failed to load skills", error);
        } finally {
          setIsLoadingSkills(false);
        }
      };
      if (skillGroups.length === 0) {
        loadSkills();
      }
    }
  }, [step, skillGroups.length]);

  useEffect(() => {
    if (personalDetailsStatus && personalDetailsStatus.personal) {
      const data = personalDetailsStatus.personal;
      setDisplayName(data.displayName || "");
      setBio(data.bio || "");
      setTrade(data.occupationDescription || "");
      setLocation(data.whereYouLive || "");
      setUniquePoint(data.uniqueSellingPoint || "");
      if (data.languages) {
        setLanguages(data.languages.map((l) => l.name));
      }
      setProfilePhotoUrl(data.profilePhotoUrl || null);
      if (data.certifications) {
        setCertifications(data.certifications);
      }
      // Set existing photos into the uploader state...
      const mappedPhotos: Photo[] = [];
      data.portfolioPhotoUrls?.forEach((url, i) => {
        mappedPhotos.push({ id: `photo-ext-${i}`, src: url, mediaType: "image" });
      });
      if (data.portfolioVideoUrl) {
         mappedPhotos.push({ id: `video-ext`, src: data.portfolioVideoUrl, mediaType: "video" });
      }
      setPhotos(mappedPhotos);
    }
  }, [personalDetailsStatus]);

  const handleFileUpload = async (
    file: File,
    getUploadUrlFn: (payload: any) => Promise<any>
  ): Promise<string> => {
    setIsUploading(true);
    try {
      const { uploadUrl, publicUrl, requiredUploadHeaders } = await getUploadUrlFn({
        filename: file.name,
        mimetype: file.type,
        fileSize: file.size,
      });

      // Upload to S3 directly
      const response = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: requiredUploadHeaders,
      });

      if (!response.ok) throw new Error("AWS S3 Upload Failed");

      return publicUrl;
    } finally {
      setIsUploading(false);
    }
  };

  const handleProfilePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const publicUrl = await handleFileUpload(file, getUploadUrlForProfilePic);
      setProfilePhotoUrl(publicUrl);
      toast.success("Profile photo updated!");
    } catch (err) {
      toast.error("Failed to upload photo.");
    }
  };

  const handleCertUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const publicUrl = await handleFileUpload(file, getUploadUrlForCert);
      setCertifications(prev => [...prev, {
        name: file.name,
        issuer: "Uploaded Document",
        documentUrl: publicUrl
      }]);
      toast.success("Document uploaded successfully!");
    } catch (err) {
      toast.error("Failed to upload document.");
    }
  };

  const removeGuideline = (idxToRemove: number) => {
    setCertifications(certifications.filter((_, idx) => idx !== idxToRemove));
  };

  const handleNext = () => {
    handleSubmit(false);
  }

  const handleBack = () => {
    router.push("/tasker/dashboard?modal=open");
  };

  const handleSubmit = async (isDraft = false) => {
    if (step === 4) {
      setIsUploading(true);
      try {
        // Upload new portfolio media objects directly from the uploader
        const finalPhotoUrls: string[] = [];
        let finalVideoUrl: string | undefined = undefined;

        for (const photo of photos) {
          if (photo.file) {
            const publicUrl = await handleFileUpload(photo.file, getUploadUrlForPortfolioMedia);
            if (photo.mediaType === "video") {
              finalVideoUrl = publicUrl;
            } else {
              finalPhotoUrls.push(publicUrl);
            }
          } else {
             if (photo.mediaType === "video") {
              finalVideoUrl = photo.src;
            } else {
              finalPhotoUrls.push(photo.src);
            }
          }
        }

        const payload = {
          displayName,
          bio,
          occupationDescription: trade,
          whereYouLive: location,
          uniqueSellingPoint: uniquePoint,
          languages: languages.map((l) => ({
            name: l,
            code: l.toLowerCase().slice(0, 2),
            proficiency: "fluent",
          })),
          profilePhotoUrl: profilePhotoUrl || undefined,
          certifications: certifications.length > 0 ? certifications : undefined,
          portfolioPhotoUrls: finalPhotoUrls,
          portfolioVideoUrl: finalVideoUrl,
          submitAsDraft: isDraft,
        };

        await submitPersonalDetails(payload);
        toast.success(isDraft ? "Draft saved!" : "Personal details saved!");
    
        router.push("/tasker/dashboard?modal=open");
       
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to complete profile");
      } finally {
        setIsUploading(false);
      }
    } else if (step === 5) {
      if (!isDraft && selectedSkills.length === 0) {
        toast.error("Please add at least one skill.");
        return;
      }
      if (selectedSkills.length > 0) {
        setIsUploading(true);
        try {
          const primary = selectedSkills[0];
          const secondary = selectedSkills.slice(1);

          const buildDetail = (s: any) => ({
             skillId: s.id,
             pricingType: s.rateType as 'HOURLY' | 'FLAT',
             experienceYears: 0,
             ...(s.rateType === "HOURLY" ? { hourlyRate: Number(s.price) || 0 } : { flatRate: Number(s.price) || 0 })
          });

          const payload = {
             primarySkillCategoryId: primary.categoryId,
             primarySkillDetail: buildDetail(primary),
             secondarySkillDetails: secondary.length > 0 ? secondary.map(buildDetail) : undefined,
             submitAsDraft: isDraft
          };

          await submitSkills(payload);
          toast.success(isDraft ? "Draft saved!" : "Skills saved successfully!");
          router.push("/tasker/dashboard?modal=open");
        } catch (err: any) {
          toast.error(err.response?.data?.message || "Failed to save skills");
        } finally {
          setIsUploading(false);
        }
      } else {
        router.push("/tasker/dashboard?modal=open");
      }
    } else {
       router.push("/tasker/dashboard?modal=open");
    }
  };

  const addSkill = (skill: any, categoryName: string, categoryId: string) => {
    if (
      selectedSkills.length < 5 &&
      !selectedSkills.find((s) => s.id === skill.id)
    ) {
      setSelectedSkills([
        ...selectedSkills,
        { ...skill, category: categoryName, categoryId, rateType: "HOURLY", price: 0 },
      ]);
    }
    // modal stays open so the user can keep adding
  };

  const removeSkill = (id: string) => {
    setSelectedSkills(selectedSkills.filter((s) => s.id !== id));
  };

  const toggleRateType = (index: number, type: "HOURLY" | "FLAT") => {
    const updated = [...selectedSkills];
    updated[index].rateType = type;
    setSelectedSkills(updated);
  };

  return (
    <main className="min-h-screen bg-white pb-32">
      {/* Header */}
      <div className="w-full flex items-center justify-between py-6 px-4 bg-white sticky top-0 z-40 ">
        <button onClick={handleBack} className="p-1 hover:opacity-70">
          <ArrowLeft className="w-8 h-8 text-[#1D2939]" strokeWidth={1.5} />
        </button>
        <span className="text-[14px] font-poppins text-gray-400">
          {step} of 6
        </span>
      </div>

      <div className="px-5 py-8 max-w-2xl mx-auto space-y-10">
        {step === 4 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h1 className="text-[25px] font-gerat font-bold text-[#1D2939]">
                Complete Your Profile
              </h1>
              <p className="text-[14px] font-poppins text-[#667085]">
                Add profile information about yourself
              </p>
            </div>

            {/* Avatar */}
            <div className="flex justify-center">
              <input type="file" accept="image/*" className="hidden" ref={profilePhotoInputRef} onChange={handleProfilePhotoChange} />
              <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-50 flex items-center justify-center border border-gray-200">
                <Image
                  src={profilePhotoUrl || user?.avatar || "/images/profile.jpg"}
                  alt="avatar"
                  className="object-cover"
                  fill
                />
                <div 
                  className="absolute inset-0 bg-[#FFFFFF66] mt-7 flex items-center justify-center translate-y-10 hover:translate-y-0 transition-transform cursor-pointer"
                  onClick={() => profilePhotoInputRef.current?.click()}
                >
                  <Image
                    src="/camera.svg"
                    alt="camera"
                    width={40}
                    height={40}
                    className="-mt-10"
                  />
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <section className="space-y-5">
              <SectionTitle label="Profile Information" />
              <Input
                label="Display Name"
                placeholder="Edith R"
                value={displayName}
                onChange={setDisplayName}
                disabled={true}
              />
              <div className="space-y-2">
                <label className="text-[14px] font-poppins text-gray-800">
                  Bio
                </label>
                <textarea
                  className="w-full p-4 rounded-2xl bg-[#F6F6F6] border border-[#0000001A] outline-none min-h-25 font-poppins text-[15px] placeholder:text-gray-400"
                  placeholder="Briefly describe your expertise..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
            </section>

            <section className="space-y-6 border-t border-[#0000001A] pt-6">
              <SectionTitle
                label=""
                desc="These improve your chances at getting recurring roles but are not compulsory"
              />
              <Input
                label="What do you do for work?"
                placeholder="e.g Student or Baker"
                value={trade}
                onChange={setTrade}
              />
              <div className="space-y-2">
                <Select
                  label="What languages do you speak?"
                  placeholder="Select"
                  value=""
                  options={[
                    { label: "English", value: "English" },
                    { label: "German", value: "German" },
                  ]}
                  onChange={(val) =>
                    !languages.includes(val) &&
                    setLanguages([...languages, val])
                  }
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {languages.map((l) => (
                    <Tag
                      key={l}
                      label={l}
                      onRemove={() =>
                        setLanguages(languages.filter((x) => x !== l))
                      }
                    />
                  ))}
                </div>
              </div>
              <Input
                label="Where do you Live?"
                placeholder="e.g Bern, Germany"
                value={location}
                onChange={setLocation}
              />
              <ServiceRadius radius={radius} setRadius={setRadius} />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[14px] font-poppins text-gray-800">
                    What makes you unique?
                  </label>
                  <HelpCircle size={14} className="text-gray-400" />
                </div>
                <textarea
                  className="w-full p-4 rounded-2xl bg-[#F6F6F6] border border-[#0000001A] outline-none min-h-25 font-poppins text-[15px] placeholder:text-gray-400"
                  placeholder="Eg. I like to make people feel relaxed with Relax people"
                  value={uniquePoint}
                  onChange={(e) => setUniquePoint(e.target.value)}
                />
              </div>
            </section>

            {/* License Upload */}
            <section className="space-y-5 border-t border-[#0000001A] pt-6">
            <h1 className="text-[22px] font-bold font-poppins">Work Information</h1>
              <SectionTitle
                label="License, Certification Or Diploma (Optional)"
                desc="Gesellanbrief, Meisterbrief, or verified foreign equivalents"
              />
              <input type="file" ref={certInputRef} className="hidden" onChange={handleCertUploadChange} accept=".pdf,image/*" />
              <button 
                onClick={() => certInputRef.current?.click()} 
                className="w-full py-6 rounded-2xl border-2 border-dashed border-[#0000001A] bg-[#F6F6F6] flex flex-col items-center justify-center gap-3 group hover:border-brand-orange transition-colors"
                disabled={isUploading}
              >
                <Image src="/upload.svg" alt="upload" width={40} height={40} />

                <span className="text-[14px] font-poppins font-medium text-gray-500">
                  {isUploading ? "Uploading..." : "Upload a photo or document of your license or certification"}
                </span>
              </button>

              {certifications.length > 0 && (
                <div className="space-y-2 mt-4">
                  <p className="text-[14px] font-poppins font-bold text-gray-800">Uploaded Certifications</p>
                  {certifications.map((cert, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="text-gray-400" size={18} />
                        <span className="text-[13px] font-poppins font-medium text-gray-700 truncate max-w-[200px]">{cert.name}</span>
                      </div>
                      <button onClick={() => removeGuideline(idx)} className="text-red-500 p-1 hover:bg-red-50 rounded-full">
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2 items-start bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
                <ShieldCheck className="text-brand-orange shrink-0" size={20} />
                <p className="text-[12px] font-poppins text-gray-700 leading-relaxed">
                  <span className="font-bold">Heads up:</span> Some tasks, like
                  electrical wiring, can only be accepted if you provide a valid
                  license or proof of qualification.
                </p>
              </div>
            </section>

            {/* Work Photos */}
            <section className="space-y-5 border-t border-[#0000001A] pt-6">
              <SectionTitle
                label="Add Photos Of Your Work"
                desc="You may add up to 3 images and a video."
              />

              <div className="-mt-7">
                <PhotoUploader
                  photos={photos}
                  onChange={(newPhotos) => setPhotos(newPhotos)}
                  maxPhotos={10}
                />
              </div>
            </section>
            
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h1 className="text-[23px] font-poppins font-bold text-[#1D2939]">
                Add Your Skills To Your Profile
              </h1>
              <p className="text-[14px] font-poppins text-[#667085]">
                Search and add your skills. (Max 5)
              </p>
            </div>

            {/* Search bar */}
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                readOnly
                placeholder={
                  selectedSkills.length >= 5
                    ? "Max 5 skills reached"
                    : "Search for a skill..."
                }
                onClick={() =>
                  selectedSkills.length < 5 && setIsSkillModalOpen(true)
                }
                className={`w-full p-4 pl-12 rounded-2xl bg-[#F6F6F6] border border-[#EAECF0] outline-none font-poppins text-[15px] ${
                  selectedSkills.length >= 5
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              />
            </div>

            {/* Add another skill button — only when < 5 */}
            {selectedSkills.length > 0 && selectedSkills.length < 5 &&(
              <button
                onClick={() => setIsSkillModalOpen(true)}
                className="w-full py-3 flex items-center bg-[#F6F6F6] justify-center gap-2 border-2 border-[#0000001A] rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="bg-[#919191] p-1 rounded-full">
                  <Plus size={14} className="text-white" />
                </div>
                <span className="text-[14px] font-poppins font-medium text-[#1D2939]">
                  Add another skill
                </span>
              </button>
            )}

            {/* Skill cards with rate + price */}
            {selectedSkills.length > 0 ? (
              <div className="space-y-4">
                {selectedSkills.map((skill, idx) => (
                  <div
                    key={skill.id}
                    className="p-2 space-y-6 border-b border-[#0000001A] pb-6"
                  >
                    <Image src='/images/home4.jpg' alt="pics" width={400} height={400} className="rounded-xl h-45 object-cover " />
                    <div className="gap-3">
                      <h3 className="text-[20px] font-poppins font-bold text-[#1D2939]">
                        {skill.name}
                      </h3>
                      <p className="text-[16px] font-poppins">
                       {skill.description}
                      </p>
                    </div>

                    <div className="flex gap-2 p-1.5 bg-[#F6F6F6] rounded-2xl border border-gray-100">
                      <button
                        onClick={() => toggleRateType(idx, "HOURLY")}
                        className={`flex-1 py-2.5 rounded-xl text-[14px] font-poppins font-bold transition-all ${skill.rateType === "HOURLY" ? "bg-brand-blue text-white shadow-md" : "text-gray-500 hover:text-gray-800"}`}
                      >
                        Hourly Rate
                      </button>
                      <button
                        onClick={() => toggleRateType(idx, "FLAT")}
                        className={`flex-1 py-2.5 rounded-xl text-[14px] font-poppins font-bold transition-all ${skill.rateType === "FLAT" ? "bg-brand-blue text-white shadow-md" : "text-gray-500 hover:text-gray-800"}`}
                      >
                        Flat Rate
                      </button>
                    </div>

                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[20px] font-poppins text-gray-400">
                        $
                      </span>
                      <input
                        type="number"
                        placeholder="0.00"
                        className="w-full p-4 pl-10 rounded-2xl bg-[#F6F6F6] border border-[#EAECF0] outline-none font-poppins text-[20px] font-bold text-[#1D2939]"
                        value={skill.price || ""}
                        onChange={(e) => {
                          const updated = [...selectedSkills];
                          updated[idx].price = e.target.value;
                          setSelectedSkills(updated);
                        }}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] font-poppins text-gray-400">
                        Per {skill.rateType === "HOURLY" ? "Hour" : "Job"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <button
                onClick={() => setIsSkillModalOpen(true)}
                className="w-full py-3 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors rounded-2xl"
              >
                <div className="bg-[#919191] p-1 rounded-full">
                  <Plus size={14} className="text-white" />
                </div>
                <span className="text-[14px] font-poppins text-[#919191]">
                  No skills added. Search for a skill to add.
                </span>
              </button>
            )}
          </div>
        )}

                <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-[#F2F4F7] flex flex-col gap-3 max-w-2xl mx-auto z-40">
          <Button
            variant="primary"
            fullWidth
            onClick={handleNext}
            disabled={isLoading || isUploading}
            className="py-4 rounded-2xl text-[16px]"
          >
            {isLoading || isUploading ? "Saving..." : "Submit"}
          </Button>
          <button
            onClick={() => handleSubmit(true)}
            disabled={isLoading || isUploading}
            className="text-[14px] font-poppins font-bold text-gray-500 hover:text-gray-800 py-1"
          >
            Save draft
          </button>
        </div>
      </div>

      {/* Skill Selection Modal */}
      {isSkillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 animate-in fade-in duration-300">
          <div className="bg-white w-full h-[90vh] sm:max-w-xl sm:h-auto sm:max-h-[80vh] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-500">
            <div className="p-6 border-[#F2F4F7] flex items-center justify-between">
              <h2 className="text-[22px] font-gerat font-bold text-[#1D2939]">
                Add a new skill
              </h2>
              <button
                onClick={() => setIsSkillModalOpen(false)}
                className="p-1 hover:opacity-70"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 border-b border-[#F2F4F7]">
              <div className="relative">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search for skills..."
                  className="w-full p-4 pl-12 rounded-2xl bg-[#F6F6F6] border border-[#EAECF0] outline-none font-poppins text-[15px]"
                />
              </div>
            </div>
            {/* Selected chips inside modal */}
            {selectedSkills.length > 0 && (
              <div className="px-6 pb-3 flex flex-wrap gap-2">
                {selectedSkills.map((skill) => (
                  <div
                    key={skill.id}
                    className="flex items-center gap-1.5 bg-[#F6F6F6] border border-[#0000001A] px-3 py-1.5 rounded-lg"
                  >
                    <span className="text-[13px] font-poppins font-medium text-[#1D2939]">
                      {skill.name}
                    </span>
                    <button
                      onClick={() => removeSkill(skill.id)}
                      className="hover:text-red-500 text-gray-400 transition-colors"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {isLoadingSkills ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange"></div>
                </div>
              ) : (
                <>
                  {skillGroups.map((group) => (
                    <div key={group.category.id}>
                      <h3 className="text-[14px] font-poppins font-bold text-[#1D2939] mb-4 uppercase tracking-wider">
                        {group.category.name}
                      </h3>
                      <div className="space-y-4">
                        {group.skills.map((skill) => (
                          <button
                            key={skill.id}
                            onClick={() => addSkill(skill, group.category.name, group.category.id)}
                            disabled={
                              !!selectedSkills.find((s) => s.id === skill.id) ||
                              selectedSkills.length >= 5
                            }
                            className={`w-full flex items-center justify-between group text-left transition-opacity ${
                              selectedSkills.find((s) => s.id === skill.id)
                                ? "opacity-40"
                                : ""
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${
                                  selectedSkills.find((s) => s.id === skill.id)
                                    ? "bg-green-100 text-green-600"
                                    : "bg-orange-100/50 text-brand-orange group-hover:bg-brand-orange group-hover:text-white"
                                }`}
                              >
                                {selectedSkills.find((s) => s.id === skill.id) ? (
                                  <X size={20} />
                                ) : (
                                  <Hammer size={28} strokeWidth={1.5} />
                                )}
                              </div>
                              <div>
                                <p className="text-[15px] font-gerat font-bold text-[#1D2939]">
                                  {skill.name}
                                </p>
                                {skill.description && (
                                  <p className="text-[12px] font-poppins text-[#667085] line-clamp-1">
                                    {skill.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {skillGroups.length === 0 && (
                    <p className="text-center text-gray-500 font-poppins text-sm py-8">
                      No skills found.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating help button */}
      <button className="fixed bottom-44 right-6 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-[20px] font-bold border border-[#EAECF0] z-30">
        ?
      </button>
    </main>
  );
};

const CompleteProfilePage = () => {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange"></div>
      </div>
    }>
      <CompleteProfileForm />
    </Suspense>
  );
};

export default CompleteProfilePage;
