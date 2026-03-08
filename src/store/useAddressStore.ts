import { create } from "zustand";
import { persist } from "zustand/middleware";
import toast from "react-hot-toast";
import { logger } from "@/utils/logger";
import type { Address } from "@/types";
import {
  createAddress,
  getAddresses,
  getAddressById,
} from "@/lib/api/addresses";

interface AddressStore {
  addresses: Address[];
  selectedAddressId: string | null;
  currentAddress: string;
  currentLatitude: number | null;
  currentLongitude: number | null;
  isLoadingLocation: boolean;
  isLoadingAddresses: boolean;

  loadAddresses: () => Promise<void>;
  reloadAddressById: (id: string) => Promise<Address | null>;

  addAddress: (params: {
    label?: string;
    address: string;
    latitude?: number;
    longitude?: number;
    city?: string;
    postalCode?: string;
    country?: string;
    externalPlaceId?: string;
  }) => Promise<Address | null>;
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
      isLoadingAddresses: false,

      loadAddresses: async () => {
        set({ isLoadingAddresses: true });
        try {
          const backendAddresses = await getAddresses();

          const normalised = backendAddresses.map((addr) => ({
            ...addr,
            address:
              addr.address ||
              addr.fullAddress ||
              addr.label ||
              "Unnamed Location",
            label: addr.label || "Unnamed Location",
          }));

          set((state) => {
            let selectedAddressId = state.selectedAddressId;
            let currentAddress = state.currentAddress;
            let currentLatitude = state.currentLatitude;
            let currentLongitude = state.currentLongitude;

            // If nothing is selected yet but we have addresses, default to the first one
            if (!selectedAddressId && normalised.length > 0) {
              const first = normalised[0];
              selectedAddressId = first.id;
              currentAddress = first.address;
              currentLatitude = first.latitude ?? null;
              currentLongitude = first.longitude ?? null;
            }

            return {
              addresses: normalised,
              selectedAddressId,
              currentAddress,
              currentLatitude,
              currentLongitude,
              isLoadingAddresses: false,
            };
          });
        } catch (error) {
          logger.error("Failed to load addresses from backend:", error);
          toast.error("Could not load your saved addresses.");
          set({ isLoadingAddresses: false });
        }
      },

      reloadAddressById: async (id: string) => {
        try {
          const addr = await getAddressById(id);
          const normalised: Address = {
            ...addr,
            address:
              addr.address ||
              addr.fullAddress ||
              addr.label ||
              "Unnamed Location",
            label: addr.label || "Unnamed Location",
          };

          set((state) => {
            const idx = state.addresses.findIndex((a) => a.id === id);
            const addresses =
              idx === -1
                ? [...state.addresses, normalised]
                : [
                    ...state.addresses.slice(0, idx),
                    normalised,
                    ...state.addresses.slice(idx + 1),
                  ];

            const isSelected = state.selectedAddressId === id;

            return {
              addresses,
              currentAddress: isSelected
                ? normalised.address
                : state.currentAddress,
              currentLatitude: isSelected
                ? normalised.latitude ?? null
                : state.currentLatitude,
              currentLongitude: isSelected
                ? normalised.longitude ?? null
                : state.currentLongitude,
            };
          });

          return normalised;
        } catch (error) {
          logger.error("Failed to reload address from backend:", error);
          toast.error("Could not refresh this address.");
          return null;
        }
      },

      addAddress: async ({
        label,
        address,
        latitude,
        longitude,
        city,
        postalCode,
        country,
        externalPlaceId,
      }) => {
        let savedAddress: Address | null = null;

        try {
          // Persist to backend — server returns a stable UUID as `id`
          savedAddress = await createAddress({
            fullAddress: address,
            label: label || "Unnamed Location",
            latitude,
            longitude,
            city,
            postalCode,
            country,
            externalPlaceId,
          });

          // Normalise: ensure `address` field (used by UI) is always set
          if (!savedAddress.address) {
            savedAddress = { ...savedAddress, address: savedAddress.fullAddress ?? address };
          }
        } catch (err) {
          logger.warn("Backend save failed, using local address ID:", err);
          // Graceful fallback — create a local address so the UI keeps working
          savedAddress = {
            id: `address-${Date.now()}`,
            label: label || "Unnamed Location",
            address,
            fullAddress: address,
            latitude,
            longitude,
            city,
            postalCode,
            country,
            externalPlaceId,
          };
        }

        set((state) => ({
          addresses: [...state.addresses, savedAddress!],
          selectedAddressId: savedAddress!.id,
          currentAddress: savedAddress!.address,
          currentLatitude: latitude ?? null,
          currentLongitude: longitude ?? null,
        }));

        logger.log("New address saved:", savedAddress);
        toast.success("Address added successfully!");
        return savedAddress;
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
            let city: string | undefined;
            let postalCode: string | undefined;
            let country: string | undefined;

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
                if (data.address) {
                  formattedAddress = formatGermanAddress(data.address);
                  city =
                    data.address.city ||
                    data.address.town ||
                    data.address.village ||
                    data.address.suburb ||
                    data.address.county;
                  postalCode = data.address.postcode;
                  country =
                    (data.address.country_code &&
                      data.address.country_code.toUpperCase()) ||
                    data.address.country;
                } else {
                  formattedAddress = data.display_name || null;
                }
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
                  city = data.city || data.locality || data.localityInfo?.locality || undefined;
                  postalCode = data.postcode || data.postalCode || undefined;
                  country = data.countryCode || data.countryName || undefined;

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

            // Save to backend to get a server UUID
            const saved = await get().addAddress({
              label: "Current Location",
              address: finalAddress,
              latitude,
              longitude,
              city,
              postalCode,
              country,
            });

            // addAddress already updates the store — just fix loading state
            set({
              currentLatitude: latitude,
              currentLongitude: longitude,
              isLoadingLocation: false,
            });

            if (!saved) {
              // Fallback already handled inside addAddress, nothing extra needed
            }

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
