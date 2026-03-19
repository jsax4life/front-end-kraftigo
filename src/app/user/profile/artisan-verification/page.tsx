"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import axios from "axios";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Camera, 
  Plus, 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  Briefcase, 
  GraduationCap, 
  Upload,
  Info
} from "lucide-react";
import Header from "@/components/shared/Header";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import { useProfileStore } from "@/store/useProfileStore";
import toast from "react-hot-toast";

const steps = [
  { id: 1, title: "Introduction" },
  { id: 2, title: "Complete Profile" },
  { id: 3, title: "Verification" },
  { id: 4, title: "Skills & More" },
  { id: 5, title: "Portfolio" },
  { id: 6, title: "Review" },
];

export default function ArtisanVerificationPage() {
  const router = useRouter();
  const { submitVerification, startKyc, getProfilePhotoUploadUrl, isLoading } = useProfileStore();
  const [currentStep, setCurrentStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [langInput, setLangInput] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [verificationUrl, setVerificationUrl] = useState("");
  
  const [formData, setFormData] = useState({
    legalFullName: "",
    displayName: "",
    profilePhoto: null as File | null,
    profilePhotoPreview: "" as string,
    languages: [] as string[],
    baseCity: "",
    postalCode: "",
    travelRadiusKm: 10,
    primaryTrade: "",
    secondarySkills: [] as string[],
    yearsExperienceHomeCountry: 0,
    yearsExperienceCurrentCountry: 0,
    certifications: [] as { name: string; issuer: string; issueDate: string; expiryDate: string }[],
    toolsOwned: false,
    transportType: "NONE",
    taxOrVatId: "",
    bio: "",
    countryOfResidence: "DE",
    governmentIdType: "passport",
    governmentIdNumber: "",
    governmentIdDocument: null as File | null,
    idCard: null as File | null,
    employmentStatus: "SELF_EMPLOYED",
    businessRegistrationNumber: "",
    vatId: "",
    skillsAndExpertise: [] as { skill: string; hourlyRate: number }[],
    portfolioPhotos: [] as File[],
    portfolioPreviews: [] as string[],
    uniqueSellingPoint: ""
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: string, file: File | null) => {
    if (!file) return;
    const previewField = `${field}Preview`;
    setFormData(prev => ({
      ...prev,
      [field]: file,
      [previewField]: URL.createObjectURL(file)
    }));
  };

  const handleArrayFileChange = (field: string, files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    const previews = newFiles.map(file => URL.createObjectURL(file));
    
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field as keyof typeof prev] as File[]), ...newFiles],
      [`${field}Previews`]: [...(prev[`${field}Previews` as keyof typeof prev] as string[] || []), ...previews]
    }));
  };

  const addCertification = () => {
    setFormData(prev => ({
      ...prev,
      certifications: [...prev.certifications, { name: "", issuer: "", issueDate: "", expiryDate: "" }]
    }));
  };

  const addSkillExpertise = () => {
    if (formData.skillsAndExpertise.length >= 5) {
      toast.error("Maximum 5 skills allowed");
      return;
    }
    setFormData(prev => ({
      ...prev,
      skillsAndExpertise: [...prev.skillsAndExpertise, { skill: "", hourlyRate: 30 }]
    }));
  };

  const handleStartKyc = async () => {
    try {
      if (verificationUrl) {
        window.location.href = verificationUrl;
        return;
      }
      const result = await startKyc();
      if (result.verificationUrl) {
         window.location.href = result.verificationUrl;
      } else {
         toast.error("Could not start identity verification. Please try again later.");
      }
    } catch (error) {
      toast.error("Failed to start identity verification");
    }
  };

  const handleUploadToS3 = async (file: File) => {
    try {
      const { uploadUrl, publicUrl } = await getProfilePhotoUploadUrl(
        file.name,
        file.type,
        file.size
      );

      await axios.put(uploadUrl, file, {
        headers: {
          'Content-Type': file.type,
        },
      });

      return publicUrl;
    } catch (error) {
      console.error("Direct upload failed:", error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    try {
      const data = new FormData();
      
      let profilePhotoUrl = "";
      if (formData.profilePhoto) {
         toast.loading("Uploading profile photo...", { id: "uploading" });
         profilePhotoUrl = await handleUploadToS3(formData.profilePhoto);
         toast.success("Photo uploaded!", { id: "uploading" });
      }

      // Basic Fields
      data.append('legalFullName', formData.legalFullName);
      data.append('displayName', formData.displayName);
      data.append('baseCity', formData.baseCity);
      data.append('postalCode', formData.postalCode);
      data.append('travelRadiusKm', formData.travelRadiusKm.toString());
      data.append('primaryTrade', formData.primaryTrade);
      data.append('yearsExperienceHomeCountry', formData.yearsExperienceHomeCountry.toString());
      data.append('yearsExperienceCurrentCountry', formData.yearsExperienceCurrentCountry.toString());
      data.append('toolsOwned', formData.toolsOwned.toString());
      data.append('transportType', formData.transportType);
      data.append('taxOrVatId', formData.taxOrVatId);
      data.append('bio', formData.bio);
      data.append('countryOfResidence', formData.countryOfResidence);
      data.append('businessRegistrationNumber', formData.businessRegistrationNumber);
      data.append('vatId', formData.vatId);
      data.append('governmentIdType', formData.governmentIdType);
      data.append('governmentIdNumber', formData.governmentIdNumber);
      data.append('employmentStatus', formData.employmentStatus);
      data.append('uniqueSellingPoint', formData.uniqueSellingPoint);

      // JSON Fields
      data.append('languages', JSON.stringify(formData.languages));
      data.append('secondarySkills', JSON.stringify(formData.secondarySkills));
      data.append('certifications', JSON.stringify(formData.certifications));
      data.append('skillsAndExpertise', JSON.stringify(formData.skillsAndExpertise));
      
      // Map certifications/expertise to skillDocuments as required by Swagger
      const skillDocs = formData.skillsAndExpertise.map(s => ({ type: 'skill', name: s.skill }));
      data.append('skillDocuments', JSON.stringify(skillDocs));

      // Use the uploaded photo URL instead of the binary
      if (profilePhotoUrl) data.append('profilePhotoUrl', profilePhotoUrl);

      // Files (keeping others as binary unless there are more presigned endpoints)
      if (formData.governmentIdDocument) data.append('governmentIdDocument', formData.governmentIdDocument);
      if (formData.idCard) data.append('idCard', formData.idCard);
      
      formData.portfolioPhotos.forEach((file) => {
        data.append('portfolioPhotos', file);
      });

      await submitVerification(data);
      toast.success("Verification form submitted successfully!");
      setHasSubmitted(true);
      
      // Pre-fetch KYC session URL
      try {
        const result = await startKyc();
        if (result.verificationUrl) setVerificationUrl(result.verificationUrl);
      } catch (e) {
        console.error("KYC pre-fetch error:", e);
      }
    } catch (error) {
      toast.error("Failed to submit verification");
    }
  };

  const renderIntroduction = () => (
    <div className="fixed inset-0 bg-[#00000080] z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-[500px] rounded-t-3xl sm:rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-500">
        <div className="p-8 text-center bg-brand-cream relative">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-brand-orange text-white rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
              <ShieldCheck size={40} />
            </div>
          </div>
          <h2 className="text-[28px] font-gerat font-bold text-[#1D2939] mb-2 leading-tight">
            Become a Crafter
          </h2>
          <p className="text-[14px] font-poppins text-[#667085] max-w-[300px] mx-auto">
            Join our community of skilled professionals and start earning today.
          </p>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h4 className="text-[16px] font-gerat font-bold text-[#1D2939]">Verify your Profile</h4>
                <p className="text-[13px] font-poppins text-[#667085]">Help customers trust you by verifying your details.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                <Briefcase size={24} />
              </div>
              <div>
                <h4 className="text-[16px] font-gerat font-bold text-[#1D2939]">License & Certifications</h4>
                <p className="text-[13px] font-poppins text-[#667085]">Share your professional background and tools.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                <Plus size={24} />
              </div>
              <div>
                <h4 className="text-[16px] font-gerat font-bold text-[#1D2939]">Setup your Skills</h4>
                <p className="text-[13px] font-poppins text-[#667085]">Define your services and set your own rates.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h4 className="text-[16px] font-gerat font-bold text-[#1D2939]">Final Approval</h4>
                <p className="text-[13px] font-poppins text-[#667085]">Our team will review and activate your account.</p>
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-col gap-4">
            <Button 
                variant="primary" 
                fullWidth 
                onClick={() => setCurrentStep(2)}
                className="py-4 text-[16px] font-gerat font-bold"
            >
              Let's Get Started
            </Button>
            <button 
                onClick={() => router.back()}
                className="text-[14px] font-poppins text-[#667085] hover:text-[#1D2939] transition-colors"
            >
                Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProfileStep = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-5">
      <div className="text-center">
        <h2 className="text-[24px] font-gerat font-bold text-[#1D2939]">Complete Your Profile</h2>
        <p className="text-[14px] font-poppins text-[#667085]">Tell us about yourself to build your craft reputation.</p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div 
            className="w-32 h-32 rounded-full border-4 border-brand-orange border-dashed flex items-center justify-center p-1 cursor-pointer group relative overflow-hidden transition-all hover:scale-105"
            onClick={() => fileInputRef.current?.click()}
        >
          {formData.profilePhotoPreview ? (
            <Image src={formData.profilePhotoPreview} alt="Preview" fill className="object-cover rounded-full" />
          ) : (
            <div className="w-full h-full bg-gray-50 rounded-full flex flex-col items-center justify-center">
              <Camera size={32} className="text-gray-300 group-hover:text-brand-orange transition-colors" />
              <span className="text-[10px] text-gray-400 font-bold mt-1">UPLOAD</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Upload size={24} className="text-white" />
          </div>
        </div>
        <input 
          ref={fileInputRef}
          type="file" 
          hidden 
          accept="image/*"
          onChange={(e) => handleFileChange('profilePhoto', e.target.files?.[0] || null)}
        />
        <span className="text-[14px] font-poppins font-medium text-gray-500">Pick a clear, smiling photo!</span>
      </div>

      <div className="space-y-6 bg-white p-6 rounded-3xl border border-[#F2F4F7]">
        <Input 
          label="Legal Full Name" 
          placeholder="As shown on your ID" 
          value={formData.legalFullName}
          onChange={(v) => handleInputChange('legalFullName', v)}
          required
        />
        <Input 
          label="Display Name" 
          placeholder="How customers will see you" 
          value={formData.displayName}
          onChange={(v) => handleInputChange('displayName', v)}
          required
        />
        
        <div>
           <label className="text-[14px] font-mabry text-gray-800 mb-2 block">Professional Bio</label>
           <textarea 
            className="w-full h-32 px-4 py-3 bg-[#F6F6F6] rounded-xl border border-[#0000001A] outline-none text-[14px] font-poppins transition-all focus:ring-1 focus:ring-brand-orange"
            placeholder="Tell customers why you're the best for the job..."
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
           />
        </div>

        <Input 
          label="Town/City" 
          placeholder="Specify your city" 
          value={formData.baseCity}
          onChange={(v) => handleInputChange('baseCity', v)}
          required
        />
        
        <Input 
          label="Postal Code" 
          placeholder="e.g. 10115" 
          value={formData.postalCode}
          onChange={(v) => handleInputChange('postalCode', v)}
          required
        />

        <div className="space-y-3">
          <label className="text-[14px] font-mabry text-gray-800">Languages</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.languages.map((lang, idx) => (
              <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[12px] font-bold flex items-center gap-1 animate-in zoom-in-50">
                {lang}
                <X size={14} className="cursor-pointer" onClick={() => {
                  const newLangs = [...formData.languages];
                  newLangs.splice(idx, 1);
                  handleInputChange('languages', newLangs);
                }} />
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input 
              placeholder="Add a language (e.g. English)" 
              value={langInput}
              onChange={(v) => setLangInput(v)}
              className="flex-1"
            />
            <Button 
                variant="primary" 
                className="w-12 h-12 flex items-center justify-center p-0"
                onClick={() => {
                   if (langInput && !formData.languages.includes(langInput)) {
                       handleInputChange('languages', [...formData.languages, langInput]);
                       setLangInput("");
                   }
                }}
            >
                <Plus size={20} />
            </Button>
          </div>
        </div>

        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <label className="text-[14px] font-mabry text-gray-800">Travel Radius (Km)</label>
                <span className="text-brand-orange font-bold font-gerat">{formData.travelRadiusKm} km</span>
            </div>
            <input 
                type="range" 
                min="0" 
                max="100" 
                step="5"
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-orange"
                value={formData.travelRadiusKm}
                onChange={(e) => handleInputChange('travelRadiusKm', parseInt(e.target.value))}
            />
            <div className="flex justify-between text-[11px] text-gray-400 font-poppins">
                <span>0 km</span>
                <span>50 km</span>
                <span>100 km</span>
            </div>
        </div>
      </div>
    </div>
  );

  const renderDocumentsStep = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-5">
      <div className="text-center">
        <h2 className="text-[24px] font-gerat font-bold text-[#1D2939]">Identity Verification</h2>
        <p className="text-[14px] font-poppins text-[#667085]">Upload your documents to unlock trust with customers.</p>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-[#F2F4F7] space-y-6">
        <Select 
          label="Country of residence" 
          value={formData.countryOfResidence}
          onChange={(v) => handleInputChange('countryOfResidence', v)}
          options={[
            { value: "DE", label: "Germany" },
            { value: "NG", label: "Nigeria" },
            { value: "UK", label: "United Kingdom" },
            { value: "US", label: "United States" },
          ]}
          required
        />

        <Select 
          label="ID Type" 
          value={formData.governmentIdType}
          onChange={(v) => handleInputChange('governmentIdType', v)}
          options={[
            { value: "passport", label: "Passport" },
            { value: "driver_license", label: "Driver's License" },
            { value: "national_id", label: "National ID Card" },
          ]}
          required
        />

        <Input 
          label="ID Number" 
          placeholder="Enter ID document number" 
          value={formData.governmentIdNumber}
          onChange={(v) => handleInputChange('governmentIdNumber', v)}
        />

        <div className="space-y-2">
            <label className="text-[14px] font-mabry text-gray-800">Government ID Document</label>
            <div 
                className="w-full aspect-video bg-[#F6F6F6] rounded-2xl border-2 border-dashed border-[#0000001A] flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-gray-100 transition-colors group"
                onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*,application/pdf';
                    input.onchange = (e) => handleFileChange('governmentIdDocument', (e.target as HTMLInputElement).files?.[0] || null);
                    input.click();
                }}
            >
                {formData.governmentIdDocument ? (
                    <div className="flex flex-col items-center">
                        <CheckCircle2 size={40} className="text-green-500 mb-2" />
                        <span className="text-[12px] font-poppins text-gray-600 truncate max-w-[200px]">
                            {formData.governmentIdDocument.name}
                        </span>
                    </div>
                ) : (
                    <>
                        <Upload size={32} className="text-gray-300 group-hover:text-brand-orange transition-colors mb-2" />
                        <span className="text-[14px] font-poppins text-gray-400">Upload Front Page</span>
                    </>
                )}
            </div>
        </div>

        <div className="space-y-2">
            <label className="text-[14px] font-mabry text-gray-800">Secondary ID (Optional)</label>
            <div 
                className="w-full aspect-video bg-[#F6F6F6] rounded-2xl border-2 border-dashed border-[#0000001A] flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-gray-100 transition-colors group"
                onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*,application/pdf';
                    input.onchange = (e) => handleFileChange('idCard', (e.target as HTMLInputElement).files?.[0] || null);
                    input.click();
                }}
            >
                {formData.idCard ? (
                    <div className="flex flex-col items-center">
                        <CheckCircle2 size={40} className="text-green-500 mb-2" />
                        <span className="text-[12px] font-poppins text-gray-600">Document Uploaded</span>
                    </div>
                ) : (
                    <>
                        <Upload size={32} className="text-gray-300 group-hover:text-brand-orange transition-colors mb-2" />
                        <span className="text-[14px] font-poppins text-gray-400">Take a photo of back/other page</span>
                    </>
                )}
            </div>
        </div>
      </div>
    </div>
  );

  const renderExpertiseStep = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-5">
      <div className="text-center">
        <h2 className="text-[24px] font-gerat font-bold text-[#1D2939]">Craft & Expertise</h2>
        <p className="text-[14px] font-poppins text-[#667085]">Define what you're good at and your experience.</p>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-[#F2F4F7] space-y-6">
        <Select 
          label="Primary Trade" 
          value={formData.primaryTrade}
          onChange={(v) => handleInputChange('primaryTrade', v)}
          options={[
            { value: "plumbing", label: "Plumbing" },
            { value: "electrical", label: "Electrical" },
            { value: "carpentry", label: "Carpentry" },
            { value: "cleaning", label: "Cleaning" },
            { value: "moving", label: "Moving" },
            { value: "painting", label: "Painting" },
            { value: "landscaping", label: "Landscaping" },
          ]}
          required
        />

        <div className="space-y-3">
          <label className="text-[14px] font-mabry text-gray-800">Secondary Skills</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.secondarySkills.map((skill, idx) => (
              <span key={idx} className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[12px] font-bold flex items-center gap-1 animate-in zoom-in-50">
                {skill}
                <X size={14} className="cursor-pointer" onClick={() => {
                  const newSkills = [...formData.secondarySkills];
                  newSkills.splice(idx, 1);
                  handleInputChange('secondarySkills', newSkills);
                }} />
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input 
              placeholder="Add secondary skill (e.g. Tiling)" 
              value={skillInput}
              onChange={(v) => setSkillInput(v)}
              className="flex-1"
            />
            <Button 
                variant="primary" 
                className="w-12 h-12 flex items-center justify-center p-0"
                onClick={() => {
                   if (skillInput && !formData.secondarySkills.includes(skillInput)) {
                       handleInputChange('secondarySkills', [...formData.secondarySkills, skillInput]);
                       setSkillInput("");
                   }
                }}
            >
                <Plus size={20} />
            </Button>
          </div>
        </div>

        <div className="space-y-4">
            <label className="text-[14px] font-mabry text-gray-800">Employment Status</label>
            <div className="grid grid-cols-2 gap-3">
                {['SELF_EMPLOYED', 'FREELANCING'].map((status) => (
                    <button
                        key={option.id}
                        onClick={() => handleInputChange('employmentStatus', option.id)}
                        className={`py-4 px-2 rounded-xl text-[13px] font-gerat font-bold transition-all border ${
                            formData.employmentStatus === option.id 
                            ? 'bg-brand-orange text-white border-brand-orange shadow-md scale-[1.02]' 
                            : 'bg-[#F6F6F6] text-gray-600 border-transparent hover:border-gray-200'
                        }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
            
            {formData.employmentStatus === 'REGISTERED_BUSINESS' && (
              <div className="space-y-4 pt-2 animate-in fade-in duration-300">
                <Input 
                  label="Business Registration Number" 
                  placeholder="Enter number" 
                  value={formData.businessRegistrationNumber}
                  onChange={(v) => handleInputChange('businessRegistrationNumber', v)}
                  required
                />
                <Input 
                  label="VAT ID" 
                  placeholder="Enter VAT ID" 
                  value={formData.vatId}
                  onChange={(v) => handleInputChange('vatId', v)}
                  required
                />
              </div>
            )}
        </div>

        <div className="grid grid-cols-2 gap-4">
            <Input 
                label="Years of Experience (Total)" 
                type="number"
                placeholder="Years" 
                value={formData.yearsExperienceHomeCountry.toString()}
                onChange={(v) => handleInputChange('yearsExperienceHomeCountry', parseInt(v) || 0)}
            />
            <Input 
                label="Years in Germany" 
                type="number"
                placeholder="Years" 
                value={formData.yearsExperienceCurrentCountry.toString()}
                onChange={(v) => handleInputChange('yearsExperienceCurrentCountry', parseInt(v) || 0)}
            />
        </div>

        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="text-[14px] font-mabry text-gray-800">Certification</label>
                <button 
                    onClick={addCertification}
                    className="text-brand-orange flex items-center gap-1 text-[12px] font-bold hover:underline"
                >
                    <Plus size={14} /> Add more
                </button>
            </div>
            {formData.certifications.map((cert, index) => (
                <div key={index} className="p-4 bg-[#F9FAFB] rounded-2xl relative space-y-3">
                    <button 
                        onClick={() => {
                            const newCerts = [...formData.certifications];
                            newCerts.splice(index, 1);
                            handleInputChange('certifications', newCerts);
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm"
                    >
                        <X size={14} />
                    </button>
                    <Input 
                        placeholder="Certificate Name" 
                        value={cert.name}
                        onChange={(v) => {
                            const newCerts = [...formData.certifications];
                            newCerts[index].name = v;
                            handleInputChange('certifications', newCerts);
                        }}
                    />
                    <Input 
                        placeholder="Issuer" 
                        value={cert.issuer}
                        onChange={(v) => {
                            const newCerts = [...formData.certifications];
                            newCerts[index].issuer = v;
                            handleInputChange('certifications', newCerts);
                        }}
                    />
                </div>
            ))}
        </div>

        <div className="flex items-center justify-between p-4 bg-[#F6F6F6] rounded-2xl">
            <div className="flex items-center gap-2">
                <Briefcase size={20} className="text-gray-400" />
                <span className="text-[14px] font-poppins text-gray-700">Own professional tools?</span>
            </div>
            <button 
                onClick={() => handleInputChange('toolsOwned', !formData.toolsOwned)}
                className={`w-12 h-6 rounded-full transition-colors relative ${formData.toolsOwned ? 'bg-brand-orange' : 'bg-gray-300'}`}
            >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.toolsOwned ? 'left-7' : 'left-1'}`}></div>
            </button>
        </div>

        <Select 
            label="Transport Type" 
            value={formData.transportType}
            onChange={(v) => handleInputChange('transportType', v)}
            options={[
                { value: "NONE", label: "None" },
                { value: "BIKE", label: "Bike" },
                { value: "CAR", label: "Car" },
                { value: "VAN", label: "Van" },
            ]}
        />
      </div>
    </div>
  );

  const renderPortfolioStep = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-5">
      <div className="text-center">
        <h2 className="text-[24px] font-gerat font-bold text-[#1D2939]">Portfolio & Skills</h2>
        <p className="text-[14px] font-poppins text-[#667085]">Showcase your best work and set your rates.</p>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-[#F2F4F7] space-y-6">
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="text-[14px] font-mabry text-gray-800">Skills & Rates</label>
                <button 
                    onClick={addSkillExpertise}
                    className="text-brand-orange flex items-center gap-1 text-[12px] font-bold hover:underline"
                >
                    <Plus size={14} /> Add Skill
                </button>
            </div>
            <p className="text-[11px] text-gray-400 font-poppins"><Info size={12} className="inline mr-1" /> Add up to 5 specific skills and your hourly rates.</p>
            
            {formData.skillsAndExpertise.map((item, index) => (
                <div key={index} className="flex gap-3 items-center">
                    <div className="flex-2">
                        <Input 
                            placeholder="e.g. Toilet Repair" 
                            value={item.skill}
                            onChange={(v) => {
                                const newSkills = [...formData.skillsAndExpertise];
                                newSkills[index].skill = v;
                                handleInputChange('skillsAndExpertise', newSkills);
                            }}
                        />
                    </div>
                    <div className="flex-1 relative">
                        <Input 
                            type="number"
                            placeholder="Rate" 
                            value={item.hourlyRate.toString()}
                            onChange={(v) => {
                                const newSkills = [...formData.skillsAndExpertise];
                                newSkills[index].hourlyRate = parseInt(v) || 0;
                                handleInputChange('skillsAndExpertise', newSkills);
                            }}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-poppins">/hr</span>
                    </div>
                    <button 
                         onClick={() => {
                            const newSkills = [...formData.skillsAndExpertise];
                            newSkills.splice(index, 1);
                            handleInputChange('skillsAndExpertise', newSkills);
                        }}
                        className="p-2 text-gray-300 hover:text-red-500"
                    >
                        <X size={18} />
                    </button>
                </div>
            ))}
        </div>

        <div className="space-y-3">
            <label className="text-[14px] font-mabry text-gray-800">Unique Selling Point</label>
            <Input 
                placeholder="What makes you stand out?" 
                value={formData.uniqueSellingPoint}
                onChange={(v) => handleInputChange('uniqueSellingPoint', v)}
            />
        </div>

        <div className="space-y-4">
            <label className="text-[14px] font-mabry text-gray-800">Portfolio Photos</label>
            <div className="grid grid-cols-3 gap-2">
                {formData.portfolioPreviews.map((src, idx) => (
                    <div key={idx} className="aspect-square rounded-xl relative group overflow-hidden border border-gray-100">
                        <Image src={src} alt="Work" fill className="object-cover" />
                        <button 
                            onClick={() => {
                                const newFiles = [...formData.portfolioPhotos];
                                const newPreviews = [...formData.portfolioPreviews];
                                newFiles.splice(idx, 1);
                                newPreviews.splice(idx, 1);
                                setFormData(prev => ({ ...prev, portfolioPhotos: newFiles, portfolioPreviews: newPreviews }));
                            }}
                            className="absolute top-1 right-1 w-5 h-5 bg-white/80 rounded-full flex items-center justify-center text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X size={12} />
                        </button>
                    </div>
                ))}
                {formData.portfolioPhotos.length < 10 && (
                    <button 
                        onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.multiple = true;
                            input.accept = 'image/*';
                            input.onchange = (e) => handleArrayFileChange('portfolioPhotos', (e.target as HTMLInputElement).files);
                            input.click();
                        }}
                        className="aspect-square bg-gray-50 rounded-xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-300 hover:border-brand-orange hover:text-brand-orange transition-all"
                    >
                        <Plus size={24} />
                        <span className="text-[10px] font-bold mt-1">ADD</span>
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentStep) {
      case 1: return renderIntroduction();
      case 2: return renderProfileStep();
      case 3: return renderDocumentsStep();
      case 4: return renderExpertiseStep();
      case 5: return renderPortfolioStep();
      case 6: return hasSubmitted ? (
        <div className="text-center space-y-8 animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 size={48} />
            </div>
            <div className="space-y-4">
                <h2 className="text-[28px] font-gerat font-bold text-[#1D2939]">Form Submitted!</h2>
                <p className="text-[14px] font-poppins text-[#667085] max-w-[320px] mx-auto leading-relaxed">
                    Your professional details have been secured. The final step is to verify your identity.
                </p>
            </div>
            
            <div className="bg-white p-6 rounded-[32px] border border-[#00000008] shadow-sm text-left space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                        <ShieldCheck size={18} />
                    </div>
                    <p className="text-[14px] font-gerat font-bold text-[#1D2939]">Form Secured</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                        <CheckCircle2 size={18} />
                    </div>
                    <p className="text-[14px] font-gerat font-bold text-[#1D2939]">Profile Details Uploaded</p>
                </div>
            </div>

            <Button 
                onClick={handleStartKyc}
                fullWidth 
                className="py-4 rounded-2xl h-14 text-[16px] flex items-center justify-center gap-2"
            >
                <Camera size={20} />
                Start identity verification
            </Button>
        </div>
      ) : (
        <div className="text-center space-y-8 animate-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <ShieldCheck size={48} />
            </div>
            <div className="space-y-2">
                <h2 className="text-[28px] font-gerat font-bold text-[#1D2939]">All Set!</h2>
                <p className="text-[14px] font-poppins text-[#667085] max-w-[280px] mx-auto">
                    Review your information below before submitting for approval.
                </p>
            </div>
            
            <div className="bg-white p-6 rounded-3xl border border-[#F2F4F7] text-left space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                    <span className="text-gray-400 font-poppins text-[13px]">Full Name</span>
                    <span className="font-gerat font-bold text-[14px]">{formData.legalFullName}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-gray-0">
                    <span className="text-gray-400 font-poppins text-[13px]">Primary Trade</span>
                    <span className="font-gerat font-bold text-[14px] capitalize">{formData.primaryTrade}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-poppins text-[13px]">Rate Base</span>
                    <span className="font-gerat font-bold text-[14px]">€{formData.skillsAndExpertise[0]?.hourlyRate || 30}/hr</span>
                </div>
            </div>

            <div className="p-4 bg-orange-50 rounded-2xl flex gap-3 text-left">
                <Info size={20} className="text-brand-orange shrink-0" />
                <p className="text-[12px] font-poppins text-brand-orange leading-relaxed">
                    By submitting, you agree that all information provided is accurate. Our team typically reviews applications within 2-3 business days.
                </p>
            </div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <main className="relative w-full min-h-screen bg-[#F9FAFB] pb-32">
      <Header 
        title={currentStep === 1 ? "Become a Crafter" : steps.find(s => s.id === currentStep)?.title || "Verification"} 
        showBack={currentStep > 1}
        onBack={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
      />

      <div className="max-w-[500px] mx-auto px-4 py-8">
        {currentStep > 1 && (
            <div className="flex justify-center mb-8 gap-2">
                {steps.slice(1).map((s) => (
                    <div 
                        key={s.id} 
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                            currentStep === s.id ? 'w-8 bg-brand-orange' : 
                            currentStep > s.id ? 'w-4 bg-green-500' : 'w-4 bg-gray-200'
                        }`}
                    />
                ))}
            </div>
        )}

        {renderContent()}

        {currentStep > 1 && (
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-gray-100 z-40">
                <div className="max-w-[500px] mx-auto">
                    <Button
                        variant="primary"
                        fullWidth
                        disabled={isLoading}
                        onClick={() => {
                            if (currentStep === 6) {
                                handleSubmit();
                            } else {
                                // Validation can be added here
                                setCurrentStep(currentStep + 1);
                                window.scrollTo(0, 0);
                            }
                        }}
                    >
                        {isLoading ? "Submitting..." : currentStep === 6 ? "Submit Application" : "Continue"}
                    </Button>
                </div>
            </div>
        )}
      </div>
    </main>
  );
}
