"use client";

import { Check } from "lucide-react";

interface Rule {
  label: string;
  test: (pw: string) => boolean;
}

const RULES: Rule[] = [
  { label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { label: "One uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { label: "One lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  {
    label: "One special character",
    test: (pw) => /[^A-Za-z0-9]/.test(pw),
  },
];

interface PasswordStrengthProps {
  password: string;
}

const PasswordStrength = ({ password }: PasswordStrengthProps) => {
  if (!password) return null;

  return (
    <ul className="space-y-2 mt-1">
      {RULES.map(({ label, test }) => {
        const met = test(password);
        return (
          <li
            key={label}
            className={`flex items-center gap-2 text-[13px] font-poppins transition-colors duration-200 ${
              met ? "text-[#FF6600]" : "text-gray-400"
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border transition-all duration-200 ${
                met
                  ? "bg-[#FF6600] border-[#FF6600]"
                  : "border-gray-300 bg-white"
              }`}
            >
              {met && <Check size={10} strokeWidth={3} className="text-white" />}
            </span>
            {label}
          </li>
        );
      })}
    </ul>
  );
};

export default PasswordStrength;
