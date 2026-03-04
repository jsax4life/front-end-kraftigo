interface ErrorAlertProps {
  message: string;
}

export const ErrorAlert = ({ message }: ErrorAlertProps) => {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
      <p className="text-sm">{message}</p>
    </div>
  );
};

interface WarningAlertProps {
  message: string;
}

export const WarningAlert = ({ message }: WarningAlertProps) => {
  return (
    <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg mb-4">
      <p className="text-sm">{message}</p>
    </div>
  );
};
