const WhyModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center sm:justify-center">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[16px] sm:text-[20px] font-poppins font-bold text-gray-900">
            Why do we collect this information?
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <p className="text-gray-600">Privacy Policy content coming soon.</p>
      </div>
    </div>
  );
};

export default WhyModal;