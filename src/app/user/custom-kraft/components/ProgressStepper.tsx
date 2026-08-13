import { useTranslations } from "next-intl";

interface ProgressStepperProps {
  currentStep: 1 | 2 | 3 | 4;
}

const ProgressStepper = ({ currentStep }: ProgressStepperProps) => {
  const t = useTranslations("customKraft.stepper");

  const steps = [
    { number: 1, label: t("description") },
    { number: 2, label: t("details") },
    { number: 3, label: t("budget") },
    { number: 4, label: t("review") },
  ];

  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((step) => (
        <div key={step.number} className="flex-1">
          <div
            className={`h-1.5 rounded-full ${
              step.number === currentStep
                ? "bg-brand-orange"
                : step.number < currentStep
                ? "bg-brand-blue"
                : "bg-gray-200"
            }`}
          />
          <p
            className={`text-[12px] font-poppins mt-2 ${
              step.number === currentStep
                ? "text-brand-orange font-semibold"
                : step.number < currentStep
                ? "text-brand-blue font-semibold"
                : "text-gray-400"
            }`}
          >
            {step.label}
          </p>
        </div>
      ))}
    </div>
  );
};

export default ProgressStepper;
