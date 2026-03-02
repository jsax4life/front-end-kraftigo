"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Plus, CreditCard, ChevronRight, X, Lock, Info, Trash2, Camera, MapPin } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

type Screen = 'list' | 'choice' | 'card-form' | 'sepa-form' | 'paypal' | 'edit-card' | 'address-form';

interface PaymentMethod {
  id: string;
  type: 'card' | 'sepa' | 'paypal' | 'google';
  name: string;
  details: string;
  address?: string;
  isDefault?: boolean;
}

interface ShippingAddress {
  id: string;
  name: string;
  details: string;
  isDefault?: boolean;
  zipCode?: string;
  country?: string;
}

const PaymentMethodsPage = () => {
  const router = useRouter();
  const [currentScreen, setCurrentScreen] = useState<Screen>("list");
  const [methods, setMethods] = useState<PaymentMethod[]>([
    {
      id: "1",
      type: "card",
      name: "John Doe",
      details: "1234 **** **** **** **** 9898",
      address: "34th Str, Applebees, Berlin",
      isDefault: true,
    },
  ]);
  const [addresses, setAddresses] = useState<ShippingAddress[]>([
    {
      id: "1",
      name: "John Doe",
      details: "34th Str, Applebees, Berlin.",
      isDefault: true,
      zipCode: "10115",
      country: "Germany",
    },
  ]);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [editingAddress, setEditingAddress] = useState<ShippingAddress | null>(null);

  // Form states
  const [cardData, setCardData] = useState({ number: "", expires: "", cv: "", name: "", zip: "", country: "Germany" });
  const [addressData, setAddressData] = useState({ name: "", details: "", zip: "", city: "Berlin", country: "Germany" });

  useEffect(() => {
    if (editingAddress) {
      setAddressData({
        name: editingAddress.name,
        details: editingAddress.details,
        zip: editingAddress.zipCode || "",
        city: "Berlin",
        country: editingAddress.country || "Germany"
      });
    } else {
      setAddressData({ name: "", details: "", zip: "", city: "Berlin", country: "Germany" });
    }
  }, [editingAddress]);

  const handleBack = () => {
    if (currentScreen === "list") {
      router.back();
    } else {
      setCurrentScreen("list");
      setEditingMethod(null);
      setEditingAddress(null);
    }
  };

  const addMethod = (method: PaymentMethod) => {
    setMethods([...methods, method]);
    setCurrentScreen("list");
    toast.success("Payment method added successfully");
  };

  const removeMethod = (id: string) => {
    setMethods(methods.filter((m) => m.id !== id));
    setCurrentScreen("list");
    toast.success("Payment method removed");
  };

  const saveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressData.name || !addressData.details) {
      toast.error("Please fill in all required fields");
      return;
    }

    const newAddress: ShippingAddress = {
      id: editingAddress?.id || Date.now().toString(),
      name: addressData.name,
      details: addressData.details,
      isDefault: editingAddress?.isDefault || addresses.length === 0,
      zipCode: addressData.zip,
      country: addressData.country,
    };

    if (editingAddress) {
      setAddresses(addresses.map(a => a.id === editingAddress.id ? newAddress : a));
      toast.success("Address updated");
    } else {
      setAddresses([...addresses, newAddress]);
      toast.success("Address added");
    }
    setCurrentScreen("list");
    setEditingAddress(null);
  };

  const removeAddress = (id: string) => {
    setAddresses(addresses.filter((a) => a.id !== id));
    setCurrentScreen("list");
    toast.success("Address removed");
    setEditingAddress(null);
  };

  return (
    <main className="min-h-screen bg-white font-poppins text-[#1D2939]">
      <Toaster position="top-center" />
      
      {/* List Screen */}
      {currentScreen === "list" && (
        <div className="px-6 pt-16 flex flex-col min-h-screen animate-in fade-in duration-300">
          <div className="flex flex-col gap-6 mb-10">
            <button onClick={handleBack} className="p-2 -ml-2 w-fit">
              <ArrowLeft size={24} className="text-[#1D2939]" />
            </button>
            <h1 className="text-[20px] font-gerat font-[850] text-black/80 tracking-[-0.03em] capitalize">
              Payment & Addresses
            </h1>
          </div>

          <div className="flex-1 flex flex-col gap-10">
            {/* Payment Methods Section */}
            <div className="flex flex-col">
              <h2 className="text-[12px] font-bold text-black/80 mb-4">
                Saved Payment Methods
              </h2>
              {methods.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 bg-[#F6F6F6] rounded-[12px] border border-black/10">
                  <p className="text-[12px] text-black/60 mb-6 font-medium">
                    You have not added any payment methods
                  </p>
                  <button
                    onClick={() => setCurrentScreen("choice")}
                    className="flex items-center gap-2 text-[#0000FF] font-bold text-[14px]"
                  >
                    <Plus size={18} />
                    <span>add new</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {methods.map((method) => (
                    <div
                      key={method.id}
                      onClick={() => {
                        setEditingMethod(method);
                        setCurrentScreen("edit-card");
                      }}
                      className="flex flex-col p-[12px] bg-[#F6F6F6] border border-black/10 rounded-[12px] cursor-pointer active:scale-[0.98] transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-[34px] h-[22px] relative">
                          {method.type === "card" && (
                            <div className="w-full h-full bg-[#FF0000]/10 rounded flex items-center justify-center">
                              <div className="flex -space-x-1">
                                <div className="w-3 h-3 rounded-full bg-[#EB001B]" />
                                <div className="w-3 h-3 rounded-full bg-[#F79E1B] opacity-80" />
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="w-[18px] h-[18px] rounded-full border border-black/10 flex items-center justify-center bg-white">
                          {method.isDefault && (
                            <div className="w-[10px] h-[10px] rounded-full bg-[#0B0B0B]" />
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[14px] font-bold text-black/90 leading-tight">
                          {method.name}
                        </p>
                        <p className="text-[14px] text-black/90 leading-tight">
                          {method.details}
                        </p>
                        <p className="text-[12px] text-black/60 leading-tight">
                          {method.address}
                        </p>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => setCurrentScreen("choice")}
                    className="w-full h-[52px] bg-[#0000FF] rounded-[12px] text-white font-bold text-[14px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform mt-2"
                  >
                    <span>+ add new</span>
                  </button>
                </div>
              )}
            </div>

            {/* Shipping Addresses Section */}
            <div className="flex flex-col pb-20">
              <h2 className="text-[12px] font-bold text-black/80 mb-4">
                Shipping Addresses
              </h2>
              {addresses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 bg-[#F6F6F6] rounded-[12px] border border-black/10">
                  <p className="text-[12px] text-black/60 mb-6 font-medium">
                    You have not added any shipping addresses
                  </p>
                  <button
                    onClick={() => {
                      setEditingAddress(null);
                      setCurrentScreen("address-form");
                    }}
                    className="flex items-center gap-2 text-[#0000FF] font-bold text-[14px]"
                  >
                    <Plus size={18} />
                    <span>add new address</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      onClick={() => {
                        setEditingAddress(address);
                        setCurrentScreen("address-form");
                      }}
                      className="flex items-center gap-4 p-[12px_15px] bg-[#F6F6F6] border border-black/10 rounded-[12px] cursor-pointer active:scale-[0.98] transition-all relative"
                    >
                      <div className="w-[24px] h-[24px] flex items-center justify-center shrink-0">
                        <MapPin size={24} className="text-black/40" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-[14px] font-bold text-black/90 leading-tight">
                          {address.name}
                        </p>
                        <p className="text-[12px] text-black/60 leading-tight">
                          {address.details}
                        </p>
                      </div>
                      <div className="w-[18px] h-[18px] rounded-full border border-black/10 flex items-center justify-center bg-white">
                        {address.isDefault && (
                          <div className="w-[10px] h-[10px] rounded-full bg-[#0B0B0B]" />
                        )}
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      setEditingAddress(null);
                      setCurrentScreen("address-form");
                    }}
                    className="w-full h-[52px] bg-[#0000FF] rounded-[12px] text-white font-bold text-[14px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform mt-2"
                  >
                    <span>+ add shipping address</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Choice Overlay */}
      {currentScreen === "choice" && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/30 animate-in fade-in duration-300">
          <div className="bg-white rounded-t-[12px] w-full max-h-[85vh] overflow-y-auto px-6 pt-10 pb-12 animate-in slide-in-from-bottom duration-400">
            <div className="flex items-center justify-between mb-10">
              <h1 className="text-[20px] font-medium text-black/80 tracking-[-0.03em]">
                Add a Payment Method
              </h1>
              <button
                onClick={handleBack}
                className="p-2 border-[3.7px] border-[#9D9D9D] rounded-full"
              >
                <X size={16} className="text-[#9D9D9D]" />
              </button>
            </div>

            <div className="space-y-3">
              <PaymentOption
                label="Debit/Credit Card"
                onClick={() => setCurrentScreen("card-form")}
              />
              <PaymentOption
                label="SEPA Direct Debit"
                onClick={() => setCurrentScreen("sepa-form")}
              />
              <PaymentOption
                label="PayPal"
                onClick={() => setCurrentScreen("paypal")}
              />
              <PaymentOption label="Google Pay" onClick={() => {}}>
                <div className="flex items-center gap-3">
                  <Image
                    src="/google2.svg"
                    alt="Google Pay"
                    width={56}
                    height={22}
                    className="grayscale opacity-60 h-auto"
                  />
                </div>
              </PaymentOption>
            </div>

            <div className="mt-48 flex flex-col items-center gap-2 text-center">
              <div className="flex items-center gap-2 mb-1">
                <Lock size={18} className="text-black/70" />
                <p className="text-[12px] text-black/80 leading-[18px] max-w-[248px]">
                  Your payment details are encrypted and never shared with
                  Krafters.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Card Form Screen */}
      {currentScreen === "card-form" && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/30">
          <div className="bg-white rounded-t-[12px] w-full h-[90vh] overflow-y-auto px-6 pt-10 pb-12 animate-in slide-in-from-bottom duration-400">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-[20px] font-medium text-black/80 tracking-[-0.03em]">
                Add Debit/Credit Card
              </h1>
              <button
                onClick={handleBack}
                className="p-2 border-[3.7px] border-[#9D9D9D] rounded-full"
              >
                <X size={16} className="text-[#9D9D9D]" />
              </button>
            </div>

            <form
              className="space-y-8"
              onSubmit={(e) => {
                e.preventDefault();
                addMethod({
                  id: Date.now().toString(),
                  type: "card",
                  name: cardData.name || "John Doe",
                  details: `**** **** **** ${cardData.number.slice(-4) || "9898"}`,
                  address: `${cardData.zip}, ${cardData.country}`,
                  isDefault: methods.length === 0,
                });
              }}
            >
              <div className="space-y-4">
                <label className="block text-[12px] font-bold text-black/80">
                  Payment Method
                </label>
                <div className="flex flex-col bg-[#F6F6F6] border border-black/10 rounded-[8px] overflow-hidden">
                  <div className="flex items-center justify-between px-3 h-[47px] border-b border-black/10">
                    <span className="text-[14px] font-bold text-black/70 w-[94px]">
                      Number
                    </span>
                    <input
                      type="text"
                      placeholder="Required"
                      className="bg-transparent border-none outline-none text-[14px] text-black/80 flex-1 placeholder:text-black/30"
                      value={cardData.number}
                      onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                    />
                    <Camera size={18} className="text-black/60" />
                  </div>
                  <div className="flex items-center px-3 h-[47px] border-b border-black/10">
                    <span className="text-[14px] font-bold text-black/70 w-[94px]">
                      Expires
                    </span>
                    <input
                      type="text"
                      placeholder="MM YYYY"
                      className="bg-transparent border-none outline-none text-[14px] text-black/80 flex-1 placeholder:text-black/30"
                      value={cardData.expires}
                      onChange={(e) => setCardData({ ...cardData, expires: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center px-3 h-[47px]">
                    <span className="text-[14px] font-bold text-black/70 w-[94px]">
                      cv
                    </span>
                    <input
                      type="text"
                      placeholder="Security Code"
                      className="bg-transparent border-none outline-none text-[14px] text-black/80 flex-1 placeholder:text-black/30"
                      value={cardData.cv}
                      onChange={(e) => setCardData({ ...cardData, cv: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-[14px] font-bold text-black/80">
                  Billing Name
                </label>
                <input
                  type="text"
                  placeholder="Full Name"
                  className="w-full bg-[#F6F6F6] border border-black/10 rounded-[12px] px-4 py-[15px] outline-none text-[14px] text-black/80 placeholder:text-[#ABAFB1]"
                  value={cardData.name}
                  onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                />
              </div>

              <div className="space-y-4">
                <label className="block text-[14px] font-bold text-black/80">
                  Billing Address
                </label>
                <div className="space-y-3">
                  <div className="flex flex-col gap-2">
                    <span className="text-[14px] text-black/60 ml-1">
                      Post Code
                    </span>
                    <input
                      type="text"
                      placeholder="Post Code"
                      className="w-full bg-[#F6F6F6] border border-black/10 rounded-[12px] px-4 py-[15px] outline-none text-[14px] text-black/80 placeholder:text-[#ABAFB1]"
                      value={cardData.zip}
                      onChange={(e) => setCardData({ ...cardData, zip: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-[14px] text-black/60 ml-1">
                      Country/Region
                    </span>
                    <div className="bg-[#F6F6F6] border border-black/10 rounded-[12px] px-4 py-[15px] flex items-center justify-between">
                      <span className="text-[14px] text-black/80">{cardData.country}</span>
                      <ChevronRight size={18} className="text-black/40" />
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className={`w-full h-[52px] rounded-[12px] text-white font-bold text-[14px] mt-8 transition-colors ${
                  cardData.number && cardData.expires && cardData.cv ? "bg-[#0000FF]" : "bg-[#919191]"
                }`}
              >
                Done
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SEPA Form Screen */}
      {currentScreen === "sepa-form" && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/30">
          <div className="bg-white rounded-t-[12px] w-full h-[90vh] overflow-y-auto px-6 pt-10 pb-12 animate-in slide-in-from-bottom duration-400">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-[20px] font-medium text-black/80 tracking-[-0.03em]">
                Add SEPA Direct Debit
              </h1>
              <button
                onClick={handleBack}
                className="p-2 border-[3.7px] border-[#9D9D9D] rounded-full"
              >
                <X size={16} className="text-[#9D9D9D]" />
              </button>
            </div>

            <form className="space-y-6">
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <span className="text-[14px] text-black/60 ml-1">
                    First Name
                  </span>
                  <input
                    type="text"
                    placeholder="First Name"
                    className="w-full bg-[#F6F6F6] border border-black/10 rounded-[12px] px-4 py-[15px] outline-none text-[14px] text-black/80 placeholder:text-[#ABAFB1]"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[14px] text-black/60 ml-1">
                    Last Name
                  </span>
                  <input
                    type="text"
                    placeholder="Last Name"
                    className="w-full bg-[#F6F6F6] border border-black/10 rounded-[12px] px-4 py-[15px] outline-none text-[14px] text-black/80 placeholder:text-[#ABAFB1]"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[14px] text-black/60 ml-1">IBAN</span>
                  <input
                    type="text"
                    placeholder="IBAN"
                    className="w-full bg-[#F6F6F6] border border-black/10 rounded-[12px] px-4 py-[15px] outline-none text-[14px] text-black/80 placeholder:text-[#ABAFB1]"
                  />
                </div>
              </div>

              <div className="flex items-start gap-3 py-2">
                <div className="w-5 h-5 rounded-[6px] border border-orange-500 bg-white flex items-center justify-center shrink-0 mt-1">
                  <div className="w-3 h-3 bg-orange-500 rounded-sm" />
                </div>
                <p className="text-[14px] text-[#2B2F32] leading-[21px]">
                  I hereby confirm the SEPA Direct Debit Mandate to
                  Kraftigos.de
                </p>
              </div>

              <div className="space-y-4">
                <label className="block text-[14px] font-bold text-black/80">
                  Billing Address
                </label>
                <div className="space-y-3">
                  <div className="flex flex-col gap-2">
                    <span className="text-[14px] text-black/60 ml-1">
                      Post Code
                    </span>
                    <input
                      type="text"
                      placeholder="Post Code"
                      className="w-full bg-[#F6F6F6] border border-black/10 rounded-[12px] px-4 py-[15px] outline-none text-[14px] text-black/80 placeholder:text-[#ABAFB1]"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-[14px] text-black/60 ml-1">
                      Country/Region
                    </span>
                    <div className="bg-[#F6F6F6] border border-black/10 rounded-[12px] px-4 py-[15px] flex items-center justify-between">
                      <span className="text-[14px] text-black/80">Germany</span>
                      <ChevronRight size={18} className="text-black/40" />
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCurrentScreen("list");
                  toast.success("SEPA method added");
                }}
                className="w-full h-[52px] bg-[#0000FF] rounded-[12px] text-white font-bold text-[14px] mt-8"
              >
                Done
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PayPal Screen */}
      {currentScreen === "paypal" && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/30 animate-in fade-in duration-300">
          <div className="bg-white rounded-t-[12px] w-full h-[88vh] overflow-y-auto px-6 pt-10 pb-12 animate-in slide-in-from-bottom duration-400">
            <div className="flex items-center justify-between mb-20">
              <h1 className="text-[20px] font-medium text-black/80 tracking-[-0.03em] mx-auto">
                Connect Paypal
              </h1>
              <button
                onClick={handleBack}
                className="p-2 border-[3.7px] border-[#9D9D9D] rounded-full absolute right-6"
              >
                <X size={16} className="text-[#9D9D9D]" />
              </button>
            </div>

            <div className="flex flex-col items-center justify-center flex-1 -mt-10">
              {/* Kraftigo Logo */}
              <div className="flex items-center gap-1 mb-2">
                <span className="text-[28px] font-gerat font-black text-[#FF6600] tracking-tight">
                  kraftig
                </span>
                <div className="relative mt-2">
                  <div className="w-5 h-5 bg-[#FF6600] rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  </div>
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                    <div className="w-1 h-1 bg-[#FF6600] rounded-full" />
                    <div className="w-1 h-1 bg-[#FF6600] rounded-full" />
                  </div>
                </div>
              </div>

              {/* Connecting Line */}
              <div className="h-16 w-[2px] border-l-[2px] border-dashed border-orange-500/40 relative my-4">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-[2px] border-orange-500 bg-white flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-orange-500 rounded-full" />
                </div>
              </div>

              {/* PayPal Logo */}
              <div className="mb-10">
                <Image
                  src="/paypal.svg"
                  alt="PayPal"
                  width={110}
                  height={30}
                  className="h-auto"
                />
              </div>

              <p className="text-[12px] font-poppins text-black/40 mt-6">Launching paypal</p>
            </div>
            
            <button 
              onClick={() => {
                setCurrentScreen("list");
                toast.success("PayPal connected");
              }}
              className="w-full h-[52px] bg-[#0070BA] rounded-[12px] text-white font-bold text-[14px] mt-auto active:scale-95 transition-transform"
            >
              Log in to PayPal
            </button>
          </div>
        </div>
      )}

      {/* Edit Card Screen */}
      {currentScreen === "edit-card" && editingMethod && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/30">
          <div className="bg-white rounded-t-[12px] w-full h-[90vh] overflow-y-auto px-6 pt-10 pb-12 animate-in slide-in-from-bottom duration-400">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-[20px] font-medium text-black/80 tracking-[-0.03em]">
                Edit Payment Method
              </h1>
              <button
                onClick={handleBack}
                className="p-2 border-[3.7px] border-[#9D9D9D] rounded-full"
              >
                <X size={16} className="text-[#9D9D9D]" />
              </button>
            </div>

            <form className="space-y-8">
              <div className="space-y-4">
                <label className="block text-[12px] font-bold text-black/80">
                  Payment Method
                </label>
                <div className="flex flex-col bg-[#F6F6F6] border border-black/10 rounded-[8px] overflow-hidden">
                  <div className="flex items-center justify-between px-3 h-[47px] border-b border-black/10">
                    <span className="text-[14px] font-bold text-black/70 w-[94px]">
                      Number
                    </span>
                    <input
                      type="text"
                      className="bg-transparent border-none outline-none text-[14px] text-black/80 flex-1"
                      defaultValue={editingMethod.details}
                    />
                    <Camera size={18} className="text-black/60" />
                  </div>
                  <div className="flex items-center px-3 h-[47px] border-b border-black/10">
                    <span className="text-[14px] font-bold text-black/70 w-[94px]">
                      Expires
                    </span>
                    <input
                      type="text"
                      className="bg-transparent border-none outline-none text-[14px] text-black/80 flex-1"
                      defaultValue="09 2029"
                    />
                  </div>
                  <div className="flex items-center px-3 h-[47px]">
                    <span className="text-[14px] font-bold text-black/70 w-[94px]">
                      cv
                    </span>
                    <input
                      type="text"
                      className="bg-transparent border-none outline-none text-[14px] text-black/80 flex-1"
                      defaultValue="4443"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-[14px] font-bold text-black/80">
                  Billing Name
                </label>
                <input
                  type="text"
                  className="w-full bg-[#F6F6F6] border border-black/10 rounded-[12px] px-4 py-[15px] outline-none text-[14px] text-black/80"
                  defaultValue={editingMethod.name}
                />
              </div>

              <div className="space-y-4">
                <label className="block text-[14px] font-bold text-black/80">
                  Billing Address
                </label>
                <div className="space-y-3">
                  <div className="flex flex-col gap-2">
                    <span className="text-[14px] text-black/60 ml-1">
                      Post Code
                    </span>
                    <input
                      type="text"
                      className="w-full bg-[#F6F6F6] border border-black/10 rounded-[12px] px-4 py-[15px] outline-none text-[14px] text-black/80"
                      defaultValue="43434"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-[14px] text-black/60 ml-1">
                      Country/Region
                    </span>
                    <div className="bg-[#F6F6F6] border border-black/10 rounded-[12px] px-4 py-[15px] flex items-center justify-between">
                      <span className="text-[14px] text-black/80">Germany</span>
                      <ChevronRight size={18} className="text-black/40" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    // In a real app, this would call an API
                    setMethods(methods.map(m => ({
                      ...m,
                      isDefault: m.id === editingMethod.id
                    })));
                    setCurrentScreen("list");
                    toast.success("Changes saved");
                  }}
                  className="w-full h-[52px] bg-[#0000FF] rounded-[12px] text-white font-bold text-[14px] active:scale-[0.98] transition-all"
                >
                  Save
                </button>
                {!editingMethod.isDefault && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setMethods(methods.map(m => ({
                        ...m,
                        isDefault: m.id === editingMethod.id
                      })));
                      toast.success("Set as default");
                    }}
                    className="w-full h-[52px] border border-black/10 rounded-[12px] font-bold text-[14px] active:scale-[0.98] transition-all"
                  >
                    Set as Default
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    removeMethod(editingMethod.id);
                  }}
                  className="w-full h-[52px] bg-[#FF6666]/10 text-[#FE2929] rounded-[12px] font-bold text-[14px] active:scale-[0.98] transition-all"
                >
                  Delete card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Address Form Screen */}
      {currentScreen === "address-form" && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/30">
          <div className="bg-white rounded-t-[12px] w-full h-[90vh] overflow-y-auto px-6 pt-10 pb-12 animate-in slide-in-from-bottom duration-400">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-[20px] font-medium text-black/80 tracking-[-0.03em]">
                {editingAddress ? "Edit Shipping Address" : "Add Shipping Address"}
              </h1>
              <button
                onClick={handleBack}
                className="p-2 border-[3.7px] border-[#9D9D9D] rounded-full"
              >
                <X size={16} className="text-[#9D9D9D]" />
              </button>
            </div>

            <form className="space-y-6" onSubmit={saveAddress}>
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <span className="text-[14px] text-black/60 ml-1">
                    Full Name
                  </span>
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="w-full bg-[#F6F6F6] border border-black/10 rounded-[12px] px-4 py-[15px] outline-none text-[14px] text-black/80 placeholder:text-[#ABAFB1]"
                    value={addressData.name}
                    onChange={(e) => setAddressData({ ...addressData, name: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[14px] text-black/60 ml-1">
                    Street & House Number
                  </span>
                  <input
                    type="text"
                    placeholder="Street Address"
                    className="w-full bg-[#F6F6F6] border border-black/10 rounded-[12px] px-4 py-[15px] outline-none text-[14px] text-black/80 placeholder:text-[#ABAFB1]"
                    value={addressData.details}
                    onChange={(e) => setAddressData({ ...addressData, details: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-[14px] text-black/60 ml-1">
                      Post Code
                    </span>
                    <input
                      type="text"
                      placeholder="Post Code"
                      className="w-full bg-[#F6F6F6] border border-black/10 rounded-[12px] px-4 py-[15px] outline-none text-[14px] text-black/80 placeholder:text-[#ABAFB1]"
                      value={addressData.zip}
                      onChange={(e) => setAddressData({ ...addressData, zip: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-[14px] text-black/60 ml-1">
                      City
                    </span>
                    <input
                      type="text"
                      placeholder="City"
                      className="w-full bg-[#F6F6F6] border border-black/10 rounded-[12px] px-4 py-[15px] outline-none text-[14px] text-black/80 placeholder:text-[#ABAFB1]"
                      value={addressData.city}
                      onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[14px] text-black/60 ml-1">
                    Country/Region
                  </span>
                  <div className="bg-[#F6F6F6] border border-black/10 rounded-[12px] px-4 py-[15px] flex items-center justify-between">
                    <span className="text-[14px] text-black/80">{addressData.country}</span>
                    <ChevronRight size={18} className="text-black/40" />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <button
                  type="submit"
                  className="w-full h-[52px] bg-[#0000FF] rounded-[12px] text-white font-bold text-[14px] active:scale-[0.98] transition-all"
                >
                  {editingAddress ? "Save Changes" : "Save Address"}
                </button>
                {editingAddress && !editingAddress.isDefault && (
                  <button
                    type="button"
                    onClick={() => {
                      setAddresses(addresses.map(a => ({
                        ...a,
                        isDefault: a.id === editingAddress.id
                      })));
                      toast.success("Set as default address");
                    }}
                    className="w-full h-[52px] border border-black/10 rounded-[12px] font-bold text-[14px] active:scale-[0.98] transition-all"
                  >
                    Set as Default
                  </button>
                )}
                {editingAddress && (
                  <button
                    type="button"
                    onClick={() => removeAddress(editingAddress.id)}
                    className="w-full h-[52px] bg-[#FF6666]/10 text-[#FE2929] rounded-[12px] font-bold text-[14px] active:scale-[0.98] transition-all"
                  >
                    Delete Address
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

const PaymentOption = ({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children?: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between p-[18px_15px] bg-[#F6F6F6] border border-black/10 rounded-[12px] hover:bg-gray-100 transition-colors"
  >
    <div className="text-[14px] font-poppins text-black/90">
      {children || <span>{label}</span>}
    </div>
    <ChevronRight size={18} className="text-black/60" />
  </button>
);

export default PaymentMethodsPage;
