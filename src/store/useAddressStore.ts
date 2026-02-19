import { create } from "zustand";
import toast from "react-hot-toast";
import { logger } from "@/utils/logger";
import type { Address } from "@/types";

interface AddressStore {
  addresses: Address[];
  selectedAddressId: string | null;
  currentAddress: string;
  currentLatitude: number | null;
  currentLongitude: number | null;
  isLoadingLocation: boolean;
  
  // Actions
  addAddress: (label: string, address: string, latitude?: number, longitude?: number) => void;
  selectAddress: (id: string) => void;
  getCurrentLocation: () => Promise<void>;
  
  // Helper to get location data for booking
  getBookingLocationData: () => {
    address: string;
    latitude: number | null;
    longitude: number | null;
  };
}

export const useAddressStore = create<AddressStore>((set, get) => ({
  addresses: [],
  selectedAddressId: null,
  currentAddress: "Add your location",
  currentLatitude: null,
  currentLongitude: null,
  isLoadingLocation: false,

  addAddress: (label: string, address: string, latitude?: number, longitude?: number) => {
    const newAddress: Address = {
      id: `address-${Date.now()}`,
      label: label || "Unnamed Location",
      address,
      latitude,
      longitude,
    };

    set((state) => ({
      addresses: [...state.addresses, newAddress],
      selectedAddressId: newAddress.id,
      currentAddress: newAddress.address,
      currentLatitude: latitude || null,
      currentLongitude: longitude || null,
    }));

    logger.log("New address added:", newAddress);
    toast.success("Address added successfully!");
  },

  selectAddress: (id: string) => {
    const address = get().addresses.find((addr) => addr.id === id);
    if (address) {
      set({
        selectedAddressId: id,
        currentAddress: address.address,
        currentLatitude: address.latitude || null,
        currentLongitude: address.longitude || null,
      });
      logger.log("Address selected:", address);
    }
  },

  getCurrentLocation: async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    set({ isLoadingLocation: true });
    logger.log("Getting current location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        logger.log("Coordinates obtained:", { latitude, longitude });

        try {
          // Reverse geocode using OpenStreetMap Nominatim
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            {
              headers: {
                "Accept-Language": "en",
              },
            }
          );

          if (!response.ok) {
            throw new Error("Failed to get address from coordinates");
          }

          const data = await response.json();
          const address = data.display_name || "Current Location";

          logger.log("Address obtained:", address);

          set({
            currentAddress: address,
            currentLatitude: latitude,
            currentLongitude: longitude,
            selectedAddressId: null,
            isLoadingLocation: false,
          });

          toast.success("Location detected!");
        } catch (error) {
          logger.error("Reverse geocoding failed:", error);
          set({
            currentAddress: "Current Location",
            currentLatitude: latitude,
            currentLongitude: longitude,
            selectedAddressId: null,
            isLoadingLocation: false,
          });
          toast.success("Using current location");
        }
      },
      (error) => {
        logger.error("Geolocation error:", error);
        set({ isLoadingLocation: false });
        
        let errorMessage = "Unable to get your location.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = "Location access denied. Please enable location permissions.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = "Location information unavailable.";
        } else if (error.code === error.TIMEOUT) {
          errorMessage = "Location request timed out.";
        }
        
        toast.error(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  },

  getBookingLocationData: () => {
    const state = get();
    return {
      address: state.currentAddress,
      latitude: state.currentLatitude,
      longitude: state.currentLongitude,
    };
  },
}));
