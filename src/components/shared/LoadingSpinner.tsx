interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  color?: "orange" | "blue" | "white"
  className?: string
}

const sizes = { sm: "w-4 h-4", md: "w-8 h-8", lg: "w-12 h-12" }
const colors = {
  orange: "border-brand-orange",
  blue: "border-brand-blue",
  white: "border-white",
}

const LoadingSpinner = ({ size = "md", color = "orange", className = "" }: LoadingSpinnerProps) => (
  <div
    className={`${sizes[size]} border-2 ${colors[color]} border-t-transparent rounded-full animate-spin ${className}`}
  />
)

export default LoadingSpinner
