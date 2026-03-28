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
  IdCard,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useProfileStore } from "@/store/useProfileStore";
import toast from "react-hot-toast";
import Loader from "@/components/ui/loader";
import { getServiceSkillGroups } from "@/lib/api/services";
import {
  getVerificationDraft,
  getVerificationMyStatus,
  saveVerificationDraft,
  patchVerificationDraft,
  shouldRedirectToDiditKyc,
  shouldRouteToKrafterProfileOnboarding,
} from "@/lib/api/verification";
import { isValidEmail, isNotEmpty, isNumeric } from "@/utils/validation";
import { Checkbox } from "@/components/ui/Checkbox";
import { LegalModal } from "@/components/ui/LegalModal";
import { TermsContent } from "@/components/ui/TermsContent";
import { PrivacyContent } from "@/components/ui/PrivacyContent";

const GOVERNMENT_ID_TYPE_TO_API: Record<string, string> = {
  passport: "passport",
  "drivers-license": "driver_license",
  "national-id": "national_id",
  "residence-permit": "national_id",
};

const API_TO_DOCUMENT_TYPE: Record<string, string> = {
  passport: "passport",
  driver_license: "drivers-license",
  national_id: "national-id",
};

function mapWorkingAsToEmploymentStatus(
  workingAs: string,
): "SELF_EMPLOYED" | "FREELANCING" {
  return workingAs === "contractor" || workingAs === "company-employee"
    ? "FREELANCING"
    : "SELF_EMPLOYED";
}

function omitUndefinedRecord(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as Record<string, unknown>;
}

/** Try to turn a remote or blob URL into a File for multipart submit (may fail on CORS). */
async function urlToFile(url: string, filename: string): Promise<File | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type || "image/jpeg" });
  } catch {
    return null;
  }
}

const DRAFT_CONFLICT_MESSAGE =
  "Saving a draft isn't available while verification is pending or your profile is already verified.";

/** ISO 3166-1 alpha-2 codes only — backend expects max 2 chars.
 * Krafter verification is currently restricted to Germany.
 */
const COUNTRY_OF_RESIDENCE_OPTIONS = [{ value: "DE", label: "Germany" }];

const GERMAN_CITY_OPTIONS = [
  { value: "Berlin", label: "Berlin" },
  { value: "Hamburg", label: "Hamburg" },
  { value: "München", label: "München" },
  { value: "Köln", label: "Köln" },
  { value: "Frankfurt am Main", label: "Frankfurt am Main" },
  { value: "Stuttgart", label: "Stuttgart" },
  { value: "Düsseldorf", label: "Düsseldorf" },
  { value: "Dortmund", label: "Dortmund" },
  { value: "Essen", label: "Essen" },
  { value: "Leipzig", label: "Leipzig" },
  { value: "Bremen", label: "Bremen" },
  { value: "Dresden", label: "Dresden" },
  { value: "Hannover", label: "Hannover" },
  { value: "Nürnberg", label: "Nürnberg" },
  { value: "Duisburg", label: "Duisburg" },
  { value: "Bochum", label: "Bochum" },
  { value: "Wuppertal", label: "Wuppertal" },
  { value: "Bielefeld", label: "Bielefeld" },
  { value: "Bonn", label: "Bonn" },
  { value: "Münster", label: "Münster" },
  { value: "Karlsruhe", label: "Karlsruhe" },
  { value: "Mannheim", label: "Mannheim" },
  { value: "Augsburg", label: "Augsburg" },
  { value: "Wiesbaden", label: "Wiesbaden" },
  { value: "Gelsenkirchen", label: "Gelsenkirchen" },
  { value: "Mönchengladbach", label: "Mönchengladbach" },
  { value: "Braunschweig", label: "Braunschweig" },
  { value: "Chemnitz", label: "Chemnitz" },
  { value: "Kiel", label: "Kiel" },
  { value: "Aachen", label: "Aachen" },
  { value: "Magdeburg", label: "Magdeburg" },
  { value: "Freiburg im Breisgau", label: "Freiburg im Breisgau" },
  { value: "Krefeld", label: "Krefeld" },
  { value: "Lübeck", label: "Lübeck" },
  { value: "Oberhausen", label: "Oberhausen" },
  { value: "Erfurt", label: "Erfurt" },
  { value: "Mainz", label: "Mainz" },
  { value: "Rostock", label: "Rostock" },
  { value: "Kassel", label: "Kassel" },
  { value: "Hagen", label: "Hagen" },
  { value: "Saarbrücken", label: "Saarbrücken" },
  { value: "Hamm", label: "Hamm" },
  { value: "Mülheim an der Ruhr", label: "Mülheim an der Ruhr" },
  { value: "Ludwigshafen am Rhein", label: "Ludwigshafen am Rhein" },
  { value: "Oldenburg", label: "Oldenburg" },
  { value: "Osnabrück", label: "Osnabrück" },
  { value: "Leverkusen", label: "Leverkusen" },
  { value: "Heidelberg", label: "Heidelberg" },
  { value: "Darmstadt", label: "Darmstadt" },
  { value: "Solingen", label: "Solingen" },
  { value: "Herne", label: "Herne" },
  { value: "Neuss", label: "Neuss" },
  { value: "Regensburg", label: "Regensburg" },
  { value: "Paderborn", label: "Paderborn" },
  { value: "Ingolstadt", label: "Ingolstadt" },
  { value: "Offenbach am Main", label: "Offenbach am Main" },
  { value: "Würzburg", label: "Würzburg" },
  { value: "Ulm", label: "Ulm" },
  { value: "Heilbronn", label: "Heilbronn" },
  { value: "Pforzheim", label: "Pforzheim" },
  { value: "Wolfsburg", label: "Wolfsburg" },
  { value: "Göttingen", label: "Göttingen" },
  { value: "Bottrop", label: "Bottrop" },
  { value: "Reutlingen", label: "Reutlingen" },
  { value: "Koblenz", label: "Koblenz" },
  { value: "Bremerhaven", label: "Bremerhaven" },
  { value: "Bergisch Gladbach", label: "Bergisch Gladbach" },
  { value: "Jena", label: "Jena" },
  { value: "Remscheid", label: "Remscheid" },
  { value: "Erlangen", label: "Erlangen" },
  { value: "Moers", label: "Moers" },
  { value: "Siegen", label: "Siegen" },
  { value: "Hildesheim", label: "Hildesheim" },
  { value: "Salzgitter", label: "Salzgitter" },
];

