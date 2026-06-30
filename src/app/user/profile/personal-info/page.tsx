"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/input";
import { AddressAutocompleteInput } from "@/components/ui/AddressAutocompleteInput";
import Button from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { useProfileStore } from "@/store/useProfileStore";
import toast from "react-hot-toast";
import { User as UserIcon, Edit2, Camera } from "lucide-react";
import { useAddressStore } from "@/store/useAddressStore";
import { CustomerProfile } from "@/types";

import Header from "@/components/shared/Header";

const PersonalInfoPage = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { customerProfile, fetchCustomerProfile, updateCustomerProfile, isLoading, getUploadUrlForProfilePic } = useProfileStore();
  

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);

  const { currentAddress } = useAddressStore();

  useEffect(() => {
    if (!customerProfile) {
      fetchCustomerProfile();
    }
  }, [customerProfile, fetchCustomerProfile]);

  useEffect(() => {
    if (customerProfile) {
      const first = customerProfile.user?.firstName || user?.firstName || "";
      const last = customerProfile.user?.lastName || user?.lastName || "";
      const profileFullName = customerProfile.fullName;
      
      setFullName(profileFullName || `${first} ${last}`.trim());
      setPhone(customerProfile.phone);
      setStreet(customerProfile.serviceAddress?.street || "");
      setCity(customerProfile.serviceAddress?.city || "");
      setPostalCode(customerProfile.serviceAddress?.postalCode || "");
      setCountry(customerProfile.serviceAddress?.country || "");
    } else if (user) {
      const first = user.firstName || "";
      const last = user.lastName || "";
      setFullName(`${first} ${last}`.trim());
      setPhone(user.phone || "");
      
      // Try to parse address from store if it's not a generic message
      if (currentAddress && currentAddress !== "Add your location") {
        const parts = currentAddress.split(',').map(p => p.trim());
        if (parts.length >= 2) {
          setStreet(parts[0] || "");
          setCity(parts[1] || "");
          // Generic fallbacks for the rest since we can't be sure of the format
          setCountry("Germany"); 
        }
      }
    }
    setEmail(user?.email || "");
  }, [customerProfile, user, currentAddress]);

  const handleSave = async () => {
    try {

      const profileData: Partial<CustomerProfile> = {
        fullName: fullName.trim(),
        phone,
        serviceAddress: {
          street: street || "N/A",
          city: city || "N/A",
          postalCode: postalCode || "00000",
          country: country || "Germany"
        },
        profilePhotoUrl: profilePhotoUrl || customerProfile?.profilePhotoUrl || user?.avatar,
        languagePreference: customerProfile?.languagePreference || "en",
        notificationPreferences: customerProfile?.notificationPreferences || {
          email: true,
          sms: false,
          push: true,
          bookingUpdates: true,
          promotions: false
        }
      };
      
      await updateCustomerProfile(profileData);
      toast.success("Profile updated successfully!");
      router.back();
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const handleProfilePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = '';
    if (!file) return;
    try {
      setIsUploadingAvatar(true);
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
      
      setProfilePhotoUrl(publicUrl);
      
      await updateCustomerProfile({ profilePhotoUrl: publicUrl });
      toast.success('Profile photo updated!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload profile photo');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <Header title="Personal Information" showLogout={false} />

      <div className="flex-1 space-y-8 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div>
          <h2 className="text-[28px] font-gerat font-bold text-[#1D2939]">
            Hi {fullName.split(' ')[0] || "User"}
          </h2>
          <p className="text-[16px] text-[#667085] font-poppins mt-1">
            Editing Profile
          </p>
        </div>

        {/* Avatar Edit */}
        <div className="flex justify-center flex-col items-center mb-4">
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
            className="relative border-2 border-dashed border-brand-orange rounded-full w-28 h-28 flex items-center justify-center shrink-0 disabled:opacity-70 disabled:cursor-wait group"
          >
            <div className="relative w-[100px] h-[100px] rounded-full overflow-hidden bg-gray-50 flex items-center justify-center shadow-lg">
              {profilePhotoUrl || customerProfile?.profilePhotoUrl || user?.avatar ? (
                <Image 
                  src={profilePhotoUrl || customerProfile?.profilePhotoUrl || user?.avatar || ""} 
                  alt="Profile" 
                  fill 
                  className="object-cover"
                />
              ) : (
                isUploadingAvatar ? (
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-orange border-t-transparent" />
                ) : (
                  <UserIcon size={48} className="text-gray-300" />
                )
              )}
            </div>
            {isUploadingAvatar && (profilePhotoUrl || customerProfile?.profilePhotoUrl || user?.avatar) && (
              <div className="absolute inset-0 rounded-[100px] bg-black/40 flex items-center justify-center m-1">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            )}
            <div className="absolute bottom-0 right-0 bg-brand-orange text-white p-2.5 rounded-full shadow-lg border-4 border-white hover:bg-orange-600 transition-all pointer-events-none">
              <Camera size={16} />
            </div>
          </button>
        </div>

        {/* Form Sections */}
        <div className="space-y-8">
          {/* Identity Section */}
          <div className="bg-white p-6 rounded-2xl border border-[#F2F4F7] shadow-sm">
            <h3 className="text-[12px] font-poppins font-bold text-[#98A2B3] uppercase tracking-widest mb-6">Personal Details</h3>
            <div className="space-y-5">
              <Input 
                label="Full name"
                value={fullName}
                onChange={(val) => setFullName(val)}
                placeholder="Enter your full name"
              />
              <Input 
                label="Email"
                value={email}
                disabled
                onChange={() => {}}
                placeholder="Enter your email"
                type="email"
              />
              <Input 
                label="Phone"
                value={phone}
                onChange={(val) => setPhone(val.replace(/\D/g, '').slice(0, 11))}
                placeholder="Enter your phone number"
                type="tel"
              />
            </div>
          </div>

          {/* Address Section */}
          <div className="bg-white p-6 rounded-2xl border border-[#F2F4F7] shadow-sm">
            <h3 className="text-[12px] font-poppins font-bold text-[#98A2B3] uppercase tracking-widest mb-6">Service Address</h3>
            <div className="space-y-5">
              <AddressAutocompleteInput 
                label="Street"
                value={street}
                onChange={setStreet}
                onSelectSuggestion={(s) => {
                  const parsedStreet = s.street || s.label.split(',')[0];
                  // Prevent duplication if the user only searched for a city
                  if (parsedStreet === s.city) {
                    setStreet("");
                  } else {
                    setStreet(parsedStreet);
                  }
                  setCity(s.city || "");
                  setPostalCode(s.postcode || "");
                  setCountry("Germany");
                }}
                placeholder="Search for your address..."
                inputClassName="w-full px-4 py-3 bg-[#F9FAFB] border border-[#EAECF0] rounded-xl text-[14px] text-[#1D2939] focus:outline-none focus:border-[#FF6600] focus:ring-1 focus:ring-[#FF6600] transition-colors"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="City"
                  value={city}
                  onChange={(val) => setCity(val)}
                  placeholder="City"
                />
                <Input 
                  label="Postal Code"
                  value={postalCode}
                  onChange={(val) => setPostalCode(val)}
                  placeholder="Postal Code"
                />
              </div>
              <Input 
                label="Country"
                value={country}
                onChange={(val) => setCountry(val)}
                placeholder="Country"
              />
            </div>
          </div>
        </div>

        <div className="pt-10">
          <Button variant="primary" fullWidth onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </main>
  );
};

export default PersonalInfoPage;
