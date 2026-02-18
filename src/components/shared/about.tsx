import Image from "next/image";
import { Headset } from "lucide-react";

const About = () => {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          {/* Profile Section */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="border-2 border-dashed border-brand-blue-deep rounded-full w-14 h-14 sm:w-16 sm:h-16 lg:w-18 lg:h-18 flex items-center justify-center">
              <Image
                src="/images/abt.jpg"
                alt="propic"
                width={300}
                height={300}
                className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full object-cover"
              />
            </div>
            <div>
              <p className="font-poppins text-[14px] sm:text-[16px] lg:text-[18px]">
                Hello Macel
              </p>
              <span className="flex items-center gap-1">
                <Image
                  src="/badge.svg"
                  alt="badge"
                  width={100}
                  height={100}
                  className="w-3 h-3 sm:w-3.5 sm:h-3.5"
                />
                <p className="font-poppins font-bold text-[11px] sm:text-[12px] text-brand-orange">
                  Lvl 12
                </p>
              </span>
            </div>
          </div>

          {/* Icons Section */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Image
              src="/flag.svg"
              alt="flag"
              width={100}
              height={100}
              className="w-7 h-7 sm:w-9 sm:h-9 lg:w-10 lg:h-10"
            />
            <div className="relative">
              <Headset size={25} className="sm:w-7 sm:h-7 lg:w-8 lg:h-8" />
              {/* Red notification dot */}
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
