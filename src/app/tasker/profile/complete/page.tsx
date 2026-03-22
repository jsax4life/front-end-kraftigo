"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  Plus,
  X,
  CheckCircle2,
  ShieldCheck,
  Briefcase,
  Upload,
  Info,
  ChevronLeft,
  Search,
  Check,
  CreditCard,
  User as UserIcon,
  ChevronDown,
} from "lucide-react";
import Header from "@/components/shared/Header";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import { useAuthStore } from "@/store/useAuthStore";
import { useProfileStore } from "@/store/useProfileStore";
import toast from "react-hot-toast";

const steps = [
  { id: 1, title: "Complete Profile" },
  { id: 2, title: "Add Skills" },
  { id: 3, title: "Trade & Work Eligibility" },
  { id: 4, title: "Legal Identity" },
  { id: 5, title: "Payout Setup" },
  { id: 6, title: "Review" },
];

const languagesList = [
  { value: "German", label: "German" },
  { value: "English", label: "English" },
  { value: "French", label: "French" },
  { value: "Spanish", label: "Spanish" },
  { value: "Italian", label: "Italian" },
  { value: "Turkish", label: "Turkish" },
  { value: "Arabic", label: "Arabic" },
  { value: "Polish", label: "Polish" },
  { value: "Russian", label: "Russian" },
  { value: "Dutch", label: "Dutch" },
];

const skillCategories = [
  {
    name: "Gardening & Outdoor",
    skills: [
      { name: "Gardening help", desc: "Includes planting, watering, weeding" },
      {
        name: "Landscaping help",
        desc: "Includes planting, watering, weeding",
      },
      {
        name: "Lawn Maintenance",
        desc: "Includes planting, watering, weeding",
      },
      { name: "Planting Help", desc: "Includes planting, watering, weeding" },
    ],
  },
  {
    name: "Cleaning",
    skills: [
      { name: "House Cleaning", desc: "Deep cleaning, dusting, and mopping" },
      { name: "Carpet Cleaning", desc: "Professional steam and dry cleaning" },
      { name: "Window Cleaning", desc: "Interior and exterior window washing" },
      {
        name: "Laundry & Ironing",
        desc: "Washing, drying, and precise ironing",
      },
    ],
  },
];

