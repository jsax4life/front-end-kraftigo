"use client";

import { ArrowLeft, Check, Star, MapPin, Briefcase, Globe, Info, Heart } from "lucide-react";
import Image from "next/image";

interface ArtisanProfileViewProps {
  onClose: () => void;
  artisan: {
    name: string;
    avatar?: string;
  };
}

const ArtisanProfileView = ({ onClose, artisan }: ArtisanProfileViewProps) => {
  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col h-full overflow-y-auto animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
        <button onClick={onClose} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-[#1D2939]" />
        </button>
        <h3 className="text-[18px] font-gerat font-bold text-[#1D2939]">{artisan.name}</h3>
        <div className="w-10"></div>
      </div>

      <div className="p-6">
        <div className="flex flex-col items-center mb-8">
           <div className="relative w-40 h-40 rounded-2xl overflow-hidden bg-gray-100 mb-4 shadow-sm">
             {artisan.avatar ? (
               <Image src={artisan.avatar} alt={artisan.name} fill className="object-cover" />
             ) : (
               <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl font-bold">
                 {artisan.name.charAt(0)}
               </div>
             )}
             <div className="absolute bottom-2 right-2 w-10 h-10 bg-brand-green rounded-full border-4 border-white flex items-center justify-center">
                <Check className="text-white" size={24} />
             </div>
           </div>

           <div className="flex items-center justify-between w-full px-4 mb-8">
              <StatItem value="264" label="Reviews" />
              <div className="w-px h-10 bg-gray-200" />
              <StatItem value="4.9 ★" label="Rating" />
              <div className="w-px h-10 bg-gray-200" />
              <StatItem value="3 Years" label="Krafting" />
           </div>

           <div className="bg-[#F9FAFB] rounded-xl p-4 w-full mb-8">
              <p className="text-[14px] font-poppins text-gray-700 leading-relaxed italic">
                "I am a secondary teacher and my husband is a musician, we have a boy 11 years old, we are all relaxed and easy going people."
              </p>
           </div>

           <div className="w-full space-y-6">
              <section>
                 <h4 className="text-[16px] font-gerat font-bold mb-4">Krafter details</h4>
                 <div className="space-y-1">
                   <p className="text-[14px] font-poppins text-gray-800">Response rate: 100%</p>
                   <p className="text-[14px] font-poppins text-gray-800">Responds within an hour</p>
                 </div>
              </section>

              <div className="space-y-4">
                 <DetailItem icon={Briefcase} text="My work: Education" />
                 <DetailItem icon={Globe} text="Speaks Chinese and English" />
                 <DetailItem icon={MapPin} text="Lives in London, United Kingdom" />
                 <DetailItem icon={Info} text="What makes me unique: I like to make people feel relaxed with Relax people" />
                 <DetailItem icon={Heart} text="Pets: Bahuma is my kitten's name" />
              </div>

              <section>
                 <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[16px] font-gerat font-bold">Images</h4>
                    <button className="text-[13px] font-poppins font-bold text-brand-orange">See all</button>
                 </div>
                 <div className="grid grid-cols-3 gap-2">
                    {[1,2,3,4,5,6].map(i => (
                        <div key={i} className="aspect-square relative rounded-xl overflow-hidden bg-gray-100">
                           <Image src={`https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=200&h=200&fit=crop&q=${i}`} alt="Project" fill className="object-cover" />
                        </div>
                    ))}
                 </div>
              </section>

              <section>
                 <h4 className="text-[16px] font-gerat font-bold mb-4">Skills & Expertise</h4>
                 <div className="flex flex-wrap gap-2">
                    <Tag text="Gardening help" />
                    <Tag text="Landscaping help" />
                    <Tag text="Lawn Maintainance" />
                    <Tag text="Planting Help" />
                    <Tag text="Weeding Help" />
                 </div>
              </section>

              <section>
                 <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[16px] font-gerat font-bold">Reviews</h4>
                 </div>
                 <div className="space-y-4">
                    <ReviewCard name="Edith B." rating={3} text="I have six years of experience cleaning houses. My priority is to bring a good service and leave everything very clean✨. I am a reliable person, I will ensure that your apartment is left very clean and I am always open to suggestions 🙏" />
                    <ReviewCard name="Edith B." rating={3} text="I have six years of experience cleaning houses. My priority is to bring a good service and leave everything very clean✨. I am a reliable person, I will ensure that your apartment is left very clean and I am always open to suggestions 🙏" />
                 </div>
                 <button className="w-full py-4 text-[14px] font-poppins font-bold text-gray-500 text-center">See all(24)</button>
              </section>
           </div>
        </div>
      </div>

      <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 px-6 flex items-center justify-between z-10">
         <div>
            <span className="text-[20px] font-gerat font-bold text-[#1D2939]">$41.29</span>
            <span className="text-[14px] font-poppins text-gray-500 font-medium whitespace-nowrap"> /hr</span>
         </div>
         <button className="bg-brand-orange text-white rounded-xl px-8 py-3.5 font-poppins font-bold text-[14px] shadow-sm active:scale-95 transition-transform">
            Check availability
         </button>
      </div>
    </div>
  );
};

const StatItem = ({ value, label }: { value: string, label: string }) => (
  <div className="flex flex-col items-center gap-1">
    <span className="text-[18px] font-gerat font-bold text-[#1D2939]">{value}</span>
    <span className="text-[12px] font-poppins text-gray-500 font-medium">{label}</span>
  </div>
);

const DetailItem = ({ icon: Icon, text }: { icon: any, text: string }) => (
  <div className="flex items-start gap-4">
    <Icon size={20} className="text-[#1D2939] shrink-0 mt-0.5" />
    <span className="text-[14px] font-poppins text-gray-700 leading-snug">{text}</span>
  </div>
);

const Tag = ({ text }: { text: string }) => (
  <div className="px-4 py-2 bg-white border border-brand-orange text-brand-orange rounded-full text-[13px] font-poppins font-medium">
    {text}
  </div>
);

const ReviewCard = ({ name, rating, text }: { name: string, rating: number, text: string }) => (
  <div className="p-4 bg-white border border-gray-100 rounded-2xl space-y-3">
    <p className="text-[13px] font-poppins text-gray-700 leading-relaxed">{text}</p>
    <div>
       <span className="text-[13px] font-poppins font-bold block mb-1">{name}</span>
       <div className="flex gap-1">
          {[1,2,3,4,5].map(i => (
            <Star key={i} size={14} className={i <= rating ? "fill-brand-orange text-brand-orange" : "text-gray-200"} />
          ))}
       </div>
    </div>
  </div>
);

export default ArtisanProfileView;
