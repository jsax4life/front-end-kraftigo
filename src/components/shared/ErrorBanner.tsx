import { AlertCircle, X } from "lucide-react"

interface ErrorBannerProps {
  message: string
  onDismiss?: () => void
  className?: string
}

const ErrorBanner = ({ message, onDismiss, className = "" }: ErrorBannerProps) => (
  <div className={`flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3 ${className}`}>
    <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
    <p className="flex-1 text-[13px] font-poppins text-red-600 leading-relaxed">{message}</p>
    {onDismiss && (
      <button onClick={onDismiss} className="text-red-400 shrink-0">
        <X size={14} />
      </button>
    )}
  </div>
)

export default ErrorBanner
