import Image from "next/image";
import Button from "@/components/ui/button";

interface HelpBannerProps {
  onSendMessage: () => void;
}

const HelpBanner = ({ onSendMessage }: HelpBannerProps) => {
  return (
    <div className="bg-[#FFF4ED] rounded-2xl p-6 relative overflow-hidden my-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-start">
        <div className="z-10 max-w-[60%]">
          <h3 className="text-[14px] text-[#1D2939] font-poppins font-medium mb-4">
            Have an issue with payments, your account, or promotions? Speak to our support team
          </h3>
          <Button
            variant="primary"
            onClick={onSendMessage}
            className="py-3! px-6! text-[14px]! w-auto!"
          >
            Send us a message
          </Button>
        </div>
        <div className="absolute right-0 bottom-0 w-32 h-32 opacity-20 transform translate-x-4 translate-y-4">
          <Image
            src="/sopport.svg"
            alt="Support"
            fill
            className="object-contain"
          />
        </div>
      </div>
    </div>
  );
};

export default HelpBanner;
