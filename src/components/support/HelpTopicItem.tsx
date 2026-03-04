import { ChevronRight } from "lucide-react";

interface HelpTopicItemProps {
  label: string;
  onClick: () => void;
}

const HelpTopicItem = ({ label, onClick }: HelpTopicItemProps) => {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between py-4 border-b border-[#F2F4F7] text-left hover:bg-gray-50 transition-colors px-1"
    >
      <span className="text-[16px] text-[#344054] font-poppins">{label}</span>
      <ChevronRight className="w-5 h-5 text-[#98A2B3]" />
    </button>
  );
};

export default HelpTopicItem;
