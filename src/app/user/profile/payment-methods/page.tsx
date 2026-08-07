"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Plus, ChevronRight, X, Lock, Camera, MapPin } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { usePaymentStore } from "@/store/usePaymentStore";
import { useAddressStore } from "@/store/useAddressStore";
import type { SavedPaymentMethod } from "@/lib/api/payments";
import type { Address } from "@/types";
import PaymentFlowModal from "@/components/shared/PaymentFlowModal";
import { useTranslations } from "next-intl";

type Screen = 'list' | 'choice' | 'card-form' | 'sepa-form' | 'paypal' | 'edit-card' | 'address-form';
const DEFAULT_ADDRESS_DATA = { name: "", details: "", zip: "", city: "Berlin", country: "Germany" };

const toAddressFormData = (address?: Address | null) =>
  address
    ? {
      name: address.label,
      details: address.address,
      zip: address.postalCode || "",
      city: address.city || "Berlin",
      country: address.country || "Germany",
    }
    : { ...DEFAULT_ADDRESS_DATA };

const readMethodCard = (method: SavedPaymentMethod | null) => {
  if (!method) return null;
  const fromCard = method.card as Record<string, unknown> | undefined;
  const fromDetails = method.details as Record<string, unknown> | undefined;
  const nested = (fromDetails?.card ?? null) as Record<string, unknown> | null;
  const source = fromCard ?? nested ?? fromDetails ?? null;
  if (!source) return null;
  const brand = typeof source.brand === "string" ? source.brand : "";
  const last4 = typeof source.last4 === "string" ? source.last4 : "";
  const expMonth =
    typeof source.expMonth === "number"
      ? source.expMonth
      : typeof source.exp_month === "number"
        ? source.exp_month
        : null;
  const expYear =
    typeof source.expYear === "number"
      ? source.expYear
      : typeof source.exp_year === "number"
        ? source.exp_year
        : null;
  const holder =
    (typeof source.holder === "string" && source.holder) ||
    (typeof source.name === "string" && source.name) ||
    method.name ||
    "";
  return { brand, last4, expMonth, expYear, holder };
};

