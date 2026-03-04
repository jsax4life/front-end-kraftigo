"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Camera, User as UserIcon } from "lucide-react";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { useProfileStore } from "@/store/useProfileStore";
import toast from "react-hot-toast";
import Header from "@/components/shared/Header";
import TaskerNav from "@/components/shared/taskerNav";

const TaskerEditProfilePage = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { artisanProfile, fetchArtisanProfile, createOrUpdateArtisanProfile, isLoading } = useProfileStore();
  
  const [legalFullName, setLegalFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [primaryTrade, setPrimaryTrade] = useState("");
  const [bio, setBio] = useState("");
  const [baseCity, setBaseCity] = useState("");
  const [postalCode, setPostalCode] = useState("");

  useEffect(() => {
    if (!artisanProfile) {
      fetchArtisanProfile();
    }
  }, [artisanProfile, fetchArtisanProfile]);

  useEffect(() => {
    if (artisanProfile) {
      setLegalFullName(artisanProfile.legalFullName);
      setDisplayName(artisanProfile.displayName);
      setPrimaryTrade(artisanProfile.primaryTrade);
      setBio(artisanProfile.bio);
      setBaseCity(artisanProfile.baseCity || "");
      setPostalCode(artisanProfile.postalCode || "");
    } else if (user) {
      setLegalFullName(user.fullName || "");
      setDisplayName(user.fullName?.split(' ')[0] || "");
    }
  }, [artisanProfile, user]);

  const handleSave = async () => {
    try {
      const profileData = {
        legalFullName,
        displayName,
        primaryTrade,
        bio,
        profilePhotoUrl: artisanProfile?.profilePhotoUrl || user?.avatar,
        languages: artisanProfile?.languages || [{ code: "en", name: "English", proficiency: "fluent" }],
        baseCity: baseCity || "Berlin",
        postalCode: postalCode || "10115",
        travelRadiusKm: artisanProfile?.travelRadiusKm || 25,
        secondarySkills: artisanProfile?.secondarySkills || [],
        yearsExperienceHomeCountry: artisanProfile?.yearsExperienceHomeCountry || 0,
        yearsExperienceCurrentCountry: artisanProfile?.yearsExperienceCurrentCountry || 0,
        toolsOwned: artisanProfile?.toolsOwned ?? true,
        transportType: artisanProfile?.transportType || "CAR" as const,
      };
      
      await createOrUpdateArtisanProfile(profileData);
      toast.success("Service profile updated successfully!");
      router.back();
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  return (
    <main className="min-h-screen bg-white flex flex-col pb-24">
      <Header title="Edit Service Profile" showLogout={false} />

      <div className="flex-1 space-y-8 max-w-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div>
          <h2 className="text-[28px] font-gerat font-bold text-[#1D2939]">
            Hi {displayName || "Tasker"}
          </h2>
          <p className="text-[16px] text-[#667085] font-poppins mt-1">
            Updating your professional presence
          </p>
        </div>

        {/* Avatar Edit */}
        <div className="flex justify-center flex-col items-center">
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-brand-orange shadow-sm bg-gray-50 flex items-center justify-center">
            {artisanProfile?.profilePhotoUrl || user?.avatar ? (
              <Image 
                src={artisanProfile?.profilePhotoUrl || user?.avatar || ""} 
                alt="Profile" 
                fill 
                className="object-cover"
              />
            ) : (
              <UserIcon size={48} className="text-gray-300" />
            )}
          </div>
          <button className="relative -mt-8 ml-20 bg-brand-blue text-white p-3 rounded-full shadow-lg border-2 border-white hover:bg-opacity-90 transition-all">
            <Camera size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-6 pt-4">
          <Input 
            label="Legal Full Name"
            value={legalFullName}
            onChange={(val) => setLegalFullName(val)}
            placeholder="Enter your legal name"
          />
          <Input 
            label="Display Name"
            value={displayName}
            onChange={(val) => setDisplayName(val)}
            placeholder="How customers search for you"
          />
          <Input 
            label="Primary Trade"
            value={primaryTrade}
            onChange={(val) => setPrimaryTrade(val)}
            placeholder="e.g. Plumbing, Electrical"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="City"
              value={baseCity}
              onChange={(val) => setBaseCity(val)}
              placeholder="e.g. Berlin"
            />
            <Input 
              label="Postal Code"
              value={postalCode}
              onChange={(val) => setPostalCode(val)}
              placeholder="e.g. 10115"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[14px] font-poppins font-semibold text-[#1D2939]">Bio</label>
            <textarea 
              className="w-full p-4 rounded-xl border border-gray-200 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange outline-none min-h-[120px] font-poppins text-[15px]"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell customers about your experience..."
            />
          </div>
        </div>

        <div className="pt-10">
          <Button variant="primary" fullWidth onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
      <TaskerNav />
    </main>
  );
};

export default TaskerEditProfilePage;
