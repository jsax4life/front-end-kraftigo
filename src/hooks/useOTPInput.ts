import { useCallback, useState } from "react";

function digitsToCodeArray(value: string, length: number): string[] {
  const digits = value.replace(/\D/g, "").slice(0, length);
  const arr = Array(length).fill("");
  for (let i = 0; i < digits.length; i += 1) {
    arr[i] = digits[i];
  }
  return arr;
}

export const useOTPInput = (length: number = 6, initialValue = "") => {
  const [code, setCode] = useState<string[]>(() => digitsToCodeArray(initialValue, length));

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

  const setFromString = useCallback(
    (value: string) => {
      setCode(digitsToCodeArray(value, length));
    },
    [length],
  );

  return {
    code,
    handleCodeChange,
    handleKeyDown,
    isComplete,
    getCode,
    reset,
    setFromString,
  };
};
