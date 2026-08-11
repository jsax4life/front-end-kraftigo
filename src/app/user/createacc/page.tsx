"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/input";
import PhoneInput from "@/components/ui/PhoneInput";
import Button from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import Loader from "@/components/ui/loader";
import {
  isValidEmail,
  isValidPassword,
  passwordsMatch,
  isNotEmpty,
  isValidPhoneLength,
} from "@/utils/validation";
import { logger } from "@/utils/logger";
import { Checkbox } from "@/components/ui/Checkbox";
import { LegalModal } from "@/components/ui/LegalModal";
import { TermsContent } from "@/components/ui/TermsContent";
import { PrivacyContent } from "@/components/ui/PrivacyContent";
import WhyModal from "@/components/ui/whyModal";
import PasswordStrength from "@/components/ui/PasswordStrength";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";
import { AUTH_CONFIG } from "@/constants/auth";
import toast from "react-hot-toast";
import EmailVerificationForm from "@/components/auth/EmailVerificationForm";
import {
  getPendingEmailVerification,
  setPendingEmailVerification,
  clearPendingEmailVerification,
} from "@/lib/pendingEmailVerification";
import { isEmailNotVerifiedError } from "@/lib/authApiErrors";
import { routeAfterAuthLogin } from "@/lib/postLoginRouting";
import {
  getKrafterSignupIntent,
  syncKrafterSignupIntentFromSearchParams,
} from "@/lib/krafterSignupIntent";

