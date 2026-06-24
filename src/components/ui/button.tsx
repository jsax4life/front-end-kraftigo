import React from "react";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "outline";
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  fullWidth?: boolean;
}

const Button = ({
  children,
  onClick,
  variant = "primary",
  className = "",
  type = "button",
  disabled = false,
  fullWidth = false,
}: ButtonProps) => {
  // Base styles that apply to all buttons
  const baseStyles =
    "h-[49px] text-[14px] font-mabry py-4 px-8 rounded-xl transition-all  disabled:cursor-not-allowed";

  // Width styles
  const widthStyles = fullWidth
    ? "w-full"
    : "w-full sm:w-auto sm:min-w-[170px]";

  // Variant-specific styles
  const variantStyles = {
    primary: disabled
      ? "bg-[#919191] text-white cursor-not-allowed"
      : "bg-brand-orange text-white hover:bg-opacity-90",
    secondary: disabled
      ? "bg-[#919191] text-white cursor-not-allowed"
      : "bg-brand-blue text-white hover:bg-opacity-90",
    outline:
      "bg-white text-gray-800 border border-gray-200 hover:bg-gray-50 shadow-sm",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${widthStyles} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