const SectionTitle = ({ label, desc }: { label: string; desc?: string }) => (
  <div className="mb-6">
    <h2 className="text-[18px] font-gerat font-bold text-[#1D2939] leading-tight">
      {label}
    </h2>
    {desc && (
      <p className="text-[14px] text-[#667085] font-poppins mt-1">{desc}</p>
    )}
  </div>
);

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    artisanProfile,
    fetchArtisanProfile,
    createOrUpdateArtisanProfile,
    updateArtisanProfile,
    getUploadUrl,
    submitVerificationUrl,
    startKyc,
    isLoading,
    fetchPayouts,
    fetchVerificationStatus,
    verificationStatus,
    payoutInfo,
  } = useProfileStore();

  // State for steps: 0 is the checklist, 1-6 are the actual onboarding steps
  const [currentStep, setCurrentStep] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [langInput, setLangInput] = useState("");
  const [skillSearch, setSkillSearch] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [verificationUrl, setVerificationUrl] = useState("");
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (hasSubmitted && countdown > 0) {
      timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
    } else if (hasSubmitted && countdown === 0) {
      router.push('/tasker/dashboard');
    }
    return () => clearTimeout(timer);
  }, [hasSubmitted, countdown]);

  const [formData, setFormData] = useState({
    legalFullName: "",
    displayName: "",
    profilePhoto: null as File | null,
    profilePhotoPreview: "" as string,
    languages: [] as string[],
    baseCity: "",
    postalCode: "",
    travelRadiusKm: 25,
    primaryTrade: "",
    secondarySkills: [] as string[],
    yearsExperienceHomeCountry: 0,
    yearsExperienceCurrentCountry: 0,
    certifications: [] as { name: string; issuer: string; file: File | null }[],
    certificationFiles: [] as File[],
    toolsOwned: false,
    transportType: "NONE" as "NONE" | "CAR" | "VAN" | "BIKE",
    taxOrVatId: "",
    bio: "",
    occupation: "",
    countryOfResidence: "Germany",
    governmentIdType: "",
    governmentIdNumber: "",
    governmentIdDocument: null as File | null,
    idCard: null as File | null,
    employmentStatus: "SELF_EMPLOYED",
    skillsAndExpertise: [] as string[],
    portfolioPhotos: [] as File[],
    portfolioPhotosPreviews: [] as string[],
    uniqueSellingPoint: "",
    iban: "",
    bic: "",
  });

  useEffect(() => {
    if (!artisanProfile) {
      fetchArtisanProfile();
    }
    fetchPayouts();
    fetchVerificationStatus();
  }, [artisanProfile, fetchArtisanProfile, fetchPayouts, fetchVerificationStatus]);

  useEffect(() => {
    if (artisanProfile) {
      setFormData((prev) => ({
        ...prev,
        legalFullName: artisanProfile.legalFullName || "",
        displayName: artisanProfile.displayName || artisanProfile.legalFullName || "",
        bio: artisanProfile.bio || "",
        baseCity: artisanProfile.baseCity || "",
        postalCode: artisanProfile.postalCode || "",
        travelRadiusKm: artisanProfile.travelRadiusKm || 25,
        primaryTrade: artisanProfile.primaryTrade || "",
        employmentStatus: artisanProfile.employmentStatus || "SELF_EMPLOYED",
        yearsExperienceHomeCountry: artisanProfile.yearsExperienceHomeCountry || 0,
        yearsExperienceCurrentCountry: artisanProfile.yearsExperienceCurrentCountry || 0,
        toolsOwned: artisanProfile.toolsOwned || false,
        transportType: artisanProfile.transportType || "NONE",
        taxOrVatId: artisanProfile.taxOrVatId || "",
        languages: (artisanProfile.languages || []).map((l) => l.name),
        profilePhotoPreview: artisanProfile.profilePhotoUrl || "",
        skillsAndExpertise: (artisanProfile as any).skillsAndExpertise?.map((s: any) => s.name) || [],
        portfolioPhotosPreviews: (artisanProfile as any).portfolioPhotoUrls || [],
        uniqueSellingPoint: (artisanProfile as any).uniqueSellingPoint || "",
        iban: (artisanProfile as any).iban || "",
        bic: (artisanProfile as any).bic || "",
      }));
    }
  }, [artisanProfile]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: string, file: File | null) => {
    if (!file) return;
    const previewField = `${field}Preview`;
    setFormData((prev) => ({
      ...prev,
      [field]: file,
      [previewField]: URL.createObjectURL(file),
    }));
  };

  const handleArrayFileChange = (field: string, files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    const previews = newFiles.map((file) => URL.createObjectURL(file));

    setFormData((prev) => ({
      ...prev,
      [field]: [...(prev[field as keyof typeof prev] as File[]), ...newFiles],
      [`${field}Previews`]: [
        ...((prev[`${field}Previews` as keyof typeof prev] as string[]) || []),
        ...previews,
      ],
    }));
  };

  const uploadFileToS3 = async (file: File) => {
    try {
      const { uploadUrl, publicUrl } = await getUploadUrl(
        file.name,
        file.type,
        file.size,
      );

      await axios.put(uploadUrl, file, {
        headers: {
          "Content-Type": file.type,
        },
      });

      return publicUrl;
    } catch (error) {
      console.error("Direct upload failed for", file.name, error);
      throw error;
    }
  };

  const handleStartKyc = async () => {
    try {
      if (verificationUrl) {
        window.location.href = verificationUrl;
        return;
      }
      const result = await startKyc();
      if (result.verificationUrl) {
        window.location.href = result.verificationUrl;
      } else {
        toast.error(
          "Could not start identity verification. Please try again later.",
        );
      }
    } catch (error) {
      toast.error("Failed to start identity verification");
    }
  };

  const handleSubmit = async (isDraft = false) => {
    try {
      // If NOT a draft, ensure mandatory fields are present
      if (!isDraft && !formData.profilePhoto && !formData.profilePhotoPreview) {
          toast.error("Profile photo is mandatory for final submission.");
          return;
      }
      
      toast.loading(isDraft ? "Saving progress..." : "Securing your application...", { id: "uploading" });

      const fd = new FormData();
      
      // Basic Info
      fd.append('legalFullName', formData.legalFullName || formData.displayName);
      fd.append('displayName', formData.displayName);
      fd.append('bio', formData.bio);
      fd.append('baseCity', formData.baseCity);
      fd.append('postalCode', formData.postalCode);
      fd.append('travelRadiusKm', formData.travelRadiusKm.toString());
      fd.append('employmentStatus', formData.employmentStatus || "SELF_EMPLOYED");
      fd.append('yearsExperienceHomeCountry', formData.yearsExperienceHomeCountry.toString());
      fd.append('yearsExperienceCurrentCountry', formData.yearsExperienceCurrentCountry.toString());
      fd.append('toolsOwned', formData.toolsOwned.toString());
      fd.append('transportType', formData.transportType);
      fd.append('taxOrVatId', formData.taxOrVatId);
      fd.append('uniqueSellingPoint', formData.uniqueSellingPoint);

      // Map Country to ISO Code
      const countryMap: Record<string, string> = { "Germany": "DE", "Nigeria": "NG" };
      fd.append('countryOfResidence', countryMap[formData.countryOfResidence] || "DE");

      // Files
      if (formData.profilePhoto) fd.append('profilePhoto', formData.profilePhoto);
      if (formData.governmentIdDocument) fd.append('idCard', formData.governmentIdDocument);
      
      formData.certificationFiles.forEach(file => {
        fd.append('certificationFiles', file);
      });
      formData.portfolioPhotos.forEach(file => {
        fd.append('portfolioPhotos', file);
      });

      // JSON Fields (Must be stringified)
      fd.append('languages', JSON.stringify(formData.languages));
      fd.append('skillsAndExpertise', JSON.stringify(formData.skillsAndExpertise.map(s => ({ name: s, hourlyRate: 0 }))));
      
      const certs = formData.certifications.map(c => ({
        name: c.name,
        issuer: c.issuer,
        issueDate: new Date().toISOString().split('T')[0]
      }));
      fd.append('certifications', JSON.stringify(certs));

      // Call store action
      await createOrUpdateArtisanProfile(fd);
      
      toast.success(isDraft ? "Progress saved!" : "Application secured!", { id: "uploading" });
      
      if (!isDraft) {
        setHasSubmitted(true);
        try {
          const result = await startKyc();
          if (result.verificationUrl) setVerificationUrl(result.verificationUrl);
        } catch (e) {
          console.error("KYC pre-fetch error:", e);
        }
      }
    } catch (error: any) {
      console.error("Submit Error:", error);
      const msg = error.response?.data?.message;
      toast.error(
        Array.isArray(msg) ? msg[0] : msg || "Failed to submit verification",
        { id: "uploading" },
      );
    }
  };

  /** STEP 0: CHECKLIST LANDING */
  const renderChecklist = () => {
    const isDetailsComplete = !!artisanProfile?.legalFullName && !!artisanProfile?.displayName && !!artisanProfile?.profilePhotoUrl;
    const isSkillsComplete = (artisanProfile?.skillsAndExpertise?.length || 0) > 0 || (artisanProfile as any)?.primaryTrade; 
    const isEligibilityComplete = !!artisanProfile?.baseCity && !!artisanProfile?.employmentStatus;
    const isIdentityComplete = !!artisanProfile?.idCardUrl || (verificationStatus as any)?.kycStatus === 'APPROVED';
    const isPayoutComplete = !!payoutInfo || !!(artisanProfile as any)?.iban || !!(artisanProfile as any)?.taxOrVatId;

    const checklistItems = [
      {
        id: "details",
        label: "Add Personal Details",
        sub: isDetailsComplete ? "Completed" : "Let customers know you better",
        completed: isDetailsComplete,
      },
      {
        id: "skills",
        label: "Add Your Skills To Your Profile",
        sub: isSkillsComplete ? "Completed" : "Show users what you worked",
        completed: isSkillsComplete,
      },
      {
        id: "eligibility",
        label: "Add Your Work Eligibility",
        sub: isEligibilityComplete ? "Completed" : "Tell them about your expertise",
        completed: isEligibilityComplete,
      },
      {
        id: "identity",
        label: "Add Legal Identity & Document",
        sub: isIdentityComplete ? "Completed" : "Help customers recognize you",
        completed: isIdentityComplete,
      },
      {
        id: "payout",
        label: "Add Payout Information",
        sub: isPayoutComplete ? "Completed" : "Setup payment to get paid",
        completed: isPayoutComplete,
      },
      {
        id: "verify",
        label: "Verify email address",
        sub: "Completed",
        completed: true,
      },
    ];

    const isAllComplete = checklistItems.every(item => item.completed);

    return (
      <div className="fixed inset-0 bg-white z-100 overflow-y-auto animate-in fade-in slide-in-from-bottom-5 duration-500">
        <div className="max-w-[480px] mx-auto px-4 py-1.5 flex flex-col items-center">
          <div className="w-full flex justify-end mb-2">
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={17} />
            </button>
          </div>

          <div className="w-38 h-38 rounded-[40px] border-2 border-dashed border-brand-orange flex items-center justify-center p-2 mb-5 relative group">
            <div className="w-full h-full bg-orange-50 rounded-[32px] flex items-center justify-center">
              <UserIcon size={64} className="text-brand-orange opacity-40" />
            </div>
            <div className="absolute -bottom-4 bg-white px-6 py-2 rounded-full shadow-lg border border-orange-100 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-orange animate-pulse" />
              <span className="text-[12px] font-bold text-brand-orange uppercase tracking-wider">
                Profile Status
              </span>
            </div>
          </div>

          <h1 className="text-[24px] font-gerat font-bold text-[#1D2939] mb-3 text-center">
            {isAllComplete ? "Profile Completed!" : "Finish Your Profile"}
          </h1>
          <p className="text-[16px] font-poppins text-[#667085] text-center mb-10 max-w-[340px]">
             {isAllComplete 
               ? "Great job! Your profile is ready for verification." 
               : "You're already part of the way there! Complete these steps to start accepting jobs."}
          </p>

          <div className="w-full space-y-4 mb-12">
            {checklistItems.map((item, i) => (
              <div key={i} className="flex gap-4 items-center">
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${item.completed ? "bg-brand-orange border-brand-orange" : "border-gray-200"}`}
                >
                  {item.completed && <Check size={14} className="text-white" />}
                </div>
                <div>
                  <h3
                    className={`text-[13.5px] font-gerat font-bold ${item.completed ? "text-gray-400 line-through" : "text-[#1D2939]"}`}
                  >
                    {item.label}
                  </h3>
                  <p className="text-[13px] font-poppins text-[#667085]">
                    {item.sub}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="w-full space-y-4">
            <Button
              variant="primary"
              fullWidth
              onClick={() => setCurrentStep(1)}
              className="py-5 font-gerat text-[18px]"
            >
              {artisanProfile ? "Edit Profile" : "Complete Now"}
            </Button>
            
            {artisanProfile ? (
              <button
                onClick={handleStartKyc}
                className="w-full py-4 text-[14px] font-poppins font-bold text-brand-orange hover:text-brand-orange/80 transition-all border border-brand-orange/20 rounded-2xl"
              >
                Proceed to Didit Verification
              </button>
            ) : (
              <button
                onClick={() => router.back()}
                className="w-full py-4 text-[14px] font-poppins font-bold text-[#667085] hover:text-[#1D2939]"
              >
                Maybe later
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  /** STEP 1: COMPLETE YOUR PROFILE (IMAGE 2) */
  const renderProfileStep = () => (
    <div className="space-y-12 animate-in fade-in slide-in-from-right-5">
      <div className="flex flex-col items-center gap-6">
        <div
          className="w-32 h-32 rounded-full relative cursor-pointer group"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-full h-full rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-100">
            {formData.profilePhotoPreview ? (
              <Image
                src={formData.profilePhotoPreview}
                alt="Preview"
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <UserIcon size={48} className="text-gray-300" />
              </div>
            )}
          </div>
          <div className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center border border-gray-100 text-brand-orange group-hover:scale-110 transition-transform">
            <Camera size={20} />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept="image/*"
            onChange={(e) =>
              handleFileChange("profilePhoto", e.target.files?.[0] || null)
            }
          />
        </div>
        {formData.profilePhotoPreview && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 rounded-full border border-green-100 animate-in fade-in zoom-in-95">
             <CheckCircle2 size={12} className="text-green-500" />
             <span className="text-[11px] font-bold text-green-600 uppercase tracking-tight">Photo Secured</span>
          </div>
        )}
      </div>

      <div className="space-y-8">
        <SectionTitle label="Profile Information" />
        <Input
          label="Display Name"
          placeholder="e.g. Edith R"
          value={formData.displayName}
          onChange={(v) => handleInputChange("displayName", v)}
          required
        />
        <div className="space-y-2">
          <label className="text-[14px] font-qurova text-gray-800">Bio</label>
          <textarea
            className="w-full h-28 px-4 py-4 bg-[#F6F6F6] rounded-2xl border border-[#0000001A] outline-none text-[14px] font-poppins placeholder:text-gray-300 transition-all focus:ring-1 focus:ring-brand-orange"
            placeholder="Briefly describe your expertise, experience, and the quality of work customers can expect..."
            value={formData.bio}
            onChange={(e) => handleInputChange("bio", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-6">
        <SectionTitle
          label="License, Certification Or Diploma (Optional)"
          desc="Gesellenbrief, Meisterbrief, or verified foreign equivalents"
        />
        <div
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.multiple = true;
            input.onchange = (e) => {
              const files = (e.target as HTMLInputElement).files;
              if (files)
                handleInputChange("certificationFiles", [
                  ...formData.certificationFiles,
                  ...Array.from(files),
                ]);
            };
            input.click();
          }}
          className={`w-full aspect-2/1 rounded-[24px] border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
            formData.certificationFiles.length > 0
              ? "bg-green-50/50 border-green-200"
              : "bg-[#F6F6F6] border-[#EAECF0] hover:bg-gray-100"
          }`}
        >
          {formData.certificationFiles.length > 0 ? (
            <>
              <CheckCircle2 size={40} className="text-green-500" />
              <span className="text-[14px] font-bold font-poppins text-green-600">
                {formData.certificationFiles.length} file
                {formData.certificationFiles.length > 1 ? "s" : ""} uploaded
              </span>
            </>
          ) : (
            <>
              <CreditCard size={40} className="text-[#667085] opacity-40" />
              <span className="text-[14px] font-poppins text-[#667085]">
                Upload a photo of your license or certification
              </span>
            </>
          )}
        </div>
        <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100 flex gap-4">
          <Info size={20} className="text-brand-orange shrink-0" />
          <p className="text-[13px] font-poppins text-gray-600 leading-[1.6]">
            <span className="font-bold text-[#1D2939]">Heads up:</span> Some
            tasks, like electrical wiring, can only be accepted if you provide a
            valid license or proof of qualification.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <SectionTitle
          label="Add Photos Of Your Work"
          desc="You may add up to 3 images and a video."
        />
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.multiple = true;
              input.accept = "image/*";
              input.onchange = (e) =>
                handleArrayFileChange(
                  "portfolioPhotos",
                  (e.target as HTMLInputElement).files,
                );
              input.click();
            }}
            className="aspect-square bg-[#F6F6F6] rounded-2xl border-2 border-dashed border-[#EAECF0] flex flex-col items-center justify-center gap-2 group hover:border-brand-orange transition-colors"
          >
            <Camera size={24} className="text-brand-orange" />
            <span className="text-[11px] font-bold text-gray-400 group-hover:text-brand-orange">
              Upload
            </span>
          </button>
          {formData.portfolioPhotosPreviews.map((src, i) => (
            <div
              key={i}
              className="aspect-square rounded-2xl relative overflow-hidden group border border-gray-100"
            >
              <Image src={src} alt="Work" fill className="object-cover" />
              <button
                onClick={() => {
                  const newF = [...formData.portfolioPhotos];
                  const newP = [...formData.portfolioPhotosPreviews];
                  newF.splice(i, 1);
                  newP.splice(i, 1);
                  setFormData((prev) => ({
                    ...prev,
                    portfolioPhotos: newF,
                    portfolioPhotosPreviews: newP,
                  }));
                }}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-white/80 rounded-full flex items-center justify-center text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-8 pb-12">
        <SectionTitle
          label="Other Details (Optional)"
          desc="These improve your chances at getting recurring roles but are not compulsory"
        />
        <Input
          label="What do you do for work?"
          placeholder="e.g. Student or Baker"
          value={formData.occupation}
          onChange={(v) => handleInputChange("occupation", v)}
        />

        <div className="space-y-4">
          <label className="text-[14px] font-qurova text-gray-800">
            What languages do you speak?
          </label>
          <div className="flex flex-wrap gap-2 mb-1">
            {formData.languages.map((l, i) => (
              <div
                key={i}
                className="px-3 py-1.5 bg-[#F6F6F6] rounded-xl border border-gray-200 text-[12px] font-bold font-poppins text-gray-700 flex items-center gap-2"
              >
                {l}
                <button
                  onClick={() =>
                    handleInputChange(
                      "languages",
                      formData.languages.filter((item) => item !== l),
                    )
                  }
                >
                  <X size={14} className="text-gray-400 hover:text-red-500" />
                </button>
              </div>
            ))}
          </div>

          <Select
            value=""
            placeholder="Select language"
            onChange={(v) => {
              if (v && !formData.languages.includes(v)) {
                handleInputChange("languages", [...formData.languages, v]);
              }
            }}
            options={languagesList.filter(
              (l) => !formData.languages.includes(l.value),
            )}
          />
        </div>

        <Input
          label="Where do you Live?"
          placeholder="e.g. Bonn, Germany"
          value={formData.baseCity}
          onChange={(v) => handleInputChange("baseCity", v)}
        />
        <Input
          label="What makes you unique?"
          placeholder="e.g. I like to make people feel relaxed with Relax people"
          value={formData.uniqueSellingPoint}
          onChange={(v) => handleInputChange("uniqueSellingPoint", v)}
        />
      </div>
    </div>
  );

  /** STEP 2: ADD SKILLS (MATCH DESIGN) */
  const renderSkillsStep = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 min-h-screen">
      <div className="flex items-center justify-between pt-4">
        <h2 className="text-[28px] font-gerat font-bold text-[#1D2939]">
          Add a new skill
        </h2>
      </div>

      <div className="relative">
        <Search
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Help"
          className="w-full h-14 pl-12 pr-6 bg-white rounded-2xl border border-gray-200 outline-none text-[16px] font-poppins focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all"
          value={skillSearch}
          onChange={(e) => setSkillSearch(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {formData.skillsAndExpertise.map((s, i) => (
          <div
            key={i}
            className="px-4 py-2 bg-[#F6F6F6] text-[#667085] rounded-xl text-[13px] font-bold font-poppins flex items-center gap-2 whitespace-nowrap border border-gray-100"
          >
            {s}{" "}
            <X
              size={14}
              className="cursor-pointer hover:text-red-500"
              onClick={() =>
                handleInputChange(
                  "skillsAndExpertise",
                  formData.skillsAndExpertise.filter((item) => item !== s),
                )
              }
            />
          </div>
        ))}
      </div>

      <div className="space-y-10 pb-40">
        {skillCategories.map((cat, i) => {
          const availableSkills = cat.skills.filter(
            (s) =>
              s.name.toLowerCase().includes(skillSearch.toLowerCase()) &&
              !formData.skillsAndExpertise.includes(s.name),
          );

          if (availableSkills.length === 0) return null;

          return (
            <div key={i} className="space-y-6">
              <h3 className="text-[16px] font-gerat font-bold text-[#1D2939]">
                {cat.name}
              </h3>
              <div className="divide-y divide-gray-50 border-t border-gray-50">
                {availableSkills.map((skill, j) => (
                  <button
                    key={j}
                    onClick={() => {
                      if (!formData.skillsAndExpertise.includes(skill.name)) {
                        handleInputChange("skillsAndExpertise", [
                          ...formData.skillsAndExpertise,
                          skill.name,
                        ]);
                      }
                    }}
                    className="w-full py-5 flex items-center justify-between group hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-brand-orange/40">
                        <CreditCard size={32} />
                      </div>
                      <div className="text-left">
                        <p className="font-gerat font-bold text-[#1D2939] text-[16px]">
                          {skill.name}
                        </p>
                        <p className="text-[13px] font-poppins text-[#667085]">
                          {skill.desc}
                        </p>
                      </div>
                    </div>
                    <ChevronDown
                      size={20}
                      className="text-gray-300 -rotate-90 group-hover:text-brand-orange transition-colors"
                    />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  /** STEP 4: LEGAL IDENTITY (DYNAMIC UPLOAD) */
  const renderIdentityStep = () => (
    <div className="space-y-12 animate-in fade-in slide-in-from-right-5">
      {/* <div className="text-center pt-8">
        <h2 className="text-[28px] font-gerat font-bold text-[#1D2939]">Legal Identity</h2>
      </div> */}

      <div className="space-y-8">
        <Select
          label="Country of residence"
          value={formData.countryOfResidence}
          onChange={(v) => handleInputChange("countryOfResidence", v)}
          options={[
            { value: "Germany", label: "Germany" },
            { value: "Nigeria", label: "Nigeria" },
          ]}
        />
        <Input
          label="City"
          placeholder="Berlin"
          value={formData.baseCity}
          onChange={(v) => handleInputChange("baseCity", v)}
        />
        <Input
          label="Postal Code"
          placeholder="002923"
          value={formData.postalCode}
          onChange={(v) => handleInputChange("postalCode", v)}
        />

        <div className="space-y-4">
          <label className="text-[14px] font-qurova text-gray-800">
            Select document type
          </label>
          <Select
            value={formData.governmentIdType}
            onChange={(v) => handleInputChange("governmentIdType", v)}
            options={[
              { value: "id_card", label: "National ID Card" },
              { value: "passport", label: "Passport" },
              { value: "driver_license", label: "Driver License" },
            ]}
          />
        </div>

        {formData.governmentIdType && (
          <div className="space-y-6">
            <label className="text-[14px] font-qurova text-gray-800">
              Upload a valid {formData.governmentIdType.replace("_", " ")}
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                onClick={() => {
                  const i = document.createElement("input");
                  i.type = "file";
                  i.onchange = (e) =>
                    handleFileChange(
                      "governmentIdDocument",
                      (e.target as HTMLInputElement).files?.[0] || null,
                    );
                  i.click();
                }}
                className="w-full aspect-2/1 bg-[#F6F6F6] rounded-[24px] border-2 border-dashed border-[#EAECF0] flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-gray-100 transition-all relative overflow-hidden"
              >
                {formData.governmentIdDocument ? (
                  <Image
                    src={URL.createObjectURL(formData.governmentIdDocument)}
                    alt="Front"
                    fill
                    className="object-cover opacity-20"
                  />
                ) : (
                  <CreditCard size={40} className="text-[#667085] opacity-40" />
                )}
                <span className="text-[13px] font-poppins text-[#667085] px-6 text-center">
                  {formData.governmentIdDocument
                    ? "Front Side Uploaded"
                    : `Front Side of your ${formData.governmentIdType.replace("_", " ")}`}
                </span>
              </div>

              {formData.governmentIdType !== "passport" && (
                <div
                  onClick={() => {
                    const i = document.createElement("input");
                    i.type = "file";
                    i.onchange = (e) =>
                      handleFileChange(
                        "idCard",
                        (e.target as HTMLInputElement).files?.[0] || null,
                      );
                    i.click();
                  }}
                  className="w-full aspect-2/1 bg-[#F6F6F6] rounded-[24px] border-2 border-dashed border-[#EAECF0] flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-gray-100 transition-all relative overflow-hidden"
                >
                  {formData.idCard ? (
                    <Image
                      src={URL.createObjectURL(formData.idCard)}
                      alt="Back"
                      fill
                      className="object-cover opacity-20"
                    />
                  ) : (
                    <CreditCard
                      size={40}
                      className="text-[#667085] opacity-40"
                    />
                  )}
                  <span className="text-[13px] font-poppins text-[#667085] px-6 text-center">
                    {formData.idCard
                      ? "Back Side Uploaded"
                      : `Back Side of your ${formData.governmentIdType.replace("_", " ")}`}
                  </span>
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 rounded-3xl space-y-3">
              <p className="text-[13px] font-poppins text-gray-500 font-bold">
                Accepted ID Cards:
              </p>
              <ul className="text-[12px] font-poppins text-gray-400 space-y-1.5 list-disc pl-5">
                <li>Passport (International or National)</li>
                <li>National Identity Card (EU/EEA)</li>
                <li>Driver's License (Plastic Card, EU)</li>
                <li>Residence Permit (EU/EEA/Switzerland)</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  /** REVIEW STEP */
  const renderReviewStep = () => (
    <div className="space-y-12 animate-in fade-in text-center pt-8 pb-32">
      {hasSubmitted ? (
        <div className="space-y-12 py-10">
          <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 size={48} strokeWidth={3} />
          </div>
          <div>
            <h2 className="text-[32px] font-gerat font-bold text-[#1D2939] mb-3">
              Application Received!
            </h2>
            <p className="text-[15px] font-poppins text-[#667085] max-w-[320px] mx-auto leading-relaxed">
              Your artisan profile is complete! You are being redirected to your dashboard in <span className="font-bold text-brand-orange">{countdown}s</span>.
            </p>
          </div>
          <Button
            variant="primary"
            fullWidth
            onClick={() => router.push('/tasker/dashboard')}
            className="py-5 font-gerat text-[18px]"
          >
            Go to Dashboard
          </Button>
        </div>
      ) : (
        <div className="space-y-12">
          <div className="w-32 h-32 rounded-full mx-auto relative overflow-hidden border-4 border-white shadow-xl bg-gray-100">
            {formData.profilePhotoPreview ? (
              <Image
                src={formData.profilePhotoPreview}
                alt="Review"
                fill
                className="object-cover"
              />
            ) : (
              <UserIcon size={64} className="text-gray-300 m-auto h-full" />
            )}
          </div>

          <div className="bg-white p-6 rounded-[32px] border border-gray-100 text-left space-y-5">
            <div className="flex justify-between items-center py-1 border-b border-gray-50">
              <span className="text-[13px] font-poppins text-gray-400">Display Name</span>
              <span className="text-[14px] font-gerat font-bold text-[#1D2939] uppercase tracking-tight">{formData.displayName}</span>
            </div>
            
            <div className="space-y-1.5 py-1 border-b border-gray-50">
              <span className="text-[13px] font-poppins text-gray-400">Bio</span>
              <p className="text-[13.5px] font-poppins text-[#1D2939] line-clamp-2 leading-relaxed italic">{formData.bio}</p>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-gray-50">
              <span className="text-[13px] font-poppins text-gray-400">Primary Trade</span>
              <span className="text-[14px] font-gerat font-bold text-[#1D2939]">{formData.primaryTrade || "N/A"}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-gray-50">
              <span className="text-[13px] font-poppins text-gray-400">Employment</span>
              <span className="text-[14px] font-gerat font-bold text-[#1D2939]">{formData.employmentStatus?.replace('_', ' ')}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-gray-50">
              <span className="text-[13px] font-poppins text-gray-400">Government ID</span>
              <span className="text-[14px] font-gerat font-bold text-[#1D2939]">{formData.governmentIdType?.replace('_', ' ')} (Uploaded)</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-gray-50">
              <span className="text-[13px] font-poppins text-gray-400">IBAN</span>
              <span className="text-[14px] font-gerat font-bold text-[#1D2939]">{formData.iban.substring(0, 4)}...{formData.iban.slice(-4)}</span>
            </div>

            <div className="space-y-3 py-1">
              <span className="text-[13px] font-poppins text-gray-400">Selected Skills</span>
              <div className="flex flex-wrap gap-2">
                 {formData.skillsAndExpertise.slice(0, 5).map((s, idx) => (
                    <span key={idx} className="px-3 py-1 bg-gray-50 rounded-lg text-[11px] font-bold font-poppins text-gray-500 uppercase tracking-wider">
                       {s}
                    </span>
                 ))}
                 {formData.skillsAndExpertise.length > 5 && (
                    <span className="px-3 py-1 bg-brand-orange/5 rounded-lg text-[11px] font-bold font-poppins text-brand-orange uppercase tracking-wider">
                       +{formData.skillsAndExpertise.length - 5} more
                    </span>
                 )}
              </div>
            </div>
          </div>

          <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100/50 flex gap-4 text-left">
            <Info size={20} className="text-blue-500 shrink-0" />
            <p className="text-[12px] font-poppins text-blue-600 leading-relaxed italic">
              By clicking finish, you acknowledge that all information provided
              is accurate and you agree to our artisan code of conduct.
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (currentStep) {
      case 0:
        return null; // Checklist is rendered in overlay
      case 1:
        return renderProfileStep();
      case 2:
        return renderSkillsStep();
      case 3:
        return (
          <div className="space-y-12 animate-in fade-in slide-in-from-right-5 pt-10">
            {/* <h2 className="text-[28px] font-gerat font-bold text-[#1D2939]">Trade & Work Eligibility</h2> */}
            <div className="space-y-10">
              <Select
                label="Primary Trade"
                value={formData.primaryTrade}
                onChange={(v) => handleInputChange("primaryTrade", v)}
                placeholder="Select"
                options={[
                  { value: "Carpenter", label: "Carpenter" },
                  { value: "Plumber", label: "Plumber" },
                  { value: "Electrician", label: "Electrician" },
                  { value: "Gardener", label: "Gardener" },
                ]}
              />

              <Select
                label="Are you working as:"
                value={formData.employmentStatus}
                onChange={(v) => handleInputChange("employmentStatus", v)}
                options={[
                  {
                    value: "SELF_EMPLOYED",
                    label: "Self employed / freelancer",
                  },
                  { value: "COMPANY", label: "Registered Company" },
                ]}
              />
            </div>
          </div>
        );
      case 4:
        return renderIdentityStep();
      case 5:
        return (
          <div className="space-y-12 animate-in fade-in slide-in-from-right-5 pt-10">
            <div>
              <h2 className="text-[28px] font-gerat font-bold text-[#1D2939]">
                Payout Setup
              </h2>
              <p className="text-[16px] font-poppins text-[#667085]">
                Add your payment information
              </p>
            </div>

            <div className="space-y-10">
              <Input
                label="IBAN"
                placeholder="DE02 1223 1223 1223 1223 1223 1223"
                value={formData.iban}
                onChange={(v) => handleInputChange("iban", v)}
              />
              <Input
                label="BIC"
                placeholder="0000 0000"
                value={formData.bic}
                onChange={(v) => handleInputChange("bic", v)}
              />
            </div>
          </div>
        );
      case 6:
        return renderReviewStep();
      default:
        return renderProfileStep();
    }
  };

  if (currentStep === 0) return renderChecklist();

  return (
    <main className="min-h-screen bg-white">
      <Header
        title={currentStep > 0 ? steps[currentStep - 1].title : ""}
        showBack={true}
        onBack={() => setCurrentStep((prev) => prev - 1)}
        rightElement={
          <div className="text-[12px] md:text-[14px] font-poppins text-gray-400 font-bold whitespace-nowrap">
            Step {currentStep} of 6
          </div>
        }
      />

      <div className="max-w-[550px] mx-auto px-6 pt-10 pb-40">
        {renderContent()}
      </div>

      {!hasSubmitted && (
        <div className="fixed bottom-0 left-0 right-0 p-8 bg-white border-t border-gray-100 z-50">
          <div className="max-w-[550px] mx-auto space-y-4">
            <Button
              variant="primary"
              fullWidth
              onClick={() => {
                if (
                  currentStep === 1 &&
                  (!formData.displayName || !formData.bio || (!formData.profilePhoto && !formData.profilePhotoPreview))
                ) {
                  toast.error("Please fill in your profile details and upload a photo");
                  return;
                }
                if (
                  currentStep === 2 &&
                  formData.skillsAndExpertise.length === 0
                ) {
                  toast.error("Please add at least one skill");
                  return;
                }
                if (
                  currentStep === 3 &&
                  (!formData.primaryTrade || !formData.employmentStatus)
                ) {
                  toast.error("Please select your trade and work status");
                  return;
                }
                if (currentStep === 4) {
                  if (
                    !formData.governmentIdType ||
                    !formData.governmentIdDocument
                  ) {
                    toast.error("Please upload your identity document");
                    return;
                  }
                  if (
                    (formData.governmentIdType === "id_card" ||
                      formData.governmentIdType === "driver_license") &&
                    !formData.idCard
                  ) {
                    toast.error("Please upload both sides of your ID Card");
                    return;
                  }
                }
                if (currentStep === 5 && !formData.iban) {
                  toast.error("Please provide your IBAN for payouts");
                  return;
                }

                if (currentStep < 6) {
                  setCurrentStep((prev) => prev + 1);
                  window.scrollTo(0, 0);
                } else {
                  handleSubmit();
                }
              }}
              disabled={isLoading}
              className="py-5 text-[18px] font-gerat"
            >
              {isLoading
                ? "Saving..."
                : currentStep === 6
                  ? "Finish Application"
                  : "Continue"}
            </Button>
            <button
              onClick={() => handleSubmit(true)}
              className="w-full text-[14px] font-poppins font-bold text-[#667085] hover:text-[#1D2939] transition-colors"
            >
              Save and Exit
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
