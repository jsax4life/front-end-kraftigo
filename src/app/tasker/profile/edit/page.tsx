"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Camera, X, User as UserIcon, HelpCircle, ChevronLeft } from "lucide-react";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Button from "@/components/ui/button";
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
      setUniquePoint(artisanProfile.bio || ""); // Reusing bio for now
      setLanguages((artisanProfile.languages || []).map(l => l.name));
    }
  }, [artisanProfile]);

  const handleSave = async () => {
    try {
      const profileData = {
        ...artisanProfile,
        displayName,
        bio,
        primaryTrade: trade,
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

        {/* Work Photos */}
        <section>
          <SectionTitle label="Add Photos Of Your Work" />
          <div className="flex flex-wrap gap-4">
             <button className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#F6F6F6] border-2 border-dashed border-[#0000001A] flex flex-col items-center justify-center gap-2 group hover:border-brand-orange transition-colors">
                <div className="bg-[#1D2939]/5 p-2 rounded-full group-hover:bg-brand-orange group-hover:text-white transition-colors">
                  <Camera size={20} />
                </div>
                <span className="text-[12px] font-poppins font-medium text-gray-500">Upload</span>
             </button>
             {/* Example thumbnails */}
             <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden group">
                <Image src="/images/home2.jpg" alt="work" fill className="object-cover" />
                <button className="absolute top-1 right-1 bg-white/80 p-0.5 rounded-md hover:bg-white text-[#1D2939]">
                   <X size={14} />
                </button>
             </div>
             <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden group">
                <Image src="/images/home3.jpg" alt="work" fill className="object-cover" />
                <button className="absolute top-1 right-1 bg-white/80 p-0.5 rounded-md hover:bg-white text-[#1D2939]">
                   <X size={14} />
                </button>
             </div>
          </div>
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
