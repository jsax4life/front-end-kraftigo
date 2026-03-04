import { create } from "zustand";
import { persist } from "zustand/middleware";
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
  addAddress: (
    label: string,
    address: string,
    latitude?: number,
    longitude?: number,
  ) => void;
  removeAddress: (id: string) => void;
  selectAddress: (id: string) => void;
  getCurrentLocation: () => Promise<void>;

  // Helper to get location data for booking
  getBookingLocationData: () => {
    address: string;
    latitude: number | null;
    longitude: number | null;
  };
}

/** Formats a Nominatim address object into German structure: Straße HausNr, PLZ Stadt (names stay in English) */
function formatGermanAddress(nominatimAddress: Record<string, string>): string {
  const {
    road,
    house_number,
    postcode,
    city,
    town,
    village,
    suburb,
    county,
    country,
  } = nominatimAddress;

  // German format: Street Name + House Number, Postcode City, Country
  const streetPart = road
    ? house_number
      ? `${road} ${house_number}`
      : road
    : "";
  const cityPart = city || town || village || suburb || county || "";
  const postalPart = postcode ? `${postcode} ${cityPart}`.trim() : cityPart;

  return [streetPart, postalPart, country].filter(Boolean).join(", ");
}

export const useAddressStore = create<AddressStore>()(
  persist(
    (set, get) => ({
      addresses: [],
      selectedAddressId: null,
      currentAddress: "Add your location",
      currentLatitude: null,
      currentLongitude: null,
      isLoadingLocation: false,

      addAddress: (
        label: string,
        address: string,
        latitude?: number,
        longitude?: number,
      ) => {
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

      removeAddress: (id: string) => {
        set((state) => ({
          addresses: state.addresses.filter((addr) => addr.id !== id),
          // If the selected address is removed, reset selection
          selectedAddressId:
            state.selectedAddressId === id ? null : state.selectedAddressId,
          currentAddress:
            state.selectedAddressId === id
              ? "Add your location"
              : state.currentAddress,
        }));
        logger.log("Address removed:", id);
        toast.success("Address removed successfully");
      },

      getCurrentLocation: async () => {
        if (!navigator.geolocation) {
          toast.error("Geolocation is not supported by your browser");
          return;
        }

        set({ isLoadingLocation: true });

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;

            let formattedAddress: string | null = null;

            // Try Nominatim first
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&email=support@krafitgo.com`,
                {
                  headers: {
                    "Accept-Language": "en",
                    "User-Agent": "Krafitgo/1.0",
                  },
                  signal: AbortSignal.timeout(8000), // don't wait forever
                },
              );
              if (response.ok) {
                const data = await response.json();
                formattedAddress = data.address
                  ? formatGermanAddress(data.address)
                  : data.display_name || null;
              }
            } catch (e) {
              logger.warn("Nominatim failed, trying fallback...", e);
            }

            // Fallback to BigDataCloud
            if (!formattedAddress) {
              try {
                const response = await fetch(
                  `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
                  { signal: AbortSignal.timeout(8000) },
                );
                if (response.ok) {
                  const data = await response.json();
                  formattedAddress =
                    [
                      data.city || data.locality,
                      data.principalSubdivision,
                      data.countryName,
                    ]
                      .filter(Boolean)
                      .join(", ") || null;
                }
              } catch (e) {
                logger.warn("BigDataCloud fallback also failed:", e);
              }
            }

            const finalAddress = formattedAddress || "Current Location";
            const newAddress = {
              id: `address-${Date.now()}`,
              label: "Current Location",
              address: finalAddress,
              latitude,
              longitude,
            };

            set((state) => ({
              addresses: [...state.addresses, newAddress],
              selectedAddressId: newAddress.id,
              currentAddress: finalAddress,
              currentLatitude: latitude,
              currentLongitude: longitude,
              isLoadingLocation: false,
            }));

            toast.success(
              formattedAddress
                ? "Location detected!"
                : "Using coordinates (address lookup failed)",
            );
          },
          (error) => {
            set({ isLoadingLocation: false });
            logger.error("Geolocation error:", error);
            let errorMessage = "Unable to get your location.";
            if (error.code === error.PERMISSION_DENIED) {
              errorMessage =
                "Location access denied. Please enable location permissions.";
            } else if (error.code === error.POSITION_UNAVAILABLE) {
              errorMessage = "Location information unavailable.";
            } else if (error.code === error.TIMEOUT) {
              errorMessage = "Location request timed out.";
            }

            toast.error(errorMessage);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
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
    }),
    {
      name: "krafitgo-address-store", // localStorage key
      // Only persist the data, not loading state
      partialize: (state) => ({
        addresses: state.addresses,
        selectedAddressId: state.selectedAddressId,
        currentAddress: state.currentAddress,
        currentLatitude: state.currentLatitude,
        currentLongitude: state.currentLongitude,
      }),
    },
  ),
);
