"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Camera, X, User as UserIcon, HelpCircle, ChevronLeft, Loader2, Plus } from "lucide-react";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Button from "@/components/ui/button";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/useAuthStore";
import { useProfileStore } from "@/store/useProfileStore";
import toast from "react-hot-toast";
import { getServiceSkillGroups } from "@/lib/api/services";

/** Helper to turn a URL into a File object for multipart submission (handling existing photos) */
async function urlToFile(url: string, filename: string): Promise<File | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type || "image/jpeg" });
  } catch (error) {
    console.error("Failed to convert URL to file:", error);
    return null;
  }
}

const Tag = ({ label, onRemove }: { label: string, onRemove: () => void }) => (
  <div className="flex items-center gap-1.5 bg-[#F6F6F6] text-[#667085] px-3 py-1.5 rounded-lg border border-[#0000001A] group">
    <span className="text-[13px] font-poppins font-medium">{label}</span>
    <button onClick={onRemove} className="hover:text-red-500 transition-colors">
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
  const { 
    artisanProfile, 
    fetchArtisanProfile, 
    updateArtisanProfile, 
    isLoading 
  } = useProfileStore();
  
  // Basic Info
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [primarySkillCategoryId, setPrimarySkillCategoryId] = useState("");
  const [baseCity, setBaseCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [travelRadiusKm, setTravelRadiusKm] = useState(25);
  const [uniqueSellingPoint, setUniqueSellingPoint] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  
  // Files
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState("");
  const [portfolioFiles, setPortfolioFiles] = useState<{file: File | null, preview: string, id: string}[]>([]);
  
  const [skillOptions, setSkillOptions] = useState<{value: string, label: string}[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSkillGroups();
    if (!artisanProfile) {
      fetchArtisanProfile();
    }
  }, [artisanProfile, fetchArtisanProfile]);

  const fetchSkillGroups = async () => {
    try {
      const groups = await getServiceSkillGroups();
      const mapped = groups.map(g => ({ value: g.category.id, label: g.category.name }));
      setSkillOptions(mapped);
    } catch (error) {
      console.error("Failed to fetch skills:", error);
    }
  };

  useEffect(() => {
    if (artisanProfile && !isDataLoaded) {
      setDisplayName(artisanProfile.displayName || "");
      setBio(artisanProfile.bio || "");
      setPrimarySkillCategoryId(artisanProfile.primarySkillCategoryId || "");
      setBaseCity(artisanProfile.baseCity || "");
      setPostalCode(artisanProfile.postalCode || "");
      setTravelRadiusKm(artisanProfile.travelRadiusKm || 25);
      setUniqueSellingPoint(artisanProfile.uniqueSellingPoint || "");
      setLanguages((artisanProfile.languages || []).map(l => l.name));
      setProfilePhotoPreview(artisanProfile.profilePhotoUrl || "");
      
      if (artisanProfile.portfolioPhotoUrls?.length) {
          const existingPortfolio = artisanProfile.portfolioPhotoUrls.map((url, i) => ({
              file: null,
              preview: url,
              id: `existing-${i}`
          }));
          setPortfolioFiles(existingPortfolio);
      }
      
      setIsDataLoaded(true);
    }
  }, [artisanProfile, isDataLoaded]);

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhotoFile(file);
      setProfilePhotoPreview(URL.createObjectURL(file));
    }
  };

  const handlePortfolioFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) {
      const newFiles = files.map(file => ({
          file,
          preview: URL.createObjectURL(file),
          id: Math.random().toString(36).substr(2, 9)
      }));
      setPortfolioFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removePortfolioFile = (id: string) => {
    setPortfolioFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleSave = async () => {
    // Validation
    if (!displayName || displayName.length < 2) return toast.error("Display Name is required (min 2 chars)");
    if (!baseCity) return toast.error("Base City is required");
    if (languages.length === 0) return toast.error("Add at least one language");
    if (!primarySkillCategoryId) return toast.error("Select your primary skill category");

    try {
      const data = new FormData();
      
      // JSON Strings
      data.append("displayName", displayName);
      data.append("bio", bio);
      data.append("baseCity", baseCity);
      data.append("postalCode", postalCode || "0000");
      data.append("travelRadiusKm", travelRadiusKm.toString());
      data.append("primarySkillCategoryId", primarySkillCategoryId);
      data.append("uniqueSellingPoint", uniqueSellingPoint);
      data.append("languages", JSON.stringify(languages.map(l => ({ name: l, code: 'en' }))));
      
      // Carry over other required fields from existing profile if not in form
      data.append("legalFullName", artisanProfile?.legalFullName || user?.fullName || "N/A");
      data.append("countryOfResidence", "DE"); // Default or from profile
      data.append("yearsExperienceHomeCountry", (artisanProfile?.yearsExperienceHomeCountry || 0).toString());
      data.append("yearsExperienceCurrentCountry", (artisanProfile?.yearsExperienceCurrentCountry || 0).toString());
      data.append("employmentStatus", artisanProfile?.employmentStatus || "SELF_EMPLOYED");
      data.append("transportType", artisanProfile?.transportType || "NONE");
      data.append("toolsOwned", (artisanProfile?.toolsOwned || false).toString());
      data.append("certifications", JSON.stringify(artisanProfile?.certifications || []));
      data.append("skillsAndExpertise", JSON.stringify(artisanProfile?.skillsAndExpertise || []));
      data.append("secondarySkillIds", JSON.stringify(artisanProfile?.secondarySkills || []));

      // Handle Profile Photo
      if (profilePhotoFile) {
        data.append("profilePhoto", profilePhotoFile);
      } else if (artisanProfile?.profilePhotoUrl) {
         const file = await urlToFile(artisanProfile.profilePhotoUrl, "profile-photo.jpg");
         if (file) data.append("profilePhoto", file);
      }

      // Handle ID Card (Mandatory for validation if never uploaded, but for PUT we might skip if not changing)
      if (artisanProfile?.idCardUrl) {
          const file = await urlToFile(artisanProfile.idCardUrl, "id-card.jpg");
          if (file) data.append("idCard", file);
      }

      // Handle Portfolio
      for (const item of portfolioFiles) {
          if (item.file) {
              data.append("portfolioPhotos", item.file);
          } else {
              const file = await urlToFile(item.preview, "portfolio.jpg");
              if (file) data.append("portfolioPhotos", file);
          }
      }

      await updateArtisanProfile(data);
      toast.success("Profile updated successfully!");
      router.push("/tasker/profile");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update profile");
    }
  };

  const addLanguage = (lang: string) => {
    if (lang !== "select" && !languages.includes(lang)) {
      setLanguages(prev => [...prev, lang]);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="w-full flex items-center justify-between py-6 px-4 bg-white border-b border-[#F2F4F7] sticky top-0 z-50">
        <button onClick={() => router.back()} className="p-1 hover:opacity-70 transition-opacity">
          <ChevronLeft className="w-8 h-8 text-[#1D2939]" strokeWidth={1.5} />
        </button>
        <div className="text-center">
           <h1 className="text-[20px] font-gerat font-bold text-[#1D2939]">Personal Information</h1>
           <p className="text-[12px] font-poppins text-[#667085]">Manage information about yourself</p>
        </div>
        <div className="w-10"></div>
      </div>

      <div className="px-4 py-8 space-y-12 max-w-2xl mx-auto pb-32">
        {/* Avatar Section */}
        <div className="flex flex-col items-center">
            <div 
              className="relative w-32 h-32 rounded-full border-2 border-[#EAECF0] p-1 shadow-sm bg-white shrink-0 group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="relative w-full h-full rounded-full overflow-hidden bg-gray-50">
                {profilePhotoPreview ? (
                  <Image 
                    src={profilePhotoPreview} 
                    alt="Profile" 
                    fill 
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <UserIcon size={40} />
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <Camera className="text-white" size={24} />
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleProfilePhotoChange} 
                className="hidden" 
                accept="image/*" 
              />
            </div>
            <p className="text-[12px] font-poppins text-gray-400 mt-2">Click to change profile photo</p>
        </div>

        {/* Profile Information */}
        <section className="space-y-6">
          <SectionTitle label="Profile Information" />
          <div className="space-y-4">
            <Input 
              label="Display Name"
              placeholder="e.g John D"
              value={displayName}
              onChange={setDisplayName}
            />
            <div className="space-y-2">
              <label className="text-[14px] font-poppins text-gray-800 font-medium">Professional Bio</label>
              <textarea 
                className="w-full p-4 rounded-xl bg-[#F6F6F6] border border-[#0000001A] outline-none min-h-[120px] font-poppins text-[14px] placeholder:text-gray-400 focus:border-brand-orange transition-colors"
                placeholder="Describe your expertise and what you offer to customers..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Trade & Expertise */}
        <section className="space-y-6">
          <SectionTitle label="Trade & Expertise" desc="Tell us what you specialize in" />
          <div className="space-y-5">
            <Select 
              label="Primary Work Category"
              placeholder="Select your trade"
              value={primarySkillCategoryId}
              onChange={setPrimarySkillCategoryId}
              options={skillOptions}
            />
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[14px] font-poppins text-gray-800 font-medium">Unique Selling Point</label>
                <HelpCircle size={14} className="text-gray-400" />
              </div>
              <textarea 
                className="w-full p-4 rounded-xl bg-[#F6F6F6] border border-[#0000001A] outline-none min-h-[100px] font-poppins text-[14px] placeholder:text-gray-400 focus:border-brand-orange transition-colors"
                placeholder="What sets you apart? e.g '5 years of professional experience in Berlin'"
                value={uniqueSellingPoint}
                onChange={(e) => setUniqueSellingPoint(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Location & Coverage */}
        <section className="space-y-6">
            <SectionTitle label="Location & Coverage" desc="Where do you provide your services?" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input 
                    label="Base City"
                    placeholder="Berlin"
                    value={baseCity}
                    onChange={setBaseCity}
                />
                <Input 
                    label="Postal Code"
                    placeholder="10115"
                    value={postalCode}
                    onChange={setPostalCode}
                />
            </div>
            <div className="space-y-2">
                <label className="text-[14px] font-poppins text-gray-800 font-medium">Travel Radius (km)</label>
                <div className="flex items-center gap-4">
                    <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        step="5"
                        value={travelRadiusKm}
                        onChange={(e) => setTravelRadiusKm(parseInt(e.target.value))}
                        className="flex-1 accent-brand-orange"
                    />
                    <span className="w-12 text-center font-gerat font-bold text-brand-orange">{travelRadiusKm}km</span>
                </div>
            </div>
        </section>

        {/* Portfolio Section */}
        <section className="space-y-6">
          <SectionTitle label="Portfolio" desc="Add photos of your best work" />
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
             <button 
               onClick={() => portfolioInputRef.current?.click()}
               className="aspect-square rounded-2xl bg-[#F6F6F6] border-2 border-dashed border-[#0000001A] flex flex-col items-center justify-center gap-1 group hover:border-brand-orange transition-colors"
             >
                <div className="bg-[#1D2939]/5 p-2 rounded-full group-hover:bg-brand-orange group-hover:text-white transition-colors">
                  <Plus size={20} />
                </div>
                <span className="text-[11px] font-poppins font-medium text-gray-500">Add Photo</span>
             </button>
             <input 
                type="file" 
                ref={portfolioInputRef} 
                onChange={handlePortfolioFilesChange} 
                className="hidden" 
                accept="image/*" 
                multiple
             />
             
             {portfolioFiles.map((item) => (
                <div key={item.id} className="relative aspect-square rounded-2xl overflow-hidden group border border-[#EAECF0]">
                   <Image src={item.preview} alt="portfolio" fill className="object-cover" unoptimized />
                   <button 
                     onClick={() => removePortfolioFile(item.id)}
                     className="absolute top-1 right-1 bg-black/50 p-1 rounded-md text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                   >
                      <X size={14} />
                   </button>
                </div>
             ))}
          </div>
        </section>

        {/* Languages */}
        <section className="space-y-6">
          <SectionTitle label="Languages" desc="Manage languages you speak" />
          <div className="space-y-4">
              <Select 
                label="Add a Language"
                placeholder="Select Language"
                value="select"
                onChange={addLanguage}
                options={[
                  { value: 'select', label: 'Select' },
                  { value: 'French', label: 'French' },
                  { value: 'English', label: 'English' },
                  { value: 'German', label: 'German' },
                  { value: 'Spanish', label: 'Spanish' },
                  { value: 'Italian', label: 'Italian' },
                ]}
              />
              <div className="flex flex-wrap gap-2">
                {languages.map(lang => (
                  <Tag key={lang} label={lang} onRemove={() => setLanguages(languages.filter(l => l !== lang))} />
                ))}
              </div>
          </div>
        </section>

        <section className="pt-8">
           <Button 
            variant="primary" 
            fullWidth 
            onClick={handleSave} 
            disabled={isLoading}
            className="py-4 text-[16px] font-gerat rounded-2xl shadow-lg ring-offset-2 focus:ring-2 focus:ring-brand-orange"
           >
              {isLoading ? (
                  <div className="flex items-center gap-2">
                      <Loader2 size={20} className="animate-spin" />
                      <span>Applying Changes...</span>
                  </div>
              ) : "Update Professional Profile"}
           </Button>
        </section>

      </div>
    </main>
  );
};

export default Page;
