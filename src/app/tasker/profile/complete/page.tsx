"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, X, Camera, Plus, Search, 
  HelpCircle, Home, Hammer, ShieldCheck, 
  User as UserIcon, CheckCircle2 
} from "lucide-react";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Button from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { useProfileStore } from "@/store/useProfileStore";
import toast from "react-hot-toast";

const Tag = ({ label, onRemove }: { label: string, onRemove: () => void }) => (
  <div className="flex items-center gap-1.5 bg-[#F6F6F6] text-[#667085] px-3 py-1.5 rounded-lg border border-[#0000001A]">
    <span className="text-[13px] font-poppins font-medium">{label}</span>
    <button onClick={onRemove} className="hover:text-red-500">
      <X size={14} />
    </button>
  </div>
);

const SectionTitle = ({ label, desc }: { label: string, desc?: string }) => (
  <div className="mb-6">
    <h2 className="text-[18px] font-gerat font-bold text-[#1D2939] leading-tight">{label}</h2>
    {desc && <p className="text-[14px] text-[#667085] font-poppins mt-1">{desc}</p>}
  </div>
);

const CompleteProfilePage = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { artisanProfile, fetchArtisanProfile, createOrUpdateArtisanProfile, isLoading } = useProfileStore();
  
  const [step, setStep] = useState(1);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);

  // Step 1 Data
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [trade, setTrade] = useState("");
  const [location, setLocation] = useState("");
  const [uniquePoint, setUniquePoint] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  
  // Step 2 Data (Skills)
  const [selectedSkills, setSelectedSkills] = useState<any[]>([]);

  useEffect(() => {
    if (!artisanProfile) {
      fetchArtisanProfile();
    }
  }, [artisanProfile, fetchArtisanProfile]);

  useEffect(() => {
    if (artisanProfile) {
      setDisplayName(artisanProfile.displayName || artisanProfile.legalFullName || "");
      setBio(artisanProfile.bio || "");
      setTrade(artisanProfile.primaryTrade || "");
      setLocation(artisanProfile.baseCity || "");
      setLanguages((artisanProfile.languages || []).map(l => l.name));
    }
  }, [artisanProfile]);

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else handleSubmit();
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else router.back();
  };

  const handleSubmit = async () => {
    try {
      // Map and Save
      const profileData = {
        ...artisanProfile,
        displayName,
        bio,
        primaryTrade: trade,
        languages: languages.map(l => ({ name: l, code: l.toLowerCase().slice(0, 2), proficiency: 'fluent' })),
        secondarySkills: selectedSkills.map(s => s.name),
        // Additional mapping for rates would go to a sub-table or service store in real app
      };
      
      await createOrUpdateArtisanProfile(profileData as any);
      toast.success("Profile completed successfully!");
      router.push("/tasker/dashboard");
    } catch (error) {
      toast.error("Failed to complete profile");
    }
  };

  const allAvailableSkills = [
    { id: "1", name: "Gardening help", category: "Gardening & Outdoor", rate: "Starting at $45/hr" },
    { id: "2", name: "Landscaping help", category: "Gardening & Outdoor", rate: "Starting at $45/hr" },
    { id: "3", name: "Lawn Maintenance", category: "Gardening & Outdoor", rate: "Starting at $45/hr" },
    { id: "4", name: "Planting Help", category: "Gardening & Outdoor", rate: "Starting at $45/hr" },
    { id: "5", name: "Kitchen Cleaning", category: "Cleaning", rate: "Starting at $45/hr" },
    { id: "6", name: "Bathroom Cleaning", category: "Cleaning", rate: "Starting at $45/hr" },
  ];

  const addSkill = (skill: any) => {
    if (selectedSkills.length < 5 && !selectedSkills.find(s => s.id === skill.id)) {
      setSelectedSkills([...selectedSkills, { ...skill, rateType: 'HOURLY', price: 0 }]);
    }
    setIsSkillModalOpen(false);
  };

  const removeSkill = (id: string) => {
    setSelectedSkills(selectedSkills.filter(s => s.id !== id));
  };

  const toggleRateType = (index: number, type: 'HOURLY' | 'FLAT') => {
    const updated = [...selectedSkills];
    updated[index].rateType = type;
    setSelectedSkills(updated);
  };

  return (
    <main className="min-h-screen bg-white pb-32">
      {/* Header */}
      <div className="w-full flex items-center justify-between py-6 px-4 bg-white sticky top-0 z-40 border-b border-[#F2F4F7]">
        <button onClick={handleBack} className="p-1 hover:opacity-70">
          <ChevronLeft className="w-8 h-8 text-[#1D2939]" strokeWidth={1.5} />
        </button>
        <span className="text-[14px] font-poppins text-gray-400">{step} of 3</span>
      </div>

      <div className="px-5 py-8 max-w-2xl mx-auto space-y-10">
        
        {step === 1 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h1 className="text-[28px] font-gerat font-bold text-[#1D2939]">Complete Your Profile</h1>
              <p className="text-[14px] font-poppins text-[#667085]">Add profile information about yourself</p>
            </div>

            {/* Avatar */}
            <div className="flex justify-center">
              <div className="relative w-32 h-32 rounded-full ring-4 ring-[#EAECF0] ring-offset-2 overflow-hidden bg-gray-50 flex items-center justify-center">
                 {artisanProfile?.profilePhotoUrl || user?.avatar ? (
                   <Image src={artisanProfile?.profilePhotoUrl || user?.avatar || ""} alt="avatar" fill className="object-cover" />
                 ) : (
                   <UserIcon size={48} className="text-gray-300" />
                 )}
                 <div className="absolute inset-0 bg-black/10 flex items-center justify-center translate-y-10 hover:translate-y-0 transition-transform cursor-pointer">
                    <Camera className="text-white" size={24} />
                 </div>
              </div>
            </div>

            {/* Profile Info */}
            <section className="space-y-5">
              <SectionTitle label="Profile Information" />
              <Input 
                label="Display Name" 
                placeholder="Edith R" 
                value={displayName} 
                onChange={setDisplayName} 
              />
              <div className="space-y-2">
                <label className="text-[14px] font-poppins text-gray-800">Bio</label>
                <textarea 
                   className="w-full p-4 rounded-2xl bg-[#F6F6F6] border border-[#0000001A] outline-none min-h-[100px] font-poppins text-[15px] placeholder:text-gray-400"
                   placeholder="Briefly describe your expertise..."
                   value={bio}
                   onChange={(e) => setBio(e.target.value)}
                />
              </div>
            </section>

            {/* License Upload */}
            <section className="space-y-5">
               <SectionTitle label="License, Certification Or Diploma (Optional)" desc="Gesellanbrief, Meisterbrief, or verified foreign equivalents" />
               <button className="w-full py-10 rounded-2xl bg-white border-2 border-dashed border-[#EAECF0] flex flex-col items-center justify-center gap-3 group hover:border-brand-orange transition-colors">
                  <div className="bg-[#1D2939]/5 p-3 rounded-2xl group-hover:bg-brand-orange group-hover:text-white transition-colors">
                    <Camera size={28} strokeWidth={1.5} />
                  </div>
                  <span className="text-[14px] font-poppins font-medium text-gray-500">Upload a photo of your license or certification</span>
               </button>
               <div className="flex gap-2 items-start bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
                  <ShieldCheck className="text-brand-orange shrink-0" size={20} />
                  <p className="text-[12px] font-poppins text-gray-700 leading-relaxed">
                    <span className="font-bold">Heads up:</span> Some tasks, like electrical wiring, can only be accepted if you provide a valid license or proof of qualification.
                  </p>
               </div>
            </section>

            {/* Work Photos */}
            <section className="space-y-5">
               <SectionTitle label="Add Photos Of Your Work" />
               <div className="flex flex-wrap gap-4">
                  <button className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#F6F6F6] border-2 border-dashed border-[#EAECF0] flex flex-col items-center justify-center gap-2 group hover:border-brand-orange transition-colors">
                    <Camera size={20} className="text-gray-400 group-hover:text-brand-orange" />
                    <span className="text-[12px] font-poppins font-medium text-gray-400">Upload</span>
                  </button>
               </div>
            </section>

            {/* Other Details */}
            <section className="space-y-6">
              <SectionTitle label="Other Details (Optional)" desc="These improve your chances at getting recurring roles but are not compulsory" />
              <Input 
                label="What do you do for work?" 
                placeholder="e.g Student or Baker" 
                value={trade} 
                onChange={setTrade} 
              />
              <div className="space-y-2">
                <Select 
                  label="What languages do you speak?" 
                  placeholder="Select" 
                  value=""
                  options={[{ label: 'English', value: 'English' }, { label: 'German', value: 'German' }]} 
                  onChange={(val) => !languages.includes(val) && setLanguages([...languages, val])} 
                />
                <div className="flex flex-wrap gap-2 mt-2">
                   {languages.map(l => <Tag key={l} label={l} onRemove={() => setLanguages(languages.filter(x => x !== l))} />)}
                </div>
              </div>
              <Input 
                label="Where do you Live?" 
                placeholder="e.g Bern, Germany" 
                value={location} 
                onChange={setLocation} 
              />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[14px] font-poppins text-gray-800">What makes you unique?</label>
                  <HelpCircle size={14} className="text-gray-400" />
                </div>
                <textarea 
                   className="w-full p-4 rounded-2xl bg-[#F6F6F6] border border-[#0000001A] outline-none min-h-[100px] font-poppins text-[15px] placeholder:text-gray-400"
                   placeholder="Eg. I like to make people feel relaxed with Relax people"
                   value={uniquePoint}
                   onChange={(e) => setUniquePoint(e.target.value)}
                />
              </div>
            </section>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h1 className="text-[28px] font-gerat font-bold text-[#1D2939]">Add Your Skills To Your Profile</h1>
              <p className="text-[14px] font-poppins text-[#667085]">Search and add your skills. (Max 5)</p>
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                readOnly
                placeholder="Search" 
                onClick={() => setIsSkillModalOpen(true)}
                className="w-full p-4 pl-12 rounded-2xl bg-[#F6F6F6] border border-[#EAECF0] outline-none font-poppins text-[15px] cursor-pointer"
              />
            </div>

            <button 
              onClick={() => setIsSkillModalOpen(true)}
              className="w-full py-4 rounded-2xl border-2 border-dashed border-[#EAECF0] flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
            >
              <div className="bg-[#1D2939]/5 p-1 rounded-full"><Plus size={16} /></div>
              <span className="text-[15px] font-poppins font-semibold text-[#1D2939]">Add new skill</span>
            </button>

            {selectedSkills.length > 0 && (
              <div className="space-y-4 pt-4">
                {selectedSkills.map((skill) => (
                   <div key={skill.id} className="relative rounded-2xl overflow-hidden border border-[#EAECF0]">
                      <div className="h-40 relative">
                        <Image src="/images/abt.jpg" alt={skill.name} fill className="object-cover" />
                        <button onClick={() => removeSkill(skill.id)} className="absolute top-3 right-3 bg-white/80 p-1.5 rounded-full text-red-500 hover:bg-white shadow-sm">
                          <X size={18} />
                        </button>
                      </div>
                      <div className="p-4">
                        <h3 className="text-[16px] font-gerat font-bold text-[#1D2939]">{skill.name}</h3>
                        <p className="text-[12px] font-poppins text-[#667085]">Includes planting, watering, and weeding.</p>
                      </div>
                   </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h1 className="text-[28px] font-gerat font-bold text-[#1D2939]">Add Your Rates</h1>
              <p className="text-[14px] font-poppins text-[#667085]">Set your pricing for each skill</p>
            </div>

            <div className="space-y-6">
              {selectedSkills.map((skill, idx) => (
                <div key={skill.id} className="p-6 rounded-3xl border border-[#EAECF0] bg-[#F9FAFB] space-y-6">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                        <Plus size={20} />
                      </div>
                      <h3 className="text-[18px] font-gerat font-bold text-[#1D2939]">{skill.name}</h3>
                   </div>
                   
                   <div className="flex gap-2 p-1 bg-white rounded-2xl border border-gray-100">
                      <button 
                        onClick={() => toggleRateType(idx, 'HOURLY')}
                        className={`flex-1 py-3.5 rounded-xl text-[14px] font-poppins font-bold transition-all ${skill.rateType === 'HOURLY' ? 'bg-brand-blue text-white shadow-md' : 'text-gray-500 hover:text-gray-800'}`}
                      >
                        Hourly Rate
                      </button>
                      <button 
                        onClick={() => toggleRateType(idx, 'FLAT')}
                        className={`flex-1 py-3.5 rounded-xl text-[14px] font-poppins font-bold transition-all ${skill.rateType === 'FLAT' ? 'bg-brand-blue text-white shadow-md' : 'text-gray-500 hover:text-gray-800'}`}
                      >
                        Flat Rate
                      </button>
                   </div>

                   <div className="relative">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[20px] font-poppins text-gray-400">$</span>
                     <input 
                       type="number" 
                       placeholder="0.00"
                       className="w-full p-4 pl-10 rounded-2xl bg-white border border-[#EAECF0] outline-none font-poppins text-[20px] font-bold text-[#1D2939]"
                       value={skill.price || ""}
                       onChange={(e) => {
                          const updated = [...selectedSkills];
                          updated[idx].price = e.target.value;
                          setSelectedSkills(updated);
                       }}
                     />
                     <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] font-poppins text-gray-400">
                       Per {skill.rateType === 'HOURLY' ? 'Hour' : 'Job'}
                     </span>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-[#F2F4F7] flex flex-col gap-3 max-w-2xl mx-auto z-40">
           <Button variant="primary" fullWidth onClick={handleNext} disabled={isLoading} className="py-4 rounded-2xl text-[16px]">
              {isLoading ? "Saving..." : step === 3 ? "Complete Profile" : "Next"}
           </Button>
           <button onClick={() => router.push("/tasker/dashboard")} className="text-[14px] font-poppins font-bold text-gray-500 hover:text-gray-800 py-1">
             Save draft
           </button>
        </div>

      </div>

      {/* Skill Selection Modal */}
      {isSkillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 animate-in fade-in duration-300">
           <div className="bg-white w-full h-[90vh] sm:max-w-xl sm:h-auto sm:max-h-[80vh] rounded-t-[32px] sm:rounded-[32px] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-500">
              <div className="p-6 border-b border-[#F2F4F7] flex items-center justify-between">
                <h2 className="text-[22px] font-gerat font-bold text-[#1D2939]">Add a new skill</h2>
                <button onClick={() => setIsSkillModalOpen(false)} className="p-1 hover:opacity-70"><X size={24} /></button>
              </div>
              <div className="p-6 border-b border-[#F2F4F7]">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search for skills..." 
                    className="w-full p-4 pl-12 rounded-2xl bg-[#F6F6F6] border border-[#EAECF0] outline-none font-poppins text-[15px]" 
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Categorized Skills */}
                <div>
                  <h3 className="text-[14px] font-poppins font-bold text-[#1D2939] mb-4 uppercase tracking-wider">Gardening & Outdoor</h3>
                  <div className="space-y-4">
                    {allAvailableSkills.filter(s => s.category === "Gardening & Outdoor").map(skill => (
                      <button 
                        key={skill.id} 
                        onClick={() => addSkill(skill)}
                        className="w-full flex items-center justify-between group text-left"
                      >
                         <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-orange-100/50 rounded-xl flex items-center justify-center text-brand-orange group-hover:bg-brand-orange group-hover:text-white transition-colors">
                               <Home size={28} strokeWidth={1.5} />
                            </div>
                            <div>
                               <p className="text-[15px] font-gerat font-bold text-[#1D2939]">{skill.name}</p>
                               <p className="text-[12px] font-poppins text-[#667085] line-clamp-1">Includes planting, watering, weeding</p>
                               <p className="text-[11px] font-poppins font-bold text-brand-orange bg-orange-50 px-2 py-0.5 rounded-full inline-block mt-1">{skill.rate}</p>
                            </div>
                         </div>
                         <ChevronLeft className="rotate-180 text-gray-300" size={20} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-[14px] font-poppins font-bold text-[#1D2939] mb-4 uppercase tracking-wider">Cleaning</h3>
                  <div className="space-y-4">
                    {allAvailableSkills.filter(s => s.category === "Cleaning").map(skill => (
                      <button 
                        key={skill.id} 
                        onClick={() => addSkill(skill)}
                        className="w-full flex items-center justify-between group text-left"
                      >
                         <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-orange-100/50 rounded-xl flex items-center justify-center text-brand-orange group-hover:bg-brand-orange group-hover:text-white transition-colors">
                               <Hammer size={28} strokeWidth={1.5} />
                            </div>
                            <div>
                               <p className="text-[15px] font-gerat font-bold text-[#1D2939]">{skill.name}</p>
                               <p className="text-[12px] font-poppins text-[#667085] line-clamp-1">Professional home cleaning services</p>
                               <p className="text-[11px] font-poppins font-bold text-brand-orange bg-orange-50 px-2 py-0.5 rounded-full inline-block mt-1">{skill.rate}</p>
                            </div>
                         </div>
                         <ChevronLeft className="rotate-180 text-gray-300" size={20} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
           </div>
        </div>
      )}

      {/* Floating help button */}
      <button className="fixed bottom-44 right-6 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-[20px] font-bold border border-[#EAECF0] z-30">
        ?
      </button>

    </main>
  );
};

export default CompleteProfilePage;
