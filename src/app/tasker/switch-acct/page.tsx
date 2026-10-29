"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Button from "@/components/ui/button";
import Image from "next/image";
import {
  ArrowLeft,
  Briefcase,
  CreditCard,
  Shield,
  CheckCircle2,
  Search,
} from "lucide-react";
import {
  KRAFTER_SIGNUP_URL,
  clearKrafterSignupIntent,
  setKrafterSignupIntent,
} from "@/lib/krafterSignupIntent";
import { useAuthStore } from "@/store/useAuthStore";
import { useProfileStore } from "@/store/useProfileStore";
import Loader from "@/components/ui/loader";
import { isNotEmpty } from "@/utils/validation";
import { Checkbox } from "@/components/ui/Checkbox";
import { LegalModal } from "@/components/ui/LegalModal";
import { TermsContent } from "@/components/ui/TermsContent";
import { PrivacyContent } from "@/components/ui/PrivacyContent";
import toast from "react-hot-toast";
import { SearchCombobox } from "@/components/ui/SearchCombobox";
import {
  fetchGermanStreetSuggestions,
  lookupGermanPostcode,
  normalizeGermanPostcode,
  resolveKrafterLocationCoords,
} from "@/lib/geoapify";
import KrafterProfileSkillsEditor from "@/components/tasker/KrafterProfileSkillsEditor";
import type { SkillOfferingDraft } from "@/lib/krafterSkillsDraft";
import {
  GENDER_SELECT_OPTIONS,
  normalizeGenderApiValue,
  isValidGenderSelection,
  type GenderApiValue,
} from "@/lib/genderOptions";
import NationalityFieldHint from "@/components/shared/NationalityFieldHint";
import { canAccessKrafterDashboard } from "@/lib/krafterProfileCompletionDisplay";
import { buildPersonalDetailsPayloadFromInitialOnboarding } from "@/lib/krafterOnboarding";
import {
  extractServiceCategoryOfferings,
  mapOfferingsToSkillDrafts,
} from "@/lib/krafterSkillsDraft";

// ─────────────────────────────────────────────────────────────────────────────