const Page = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;
  const [skipDocumentUpload, setSkipDocumentUpload] = useState(false);
  const selfieCameraInputRef = useRef<HTMLInputElement>(null);
  const selfieGalleryInputRef = useRef<HTMLInputElement>(null);
  const [showSelfieSourcePicker, setShowSelfieSourcePicker] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isSubmittingVerification, setIsSubmittingVerification] =
    useState(false);
  const [primaryTradeOptions, setPrimaryTradeOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [verificationDraftId, setVerificationDraftId] = useState<string | null>(
    null,
  );
  const [isLoadingDraft, setIsLoadingDraft] = useState(true);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [restoredGovernmentIdDocumentUrl, setRestoredGovernmentIdDocumentUrl] =
    useState<string | null>(null);
  const [restoredProfilePhotoUrl, setRestoredProfilePhotoUrl] = useState<
    string | null
  >(null);
  const draftRestoreToastShown = useRef(false);
  const { submitVerification } = useProfileStore();
  const { user, isLoading } = useAuthStore();
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  useEffect(() => {
    const storedName =
      typeof window !== "undefined"
        ? localStorage.getItem("kraftigo_user_fullName") || ""
        : "";

    setFormData((prev) => ({
      ...prev,
      fullName: prev.fullName || user?.fullName || storedName,
      email: prev.email || user?.email || "",
    }));
  }, [user?.fullName, user?.email]);

  useEffect(() => {
    const fetchSkillGroups = async () => {
      try {
        const groups = await getServiceSkillGroups();
        const mapped = groups
          .map((group) => ({
            value: group.category.id,
            label: group.category.name,
          }))
          .filter((option) => option.value && option.label);
        setPrimaryTradeOptions(mapped);
      } catch (error) {
        toast.error("Failed to load primary trade categories");
      }
    };

    fetchSkillGroups();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoadingDraft(true);
      try {
        let myStatus = null as Awaited<
          ReturnType<typeof getVerificationMyStatus>
        > | null;
        try {
          myStatus = await getVerificationMyStatus();
        } catch {
          /* proceed with draft if status unavailable */
        }
        if (cancelled) return;
        if (shouldRedirectToDiditKyc(myStatus)) {
          router.replace("/krafter/kyc-welcome");
          return;
        }
        if (shouldRouteToKrafterProfileOnboarding(myStatus)) {
          router.replace("/krafter/profile-completion");
          return;
        }

        const res = await getVerificationDraft();
        if (cancelled) return;
        setVerificationDraftId(res.draftId);

        const p = res.payload;
        if (!p || typeof p !== "object" || Object.keys(p).length === 0) {
          return;
        }

        const extRaw = p.extensions as Record<string, unknown> | undefined;
        const ext = extRaw?.krafterVerification as
          | Record<string, unknown>
          | undefined;

        const apiGovType = p.governmentIdType as string | undefined;
        const documentTypeFromApi =
          (apiGovType && API_TO_DOCUMENT_TYPE[apiGovType]) ||
          (ext?.documentType as string | undefined) ||
          "";

        const emp = p.employmentStatus as string | undefined;
        let workingAs = (ext?.workingAs as string) || "";
        if (!workingAs && emp === "FREELANCING") workingAs = "contractor";
        if (!workingAs && emp === "SELF_EMPLOYED") workingAs = "self-employed";

        const profileUrl =
          (p.idCardUrl as string | undefined) ||
          (p.profilePhotoUrl as string | undefined);

        setFormData((prev) => ({
          ...prev,
          fullName: (p.fullName as string) ?? prev.fullName,
          city: (p.baseCity as string) ?? prev.city,
          postal: (p.postalCode as string) ?? prev.postal,
          country: ((p.countryOfResidence as string) || prev.country || "DE")
            .toUpperCase()
            .slice(0, 2),
          documentType: documentTypeFromApi || prev.documentType,
          trade:
            (p.primarySkillCategoryId as string) ??
            (ext?.trade as string) ??
            prev.trade,
          workingAs: workingAs || prev.workingAs,
          businessRegistrationNumber:
            (ext?.businessRegistrationNumber as string) ??
            prev.businessRegistrationNumber,
          vatId: (ext?.vatId as string) ?? prev.vatId,
          term1Accepted:
            typeof ext?.term1Accepted === "boolean"
              ? ext.term1Accepted
              : prev.term1Accepted,
          term2Accepted:
            typeof ext?.term2Accepted === "boolean"
              ? ext.term2Accepted
              : prev.term2Accepted,
          email: (ext?.email as string) ?? prev.email,
          selfieImage: profileUrl ?? prev.selfieImage,
        }));

        const gUrl = p.governmentIdDocumentUrl as string | undefined;
        if (gUrl) setRestoredGovernmentIdDocumentUrl(gUrl);
        if (profileUrl) setRestoredProfilePhotoUrl(profileUrl);

        const skipped =
          typeof p.idCardSkipped === "boolean"
            ? p.idCardSkipped
            : typeof ext?.skipDocumentUpload === "boolean"
              ? ext.skipDocumentUpload
              : undefined;
        if (typeof skipped === "boolean") setSkipDocumentUpload(skipped);

        const step = ext?.currentStep;
        if (typeof step === "number" && step >= 1 && step <= 6) {
          setCurrentStep(step);
        }

        const hadDraftData =
          Object.keys(p).filter((k) => k !== "extensions").length > 0 ||
          (ext && Object.keys(ext).length > 0);
        if (hadDraftData && !draftRestoreToastShown.current) {
          draftRestoreToastShown.current = true;
          toast.success("Restored your saved draft");
        }
      } catch (e: unknown) {
        const err = e as { response?: { status?: number } };
        if (err.response?.status === 409) {
          toast.error(DRAFT_CONFLICT_MESSAGE);
        }
      } finally {
        if (!cancelled) setIsLoadingDraft(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, router]);

  // Form data state
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    term1Accepted: false,
    term2Accepted: false,
    country: "DE",
    city: "",
    postal: "",
    documentType: "",
    idDocument: null as File | null,
    trade: "",
    workingAs: "",
    businessRegistrationNumber: "",
    vatId: "",
    selfieImage: null as string | null,
    selfieFile: null as File | null,
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [citySearch, setCitySearch] = useState("");

  const handleInputChange = (
    field: string,
    value: string | boolean | File | null,
  ) => {
    // Numeric-only fields restriction
    const numericFields = ["postal", "businessRegistrationNumber"];
    if (numericFields.includes(field) && typeof value === "string") {
      if (value !== "" && !/^\d+$/.test(value)) return;
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Check if current step is valid
  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return true; // Intro step is always valid
      case 2:
        return (
          isNotEmpty(formData.fullName) &&
          isNotEmpty(formData.email) &&
          isValidEmail(formData.email) &&
          formData.term1Accepted !== false &&
          formData.term2Accepted !== false
        );
      case 4:
        const hasLocationDetails =
          isNotEmpty(formData.country) &&
          isNotEmpty(formData.city) &&
          isNotEmpty(formData.postal) &&
          isNumeric(formData.postal);
        const hasIdDoc =
          !!formData.idDocument || !!restoredGovernmentIdDocumentUrl;
        if (skipDocumentUpload) return hasLocationDetails;
        return (
          hasLocationDetails && isNotEmpty(formData.documentType) && hasIdDoc
        );
      case 5:
        const isBasicValid =
          isNotEmpty(formData.trade) && isNotEmpty(formData.workingAs);
        const isRegisteredBusiness =
          formData.workingAs === "registered-business";
        const isBusinessFieldsValid =
          !isRegisteredBusiness ||
          (isNotEmpty(formData.businessRegistrationNumber) &&
            isNumeric(formData.businessRegistrationNumber) &&
            isNotEmpty(formData.vatId));
        return isBasicValid && isBusinessFieldsValid;
      case 6:
        return true;
      default:
        return false;
    }
  };

  // Navigate to next step
  const handleNext = async () => {
    if (currentStep < totalSteps) {
      if (currentStep === 2) {
        await handleSubmit();
      } else {
        setCurrentStep(currentStep + 1);
      }
    } else {
      // Verification onboarding is done; continue into profile completion flow
      router.push("/krafter/profile-completion");
    }
  };

  const handleSkip = () => {
    router.push("/krafter/profile-completion");
  };

  // Navigate to previous step
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  // Submit form
  const handleSubmit = async () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("kraftigo_tasker_fullName", formData.fullName);
    }
    setCurrentStep(4);
  };

  const buildVerificationDraftPayload = (): Record<string, unknown> => {
    const employmentStatus = mapWorkingAsToEmploymentStatus(
      formData.workingAs || "self-employed",
    );
    const govApi = formData.documentType
      ? GOVERNMENT_ID_TYPE_TO_API[formData.documentType]
      : undefined;

    const krafterVerification = omitUndefinedRecord({
      trade: formData.trade || undefined,
      workingAs: formData.workingAs || undefined,
      businessRegistrationNumber:
        formData.businessRegistrationNumber || undefined,
      vatId: formData.vatId || undefined,
      documentType: formData.documentType || undefined,
      email: formData.email || undefined,
      currentStep,
      skipDocumentUpload,
      term1Accepted: formData.term1Accepted,
      term2Accepted: formData.term2Accepted,
    });

    const body: Record<string, unknown> = omitUndefinedRecord({
      fullName: formData.fullName || undefined,
      baseCity: formData.city || undefined,
      postalCode: formData.postal || undefined,
      countryOfResidence: (formData.country || "DE").toUpperCase().slice(0, 2),
      employmentStatus,
      idCardSkipped: skipDocumentUpload,
      skillDocuments: [],
      portfolioLinks: [],
      governmentIdType: govApi,
      primarySkillCategoryId: formData.trade || undefined,
      extensions: { krafterVerification },
    });

    if (restoredGovernmentIdDocumentUrl && !formData.idDocument) {
      body.governmentIdDocumentUrl = restoredGovernmentIdDocumentUrl;
    }
    if (restoredProfilePhotoUrl && !formData.selfieFile) {
      body.idCardUrl = restoredProfilePhotoUrl;
    }

    return body;
  };

  const handleSaveDraft = async () => {
    try {
      setIsSavingDraft(true);
      const body = buildVerificationDraftPayload();
      const res = verificationDraftId
        ? await patchVerificationDraft(verificationDraftId, body)
        : await saveVerificationDraft(body);
      if (res.draftId) setVerificationDraftId(res.draftId);
      toast.success("Draft saved");
    } catch (e: unknown) {
      const err = e as {
        response?: { status?: number; data?: { message?: string } };
      };
      if (err.response?.status === 409) {
        toast.error(DRAFT_CONFLICT_MESSAGE);
      } else {
        toast.error(
          err.response?.data?.message || "Could not save draft. Try again.",
        );
      }
    } finally {
      setIsSavingDraft(false);
    }
  };

  const openSelfieSourcePicker = () => {
    setShowSelfieSourcePicker(true);
  };

  const handleSelfieChange = (file: File | null) => {
    if (!file) return;
    setRestoredProfilePhotoUrl(null);
    const previewUrl = URL.createObjectURL(file);
    handleInputChange("selfieImage", previewUrl);
    handleInputChange("selfieFile", file);
    setShowSelfieSourcePicker(false);
  };

  const handleVerificationSubmission = async () => {
    const blocker = getVerificationSubmitBlocker();
    if (blocker) {
      toast.error(blocker);
      if (!formData.idDocument && !restoredGovernmentIdDocumentUrl) {
        redirectToLegalIdentityForId();
      } else if (!isNotEmpty(formData.documentType)) {
        redirectToLegalIdentityForId();
      }
      return;
    }

    let idFile = formData.idDocument;
    if (!idFile && restoredGovernmentIdDocumentUrl) {
      idFile = await urlToFile(
        restoredGovernmentIdDocumentUrl,
        "government-id.jpg",
      );
    }
    if (!idFile || idFile.size === 0) {
      toast.error(
        "Could not load your saved government ID. Please upload it again on Legal Identity.",
      );
      redirectToLegalIdentityForId();
      return;
    }

    let selfieF = formData.selfieFile;
    if (!selfieF && restoredProfilePhotoUrl) {
      selfieF = await urlToFile(restoredProfilePhotoUrl, "profile-photo.jpg");
    }
    if (!selfieF || selfieF.size === 0) {
      openSelfieSourcePicker();
      toast.error(
        "Could not load your saved selfie. Please take or choose a photo again.",
      );
      return;
    }

    const employmentStatus = mapWorkingAsToEmploymentStatus(
      formData.workingAs || "self-employed",
    );

    const data = new FormData();
    data.append(
      "governmentIdType",
      GOVERNMENT_ID_TYPE_TO_API[formData.documentType] || "national_id",
    );
    data.append("governmentIdNumber", "");
    data.append("governmentIdDocument", idFile);
    data.append("skillDocuments", JSON.stringify([]));
    data.append("baseCity", formData.city);
    data.append("postalCode", formData.postal);
    data.append("primarySkillCategoryId", formData.trade);
    if (!formData.trade) {
      toast.error("Please select your primary trade before submitting.");
      return;
    }
    const countryCode = (formData.country || "DE").toUpperCase().slice(0, 2);
    data.append("countryOfResidence", countryCode);
    data.append("profilePhoto", selfieF);
    data.append("employmentStatus", employmentStatus);

    try {
      setIsSubmittingVerification(true);
      await submitVerification(data);
      setVerificationDraftId(null);
      toast.success("Verification submitted successfully!");
      router.push("/krafter/kyc-welcome");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to submit verification",
      );
    } finally {
      setIsSubmittingVerification(false);
    }
  };

  const selectedTradeLabel =
    primaryTradeOptions.find((option) => option.value === formData.trade)
      ?.label || "Not selected";

  const documentTypeLabel =
    (
      {
        passport: "Passport",
        "national-id": "National Identity Card",
        "drivers-license": "Driver's License",
        "residence-permit": "Residence Permit",
      } as Record<string, string>
    )[formData.documentType] || "Not selected";

  const countryResidenceLabel =
    COUNTRY_OF_RESIDENCE_OPTIONS.find((c) => c.value === formData.country)
      ?.label ||
    formData.country ||
    "-";

  /** Final submit always hits POST /api/verification/submit (not draft). Require ID + type + selfie. */
  const getVerificationSubmitBlocker = (): string | null => {
    const hasGovIdFileOrUrl =
      !!formData.idDocument || !!restoredGovernmentIdDocumentUrl;
    if (!hasGovIdFileOrUrl) {
      return "Add your government ID on the Legal Identity step before submitting.";
    }
    if (!isNotEmpty(formData.documentType)) {
      return "Select your government ID document type.";
    }
    const hasSelfieFileOrUrl =
      !!formData.selfieFile || !!restoredProfilePhotoUrl;
    if (!hasSelfieFileOrUrl) {
      return "Add a selfie photo before submitting.";
    }
    return null;
  };

  const redirectToLegalIdentityForId = () => {
    setSkipDocumentUpload(false);
    setCurrentStep(4);
  };

  return (
    <main className="relative w-full min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {isLoading || isLoadingDraft ? (
        <Loader />
      ) : (
        <div className="w-full max-w-2xl mx-auto min-h-screen flex flex-col py-8">
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
            {/* Step 1: Intro */}
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
                  <div className="w-full relative h-62.5 rounded-2xl overflow-hidden mb-4">
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
                    <div key={i} className="flex items-center gap-4">
                      {item.icon}
                      <div className="flex-1">
                        <h4 className="text-[16px] font-gerat font-bold text-[#1D2939]">
                          {item.title}
                        </h4>
                        <p className="text-[13px] font-poppins text-gray-500">
                          {item.desc}
                        </p>
                      </div>
                      <div className="text-blue-600">
                        <CheckCircle2
                          size={24}
                          className="fill-blue-600 text-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Basic Info */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-gerat font-bold mb-8">
                  Tell Us About You
                </h1>
                <Input
                  label="Enter Your Full Name (Exactly as on ID)"
                  placeholder="Enter Full Name"
                  value={formData.fullName}
                  onChange={(value) => handleInputChange("fullName", value)}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={() => {}}
                  error={
                    formData.email && !isValidEmail(formData.email)
                      ? "Please enter a valid email"
                      : ""
                  }
                  disabled
                  required
                />
                <div>
                  <Checkbox
                    checked={formData.term1Accepted}
                    onChange={(checked: boolean) =>
                      handleInputChange("term1Accepted", checked)
                    }
                    labelNode={
                      <span className="text-[14px] font-poppins text-gray-700 leading-relaxed">
                        By continuing you accept the{" "}
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
                        </button>
                      </span>
                    }
                  />

                  <Checkbox
                    checked={formData.term2Accepted}
                    onChange={(checked: boolean) =>
                      handleInputChange("term2Accepted", checked)
                    }
                    labelNode={
                      <span className="text-[14px] font-poppins text-gray-700 leading-relaxed">
                        By continuing you accept the{" "}
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
                        </button>
                      </span>
                    }
                  />
                </div>
                {/* Terms of Use Modal */}
                <LegalModal
                  isOpen={showTermsModal}
                  onClose={() => setShowTermsModal(false)}
                  title="Terms of Use"
                >
                  <TermsContent />
                </LegalModal>

                {/* Privacy Policy Modal — wire up PrivacyContent when ready */}
                <LegalModal
                  isOpen={showPrivacyModal}
                  onClose={() => setShowPrivacyModal(false)}
                  title="Privacy Policy"
                >
                  <PrivacyContent />
                </LegalModal>
              </div>
            )}

            {/* Step 4: legal identity*/}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-gerat font-bold mb-8">
                  Legal Identity
                </h1>
                <Select
                  label="Country of residence"
                  placeholder="Select country"
                  value={formData.country}
                  onChange={() => {
                    // Country is fixed to Germany in this flow.
                    handleInputChange("country", "DE");
                  }}
                  disabled
                  options={COUNTRY_OF_RESIDENCE_OPTIONS}
                  required
                />
                <Input
                  label="City"
                  placeholder="Start typing to search cities in Germany"
                  value={citySearch || formData.city}
                  onChange={(value) => {
                    setCitySearch(value);
                    // Clear selected city if user starts a new search
                    if (value && value !== formData.city) {
                      handleInputChange("city", "");
                    }
                  }}
                  required
                />
                {(citySearch || "").trim() && (
                  <div className="max-h-40 overflow-y-auto bg-[#F6F6F6] rounded-xl border border-[#0000001A] px-3 py-2 space-y-1">
                    {GERMAN_CITY_OPTIONS.filter((c) =>
                      c.label
                        .toLowerCase()
                        .includes((citySearch || "").toLowerCase()),
                    ).map((city) => (
                      <button
                        key={city.value}
                        type="button"
                        onClick={() => {
                          handleInputChange("city", city.value);
                          setCitySearch("");
                        }}
                        className={`w-full text-left text-[14px] font-poppins px-2 py-1 rounded-lg hover:bg-white ${
                          formData.city === city.value
                            ? "bg-white font-semibold"
                            : ""
                        }`}
                      >
                        {city.label}
                      </button>
                    ))}
                  </div>
                )}
                <Input
                  label="Postal Code"
                  placeholder="88019"
                  value={formData.postal}
                  onChange={(value) => handleInputChange("postal", value)}
                  error={
                    formData.postal && !isNumeric(formData.postal)
                      ? "Numbers only"
                      : ""
                  }
                  required
                />

                {!skipDocumentUpload && (
                  <>
                    {restoredGovernmentIdDocumentUrl &&
                      !formData.idDocument && (
                        <p className="text-[13px] font-poppins text-gray-600 -mt-2">
                          A government ID is already saved on your draft. Upload
                          a new file to replace it.
                        </p>
                      )}
                    <Select
                      label="Select document type"
                      placeholder="Select"
                      value={formData.documentType}
                      onChange={(value) =>
                        handleInputChange("documentType", value)
                      }
                      options={[
                        {
                          value: "passport",
                          label: "Passport (International or National)",
                        },
                        {
                          value: "national-id",
                          label: "National Identity Card (EU/EEA)",
                        },
                        {
                          value: "drivers-license",
                          label: "Driver's License (Plastic Card, EU)",
                        },
                        {
                          value: "residence-permit",
                          label: "Residence Permit (EU/EEA/Switzerland)",
                        },
                      ]}
                      required
                    />

                    <div className="space-y-2">
                      <p className="text-[14px] font-mabry text-gray-700">
                        Upload a valid ID card
                      </p>
                      <label className="w-full rounded-2xl border border-dashed border-gray-300 bg-[#F6F6F6] p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-brand-orange transition-colors">
                        <IdCard size={22} className="text-gray-500 mb-3" />
                        <span className="text-[13px] font-poppins text-gray-600">
                          {formData.idDocument
                            ? formData.idDocument.name
                            : "Upload or take a photo of your valid Id Card"}
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*,application/pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            if (file) setRestoredGovernmentIdDocumentUrl(null);
                            handleInputChange("idDocument", file);
                          }}
                        />
                      </label>
                    </div>

                    <div className="text-[13px] font-poppins text-gray-700">
                      <p className="font-semibold mb-2">Accepted ID Cards:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Passport (International or National)</li>
                        <li>National Identity Card (EU/EEA)</li>
                        <li>Driver&apos;s License (Plastic Card, EU)</li>
                        <li>Residence Permit (EU/EEA/Switzerland)</li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 5: Trade & Work Eligibility */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-gerat font-bold mb-8">
                  Trade & Work Eligibility
                </h1>
                <Select
                  label="Primary Trade"
                  placeholder="Select"
                  value={formData.trade}
                  onChange={(value) => handleInputChange("trade", value)}
                  options={primaryTradeOptions}
                  required
                />
                <Select
                  label="Are you working as:"
                  placeholder="Self employed / freelancer"
                  value={formData.workingAs}
                  onChange={(value) => handleInputChange("workingAs", value)}
                  options={[
                    {
                      value: "self-employed",
                      label: "Self employed / freelancer",
                    },
                    { value: "company-employee", label: "Company employee" },
                    { value: "contractor", label: "Contractor" },
                    { value: "business-owner", label: "Business owner" },
                    {
                      value: "registered-business",
                      label: "Registered business",
                    },
                  ]}
                  required
                />

                {/* Conditional fields for Registered Business */}
                {formData.workingAs === "registered-business" && (
                  <>
                    <Input
                      label="Business registration number"
                      placeholder="Enter registration number"
                      value={formData.businessRegistrationNumber}
                      onChange={(value) =>
                        handleInputChange("businessRegistrationNumber", value)
                      }
                      error={
                        formData.businessRegistrationNumber &&
                        !isNumeric(formData.businessRegistrationNumber)
                          ? "Numbers only"
                          : ""
                      }
                      required
                    />
                    <Input
                      label="VAT ID"
                      placeholder="Enter VAT ID"
                      value={formData.vatId}
                      onChange={(value) => handleInputChange("vatId", value)}
                      required
                    />
                  </>
                )}
              </div>
            )}

            {/* Step 6: Take a Selfie */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-gerat font-bold mb-2">
                  Add up your selfie to your profile
                </h1>
                <p className="text-[14px] font-mabry text-gray-600 mb-8">
                  We use your selfie to compare with your passport photo
                </p>

                {/* Selfie Illustration Placeholder */}
                <div className="flex justify-center mb-8">
                  <div className="w-48 h-48 lg:w-64 lg:h-64 bg-gray-100 rounded-3xl flex items-center justify-center border-2 border-dashed border-gray-300 group hover:border-brand-orange transition-colors">
                    {formData.selfieImage ? (
                      <Image
                        src={formData.selfieImage}
                        alt="selfie preview"
                        width={200}
                        height={200}
                        className="w-48 h-48 lg:w-64 lg:h-64 object-cover rounded-3xl"
                      />
                    ) : (
                      <Image
                        src="/avatar.svg"
                        alt="selfie placeholder"
                        width={200}
                        height={200}
                        className="w-32 h-32 lg:w-48 lg:h-48 opacity-50 group-hover:opacity-100 transition-opacity"
                      />
                    )}
                  </div>
                </div>
                <input
                  ref={selfieCameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={(e) =>
                    handleSelfieChange(e.target.files?.[0] || null)
                  }
                />
                <input
                  ref={selfieGalleryInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    handleSelfieChange(e.target.files?.[0] || null)
                  }
                />

                {/* Instructions Box */}
                <div className=" p-2 space-y-3">
                  <p className="text-[13px] font-poppins font-semibold text-gray-800">
                    Make sure you have:
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-brand-orange bg-brand-yellow px-3 py-1 rounded-full  font-bold text-[14px] mt-0.5">
                        1
                      </span>
                      <div>
                        <p className="text-[13px] font-poppins font-semibold text-gray-800">
                          Good lighting
                        </p>
                        <p className="text-[12px] font-poppins text-gray-600">
                          Make sure you in a well lit area and both ears are
                          uncovered
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-brand-orange bg-brand-yellow px-3 py-1 rounded-full font-bold text-[14px] mt-0.5">
                        2
                      </span>
                      <div>
                        <p className="text-[13px] font-poppins font-semibold text-gray-800">
                          Look straight
                        </p>
                        <p className="text-[12px] font-poppins text-gray-600">
                          Hold your phone at eye level and look straight into
                          the camera
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button className="fixed bottom-40 right-4 sm:right-6 lg:right-8 w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center text-xl font-bold border border-gray-200 hover:shadow-xl transition-shadow">
            ?
          </button>

          <div className="mt-auto space-y-4">
            {currentStep === 2 && (
              <div className="text-center text-[14px] font-poppins">
                <span className="text-brand-orange">
                  Already have an account?{" "}
                </span>
                <button
                  onClick={() => router.push("/tasker/login")}
                  className="text-brand-blue font-semibold hover:underline"
                >
                  Sign In
                </button>
              </div>
            )}

            <div>
              {currentStep === 4 && !skipDocumentUpload ? (
                <>
                  <div className="grid grid-cols-2 gap-3 mt-8">
                    <Button
                      variant="outline"
                      onClick={() => void handleSaveDraft()}
                      disabled={isSavingDraft}
                      className="py-4 text-[16px] font-gerat font-bold"
                    >
                      {isSavingDraft ? "Saving…" : "Save draft"}
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleNext}
                      fullWidth
                      disabled={!isStepValid()}
                      className="py-4 text-[16px] font-gerat font-bold"
                    >
                      Continue
                    </Button>
                  </div>
                  <button
                    onClick={() => {
                      setSkipDocumentUpload(true);
                      toast(
                        "You can upload your ID later. Continue with location details.",
                      );
                    }}
                    className="w-full text-center text-[14px] font-mabry text-gray-700 hover:text-brand-orange mt-4 py-2 font-bold transition-colors"
                  >
                    Skip
                  </button>
                </>
              ) : (currentStep === 4 && skipDocumentUpload) ||
                currentStep === 5 ? (
                <div className="grid grid-cols-2 gap-3 mt-8">
                  <Button
                    variant="outline"
                    onClick={() => void handleSaveDraft()}
                    disabled={isSavingDraft}
                    className="py-4 text-[16px] font-gerat font-bold"
                  >
                    {isSavingDraft ? "Saving…" : "Save draft"}
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleNext}
                    fullWidth
                    disabled={!isStepValid()}
                    className="py-4 text-[16px] font-gerat font-bold"
                  >
                    Continue
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    variant="primary"
                    onClick={() => {
                      if (currentStep !== 6) {
                        handleNext();
                        return;
                      }
                      if (!formData.selfieImage) {
                        openSelfieSourcePicker();
                        return;
                      }
                      const submitBlocker = getVerificationSubmitBlocker();
                      if (submitBlocker) {
                        toast.error(submitBlocker);
                        if (
                          !formData.idDocument &&
                          !restoredGovernmentIdDocumentUrl
                        ) {
                          redirectToLegalIdentityForId();
                        } else if (!isNotEmpty(formData.documentType)) {
                          redirectToLegalIdentityForId();
                        }
                        return;
                      }
                      setShowReviewModal(true);
                    }}
                    fullWidth
                    disabled={!isStepValid() || isSubmittingVerification}
                    className="py-4 text-[16px] font-gerat font-bold mt-8"
                  >
                    {currentStep === 1
                      ? "Get Started"
                      : currentStep === 6
                        ? isSubmittingVerification
                          ? "Submitting..."
                          : formData.selfieImage
                            ? "Submit Verification"
                            : "Open camera"
                        : "Continue"}
                  </Button>

                  {currentStep === 6 && (
                    <button
                      onClick={handleSkip}
                      className="w-full text-center text-[14px] font-mabry text-gray-700 hover:text-brand-orange mt-4 py-2 font-bold transition-colors"
                    >
                      Skip
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {showSelfieSourcePicker && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-4 space-y-3">
            <h3 className="text-[16px] font-gerat font-bold text-gray-900">
              Choose selfie source
            </h3>
            <Button
              variant="primary"
              fullWidth
              onClick={() => selfieCameraInputRef.current?.click()}
            >
              Use live camera
            </Button>
            <Button
              variant="outline"
              fullWidth
              onClick={() => selfieGalleryInputRef.current?.click()}
            >
              Pick from device
            </Button>
            <button
              className="w-full text-center text-[14px] font-mabry text-gray-600 py-2"
              onClick={() => setShowSelfieSourcePicker(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {showReviewModal && (
        <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            <h3 className="text-[18px] font-gerat font-bold text-gray-900">
              Review your details
            </h3>

            <div className="rounded-xl bg-[#F9FAFB] p-4 space-y-3 text-[13px] font-poppins text-gray-700">
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Full name</span>
                <span className="font-semibold text-right">
                  {formData.fullName || "-"}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Email</span>
                <span className="font-semibold text-right">
                  {formData.email || "-"}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Country</span>
                <span className="font-semibold text-right">
                  {countryResidenceLabel}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">City</span>
                <span className="font-semibold text-right">
                  {formData.city || "-"}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Postal code</span>
                <span className="font-semibold text-right">
                  {formData.postal || "-"}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Document type</span>
                <span className="font-semibold text-right">
                  {documentTypeLabel}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Document uploaded</span>
                <span className="font-semibold text-right">
                  {formData.idDocument ? formData.idDocument.name : "No"}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Primary trade</span>
                <span className="font-semibold text-right">
                  {selectedTradeLabel}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Work mode</span>
                <span className="font-semibold text-right">
                  {formData.workingAs || "-"}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">VAT ID</span>
                <span className="font-semibold text-right">
                  {formData.vatId || "-"}
                </span>
              </div>
            </div>

            {formData.selfieImage && (
              <div className="space-y-2">
                <p className="text-[13px] font-poppins text-gray-500">
                  Selfie preview
                </p>
                <div className="w-28 h-28 rounded-xl overflow-hidden border border-gray-200">
                  <Image
                    src={formData.selfieImage}
                    alt="selfie review"
                    width={112}
                    height={112}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-1">
              <Button
                variant="outline"
                fullWidth
                onClick={() => setShowReviewModal(false)}
              >
                Edit
              </Button>
              <Button
                variant="primary"
                fullWidth
                disabled={isSubmittingVerification}
                onClick={async () => {
                  await handleVerificationSubmission();
                  setShowReviewModal(false);
                }}
              >
                {isSubmittingVerification
                  ? "Submitting..."
                  : "Submit verification"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Page;