const Page = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = AUTH_CONFIG.REGISTRATION_STEPS;
  const {
    registerUser,
    verifyEmail,
    resendVerificationCode,
    loginUser,
    isLoading,
    error,
    clearError,
  } = useAuthStore();
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showWhyModal, setShowWhyModal] = useState(false);
  const [googleTermsAccepted, setGoogleTermsAccepted] = useState(false);
  const [isKrafterSignupFlow] = useState(() => {
    if (typeof window === "undefined") return false;
    syncKrafterSignupIntentFromSearchParams(
      new URLSearchParams(window.location.search),
    );
    return getKrafterSignupIntent();
  });

  // Form data state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dialCode: "+49",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
  });

  // Resume interrupted email verification
  useEffect(() => {
    const pending = getPendingEmailVerification();
    const authUser = useAuthStore.getState().user;
    const pendingEmail =
      pending?.email ||
      (authUser?.status === "PENDING_VERIFICATION" ? authUser.email?.trim().toLowerCase() : "");
    if (!pendingEmail) return;
    setFormData((prev) => ({ ...prev, email: pendingEmail }));
    setCurrentStep(4);
  }, []);

  const handleInputChange = (field: string, value: string | boolean) => {
    if (error) clearError();
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Check if current step is valid (for button disable state)
  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return (
          isNotEmpty(formData.firstName) &&
          isNotEmpty(formData.lastName) &&
          isNotEmpty(formData.email) &&
          isNotEmpty(formData.phone) &&
          isValidEmail(formData.email) &&
          isValidPhoneLength(formData.phone)
        );
      case 2:
        // For password step, only check if fields are not empty
        // Don't disable button for validation - let user click and see error toast
        return (
          isNotEmpty(formData.password) && isNotEmpty(formData.confirmPassword)
        );
      case 3:
        return formData.termsAccepted;
      default:
        return false;
    }
  };

  // Navigate to next step
  const handleNext = () => {
    if (currentStep < 3) {
      // Validate Step 2 (password) before proceeding
      if (currentStep === 2) {
        if (
          !isValidPassword(formData.password, AUTH_CONFIG.MIN_PASSWORD_LENGTH)
        ) {
          toast.error("Password must be at least 8 characters");
          return;
        }
        if (!passwordsMatch(formData.password, formData.confirmPassword)) {
          toast.error("Passwords do not match");
          return;
        }
      }
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 3) {
      // Submit registration on step 3 (after terms acceptance)
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  // Submit form
  const handleSubmit = async () => {
    // Basic validation (should already be validated by step progression)
    if (
      !isNotEmpty(formData.firstName) ||
      !isNotEmpty(formData.lastName) ||
      !isNotEmpty(formData.email) ||
      !isNotEmpty(formData.phone) ||
      !isNotEmpty(formData.password)
    ) {
      toast.error("All fields are required");
      return;
    }

    // Prepare data for backend — use the dial code the user actually selected
    const formattedPhone = `${formData.dialCode}${formData.phone.replace(/^0+/, "")}`;

    const registrationData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      phone: formattedPhone,
      hasAcceptedTerms: formData.termsAccepted,
      ...(isKrafterSignupFlow || getKrafterSignupIntent()
        ? { signupIntent: "krafter" as const }
        : {}),
    };

    logger.log("Submitting registration data:", registrationData);

    try {
      const result = await registerUser(registrationData);
      logger.log("Registration successful!", result);

      toast.success(
        result.message || "Registration successful! Please check your email.",
      );

      setPendingEmailVerification(formData.email, {
        krafterSignupIntent: isKrafterSignupFlow,
      });
      setCurrentStep(4);
    } catch (err: unknown) {
      logger.error("Registration failed:", err);
      const storeError = useAuthStore.getState().error;
      if (isEmailNotVerifiedError(err, storeError)) {
        setPendingEmailVerification(formData.email, {
        krafterSignupIntent: isKrafterSignupFlow,
      });
        toast.error("This email is registered but not verified. Enter your verification code.");
        setCurrentStep(4);
        return;
      }
      const e = err as { response?: { data?: { message?: string } } };
      const errorMessage =
        e.response?.data?.message ||
        error ||
        "Registration failed. Please try again.";
      toast.error(errorMessage);
    }
  };

  return (
    <main className="relative w-full min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {isLoading ? (
        <>
          <Loader />
        </>
      ) : (
        <div className="w-full max-w-4xl mx-auto min-h-screen flex flex-col py-8">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={handleBack}
              className="text-2xl hover:opacity-70 transition-opacity"
            >
              <ArrowLeft />
            </button>
            <span className="text-[14px] text-gray-500 font-poppins">
              Step {currentStep} of {totalSteps}
            </span>
          </div>

          {/* Step Content */}
          <div className="flex-1">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-gerat font-bold mb-8">
                  {isKrafterSignupFlow
                    ? "Create your Krafter account"
                    : "Tell Us About You"}
                </h1>
                {isKrafterSignupFlow ? (
                  <p className="text-[14px] font-poppins text-gray-600 -mt-4 mb-6">
                    After verifying your email, you&apos;ll continue straight to Krafter
                    registration.
                  </p>
                ) : null}

                <Input
                  label="Enter Your First Name"
                  placeholder="Enter First Name"
                  value={formData.firstName}
                  onChange={(value) => handleInputChange("firstName", value)}
                  required
                />
                <Input
                  label="Enter Your Last Name"
                  placeholder="Enter Last Name"
                  value={formData.lastName}
                  onChange={(value) => handleInputChange("lastName", value)}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(value) => handleInputChange("email", value)}
                  required
                />
                <PhoneInput
                  label="Phone Number"
                  placeholder="000 000 0000"
                  value={formData.phone}
                  onChange={(value) => handleInputChange("phone", value)}
                  onDialCodeChange={(code) => handleInputChange("dialCode", code)}
                  required
                />

                {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
                  <div className="pt-4 border-t border-gray-100 space-y-4">
                    <p className="text-center text-[14px] font-mabry text-gray-500">
                      Or sign up with Google
                    </p>
                    <Checkbox
                      checked={googleTermsAccepted}
                      onChange={setGoogleTermsAccepted}
                      labelNode={
                        <span className="text-[13px] font-poppins text-gray-700 leading-relaxed">
                          I agree to the{" "}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setShowTermsModal(true);
                            }}
                            className="text-brand-blue underline font-semibold"
                          >
                            Terms of Use
                          </button>{" "}
                          and{" "}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setShowPrivacyModal(true);
                            }}
                            className="text-brand-blue underline font-semibold"
                          >
                            Privacy Policy
                          </button>
                        </span>
                      }
                    />
                    <GoogleLoginButton
                      variant="full"
                      termsAccepted={googleTermsAccepted}
                    />
                  </div>
                ) : null}
              </div>
            )}

            {/* Step 2: Password */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-gerat font-bold mb-8">
                  Create Password
                </h1>

                <Input
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(value) => handleInputChange("password", value)}
                  required
                />
                <PasswordStrength password={formData.password} />
                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="Enter your confirm password"
                  value={formData.confirmPassword}
                  onChange={(value) =>
                    handleInputChange("confirmPassword", value)
                  }
                  required
                />
              </div>
            )}

            {/* Step 3: Terms of Use */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-gerat font-bold mb-3">
                  Terms Of Use
                </h1>
                <p className="text-[14px] font-poppins text-gray-600">
                  By clicking, you agree to receive updates and newsletters
                  about Kraftigo services & products
                </p>

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

            {/* Step 3: Email Verification */}
            {currentStep === 4 && (
              <EmailVerificationForm
                email={formData.email}
                isLoading={isLoading}
                onVerify={async (otpCode) => {
                  logger.log("Verifying email with code:", otpCode);
                  try {
                    await verifyEmail(formData.email, otpCode);
                    clearPendingEmailVerification();
                    if (formData.password) {
                      await loginUser(formData.email, formData.password);
                      toast.success(
                        getKrafterSignupIntent()
                          ? "Account created! Continue your Krafter registration."
                          : "Registration complete! Welcome to Kraftigo.",
                      );
                      await routeAfterAuthLogin(router);
                      return;
                    }
                    toast.success("Email verified! Sign in to continue.");
                    router.push(
                      `/user/login?email=${encodeURIComponent(formData.email)}&verified=1`,
                    );
                  } catch (err: unknown) {
                    logger.error("Verification failed:", err);
                    const e = err as { response?: { data?: { message?: string } } };
                    toast.error(
                      e.response?.data?.message ||
                        error ||
                        "Verification failed. Please check your code and try again.",
                    );
                  }
                }}
                onResend={async () => {
                  logger.log("Resending verification code to:", formData.email);
                  try {
                    const message = await resendVerificationCode(formData.email);
                    setPendingEmailVerification(formData.email, {
                      krafterSignupIntent: isKrafterSignupFlow,
                    });
                    toast.success(message);
                  } catch (err: unknown) {
                    logger.error("Resend failed:", err);
                    const e = err as { response?: { data?: { message?: string } } };
                    toast.error(
                      e.response?.data?.message ||
                        error ||
                        "Failed to resend code. Please try again.",
                    );
                  }
                }}
              />
            )}
          </div>

          {/* <button className="fixed bottom-40 right-4 sm:right-6 lg:right-8 w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center text-xl font-bold border border-gray-200 hover:shadow-xl transition-shadow">
            ?
          </button> */}

          <div className="mt-auto space-y-4">
            {currentStep === 1 && (
              <div className="text-center text-[14px] font-poppins">
                <span className="text-brand-orange">
                  Already have an account?{" "}
                </span>
                <button
                  onClick={() => router.push("/user/login")}
                  className="text-brand-blue font-semibold hover:underline"
                >
                  Sign In
                </button>
              </div>
            )}

            {currentStep === 2 && (
              <div className="text-center text-[14px] font-poppins">
                <span
                  className="text-gray-600"
                  onClick={() => setShowWhyModal(true)}
                >
                  Why do we collect this information?
                </span>
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <Checkbox
                  checked={formData.termsAccepted}
                  onChange={(checked: boolean) =>
                    handleInputChange("termsAccepted", checked)
                  }
                  labelNode={
                    <span className="text-[14px] font-poppins text-gray-700 leading-relaxed">
                      I agree to the{" "}
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
                      </button>
                    </span>
                  }
                />
              </div>
            )}

            {currentStep !== 4 && (
            <div>
              <Button
                variant="primary"
                onClick={handleNext}
                fullWidth
                disabled={!isStepValid()}
              >
                {currentStep === totalSteps ? "Submit" : "Continue"}
              </Button>
            </div>
            )}
          </div>
        </div>
      )}

      {/* Why Modal */}
      <WhyModal isOpen={showWhyModal} onClose={() => setShowWhyModal(false)} />
    </main>
  );
};

export default Page;
