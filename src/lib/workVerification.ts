"use client";

export type FreshLocationSample = {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  capturedAt: string;
};

const DEVICE_ID_STORAGE_KEY = "kraftigo:app-install-id";
const MIN_DEVICE_ID_LENGTH = 8;

function createInstallId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `web-${crypto.randomUUID()}`;
  }
  const random = Math.random().toString(36).slice(2);
  return `web-${Date.now().toString(36)}-${random}`;
}

/**
 * Stable app-install identifier for fraud signals. It is intentionally not
 * derived from user data and is safe to persist on this browser installation.
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") {
    throw new Error("Device identification is only available in the browser.");
  }

  const stored = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY)?.trim();
  if (stored && stored.length >= MIN_DEVICE_ID_LENGTH) return stored;

  const created = createInstallId();
  window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, created);
  return created;
}

/**
 * Requests a fresh, foreground, high-accuracy location sample. Cached samples
 * are explicitly disabled because Start and Complete require current evidence.
 */
export function captureFreshLocation(): Promise<FreshLocationSample> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.reject(
      new Error("Location is not supported by this browser. Use a device with location enabled."),
    );
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        if (![latitude, longitude, accuracy].every(Number.isFinite)) {
          reject(new Error("The device returned an invalid location sample. Please try again."));
          return;
        }

        resolve({
          latitude,
          longitude,
          accuracyMeters: accuracy,
          capturedAt: new Date(position.timestamp).toISOString(),
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(
            new Error(
              "Location permission is required to verify work. Enable precise location and try again.",
            ),
          );
          return;
        }
        if (error.code === error.TIMEOUT) {
          reject(new Error("A fresh location could not be captured in time. Please try again."));
          return;
        }
        reject(new Error("Your current location is unavailable. Check location settings and try again."));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15_000,
      },
    );
  });
}

export function normalizeArrivalPin(value: string): string {
  return value.replace(/\D/g, "").slice(0, 6);
}

export function isValidArrivalPin(value: string): boolean {
  return /^\d{6}$/.test(value);
}
