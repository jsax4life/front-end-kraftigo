"use client";

import { X } from "lucide-react";
import { useState, useEffect } from "react";
import Button from "@/components/ui/button";
import { AddressAutocompleteInput } from "@/components/ui/AddressAutocompleteInput";
import toast from "react-hot-toast";

interface Address {
  id: string;
  label: string;
  address: string;
}

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedAddresses: Address[]; 
  selectedAddressId?: string;
  onSelectAddress?: (addressId: string) => void; 
  onAddNewAddress?: (params: {
    label: string;
    address: string;
    latitude?: number;
    longitude?: number;
  }) => void;
  onUseCurrentLocation?: () => void;
  onRemoveAddress?: (addressId: string) => void;
}

const AddressModal = ({
  isOpen,
  onClose,
  savedAddresses, // No default value
  selectedAddressId = "",
  onSelectAddress,
  onAddNewAddress,
  onUseCurrentLocation,
  onRemoveAddress,
}: AddressModalProps) => {
  const [selectedAddress, setSelectedAddress] = useState(selectedAddressId);
  const [showAddNewForm, setShowAddNewForm] = useState(false);
  const [newAddressLabel, setNewAddressLabel] = useState("");
  const [newAddressValue, setNewAddressValue] = useState("");
  const [newAddressCoords, setNewAddressCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("overflow-hidden");

      const preventScroll = (e: Event) => {
        const target = e.target as HTMLElement;
        if (target && target.closest(".modal-scrollable-content")) return;
        e.preventDefault();
      };

      window.addEventListener("wheel", preventScroll, { passive: false });
      window.addEventListener("touchmove", preventScroll, { passive: false });

      return () => {
        document.body.classList.remove("overflow-hidden");
        window.removeEventListener("wheel", preventScroll);
        window.removeEventListener("touchmove", preventScroll);
      };
    } else {
      document.body.classList.remove("overflow-hidden");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectAddress = (addressId: string) => {
    setSelectedAddress(addressId);
    if (onSelectAddress) {
      onSelectAddress(addressId); // Only pass addressId
    }
  };

  const handleAddNew = () => {
    if (newAddressValue) {
      if (!newAddressCoords) {
        toast.error("Please pick an address from the dropdown suggestions.");
        return;
      }
      if (onAddNewAddress) {
        onAddNewAddress({
          label: newAddressLabel.trim() || newAddressValue.split(',')[0],
          address: newAddressValue,
          latitude: newAddressCoords.latitude,
          longitude: newAddressCoords.longitude,
        });
      }
      setNewAddressLabel("");
      setNewAddressValue("");
      setNewAddressCoords(null);
      setShowAddNewForm(false);
    }
  };

  const handleDone = () => {
    if (selectedAddress && onSelectAddress) {
      onSelectAddress(selectedAddress); // Only pass addressId
    }
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center sm:justify-center"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto overscroll-contain modal-scrollable-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 ">
          <h2 className="text-[18px] sm:text-[20px] font-poppins font-bold text-gray-900">
            Addresses
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={22} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6">
          {/* Saved Addresses */}
          {!showAddNewForm && (
            <>
              <div>
                <h3 className="text-[14px] font-poppins font-semibold text-gray-900 mb-3">
                  Saved Addresses
                </h3>
                {savedAddresses.length > 0 ? (
                  <div className="space-y-3">
                    {savedAddresses.map((addr) => (
                      <div
                        key={addr.id}
                        className="relative group bg-[#F6F6F6] p-4 border border-[#0000001A] rounded-xl hover:bg-gray-100 transition-colors"
                      >
                         {/* Delete Button */}
                         {onRemoveAddress && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveAddress(addr.id);
                            }}
                            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors z-10"
                            title="Remove address"
                          >
                            <X size={16} />
                          </button>
                        )}
                        
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="address"
                            value={addr.id}
                            checked={selectedAddress === addr.id}
                            onChange={(e) => handleSelectAddress(e.target.value)}
                            className="mt-0.5 w-5 h-5 accent-black cursor-pointer"
                          />
                          <div className="flex-1 pr-6">
                            <p className="text-[14px] font-poppins font-semibold text-gray-900">
                              {addr.label}
                            </p>
                            <p className="text-[13px] text-gray-600 font-poppins">
                              {addr.address}
                            </p>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#F6F6F6] border border-[#0000001A] rounded-xl p-6 text-center">
                    <p className="text-[14px] font-poppins text-gray-500">
                      No saved addresses yet. Add your first address or use your
                      current location.
                    </p>
                  </div>
                )}
              </div>

              {/* Add New Button */}
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setShowAddNewForm(true)}
              >
                add new
              </Button>

              {/* Current Location */}
              <div>
                <h3 className="text-[14px] font-poppins font-semibold text-gray-900 mb-3">
                  Current Location
                </h3>
                <button
                  onClick={onUseCurrentLocation}
                  className="w-full rounded-xl py-8 flex items-center justify-center gap-2 hover:bg-gray-200 bg-[#F6F6F6] border border-[#0000001A] transition-colors"
                >
                  <div className="bg-[#FF66001A] flex items-center gap-3 px-4 py-2.5 rounded-full">
                    <div className="w-5 h-5 rounded-full border-2 border-gray-900 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-900"></div>
                    </div>
                    <span className="text-[14px] font-poppins font-semibold text-gray-900">
                      Use current location
                    </span>
                  </div>
                </button>
              </div>

              {/* Done Button */}
              <div className="mb-30">
                <Button variant="primary" fullWidth onClick={handleDone}>
                  Done
                </Button>
              </div>
            </>
          )}

          {/* Add New Address Form */}
          {showAddNewForm && (
            <>
              <div className="bg-[#F6F6F6] border border-[#0000001A] p-4 rounded-xl mt-4">
                <h3 className="text-[14px] font-poppins font-semibold text-gray-900 mb-3">
                  Add New Address
                </h3>
                <div className="space-y-3">
                  {/* Address Label */}
                  <div>
                    <label className="text-[13px] font-mabry text-gray-600 mb-1 block">
                      Name this address (Optional)
                    </label>
                    <input
                      type="text"
                      value={newAddressLabel}
                      onChange={(e) => setNewAddressLabel(e.target.value)}
                      placeholder="My Office"
                      className="w-full p-3 bg-[#F6F6F6] border border-[#0000001A] rounded-xl text-[14px] font-poppins text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-orange"
                    />
                  </div>

                  {/* Address Input */}
                  <AddressAutocompleteInput 
                    label="Search for Area, Street Name"
                    placeholder="2383 Timber Oak Drive Circuit"
                    value={newAddressValue}
                    onChange={(val) => {
                      setNewAddressValue(val);
                      setNewAddressCoords(null);
                    }}
                    onSelectSuggestion={(suggestion) => {
                      setNewAddressValue(suggestion.label);
                      if (
                        suggestion.latitude != null &&
                        suggestion.longitude != null &&
                        Number.isFinite(suggestion.latitude) &&
                        Number.isFinite(suggestion.longitude)
                      ) {
                        setNewAddressCoords({
                          latitude: suggestion.latitude,
                          longitude: suggestion.longitude,
                        });
                      }
                    }}
                  />

                  <span className="text-[13px] font-poppins flex justify-center text-gray-500 pt-3">
                    or
                  </span>

                  {/* Use Current Location Button */}
                  <button
                    onClick={onUseCurrentLocation}
                    className="w-full rounded-xl py-4 flex items-center justify-center gap-2  transition-colors"
                  >
                    <div className="bg-[#FF66001A] flex items-center gap-3 px-4 py-2.5 rounded-full">
                      <div className="w-5 h-5 rounded-full border-2 border-gray-900 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-900"></div>
                      </div>
                      <span className="text-[14px] font-poppins font-semibold text-gray-900">
                        Use current location
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Done Button */}
              <Button
                variant="primary"
                fullWidth
                onClick={handleAddNew}
                disabled={!newAddressValue}
              >
                Done
              </Button>

              {/* Cancel/Back */}
              <button
                onClick={() => setShowAddNewForm(false)}
                className="w-full text-[14px] font-poppins text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddressModal;
