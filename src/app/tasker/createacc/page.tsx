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
import { isNotEmpty } from "@/utils/validation";
import { Checkbox } from "@/components/ui/Checkbox";
import { LegalModal } from "@/components/ui/LegalModal";
import { TermsContent } from "@/components/ui/TermsContent";
import { PrivacyContent } from "@/components/ui/PrivacyContent";

// function omitUndefinedRecord(
//   obj: Record<string, unknown>,
// ): Record<string, unknown> {
//   return Object.fromEntries(
//     Object.entries(obj).filter(([, v]) => v !== undefined),
//   ) as Record<string, unknown>;
// }

/** Try to turn a remote or blob URL into a File for multipart submit (may fail on CORS). */
// async function urlToFile(url: string, filename: string): Promise<File | null> {
//   try {
//     const res = await fetch(url);
//     if (!res.ok) return null;
//     const blob = await res.blob();
//     return new File([blob], filename, { type: blob.type || "image/jpeg" });
//   } catch {
//     return null;
//   }
// }

// const DRAFT_CONFLICT_MESSAGE =
//   "Saving a draft isn't available while verification is pending or your profile is already verified.";

// /** ISO 3166-1 alpha-2 codes only — backend expects max 2 chars.
//  * Krafter verification is currently restricted to Germany.
//  */

