"use client";

import { Headset, MapPin, ChevronDown, X, LogOut } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useProfileStore } from "@/store/useProfileStore";
import Button from "@/components/ui/button";
import toast from "react-hot-toast";
import Select from "../ui/select";
import ImageSelect from "../ui/ImageSelect";
import AddressModal from "./AddressModal";
import { useAddressStore } from "@/store/useAddressStore";

const Userabt = () => {
  const router = useRouter();
  const { logout, user } = useAuthStore();
  const { customerProfile, fetchCustomerProfile } = useProfileStore();
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [language, setLanguage] = useState("de");
  const [currency, setCurrency] = useState("USD");

  useEffect(() => {
    if (!customerProfile) {
      fetchCustomerProfile();
    }
  }, [customerProfile, fetchCustomerProfile]);

  // Address store
  const {
    addresses,
    selectedAddressId,
    currentAddress: storeAddress,
    selectAddress,
    addAddress,
    removeAddress,
    getCurrentLocation,
    loadAddresses,
  } = useAddressStore();

  const currentAddress = customerProfile?.serviceAddress 
    ? `${customerProfile.serviceAddress.street}, ${customerProfile.serviceAddress.city}` 
    : storeAddress;

  // Ensure we have the latest addresses from backend on mount
  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      router.push("/user/login");
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  return (
    <>
      <div className="flex items-center justify-between py-2">
        <div
          className="flex items-center gap-2 text-[13px] sm:text-[14px] font-poppins cursor-pointer flex-1 min-w-0"
          onClick={() => setShowAddressModal(true)}
        >
          <MapPin size={16} className="text-gray-600 shrink-0" />
          <span className="text-gray-800 truncate">{currentAddress}</span>
          <ChevronDown size={16} className="text-gray-600 shrink-0" />
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-4">
          <Image
            src={language === "de" ? "/flag-de.svg" : language === "fr" ? "/flag-fr.svg" : "/flag-en.svg"}
            alt="flag"
            width={40}
            height={40}
            className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 cursor-pointer object-cover rounded-full"
            onClick={() => setShowLanguageModal(true)}
          />

          <div 
            className="relative bg-[#F2F2F2] p-2 rounded-full cursor-pointer" 
            onClick={() => router.push("/user/support")}
          >
            <Headset size={22} className="sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
            <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></div>
          </div>

          <button 
            onClick={handleLogout}
            className="bg-red-50 p-2 rounded-full text-[#F04438] hover:bg-red-100 transition-colors"
            title="Sign Out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <AddressModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        savedAddresses={addresses}
        selectedAddressId={selectedAddressId || ""}
        onSelectAddress={(addressId) => {
          selectAddress(addressId);
          setShowAddressModal(false);
        }}
        onAddNewAddress={({ label, address }) => {
          addAddress({ label, address });
          setShowAddressModal(false);
        }}
        onUseCurrentLocation={async () => {
          await getCurrentLocation();
          setShowAddressModal(false);
        }}
        onRemoveAddress={removeAddress}
      />

      {/* Language Modal */}
      {showLanguageModal && (
        <div 
          className="fixed inset-0 bg-black/50 z-60 flex items-end"
          onClick={() => setShowLanguageModal(false)}
        >
          <div 
            className="bg-white rounded-t-3xl w-full sm:max-w-md mx-auto max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-50">
              <h2 className="text-[20px] font-gerat font-bold">Preferences</h2>
              <button
                onClick={() => setShowLanguageModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={22} className="text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-[14px] font-poppins font-semibold text-gray-700 mb-3">
                  Language
                </h3>
                <ImageSelect
                  placeholder="Select Language"
                  value={language}
                  onChange={(val) => setLanguage(val)}
                  options={[
                    { value: "en", label: "English", image: "/flag-en.svg" },
                    { value: "de", label: "German (Deutsch)", image: "/flag-de.svg" },
                    { value: "fr", label: "French", image: "/flag-fr.svg" },
                  ]}
                  required
                />
              </div>

              <div>
                <h3 className="text-[14px] font-poppins font-semibold text-gray-700 mb-3">
                  Currency
                </h3>
                <Select
                  placeholder="Select Currency"
                  value={currency}
                  onChange={(val) => setCurrency(val)}
                  options={[
                    { value: "USD", label: "$ USD" },
                    { value: "EUR", label: "€ EUR" },
                    { value: "GBP", label: "£ GBP" },
                  ]}
                  required
                />
              </div>

              <div className="pt-4">
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => setShowLanguageModal(false)}
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Userabt;
