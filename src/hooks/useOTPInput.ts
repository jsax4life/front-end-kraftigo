import { useState } from "react";

export const useOTPInput = (length: number = 6) => {
  const [code, setCode] = useState<string[]>(Array(length).fill(""));

  const handleCodeChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      // Auto-focus next input
      if (value && index < length - 1) {
        const nextInput = document.getElementById(`code-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const isComplete = () => code.every((digit) => digit !== "");

  const getCode = () => code.join("");

  const reset = () => setCode(Array(length).fill(""));

  return {
    code,
    handleCodeChange,
    handleKeyDown,
    isComplete,
    getCode,
    reset,
  };
};
