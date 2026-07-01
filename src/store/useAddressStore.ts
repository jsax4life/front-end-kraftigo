import { create } from "zustand";
import { persist } from "zustand/middleware";
import toast from "react-hot-toast";
import { logger } from "@/utils/logger";
import type { Address } from "@/types";
import {
  findOrCreateAddress,
  getAddresses,
  getAddressById,
  normalizeAddressRecord,
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
  selectAddress: (id: string) => Promise<void>;
  getCurrentLocation: () => Promise<void>;

  getBookingLocationData: () => {
    address: string;
    latitude: number | null;
    longitude: number | null;
  };
  clearAddresses: () => void;
}

function formatGermanAddress(nominatimAddress: Record<string, string>): string {
  const road =
    nominatimAddress.road ||
    nominatimAddress.pedestrian ||
    nominatimAddress.street ||
    "";
  const houseNumber = nominatimAddress.house_number || "";
  const postcode = nominatimAddress.postcode || "";

  const city =
    nominatimAddress.city ||
    nominatimAddress.town ||
    nominatimAddress.village ||
    nominatimAddress.suburb ||
    nominatimAddress.county ||
    "";

  const streetPart = `${road} ${houseNumber}`.trim();

  const cityPart = `${postcode} ${city}`.trim();

  if (streetPart && cityPart) return `${streetPart}, ${cityPart}`;
  if (streetPart) return streetPart;
  if (cityPart) return cityPart;

  return "";
}

function parseStoredCoord(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
}

function coordsFromAddress(
  address: Pick<Address, "latitude" | "longitude"> | null | undefined,
): { latitude: number | null; longitude: number | null } {
  return {
    latitude: parseStoredCoord(address?.latitude),
    longitude: parseStoredCoord(address?.longitude),
  };
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

          const normalised = backendAddresses.map(normalizeAddressRecord);

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
              const firstCoords = coordsFromAddress(first);
              currentLatitude = firstCoords.latitude;
              currentLongitude = firstCoords.longitude;
            } else if (selectedAddressId) {
              const selected = normalised.find((a) => a.id === selectedAddressId);
              if (selected) {
                currentAddress = selected.address;
                const selectedCoords = coordsFromAddress(selected);
                currentLatitude = selectedCoords.latitude;
                currentLongitude = selectedCoords.longitude;
              }
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
          const normalised = normalizeAddressRecord(addr);

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
                ? coordsFromAddress(normalised).latitude
                : state.currentLatitude,
              currentLongitude: isSelected
                ? coordsFromAddress(normalised).longitude
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
        let finalLat = latitude;
        let finalLng = longitude;

        // Geocode if coordinates are missing
        if ((finalLat == null || finalLng == null) && address) {
          try {
            const geoResponse = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`, {
              headers: { "User-Agent": "Krafitgo/1.0" },
            });
            if (geoResponse.ok) {
              const geoData = await geoResponse.json();
              if (geoData && geoData.length > 0) {
                finalLat = parseFloat(geoData[0].lat);
                finalLng = parseFloat(geoData[0].lon);
              }
            }
          } catch (e) {
            logger.warn("Geocoding manual address failed:", e);
          }
        }

        try {
          const { address: saved, created } = await findOrCreateAddress({
            fullAddress: address,
            label: label || "Unnamed Location",
            latitude: finalLat,
            longitude: finalLng,
            city,
            postalCode,
            country,
            externalPlaceId,
          });
          savedAddress = saved;

          set((state) => {
            const idx = state.addresses.findIndex((a) => a.id === saved.id);
            const addresses =
              idx === -1
                ? [...state.addresses, saved]
                : state.addresses.map((a, i) => (i === idx ? saved : a));

            return {
              addresses,
              selectedAddressId: saved.id,
              currentAddress: saved.address,
              currentLatitude: finalLat ?? parseStoredCoord(saved.latitude),
              currentLongitude: finalLng ?? parseStoredCoord(saved.longitude),
            };
          });

          logger.log(created ? "New address saved:" : "Reused existing address:", saved);
          toast.success(
            created ? "Address added successfully!" : "Using your saved address",
          );
          return saved;
        } catch (err) {
          logger.warn("Backend save failed, using local address ID:", err);
          // Graceful fallback — create a local address so the UI keeps working
          savedAddress = {
            id: `address-${Date.now()}`,
            label: label || "Unnamed Location",
            address,
            fullAddress: address,
            latitude: finalLat,
            longitude: finalLng,
            city,
            postalCode,
            country,
            externalPlaceId,
          };

          set((state) => ({
            addresses: [...state.addresses, savedAddress!],
            selectedAddressId: savedAddress!.id,
            currentAddress: savedAddress!.address,
            currentLatitude: finalLat ?? null,
            currentLongitude: finalLng ?? null,
          }));

          toast.success("Address added successfully!");
          return savedAddress;
        }
      },

      selectAddress: async (id: string) => {
        let address = get().addresses.find((addr) => addr.id === id);
        if (!address) return;

        let { latitude, longitude } = coordsFromAddress(address);

        if (latitude == null || longitude == null) {
          const reloaded = await get().reloadAddressById(id);
          if (reloaded) {
            address = reloaded;
            ({ latitude, longitude } = coordsFromAddress(reloaded));
          }
        }

        set({
          selectedAddressId: id,
          currentAddress: address.address,
          currentLatitude: latitude,
          currentLongitude: longitude,
        });
        logger.log("Address selected:", address);
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

            try {
              // Added zoom=18 for exact street level accuracy
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=18&addressdetails=1&email=support@krafitgo.com`,
                {
                  headers: {
                    "Accept-Language": "en", // Keeps the names in English, but format stays German
                    "User-Agent": "Krafitgo/1.0",
                  },
                  signal: AbortSignal.timeout(8000),
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
                  city =
                    data.city ||
                    data.locality ||
                    data.localityInfo?.locality ||
                    undefined;
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
        const selected = state.addresses.find(
          (a) => a.id === state.selectedAddressId,
        );
        const fromSelected = coordsFromAddress(selected);
        const fromCurrent = {
          latitude: parseStoredCoord(state.currentLatitude),
          longitude: parseStoredCoord(state.currentLongitude),
        };

        return {
          address: selected?.address ?? state.currentAddress,
          latitude: fromSelected.latitude ?? fromCurrent.latitude,
          longitude: fromSelected.longitude ?? fromCurrent.longitude,
        };
      },

      clearAddresses: () => {
        set({
          addresses: [],
          selectedAddressId: null,
          currentAddress: "Add your location",
          currentLatitude: null,
          currentLongitude: null,
        });
      },
    }),
    {
      name: "krafitgo-address-store", // localStorage key
      // Only persist the data, not loading state
      partialize: (state) => {
        let isAuthenticated = false;
        try {
          const authStorage = localStorage.getItem("auth-storage");
          if (authStorage) {
            const parsed = JSON.parse(authStorage);
            isAuthenticated = !!parsed.state?.isAuthenticated;
          }
        } catch (e) {
          // Ignore parsing errors
        }

        if (!isAuthenticated) {
          // Return default state to clear or prevent saving to local storage
          return {
            addresses: [],
            selectedAddressId: null,
            currentAddress: "Add your location",
            currentLatitude: null,
            currentLongitude: null,
          };
        }

        return {
          addresses: state.addresses,
          selectedAddressId: state.selectedAddressId,
          currentAddress: state.currentAddress,
          currentLatitude: state.currentLatitude,
          currentLongitude: state.currentLongitude,
        };
      },
    },
  ),
);