const PaymentMethodsPage = () => {
  const router = useRouter();
  const [currentScreen, setCurrentScreen] = useState<Screen>("list");
  const [showPaymentFlowModal, setShowPaymentFlowModal] = useState(false);
  const t = useTranslations("profile.paymentMethods");

  const {
    savedMethods: methods,
    fetchSavedMethods,
    removeSavedMethod,
    setDefaultSavedMethod,
    isLoading: methodsLoading,
  } = usePaymentStore();

  const {
    addresses,
    loadAddresses,
    removeAddress,
    addAddress,
    isLoadingAddresses,
  } = useAddressStore();

  useEffect(() => {
    void fetchSavedMethods();
    void loadAddresses();
  }, [fetchSavedMethods, loadAddresses]);

  useEffect(() => {
    const refreshMethods = () => {
      void fetchSavedMethods();
    };
    window.addEventListener("focus", refreshMethods);
    document.addEventListener("visibilitychange", refreshMethods);
    return () => {
      window.removeEventListener("focus", refreshMethods);
      document.removeEventListener("visibilitychange", refreshMethods);
    };
  }, [fetchSavedMethods]);

  const [editingMethod, setEditingMethod] = useState<SavedPaymentMethod | null>(null);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const editingCard = readMethodCard(editingMethod);

  // Form states
  const [cardData, setCardData] = useState({ number: "", expires: "", cv: "", name: "", zip: "", country: "Germany" });
  const [addressData, setAddressData] = useState({ ...DEFAULT_ADDRESS_DATA });

  const openNewAddressForm = () => {
    setEditingAddress(null);
    setAddressData({ ...DEFAULT_ADDRESS_DATA });
    setCurrentScreen("address-form");
  };

  const openEditAddressForm = (address: Address) => {
    setEditingAddress(address);
    setAddressData(toAddressFormData(address));
    setCurrentScreen("address-form");
  };

  const handleBack = () => {
    if (currentScreen === "list") {
      router.back();
    } else {
      setCurrentScreen("list");
      setEditingMethod(null);
      setEditingAddress(null);
      setAddressData({ ...DEFAULT_ADDRESS_DATA });
    }
  };

  const handleRemoveMethod = async (id: string) => {
    const ok = await removeSavedMethod(id);
    if (ok) {
      setCurrentScreen("list");
      toast.success(t("paymentMethodRemoved"));
    } else {
      toast.error(t("failedToRemovePaymentMethod"));
    }
  };

  const handleSetDefault = async (id: string) => {
    const ok = await setDefaultSavedMethod(id);
    if (ok) {
      toast.success(t("setAsDefault"));
    } else {
      toast.error(t("failedToUpdateDefault"));
    }
  };

  const saveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressData.details) {
      toast.error(t("pleaseEnterAddress"));
      return;
    }
    await addAddress({
      label: addressData.name || "Home",
      address: addressData.details,
      city: addressData.city,
      postalCode: addressData.zip,
      country: addressData.country,
    });
    setCurrentScreen("list");
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
              {t("title")}
            </h1>
          </div>

          <div className="flex-1 flex flex-col gap-10">
            {/* Payment Methods Section */}
            <div className="flex flex-col">
              <h2 className="text-[12px] font-bold text-black/80 mb-4">
                {t("savedPaymentMethods")}
              </h2>
              {methodsLoading && methods.length === 0 ? (
                <div className="flex items-center justify-center py-10 bg-[#F6F6F6] rounded-[12px] border border-black/10">
                  <p className="text-[12px] text-black/60 font-medium">{t("loadingPaymentMethods")}</p>
                </div>
              ) : methods.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 bg-[#F6F6F6] rounded-[12px] border border-black/10">
                  <p className="text-[12px] text-black/60 mb-6 font-medium">
                    {t("noPaymentMethods")}
                  </p>
                  <button
                    onClick={() => setShowPaymentFlowModal(true)}
                    className="flex items-center gap-2 text-[#0000FF] font-bold text-[14px]"
                  >
                    <Plus size={18} />
                    <span>{t("addNew")}</span>
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
                          {readMethodCard(method)?.holder || "Card"}
                        </p>
                        <p className="text-[14px] text-black/90 leading-tight">
                          {readMethodCard(method)
                            ? `${readMethodCard(method)?.brand?.toUpperCase() || "CARD"} •••• ${readMethodCard(method)?.last4 || "----"}`
                            : typeof method.details === "string"
                              ? method.details
                              : "Saved method"}
                        </p>
                        <p className="text-[12px] text-black/60 leading-tight">
                          {readMethodCard(method)?.expMonth && readMethodCard(method)?.expYear
                            ? `Exp ${String(readMethodCard(method)?.expMonth).padStart(2, "0")}/${readMethodCard(method)?.expYear}`
                            : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => setShowPaymentFlowModal(true)}
                    className="w-full h-[52px] bg-[#0000FF] rounded-[12px] text-white font-bold text-[14px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform mt-2"
                  >
                    <span>{t("view")}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Shipping Addresses Section */}
            <div className="flex flex-col pb-20">
              <h2 className="text-[12px] font-bold text-black/80 mb-4">
                {t("savedAddresses")}
              </h2>
              {isLoadingAddresses && addresses.length === 0 ? (
                <div className="flex items-center justify-center py-10 bg-[#F6F6F6] rounded-[12px] border border-black/10">
                  <p className="text-[12px] text-black/60 font-medium">{t("loadingAddresses")}</p>
                </div>
              ) : addresses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 bg-[#F6F6F6] rounded-[12px] border border-black/10">
                  <p className="text-[12px] text-black/60 mb-6 font-medium">
                    {t("noSavedAddresses")}
                  </p>
                  <button
                    onClick={() => {
                      openNewAddressForm();
                    }}
                    className="flex items-center gap-2 text-[#0000FF] font-bold text-[14px]"
                  >
                    <Plus size={18} />
                    <span>{t("addNewAddress")}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      onClick={() => {
                        openEditAddressForm(address);
                      }}
                      className="flex items-center gap-4 p-[12px_15px] bg-[#F6F6F6] border border-black/10 rounded-[12px] cursor-pointer active:scale-[0.98] transition-all relative"
                    >
                      <div className="w-[24px] h-[24px] flex items-center justify-center shrink-0">
                        <MapPin size={24} className="text-black/40" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-[14px] font-bold text-black/90 leading-tight">
                          {address.label}
                        </p>
                        <p className="text-[12px] text-black/60 leading-tight">
                          {address.address}
                        </p>
                      </div>
                      <div className="w-[18px] h-[18px] rounded-full border border-black/10 flex items-center justify-center bg-white" />
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      openNewAddressForm();
                    }}
                    className="w-full h-[52px] bg-[#0000FF] rounded-[12px] text-white font-bold text-[14px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform mt-2"
                  >
                    <span>{t("plusAddSavedAddress")}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showPaymentFlowModal && (
        <PaymentFlowModal
          onClose={() => {
            setShowPaymentFlowModal(false);
            void fetchSavedMethods();
          }}
        />
      )}

      {/* Choice Overlay */}
      {currentScreen === "choice" && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/30 animate-in fade-in duration-300">
          <div className="bg-white rounded-t-[12px] w-full max-h-[85vh] overflow-y-auto px-6 pt-10 pb-12 animate-in slide-in-from-bottom duration-400">
            <div className="flex items-center justify-between mb-10">
              <h1 className="text-[20px] font-medium text-black/80 tracking-[-0.03em]">
                {t("addPaymentMethod")}
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
                label={t("debitCreditCard")}
                onClick={() => setCurrentScreen("card-form")}
              />
              <PaymentOption
                label={t("sepaDirectDebit")}
                onClick={() => setCurrentScreen("sepa-form")}
              />
              <PaymentOption
                label={t("paypal")}
                onClick={() => setCurrentScreen("paypal")}
              />
              <PaymentOption label={t("googlePay")} onClick={() => { }}>
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
                  {t("encryptionInfo")}
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
                {t("addDebitCreditCard")}
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
              onSubmit={async (e) => {
                e.preventDefault();
                setCurrentScreen("list");
                toast.success(t("cardAdded"));
                await fetchSavedMethods();
              }}
            >
              <div className="space-y-4">
                <label className="block text-[12px] font-bold text-black/80">
                  {t("paymentMethodLabel")}
                </label>
                <div className="flex flex-col bg-[#F6F6F6] border border-black/10 rounded-[8px] overflow-hidden">
                  <div className="flex items-center justify-between px-3 h-[47px] border-b border-black/10">
                    <span className="text-[14px] font-bold text-black/70 w-[94px]">
                      {t("number")}
                    </span>
                    <input
                      type="text"
                      placeholder={t("required")}
                      className="bg-transparent border-none outline-none text-[14px] text-black/80 flex-1 placeholder:text-black/30"
                      value={cardData.number}
                      onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                    />
                    <Camera size={18} className="text-black/60" />
                  </div>
                  <div className="flex items-center px-3 h-[47px] border-b border-black/10">
                    <span className="text-[14px] font-bold text-black/70 w-[94px]">
                      {t("expires")}
                    </span>
                    <input
                      type="text"
                      placeholder={t("mmYyyy")}
                      className="bg-transparent border-none outline-none text-[14px] text-black/80 flex-1 placeholder:text-black/30"
                      value={cardData.expires}
                      onChange={(e) => setCardData({ ...cardData, expires: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center px-3 h-[47px]">
                    <span className="text-[14px] font-bold text-black/70 w-[94px]">
                      {t("cv")}
                    </span>
                    <input
                      type="text"
                      placeholder={t("securityCode")}
                      className="bg-transparent border-none outline-none text-[14px] text-black/80 flex-1 placeholder:text-black/30"
                      value={cardData.cv}
                      onChange={(e) => setCardData({ ...cardData, cv: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-[14px] font-bold text-black/80">
                  {t("billingName")}
                </label>
                <input
                  type="text"
                  placeholder={t("fullName")}
                  className="w-full bg-[#F6F6F6] border border-black/10 rounded-[12px] px-4 py-[15px] outline-none text-[14px] text-black/80 placeholder:text-[#ABAFB1]"
                  value={cardData.name}
                  onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                />
              </div>

              <div className="space-y-4">
                <label className="block text-[14px] font-bold text-black/80">
                  {t("billingAddress")}
                </label>
                <div className="space-y-3">
                  <div className="flex flex-col gap-2">
                    <span className="text-[14px] text-black/60 ml-1">
                      {t("postCode")}
                    </span>
                    <input
                      type="text"
                      placeholder={t("postCode")}
                      className="w-full bg-[#F6F6F6] border border-black/10 rounded-[12px] px-4 py-[15px] outline-none text-[14px] text-black/80 placeholder:text-[#ABAFB1]"
                      value={cardData.zip}
                      onChange={(e) => setCardData({ ...cardData, zip: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-[14px] text-black/60 ml-1">
                      {t("countryRegion")}
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
                className={`w-full h-[52px] rounded-[12px] text-white font-bold text-[14px] mt-8 transition-colors ${cardData.number && cardData.expires && cardData.cv ? "bg-[#0000FF]" : "bg-[#919191]"
                  }`}
              >
                {t("done")}
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
                {t("addSepaDirectDebit")}
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
                    {t("firstName")}
                  </span>
                  <input
                    type="text"
                    placeholder={t("firstName")}
                    className="w-full bg-[#F6F6F6] border border-black/10 rounded-[12px] px-4 py-[15px] outline-none text-[14px] text-black/80 placeholder:text-[#ABAFB1]"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[14px] text-black/60 ml-1">
                    {t("lastName")}
                  </span>
                  <input
                    type="text"
                    placeholder={t("lastName")}
                    className="w-full bg-[#F6F6F6] border border-black/10 rounded-[12px] px-4 py-[15px] outline-none text-[14px] text-black/80 placeholder:text-[#ABAFB1]"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[14px] text-black/60 ml-1">{t("iban")}</span>
                  <input
                    type="text"
                    placeholder={t("iban")}
                    className="w-full bg-[#F6F6F6] border border-black/10 rounded-[12px] px-4 py-[15px] outline-none text-[14px] text-black/80 placeholder:text-[#ABAFB1]"
                  />
                </div>
              </div>

              <div className="flex items-start gap-3 py-2">
                <div className="w-5 h-5 rounded-[6px] border border-orange-500 bg-white flex items-center justify-center shrink-0 mt-1">
                  <div className="w-3 h-3 bg-orange-500 rounded-sm" />
                </div>
                <p className="text-[14px] text-[#2B2F32] leading-[21px]">
                  {t("sepaConfirm")}
                </p>
              </div>

              <div className="space-y-4">
                <label className="block text-[14px] font-bold text-black/80">
                  {t("billingAddress")}
                </label>
                <div className="space-y-3">
                  <div className="flex flex-col gap-2">
                    <span className="text-[14px] text-black/60 ml-1">
                      {t("postCode")}
                    </span>
                    <input
                      type="text"
                      placeholder={t("postCode")}
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
                  toast.success(t("sepaAdded"));
                }}
                className="w-full h-[52px] bg-[#0000FF] rounded-[12px] text-white font-bold text-[14px] mt-8"
              >
                {t("done")}
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
                {t("connectPaypal")}
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

              <p className="text-[12px] font-poppins text-black/40 mt-6">{t("launchingPaypal")}</p>
            </div>

            <button
              onClick={() => {
                setCurrentScreen("list");
                toast.success(t("paypalConnected"));
              }}
              className="w-full h-[52px] bg-[#0070BA] rounded-[12px] text-white font-bold text-[14px] mt-auto active:scale-95 transition-transform"
            >
              {t("loginToPaypal")}
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
                {t("editPaymentMethod")}
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
                  {t("paymentMethodLabel")}
                </label>
                <div className="flex flex-col bg-[#F6F6F6] border border-black/10 rounded-[8px] overflow-hidden">
                  <div className="flex items-center justify-between px-3 h-[47px] border-b border-black/10">
                    <span className="text-[14px] font-bold text-black/70 w-[94px]">
                      {t("number")}
                    </span>
                    <input
                      type="text"
                      className="bg-transparent border-none outline-none text-[14px] text-black/80 flex-1"
                      value={editingCard?.last4 ? `•••• •••• •••• ${editingCard.last4}` : ""}
                      readOnly
                    />
                    <Camera size={18} className="text-black/60" />
                  </div>
                  <div className="flex items-center px-3 h-[47px] border-b border-black/10">
                    <span className="text-[14px] font-bold text-black/70 w-[94px]">
                      {t("expires")}
                    </span>
                    <input
                      type="text"
                      className="bg-transparent border-none outline-none text-[14px] text-black/80 flex-1"
                      value={
                        editingCard?.expMonth && editingCard?.expYear
                          ? `${String(editingCard.expMonth).padStart(2, "0")} ${editingCard.expYear}`
                          : ""
                      }
                      readOnly
                    />
                  </div>
                  <div className="flex items-center px-3 h-[47px]">
                    <span className="text-[14px] font-bold text-black/70 w-[94px]">
                      {t("cv")}
                    </span>
                    <input
                      type="text"
                      className="bg-transparent border-none outline-none text-[14px] text-black/80 flex-1"
                      value=""
                      readOnly
                      placeholder={t("notStoredForSecurity")}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-[14px] font-bold text-black/80">
                  {t("billingName")}
                </label>
                <input
                  type="text"
                  className="w-full bg-[#F6F6F6] border border-black/10 rounded-[12px] px-4 py-[15px] outline-none text-[14px] text-black/80"
                  value={editingCard?.holder || editingMethod.name || ""}
                  readOnly
                />
              </div>

              <div className="space-y-4">
                <label className="block text-[14px] font-bold text-black/80">
                  {t("billingAddress")}
                </label>
                <div className="space-y-3">
                  <div className="flex flex-col gap-2">
                    <span className="text-[14px] text-black/60 ml-1">
                      {t("postCode")}
                    </span>
                    <input
                      type="text"
                      className="w-full bg-[#F6F6F6] border border-black/10 rounded-[12px] px-4 py-[15px] outline-none text-[14px] text-black/80"
                      value=""
                      readOnly
                      placeholder={t("notAvailable")}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-[14px] text-black/60 ml-1">
                      {t("countryRegion")}
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
                    setCurrentScreen("list");
                    toast.success(t("changesSaved"));
                  }}
                  className="w-full h-[52px] bg-[#0000FF] rounded-[12px] text-white font-bold text-[14px] active:scale-[0.98] transition-all"
                >
                  {t("save")}
                </button>
                {!editingMethod.isDefault && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleSetDefault(editingMethod.id);
                    }}
                    className="w-full h-[52px] border border-black/10 rounded-[12px] font-bold text-[14px] active:scale-[0.98] transition-all"
                  >
                    {t("setAsDefaultBtn")}
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleRemoveMethod(editingMethod.id);
                  }}
                  className="w-full h-[52px] bg-[#FF6666]/10 text-[#FE2929] rounded-[12px] font-bold text-[14px] active:scale-[0.98] transition-all"
                >
                  {t("deleteCard")}
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
                {editingAddress ? t("editSavedAddress") : t("addSavedAddress")}
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
                    {t("fullName")}
                  </span>
                  <input
                    type="text"
                    placeholder={t("fullName")}
                    className="w-full bg-[#F6F6F6] border border-black/10 rounded-[12px] px-4 py-[15px] outline-none text-[14px] text-black/80 placeholder:text-[#ABAFB1]"
                    value={addressData.name}
                    onChange={(e) => setAddressData({ ...addressData, name: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[14px] text-black/60 ml-1">
                    {t("streetHouseNumber")}
                  </span>
                  <input
                    type="text"
                    placeholder={t("streetAddress")}
                    className="w-full bg-[#F6F6F6] border border-black/10 rounded-[12px] px-4 py-[15px] outline-none text-[14px] text-black/80 placeholder:text-[#ABAFB1]"
                    value={addressData.details}
                    onChange={(e) => setAddressData({ ...addressData, details: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-[14px] text-black/60 ml-1">
                      {t("postCode")}
                    </span>
                    <input
                      type="text"
                      placeholder={t("postCode")}
                      className="w-full bg-[#F6F6F6] border border-black/10 rounded-[12px] px-4 py-[15px] outline-none text-[14px] text-black/80 placeholder:text-[#ABAFB1]"
                      value={addressData.zip}
                      onChange={(e) => setAddressData({ ...addressData, zip: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-[14px] text-black/60 ml-1">
                      {t("city")}
                    </span>
                    <input
                      type="text"
                      placeholder={t("city")}
                      className="w-full bg-[#F6F6F6] border border-black/10 rounded-[12px] px-4 py-[15px] outline-none text-[14px] text-black/80 placeholder:text-[#ABAFB1]"
                      value={addressData.city}
                      onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[14px] text-black/60 ml-1">
                    {t("countryRegion")}
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
                  {editingAddress ? t("saveChanges") : t("saveAddressBtn")}
                </button>

                {editingAddress && (
                  <button
                    type="button"
                    onClick={() => removeAddress(editingAddress.id)}
                    className="w-full h-[52px] bg-[#FF6666]/10 text-[#FE2929] rounded-[12px] font-bold text-[14px] active:scale-[0.98] transition-all"
                  >
                    {t("deleteAddress")}
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