const Page = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  // const [skipDocumentUpload, setSkipDocumentUpload] = useState(false);
  // const selfieCameraInputRef = useRef<HTMLInputElement>(null);
  // const selfieGalleryInputRef = useRef<HTMLInputElement>(null);
  // const [showSelfieSourcePicker, setShowSelfieSourcePicker] = useState(false);
  // const [showReviewModal, setShowReviewModal] = useState(false);
  // const [isSubmittingVerification, setIsSubmittingVerification] =
  //   useState(false);
  // const [verificationDraftId, setVerificationDraftId] = useState<string | null>(
  //   null,
  // );
  // const [isLoadingDraft, setIsLoadingDraft] = useState(true);
  // const [isSavingDraft, setIsSavingDraft] = useState(false);
  // const [restoredProfilePhotoUrl, setRestoredProfilePhotoUrl] = useState<
  //   string | null
  // >(null);
  // const draftRestoreToastShown = useRef(false);
  // const { submitVerification } = useProfileStore();
  const { user, isLoading } = useAuthStore();
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // useEffect(() => {
  //   const storedName =
  //     typeof window !== "undefined"
  //       ? localStorage.getItem("kraftigo_user_fullName") || ""
  //       : "";

  //   setFormData((prev) => ({
  //     ...prev,
  //     firstName: prev.firstName || user?.firstName || "",
  //     lastName: prev.lastName || user?.lastName || "",
  //     gender: prev.gender || user?.gender || "",
  //     dateOfBirth: prev.dateOfBirth || user?.dateOfBirth || "",
  //     nationality: prev.nationality || user?.nationality || "",
  //   }));
  // }, [user?.firstName, user?.lastName, user?.gender, user?.dateOfBirth, user?.nationality]);

  // useEffect(() => {
  //   const fetchSkillGroups = async () => {
  //     try {
  //       const groups = await getServiceSkillGroups();
  //       const mapped = groups
  //         .map((group) => ({
  //           value: group.category.id,
  //           label: group.category.name,
  //         }))
  //         .filter((option) => option.value && option.label);
  //       setPrimaryTradeOptions(mapped);
  //     } catch (error) {
  //       toast.error("Failed to load primary trade categories");
  //     }
  //   };

  //   fetchSkillGroups();
  // }, []);

  // useEffect(() => {
  //   let cancelled = false;
  //   (async () => {
  //     setIsLoadingDraft(true);
  //     try {
  //       let myStatus = null as Awaited<
  //         ReturnType<typeof getVerificationMyStatus>
  //       > | null;
  //       try {
  //         myStatus = await getVerificationMyStatus();
  //       } catch {
  //         /* proceed with draft if status unavailable */
  //       }
  //       if (cancelled) return;
  //       if (shouldRedirectToDiditKyc(myStatus)) {
  //         router.replace("/krafter/kyc-welcome");
  //         return;
  //       }
  //       if (shouldRouteToKrafterProfileOnboarding(myStatus)) {
  //         router.replace("/krafter/profile-completion");
  //         return;
  //       }

  //       const res = await getVerificationDraft();
  //       if (cancelled) return;
  //       setVerificationDraftId(res.draftId);

  //       const p = res.payload;
  //       if (!p || typeof p !== "object" || Object.keys(p).length === 0) {
  //         return;
  //       }

  //       const extRaw = p.extensions as Record<string, unknown> | undefined;
  //       const ext = extRaw?.krafterVerification as
  //         | Record<string, unknown>
  //         | undefined;

  //       const apiGovType = p.governmentIdType as string | undefined;
  //       const documentTypeFromApi =
  //         (apiGovType && API_TO_DOCUMENT_TYPE[apiGovType]) ||
  //         (ext?.documentType as string | undefined) ||
  //         "";

  //       const emp = p.employmentStatus as string | undefined;
  //       let workingAs = (ext?.workingAs as string) || "";
  //       if (!workingAs && emp === "FREELANCING") workingAs = "contractor";
  //       if (!workingAs && emp === "SELF_EMPLOYED") workingAs = "self-employed";

  //       const profileUrl =
  //         (p.idCardUrl as string | undefined) ||
  //         (p.profilePhotoUrl as string | undefined);

  //       setFormData((prev) => ({
  //         ...prev,
  //         fullName: (p.fullName as string) ?? prev.fullName,
  //         city: (p.baseCity as string) ?? prev.city,
  //         postal: (p.postalCode as string) ?? prev.postal,
  //         country: ((p.countryOfResidence as string) || prev.country || "DE")
  //           .toUpperCase()
  //           .slice(0, 2),
  //         documentType: documentTypeFromApi || prev.documentType,
  //         trade:
  //           (p.primarySkillCategoryId as string) ??
  //           (ext?.trade as string) ??
  //           prev.trade,
  //         workingAs: workingAs || prev.workingAs,
  //         businessRegistrationNumber:
  //           (ext?.businessRegistrationNumber as string) ??
  //           prev.businessRegistrationNumber,
  //         vatId: (ext?.vatId as string) ?? prev.vatId,
  //         termsAccepted:
  //           typeof ext?.termsAccepted === "boolean"
  //             ? ext.termsAccepted
  //             : prev.termsAccepted,

  //         email: (ext?.email as string) ?? prev.email,
  //         selfieImage: profileUrl ?? prev.selfieImage,
  //       }));

  //       const gUrl = p.governmentIdDocumentUrl as string | undefined;
  //       if (gUrl) setRestoredGovernmentIdDocumentUrl(gUrl);
  //       if (profileUrl) setRestoredProfilePhotoUrl(profileUrl);

  //       const skipped =
  //         typeof p.idCardSkipped === "boolean"
  //           ? p.idCardSkipped
  //           : typeof ext?.skipDocumentUpload === "boolean"
  //             ? ext.skipDocumentUpload
  //             : undefined;
  //       if (typeof skipped === "boolean") setSkipDocumentUpload(skipped);

  //       const step = ext?.currentStep;
  //       if (typeof step === "number" && step >= 1 && step <= 6) {
  //         setCurrentStep(step);
  //       }

  //       const hadDraftData =
  //         Object.keys(p).filter((k) => k !== "extensions").length > 0 ||
  //         (ext && Object.keys(ext).length > 0);
  //       if (hadDraftData && !draftRestoreToastShown.current) {
  //         draftRestoreToastShown.current = true;
  //         toast.success("Restored your saved draft");
  //       }
  //     } catch (e: unknown) {
  //       const err = e as { response?: { status?: number } };
  //       if (err.response?.status === 409) {
  //         toast.error(DRAFT_CONFLICT_MESSAGE);
  //       }
  //     } finally {
  //       if (!cancelled) setIsLoadingDraft(false);
  //     }
  //   })();
  //   return () => {
  //     cancelled = true;
  //   };
  // }, [user?.id, router]);

  // Form data state
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
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  // const [citySearch, setCitySearch] = useState("");

  const handleInputChange = (
    field: string,
    value: string | boolean | File | null,
  ) => {
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
          isNotEmpty(formData.firstName) &&
          isNotEmpty(formData.lastName) &&
          isNotEmpty(formData.gender) &&
          isNotEmpty(formData.dateOfBirth) &&
          isNotEmpty(formData.nationality) &&
          formData.termsAccepted !== false
        );
      case 3:
        return (
          isNotEmpty(formData.streetNo) &&
          isNotEmpty(formData.postCode) &&
          isNotEmpty(formData.city)
        );
      default:
        return false;
    }
  };

  // Navigate to next step
  const handleNext = async () => {
    if (currentStep < totalSteps) {
      if (currentStep === 3) {
        await handleSubmit();
      } else {
        setCurrentStep(currentStep + 1);
      }
    } else {
      // Verification onboarding is done; continue into profile completion flow
      router.push("/tasker/dashboard");
    }
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
      localStorage.setItem(
        "kraftigo_tasker_fullName",
        formData.firstName + " " + formData.lastName,
      );
    }
  };

  // const buildVerificationDraftPayload = (): Record<string, unknown> => {
  //   const employmentStatus = mapWorkingAsToEmploymentStatus(
  //     formData.workingAs || "self-employed",
  //   );
  //   const govApi = formData.documentType
  //     ? GOVERNMENT_ID_TYPE_TO_API[formData.documentType]
  //     : undefined;

  //   const krafterVerification = omitUndefinedRecord({
  //     trade: formData.trade || undefined,
  //     workingAs: formData.workingAs || undefined,
  //     businessRegistrationNumber:
  //       formData.businessRegistrationNumber || undefined,
  //     vatId: formData.vatId || undefined,
  //     documentType: formData.documentType || undefined,
  //     email: formData.email || undefined,
  //     currentStep,
  //     skipDocumentUpload,
  //     termsAccepted: formData.termsAccepted,
  //   });

  //   const body: Record<string, unknown> = omitUndefinedRecord({
  //     fullName: formData.fullName || undefined,
  //     baseCity: formData.city || undefined,
  //     postalCode: formData.postal || undefined,
  //     countryOfResidence: (formData.country || "DE").toUpperCase().slice(0, 2),
  //     employmentStatus,
  //     idCardSkipped: skipDocumentUpload,
  //     skillDocuments: [],
  //     portfolioLinks: [],
  //     governmentIdType: govApi,
  //     primarySkillCategoryId: formData.trade || undefined,
  //     extensions: { krafterVerification },
  //   });

  //   if (restoredGovernmentIdDocumentUrl && !formData.idDocument) {
  //     body.governmentIdDocumentUrl = restoredGovernmentIdDocumentUrl;
  //   }
  //   if (restoredProfilePhotoUrl && !formData.selfieFile) {
  //     body.idCardUrl = restoredProfilePhotoUrl;
  //   }

  //   return body;
  // };

  // const handleSaveDraft = async () => {
  //   try {
  //     setIsSavingDraft(true);
  //     const body = buildVerificationDraftPayload();
  //     const res = verificationDraftId
  //       ? await patchVerificationDraft(verificationDraftId, body)
  //       : await saveVerificationDraft(body);
  //     if (res.draftId) setVerificationDraftId(res.draftId);
  //     toast.success("Draft saved");
  //   } catch (e: unknown) {
  //     const err = e as {
  //       response?: { status?: number; data?: { message?: string } };
  //     };
  //     if (err.response?.status === 409) {
  //       toast.error(DRAFT_CONFLICT_MESSAGE);
  //     } else {
  //       toast.error(
  //         err.response?.data?.message || "Could not save draft. Try again.",
  //       );
  //     }
  //   } finally {
  //     setIsSavingDraft(false);
  //   }
  // };

  // const openSelfieSourcePicker = () => {
  //   setShowSelfieSourcePicker(true);
  // };

  // const handleSelfieChange = (file: File | null) => {
  //   if (!file) return;
  //   setRestoredProfilePhotoUrl(null);
  //   const previewUrl = URL.createObjectURL(file);
  //   handleInputChange("selfieImage", previewUrl);
  //   handleInputChange("selfieFile", file);
  //   setShowSelfieSourcePicker(false);
  // };

  // const handleVerificationSubmission = async () => {
  //   const blocker = getVerificationSubmitBlocker();
  //   if (blocker) {
  //     toast.error(blocker);
  //     if (!formData.idDocument && !restoredGovernmentIdDocumentUrl) {
  //       redirectToLegalIdentityForId();
  //     } else if (!isNotEmpty(formData.documentType)) {
  //       redirectToLegalIdentityForId();
  //     }
  //     return;
  //   }

  //   let idFile = formData.idDocument;
  //   if (!idFile && restoredGovernmentIdDocumentUrl) {
  //     idFile = await urlToFile(
  //       restoredGovernmentIdDocumentUrl,
  //       "government-id.jpg",
  //     );
  //   }
  //   if (!idFile || idFile.size === 0) {
  //     toast.error(
  //       "Could not load your saved government ID. Please upload it again on Legal Identity.",
  //     );
  //     redirectToLegalIdentityForId();
  //     return;
  //   }

  //   let selfieF = formData.selfieFile;
  //   if (!selfieF && restoredProfilePhotoUrl) {
  //     selfieF = await urlToFile(restoredProfilePhotoUrl, "profile-photo.jpg");
  //   }
  //   if (!selfieF || selfieF.size === 0) {
  //     openSelfieSourcePicker();
  //     toast.error(
  //       "Could not load your saved selfie. Please take or choose a photo again.",
  //     );
  //     return;
  //   }

  //   const employmentStatus = mapWorkingAsToEmploymentStatus(
  //     formData.workingAs || "self-employed",
  //   );

  //   const data = new FormData();
  //   data.append(
  //     "governmentIdType",
  //     GOVERNMENT_ID_TYPE_TO_API[formData.documentType] || "national_id",
  //   );
  //   data.append("governmentIdNumber", "");
  //   data.append("governmentIdDocument", idFile);
  //   data.append("skillDocuments", JSON.stringify([]));
  //   data.append("baseCity", formData.city);
  //   data.append("postalCode", formData.postal);
  //   data.append("primarySkillCategoryId", formData.trade);
  //   if (!formData.trade) {
  //     toast.error("Please select your primary trade before submitting.");
  //     return;
  //   }
  //   const countryCode = (formData.country || "DE").toUpperCase().slice(0, 2);
  //   data.append("countryOfResidence", countryCode);
  //   data.append("profilePhoto", selfieF);
  //   data.append("employmentStatus", employmentStatus);

  //   try {
  //     setIsSubmittingVerification(true);
  //     await submitVerification(data);
  //     setVerificationDraftId(null);
  //     toast.success("Verification submitted successfully!");
  //     router.push("/krafter/kyc-welcome");
  //   } catch (error: any) {
  //     toast.error(
  //       error?.response?.data?.message || "Failed to submit verification",
  //     );
  //   } finally {
  //     setIsSubmittingVerification(false);
  //   }
  // };

  /** Final submit always hits POST /api/verification/submit (not draft). Require ID + type + selfie. */
  // const getVerificationSubmitBlocker = (): string | null => {
  //   const hasGovIdFileOrUrl =
  //     !!formData.idDocument || !!restoredGovernmentIdDocumentUrl;
  //   if (!hasGovIdFileOrUrl) {
  //     return "Add your government ID on the Legal Identity step before submitting.";
  //   }
  //   if (!isNotEmpty(formData.documentType)) {
  //     return "Select your government ID document type.";
  //   }
  //   const hasSelfieFileOrUrl =
  //     !!formData.selfieFile || !!restoredProfilePhotoUrl;
  //   if (!hasSelfieFileOrUrl) {
  //     return "Add a selfie photo before submitting.";
  //   }
  //   return null;
  // };

  // const redirectToLegalIdentityForId = () => {
  //   setSkipDocumentUpload(false);
  //   setCurrentStep(4);
  // };

  return (
    <main className="relative w-full min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {isLoading ? (
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

            {/* Step 2: Basic Info */}
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
                  onChange={(value) => handleInputChange("firstName", value)}
                  required
                />
                <Input
                  label="Last Name"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={(value) => handleInputChange("lastName", value)}
                  required
                />
                <Select
                  label="Gender"
                  placeholder="Male"
                  value={formData.gender}
                  onChange={(value) => handleInputChange("gender", value)}
                  options={[
                    {
                      value: "Male",
                      label: "Male",
                    },
                    {
                      value: "Female",
                      label: "Female",
                    },
                  ]}
                  required
                />
                <Input
                  label="Date of Birth"
                  type="date"
                  placeholder="Date of Birth"
                  value={formData.dateOfBirth}
                  onChange={(value) => handleInputChange("dateOfBirth", value)}
                  required
                />
                <Select
                  label="Nationality"
                  placeholder="German"
                  value={formData.nationality}
                  onChange={(value) => handleInputChange("nationality", value)}
                  options={[
                    {
                      value: "German",
                      label: "German",
                    },
                    {
                      value: "Ghanaian",
                      label: "Ghanaian",
                    },
                  ]}
                  required
                />

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

            {currentStep === 3 && (
              <div className="space-y-6">
                <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-gerat font-semibold mb-2">
                  Tell us about you
                </h1>
                <p className="text-[14px] font-poppins text-[#2B2F32] mb-8 font-bold">
                  Enter your current home address and we will help you find jobs
                  near you
                </p>
                <Input
                  label="Street and house number"
                  placeholder="Street and house number"
                  value={formData.streetNo}
                  onChange={(value) => handleInputChange("streetNo", value)}
                  required
                />
                <Input
                  label="Post code"
                  placeholder="Post code"
                  value={formData.postCode}
                  onChange={(value) => handleInputChange("postCode", value)}
                  required
                />
                <Input
                  label="City"
                  placeholder="City"
                  value={formData.city}
                  onChange={(value) => handleInputChange("city", value)}
                  required
                />
              </div>
            )}

            {/* Step 6: Take a Selfie */}
            {/* {currentStep === 6 && (
              <div className="space-y-6">
                <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-gerat font-bold mb-2">
                  Add up your selfie to your profile
                </h1>
                <p className="text-[14px] font-mabry text-gray-600 mb-8">
                  We use your selfie to compare with your passport photo
                </p>

                {/* Selfie Illustration Placeholder */}
            {/* <div className="flex justify-center mb-8">
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
                /> */}

            {/* Instructions Box */}
            {/* <div className=" p-2 space-y-3">
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
            )} */}
          </div>

          {/* <button className="fixed bottom-40 right-4 sm:right-6 lg:right-8 w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center text-xl font-bold border border-gray-200 hover:shadow-xl transition-shadow">
            ?
          </button> */}

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
                  Continue
                </Button>
              </div>
            )}
            {currentStep === 2 && (
              <div className="text-center text-[14px] font-poppins pt-5">
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
            )}

            {currentStep === 3 && (
              <div className="text-center text-[14px] font-poppins pt-5">
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
            )}
          </div>
        </div>
      )}
    </main>
  );
};

export default Page;