const Page = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const {
    isLoading: saving,
    fetchKrafterOnboardingStatus,
    saveKrafterPersonal,
    saveKrafterAddress,
    submitSkills,
    submitPersonalDetails,
    fetchKrafterProfileCompletionSummary,
    profileCompletionSummary,
  } = useProfileStore();
  const [selectedSkills, setSelectedSkills] = useState<SkillOfferingDraft[]>([]);
  const [postCodeLookupLoading, setPostCodeLookupLoading] = useState(false);
  const postCodeDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** PLZ centroid for Geoapify bias — kept while typing street (not cleared per keystroke). */
  const postCodeGeoBiasRef = useRef<{ latitude: number; longitude: number } | null>(
    null,
  );
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // ── Nationality data ──────────────────────────────────────────────────────
  const [nationalities, setNationalities] = useState<string[]>([]);
  const [nationalitiesLoading, setNationalitiesLoading] = useState(true);
  // Maps demonym → ISO cca2 code (e.g. "German" → "DE") for the API
  const [demonymToCode, setDemonymToCode] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchNationalities = async () => {
      try {
        const res = await fetch("/api/nationalities");
        const data: Array<{ demonym: string; code: string }> = await res.json();

        if (!Array.isArray(data)) throw new Error("Unexpected response");

        const codeMap: Record<string, string> = {};
        const demonyms: string[] = [];

        data.forEach(({ demonym, code }) => {
          demonyms.push(demonym);
          codeMap[demonym] = code;
        });

        setNationalities(demonyms); // already sorted by the API
        setDemonymToCode(codeMap);
      } catch {
        // Should never happen with static route, but keep a minimal fallback
        setNationalities(["British", "German", "French", "Nigerian", "Indian", "American"]);
        setDemonymToCode({ British: "GB", German: "DE", French: "FR", Nigerian: "NG", Indian: "IN", American: "US" });
      } finally {
        setNationalitiesLoading(false);
      }
    };

    fetchNationalities();
  }, []);

  // ── Street address autocomplete (Photon / OpenStreetMap — Germany only) ───
  const [streetSuggestions, setStreetSuggestions] = useState<
    {
      label: string;
      street: string;
      postcode: string;
      city: string;
      latitude?: number;
      longitude?: number;
    }[]
  >([]);
  const [streetLoading, setStreetLoading] = useState(false);
  const [streetOpen, setStreetOpen] = useState(false);
  const [streetQuery, setStreetQuery] = useState("");
  const streetRef = useRef<HTMLDivElement>(null);
  const streetDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close street dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (streetRef.current && !streetRef.current.contains(e.target as Node)) {
        setStreetOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const searchStreet = (query: string) => {
    setStreetQuery(query);
    handleInputChange("streetNo", query);
    setFormData((prev) => ({ ...prev, addressLatitude: null, addressLongitude: null }));
    if (streetDebounce.current) clearTimeout(streetDebounce.current);
    const live = formDataRef.current;
    if (normalizeGermanPostcode(live.postCode).length !== 5) {
      setStreetSuggestions([]);
      setStreetOpen(false);
      return;
    }
    if (query.trim().length < 3) {
      setStreetSuggestions([]);
      setStreetOpen(false);
      return;
    }
    streetDebounce.current = setTimeout(async () => {
      setStreetLoading(true);
      try {
        const latest = formDataRef.current;
        const plz = normalizeGermanPostcode(latest.postCode);
        const bias = postCodeGeoBiasRef.current;
        const unique = await fetchGermanStreetSuggestions(query, {
          postcode: plz,
          city: latest.city,
          latitude: bias?.latitude ?? latest.addressLatitude,
          longitude: bias?.longitude ?? latest.addressLongitude,
        });

        setStreetSuggestions(unique);
        setStreetOpen(unique.length > 0);
      } catch {
        setStreetSuggestions([]);
      } finally {
        setStreetLoading(false);
      }
    }, 350);
  };

  const selectStreetSuggestion = (s: {
    label: string;
    street: string;
    postcode: string;
    city: string;
    latitude?: number;
    longitude?: number;
  }) => {
    setStreetQuery(s.street);
    setFormData((prev) => ({
      ...prev,
      streetNo: s.street,
      postCode: s.postcode || prev.postCode,
      city: s.city || prev.city,
      addressLatitude:
        s.latitude != null && Number.isFinite(s.latitude) ? s.latitude : null,
      addressLongitude:
        s.longitude != null && Number.isFinite(s.longitude) ? s.longitude : null,
    }));
    setStreetOpen(false);
    setStreetSuggestions([]);
  };

  // ── Form state ────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    dateOfBirth: "",
    nationality: "",
    termsAccepted: false,
    streetNo: "",
    postCode: "",
    city: "",
    addressLatitude: null as number | null,
    addressLongitude: null as number | null,
  });
  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  // Prefill from onboarding status on mount
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setKrafterSignupIntent();
      router.replace(KRAFTER_SIGNUP_URL);
      return;
    }

    clearKrafterSignupIntent();

    fetchKrafterOnboardingStatus().then(() => {
      const { onboardingStatus } = useProfileStore.getState();
      if (onboardingStatus) {
        const p = onboardingStatus.personal;
        const a = onboardingStatus.address;
        
        setFormData((prev) => ({
          ...prev,
          firstName: p?.firstName ?? prev.firstName,
          lastName: p?.lastName ?? prev.lastName,
          gender: p?.gender ? normalizeGenderApiValue(p.gender) : prev.gender,
          dateOfBirth: p?.dateOfBirth ?? prev.dateOfBirth,
          nationality: p?.nationality ?? prev.nationality,
          streetNo: a?.street ?? prev.streetNo,
          postCode: a?.postalCode ?? prev.postCode,
          city: a?.city ?? prev.city,
        }));
        
        // Sync street autocomplete query label
        if (a?.street) setStreetQuery(a.street);
      }

      fetchKrafterProfileCompletionSummary().then(() => {
        const summary = useProfileStore.getState().profileCompletionSummary;
        if (!summary?.initialOnboarding?.isComplete) return;

        const offerings = extractServiceCategoryOfferings(summary.skills);
        if (offerings.length > 0) {
          setSelectedSkills(mapOfferingsToSkillDrafts(offerings));
        }

        if (summary.skills?.isComplete) {
          setCurrentStep(4);
          return;
        }
        if (summary.initialOnboarding.addressCompletedAt) {
          setCurrentStep(4);
        } else if (summary.initialOnboarding.personalCompletedAt) {
          setCurrentStep(3);
        }
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, router]);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleInputChange = (
    field: string,
    value: string | boolean | File | null,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handlePostCodeChange = (raw: string) => {
    const postCode = normalizeGermanPostcode(raw);
    postCodeGeoBiasRef.current = null;
    handleInputChange("postCode", postCode);
    setFormData((prev) => ({
      ...prev,
      postCode,
      addressLatitude: null,
      addressLongitude: null,
    }));

    if (postCodeDebounce.current) clearTimeout(postCodeDebounce.current);
    if (postCode.length !== 5) {
      return;
    }

    postCodeDebounce.current = setTimeout(async () => {
      setPostCodeLookupLoading(true);
      try {
        const match = await lookupGermanPostcode(postCode);
        if (!match) {
          postCodeGeoBiasRef.current = null;
          return;
        }
        if (match.latitude != null && match.longitude != null) {
          postCodeGeoBiasRef.current = {
            latitude: match.latitude,
            longitude: match.longitude,
          };
        } else {
          postCodeGeoBiasRef.current = null;
        }
        setFormData((prev) => ({
          ...prev,
          city: match.city || prev.city,
          ...(match.latitude != null && match.longitude != null
            ? {
                addressLatitude: match.latitude,
                addressLongitude: match.longitude,
              }
            : {}),
        }));
      } finally {
        setPostCodeLookupLoading(false);
      }
    }, 400);
  };

  // When nationality is confirmed — no city reset needed (city is always Germany)
  const handleNationalityChange = (nat: string) => {
    handleInputChange("nationality", nat);
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return true;
      case 2:
        return (
          isNotEmpty(formData.firstName) &&
          isNotEmpty(formData.lastName) &&
          isNotEmpty(formData.gender) &&
          isValidGenderSelection(formData.gender) &&
          isNotEmpty(formData.dateOfBirth) &&
          isNotEmpty(formData.nationality) &&
          formData.termsAccepted !== false
        );
      case 3:
        return (
          normalizeGermanPostcode(formData.postCode).length === 5 &&
          isNotEmpty(formData.streetNo) &&
          isNotEmpty(formData.city)
        );
      case 4: {
        if (profileCompletionSummary?.skills?.isComplete) return true;
        return (
          selectedSkills.length > 0 &&
          selectedSkills.every(
            (s) =>
              s.categoryId &&
              Number(s.price) > 0 &&
              Number(s.experienceYears) >= 0,
          )
        );
      }
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      // Intro → Personal Details (no API call)
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      // Personal Details → save to API then advance to Address
      try {
        await saveKrafterPersonal({
          firstName: formData.firstName,
          lastName: formData.lastName,
          gender: formData.gender as GenderApiValue,
          dateOfBirth: formData.dateOfBirth,
          nationality: demonymToCode[formData.nationality] ?? formData.nationality,
          hasAcceptedTerms: formData.termsAccepted as boolean,
        });
        setCurrentStep(3);
      } catch {
        toast.error("Failed to save personal details. Please try again.");
      }
      return;
    }

    if (currentStep === 3) {
      try {
        await saveKrafterAddressStep();
        setCurrentStep(4);
      } catch {
        /* toast in saveKrafterAddressStep */
      }
      return;
    }

    if (currentStep === 4) {
      try {
        let summary = useProfileStore.getState().profileCompletionSummary;

        if (!summary?.personalDetails?.isComplete) {
          await submitPersonalDetails(
            buildPersonalDetailsPayloadFromInitialOnboarding(formData),
          );
          summary = useProfileStore.getState().profileCompletionSummary;
        }

        if (!summary?.skills?.isComplete) {
          await submitSkills({
            serviceCategoryOfferings: selectedSkills.map((s) => ({
              serviceCategoryId: s.categoryId,
              pricingType: s.rateType,
              ...(s.rateType === "HOURLY"
                ? { hourlyRate: Number(s.price) || 0 }
                : { flatRate: Number(s.price) || 0 }),
              experienceYears: Number(s.experienceYears) || 0,
              ...(s.photoUrl ? { photoUrl: s.photoUrl } : {}),
            })),
            submitAsDraft: false,
          });
        }

        await fetchKrafterProfileCompletionSummary();
        summary = useProfileStore.getState().profileCompletionSummary;

        if (canAccessKrafterDashboard(summary)) {
          toast.success("You're all set! Welcome to your Krafter dashboard.");
          router.push("/tasker/dashboard");
          return;
        }

        if (summary?.personalDetails?.isComplete && summary?.skills?.isComplete) {
          toast.error(
            "Profile steps are saved, but Krafter access is not active yet. Refresh or contact support if this continues.",
          );
        } else {
          toast.error("Could not finish Krafter setup. Please try again.");
        }
      } catch {
        toast.error("Failed to finish Krafter setup. Please try again.");
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const saveKrafterAddressStep = async () => {
    const postCode = normalizeGermanPostcode(formData.postCode);
    const addressText = [formData.streetNo, postCode, formData.city]
      .filter(Boolean)
      .join(", ");
    const pickerCoords =
      formData.addressLatitude != null &&
      formData.addressLongitude != null &&
      Number.isFinite(formData.addressLatitude) &&
      Number.isFinite(formData.addressLongitude)
        ? {
            latitude: formData.addressLatitude,
            longitude: formData.addressLongitude,
          }
        : null;
    const resolvedCoords = await resolveKrafterLocationCoords(
      addressText,
      pickerCoords,
    );

    await saveKrafterAddress({
      street: formData.streetNo,
      postalCode: postCode,
      city: formData.city,
      ...(resolvedCoords
        ? {
            latitude: resolvedCoords.latitude,
            longitude: resolvedCoords.longitude,
          }
        : {}),
    });
  };

  // Show page-level loader only while auth is initialising
  const isLoading = authLoading;

  return (
    <main className="relative w-full min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {isLoading ? (
        <Loader />
      ) : (
        <div className="w-full max-w-4xl mx-auto min-h-screen flex flex-col py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={handleBack}
              className="text-2xl hover:opacity-70 transition-opacity"
            >
              <ArrowLeft />
            </button>
            {currentStep > 1 && (
              <span className="text-[14px] text-gray-500 font-poppins">
                Step {currentStep - 1} of {totalSteps - 1}
              </span>
            )}
          </div>

          {/* Step Content */}
          <div className="flex-1">
            {/* ── Step 1: Intro ── */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="flex flex-col items-center mb-2">
                  <Image
                    src="/taskerLogo.svg"
                    alt="kraftigo logo"
                    width={150}
                    height={50}
                    className="mb-8"
                  />
                  <div className="w-full relative h-40 rounded-2xl overflow-hidden mb-4">
                    <Image
                      src="/get-started.png"
                      alt="Become a Krafter"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>

                <h1 className="text-[32px] font-gerat font-bold leading-tight mb-4">
                  Become a kraftigo Krafter
                </h1>

                <p className="text-[15px] font-poppins text-gray-600 mb-8 leading-relaxed">
                  Join our community of professionals. To maintain a safe and
                  professional marketplace, all Krafters must meet the following
                  requirements:
                </p>

                <div className="space-y-6">
                  {[
                    {
                      icon: (
                        <div className="p-3 bg-[#0000FF1A] text-blue-600 rounded-xl">
                          <Briefcase size={22} />
                        </div>
                      ),
                      title: "Must be legally allowed to work",
                      desc: "You must be eligible to work in your current location",
                    },
                    {
                      icon: (
                        <div className="p-3 bg-[#0000FF1A] text-blue-600 rounded-xl">
                          <CreditCard size={22} />
                        </div>
                      ),
                      title: "Identity verification is required",
                      desc: "A valid government issued ID is required for screening",
                    },
                    {
                      icon: (
                        <div className="p-3 bg-[#0000FF1A] text-blue-600 rounded-xl">
                          <Shield size={22} />
                        </div>
                      ),
                      title: "Approval needed before jobs",
                      desc: "Our team will review your profile before you can start",
                    },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex items-center gap-4 pb-3">
                        {item.icon}
                        <div className="flex-1">
                          <h4 className="text-[16px] font-gerat font-bold text-[#1D2939] mt-1.5">
                            {item.title}
                          </h4>
                          <p className="text-[13px] font-poppins text-gray-500">
                            {item.desc}
                          </p>
                        </div>
                        <div className="text-blue-600 -mt-8">
                          <CheckCircle2
                            size={24}
                            className="fill-blue-600 text-white"
                          />
                        </div>
                      </div>
                      <hr className="w-full text-[#0000001A]" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Step 2: Basic Info ── */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-gerat font-semibold mb-2">
                  Tell Us About You
                </h1>
                <p className="text-[16px] font-poppins text-[#2B2F32] mb-8">
                  Enter your details exactly as on your ID
                </p>

                <Input
                  label="First Name"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={(v) => handleInputChange("firstName", v)}
                  required
                />
                <Input
                  label="Last Name"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={(v) => handleInputChange("lastName", v)}
                  required
                />
                <Select
                  label="Gender"
                  placeholder="Select gender"
                  value={formData.gender}
                  onChange={(v) => handleInputChange("gender", v)}
                  options={GENDER_SELECT_OPTIONS}
                  required
                />
                <Input
                  label="Date of Birth"
                  type="date"
                  placeholder="Date of Birth"
                  value={formData.dateOfBirth}
                  onChange={(v) => handleInputChange("dateOfBirth", v)}
                  required
                />

                {/* Searchable nationality */}
                <SearchCombobox
                  label="Nationality"
                  value={formData.nationality}
                  onChange={handleNationalityChange}
                  options={nationalities}
                  isLoading={nationalitiesLoading}
                  placeholder="Search nationality"
                  required
                  emptyMessage="No nationality found. Try a different spelling."
                />
                <NationalityFieldHint />

                <div>
                  <Checkbox
                    checked={formData.termsAccepted}
                    onChange={(checked: boolean) =>
                      handleInputChange("termsAccepted", checked)
                    }
                    labelNode={
                      <span className="text-[12px] font-poppins text-gray-700 leading-relaxed -mt-2">
                        I confirm that I have read, understood, and agree to be
                        bound by the{" "}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowTermsModal(true);
                          }}
                          className="text-brand-blue underline underline-offset-2 font-semibold hover:opacity-75 transition-opacity"
                        >
                          Terms of Use
                        </button>{" "}
                        and{" "}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowPrivacyModal(true);
                          }}
                          className="text-brand-blue underline underline-offset-2 font-semibold hover:opacity-75 transition-opacity"
                        >
                          Privacy Policy
                        </button>{" "}
                        of Kraftigö
                      </span>
                    }
                  />
                </div>
              </div>
            )}

            {/* ── Step 3: Address ── */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-gerat font-semibold mb-2">
                  Tell us about you
                </h1>
                <p className="text-[14px] font-poppins text-[#2B2F32] mb-2 font-bold">
                  Enter your current home address and we will help you find jobs
                  near you
                </p>
                <span className="flex items-center gap-2">
                  <Image
                    src="/badge2.svg"
                    alt="location"
                    width={14}
                    height={14}
                  />
                  <p className="text-[13px] font-poppins">
                    Customers cannot see your address
                  </p>
                </span>

                <div className="relative space-y-1.5">
                  <label className="text-[14px] font-poppins text-gray-800 font-medium block">
                    Post code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={5}
                    value={formData.postCode}
                    placeholder="e.g. 10115"
                    onChange={(e) => handlePostCodeChange(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl bg-[#F6F6F6] border border-[#EAECF0] outline-none font-poppins text-[15px] focus:border-brand-orange transition-colors"
                  />
                  {postCodeLookupLoading ? (
                    <p className="text-[11px] font-poppins text-gray-400">
                      Looking up city…
                    </p>
                  ) : (
                    <p className="text-[11px] font-poppins text-gray-400">
                      Enter your 5-digit PLZ — we will fill in your city
                    </p>
                  )}
                </div>

                <Input
                  label="City"
                  placeholder="Filled from post code"
                  value={formData.city}
                  onChange={(v) => handleInputChange("city", v)}
                  required
                />

                {/* Street — Geoapify autocomplete (scoped to PLZ when set) */}
                <div ref={streetRef} className="relative space-y-1.5">
                  <label className="text-[14px] font-poppins text-gray-800 font-medium block">
                    Street and house number{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Search
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                    <input
                      type="text"
                      value={streetQuery || formData.streetNo}
                      placeholder="e.g. Musterstraße 12"
                      onChange={(e) => searchStreet(e.target.value)}
                      onFocus={() =>
                        streetSuggestions.length > 0 && setStreetOpen(true)
                      }
                      className="w-full px-4 pl-10 pr-10 py-3.5 rounded-2xl bg-[#F6F6F6] border border-[#EAECF0] outline-none font-poppins text-[15px] focus:border-brand-orange transition-colors"
                    />
                    {streetLoading && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  {streetOpen && streetSuggestions.length > 0 && (
                    <ul className="absolute z-50 w-full bg-white border border-[#EAECF0] rounded-2xl shadow-xl max-h-56 overflow-y-auto mt-1 py-1">
                      {streetSuggestions.map((s, i) => (
                        <li key={i}>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => selectStreetSuggestion(s)}
                            className="w-full text-left px-4 py-2.5 font-poppins text-[14px] text-[#1D2939] hover:bg-[#FFF4EE] hover:text-brand-orange transition-colors"
                          >
                            <span className="font-semibold">{s.street}</span>
                            {(s.postcode || s.city) && (
                              <span className="text-gray-400 text-[12px] ml-1">
                                —{" "}
                                {[s.postcode, s.city].filter(Boolean).join(" ")}
                              </span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="text-[11px] font-poppins text-gray-400">
                    {normalizeGermanPostcode(formData.postCode).length === 5
                      ? "Pick your street — suggestions are limited to your post code"
                      : "Enter your post code first, then select your street"}
                  </p>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4 pb-24">
                <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-gerat font-semibold mb-2">
                  Add your skills
                </h1>
                <p className="text-[14px] font-poppins text-[#667085] mb-4">
                  Choose what you offer and set your rates so customers can book you.
                </p>
                <KrafterProfileSkillsEditor
                  skills={selectedSkills}
                  onSkillsChange={setSelectedSkills}
                />
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="mt-auto space-y-4">
            {currentStep === 1 && (
              <div className="text-center text-[14px] font-poppins pt-8 pb-3">
                <Button
                  variant="primary"
                  onClick={handleNext}
                  fullWidth
                  disabled={!isStepValid()}
                  className="py-4 text-[16px] font-gerat font-bold"
                >
                  Get Started
                </Button>
              </div>
            )}
            {currentStep === 2 && (
              <div className="text-center text-[14px] font-poppins pt-5">
                <Button
                  variant="primary"
                  onClick={handleNext}
                  fullWidth
                  disabled={!isStepValid() || saving}
                  className="py-4 text-[16px] font-gerat font-bold"
                >
                  {saving ? "Saving…" : "Continue"}
                </Button>
              </div>
            )}
            {currentStep === 3 && (
              <div className="text-center text-[14px] font-poppins pt-5">
                <Button
                  variant="primary"
                  onClick={handleNext}
                  fullWidth
                  disabled={!isStepValid() || saving}
                  className="py-4 text-[16px] font-gerat font-bold"
                >
                  {saving ? "Saving…" : "Continue to skills"}
                </Button>
              </div>
            )}
            {currentStep === 4 && (
              <div className="text-center text-[14px] font-poppins pt-5">
                <Button
                  variant="primary"
                  onClick={handleNext}
                  fullWidth
                  disabled={!isStepValid() || saving}
                  className="py-4 text-[16px] font-gerat font-bold"
                >
                  {saving
                    ? "Saving…"
                    : profileCompletionSummary?.skills?.isComplete
                      ? "Finish setup"
                      : "Go to dashboard"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Terms of Use Modal */}
      <LegalModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        title="Terms of Use"
      >
        <TermsContent initialTab="krafter" />
      </LegalModal>

      {/* Privacy Policy Modal */}
      <LegalModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        title="Privacy Policy"
      >
        <PrivacyContent />
      </LegalModal>
    </main>
  );
};

export default Page;
