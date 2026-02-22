"use client";

import { ArrowLeft, X, ChevronRight, Lock } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { usePaymentStore } from "@/store/usePaymentStore";
import toast from "react-hot-toast";

interface PaymentFlowModalProps {
  onClose: () => void;
}

const PaymentFlowModal = ({ onClose }: PaymentFlowModalProps) => {
  const { paymentMethods, addPaymentMethod, removePaymentMethod, selectedPaymentId, selectPayment } = usePaymentStore();
  
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showAddSepa, setShowAddSepa] = useState(false);
  const [showAddPaypal, setShowAddPaypal] = useState(false);
  const [editingMethodId, setEditingMethodId] = useState<string | null>(null);
  
  // Card form state
  const [cardForm, setCardForm] = useState({
    number: "",
    expires: "",
    cvv: "",
    name: "",
    postCode: "",
    country: "",
  });
  
  // SEPA form state
  const [sepaForm, setSepaForm] = useState({
    firstName: "",
    lastName: "",
    iban: "",
    bic: "",
    postCode: "",
    country: "",
    consent: false,
  });

  const handleEditCard = (methodId: string) => {
    const method = paymentMethods.find(m => m.id === methodId);
    if (method && method.type === 'card') {
      setEditingMethodId(methodId);
      setCardForm({
        number: method.details?.last4 || "",
        expires: method.details?.expiryDate || "",
        cvv: "",
        name: method.details?.holder || "",
        postCode: "",
        country: "",
      });
      setShowAddCard(true);
    }
  };

  const handleEditSepa = (methodId: string) => {
    const method = paymentMethods.find(m => m.id === methodId);
    if (method && method.type === 'sepa') {
      setEditingMethodId(methodId);
      const [firstName = "", lastName = ""] = (method.details?.holder || "").split(" ");
      setSepaForm({
        firstName,
        lastName,
        iban: method.details?.iban?.replace(/\*/g, "").trim() || "",
        bic: "",
        postCode: "",
        country: "",
        consent: true,
      });
      setShowAddSepa(true);
    }
  };

  const handleAddCard = () => {
    if (!cardForm.number || !cardForm.expires || !cardForm.cvv || !cardForm.name) {
      toast.error("Please fill in all required fields");
      return;
    }

    // If editing, remove old method first
    if (editingMethodId) {
      removePaymentMethod(editingMethodId);
    }

    // Mask card number
    const last4 = cardForm.number.slice(-4);
    const maskedNumber = `**** **** **** ${last4}`;

    addPaymentMethod({
      type: "card",
      name: "Debit/Credit Card",
      details: {
        holder: cardForm.name,
        number: maskedNumber,
        last4: last4,
        expiryDate: cardForm.expires,
      },
      isDefault: paymentMethods.length === 0,
    });

    toast.success(editingMethodId ? "Card updated successfully!" : "Card added successfully!");
    setShowAddCard(false);
    setShowAddMethod(false);
    setEditingMethodId(null);
    setCardForm({ number: "", expires: "", cvv: "", name: "", postCode: "", country: "" });
  };

  const handleAddSepa = () => {
    if (!sepaForm.firstName || !sepaForm.lastName || !sepaForm.iban || !sepaForm.consent) {
      toast.error("Please fill in all required fields and accept the mandate");
      return;
    }

    // If editing, remove old method first
    if (editingMethodId) {
      removePaymentMethod(editingMethodId);
    }

    // Mask IBAN
    const maskedIban = `**** **** **** ${sepaForm.iban.slice(-4)}`;

    addPaymentMethod({
      type: "sepa",
      name: "SEPA Direct Debit",
      details: {
        holder: `${sepaForm.firstName} ${sepaForm.lastName}`,
        iban: maskedIban,
      },
      isDefault: paymentMethods.length === 0,
    });

    toast.success(editingMethodId ? "SEPA account updated successfully!" : "SEPA account added successfully!");
    setShowAddSepa(false);
    setShowAddMethod(false);
    setEditingMethodId(null);
    setSepaForm({ firstName: "", lastName: "", iban: "", bic: "", postCode: "", country: "", consent: false });
  };

  const handleDeleteCard = () => {
    if (editingMethodId) {
      removePaymentMethod(editingMethodId);
      toast.success("Payment method deleted");
      setShowAddCard(false);
      setShowAddSepa(false);
      setEditingMethodId(null);
      setCardForm({ number: "", expires: "", cvv: "", name: "", postCode: "", country: "" });
      setSepaForm({ firstName: "", lastName: "", iban: "", bic: "", postCode: "", country: "", consent: false });
    }
  };

  return (
    <div className="fixed inset-0 z-100 bg-white flex flex-col animate-in fade-in duration-200">
      {/* Header */}
      <div className="px-4 py-6">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Close any open nested modals first
            if (showAddCard || showAddSepa || showAddPaypal) {
              setShowAddCard(false);
              setShowAddSepa(false);
              setShowAddPaypal(false);
              setEditingMethodId(null);
            } else if (showAddMethod) {
              setShowAddMethod(false);
            } else {
              onClose();
            }
          }}
          className="text-gray-900 p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-[20px] sm:text-[22px] font-gerat font-bold mt-2">
          Payment & Addresses
        </h2>
      </div>

      {/* Body */}
      {paymentMethods.length === 0 ? (
        <>
          <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-50">
            <Image src="/credit.svg" alt="credit" width={200} height={200} />

            <p className="text-gray-500 font-poppins text-[14px] sm:text-[15px] text-center max-w-xs mt-6">
              You have not added any payment methods
            </p>
          </div>

          {/* Footer / Action */}
          <div className="p-4 pb-8">
            <button
              onClick={() => setShowAddMethod(true)}
              className="w-full bg-[#0200FF] hover:bg-blue-700 text-white font-poppins text-[16px] font-medium py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <span className="text-xl font-light leading-none">+</span> add new
            </button>
          </div>
        </>
      ) : (
        <div className="flex-1 px-4 mt-4 overflow-y-auto no-scrollbar pb-32">
          <h3 className="text-[14px] sm:text-[15px] font-qurova font-bold text-gray-900 mb-4 px-1">
            Saved Payment Methods
          </h3>
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className={`p-5 rounded-xl border cursor-pointer transition-colors ${
                  selectedPaymentId === method.id
                    ? "bg-[#F8F9FA] border-gray-300"
                    : "bg-white border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  {/* Dynamic Logo Rendering */}
                  <div onClick={() => selectPayment(method.id)}>
                    {method.type === "card" && (
                      <div className="relative w-8 h-5 flex items-center">
                        <div className="w-4.5 h-4.5 rounded-full bg-[#EB001B] absolute left-0 opacity-90"></div>
                        <div className="w-4.5 h-4.5 rounded-full bg-[#F79E1B] absolute left-2.5 opacity-90 mix-blend-multiply"></div>
                      </div>
                    )}
                    {method.type === "sepa" && (
                      <div className="h-5.5 w-12.5 flex items-center justify-center bg-[#00529A] rounded-sm px-1 -mt-0.5 shadow-sm">
                        <div className="flex flex-col items-center justify-center mt-0.5">
                          <span className="text-white font-bold leading-none text-[11px] tracking-wide flex items-center">
                            S
                            <span className="text-[#FFC423] text-[12px] -mx-[0.5px]">
                              €
                            </span>
                            PA
                          </span>
                          <span className="text-white text-[4px] font-semibold leading-none tracking-wider uppercase opacity-90 mt-px">
                            Direct Debits
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Radio button */}
                  <div
                    onClick={() => selectPayment(method.id)}
                    className={`w-5.5 h-5.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      selectedPaymentId === method.id
                        ? "border-black"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedPaymentId === method.id && (
                      <div className="w-2.5 h-2.5 bg-black rounded-full"></div>
                    )}
                  </div>
                </div>

                <div 
                  className="space-y-1 cursor-pointer"
                  onClick={() => {
                    if (method.type === 'card') {
                      handleEditCard(method.id);
                    } else if (method.type === 'sepa') {
                      handleEditSepa(method.id);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-qurova font-bold text-[15px] text-gray-900">
                      {method.details?.holder || method.name}
                    </p>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (method.type === 'card') {
                          handleEditCard(method.id);
                        } else if (method.type === 'sepa') {
                          handleEditSepa(method.id);
                        }
                      }}
                      className="text-brand-orange text-[13px] sm:text-[14px] font-poppins font-semibold hover:underline"
                    >
                      Change
                    </button>
                  </div>
                  <p className="font-poppins text-[14px] text-gray-900 font-normal tracking-widest">
                    {method.details?.number || method.details?.iban || ""}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <button
              onClick={() => setShowAddMethod(true)}
              className="w-full bg-[#0200FF] hover:bg-blue-700 text-white font-poppins text-[15px] py-3.5 rounded-[10px] transition-colors"
            >
              add new
            </button>
          </div>
        </div>
      )}

      {/* Add Payment Method Bottom Sheet */}
      {showAddMethod && (
        <div className="fixed inset-0 z-110 flex flex-col justify-end animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowAddMethod(false)}
          ></div>

          {/* Bottom Sheet */}
          <div className="relative bg-white w-full h-[90vh] rounded-t-2xl p-4 sm:p-6 pb-8 animate-in slide-in-from-bottom-full duration-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[18px] sm:text-[20px] font-poppins font-bold">
                Add a Payment Method
              </h3>
              <button
                onClick={() => setShowAddMethod(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 -mr-2"
              >
                <X size={24} strokeWidth={3} />
              </button>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {/* Debit/Credit Card */}
              <button
                onClick={() => setShowAddCard(true)}
                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-gray-400 transition-colors bg-white"
              >
                <span className="font-poppins text-[14px] sm:text-[15px] text-gray-800">
                  Debit/Credit Card
                </span>
                <ChevronRight className="text-gray-400" size={20} />
              </button>

              {/* SEPA Direct Debit */}
              <button
                onClick={() => setShowAddSepa(true)}
                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-gray-400 transition-colors bg-white"
              >
                <span className="font-poppins text-[14px] sm:text-[15px] text-gray-800">
                  SEPA Direct Debit
                </span>
                <ChevronRight className="text-gray-400" size={20} />
              </button>

              {/* PayPal */}
              <button
                onClick={() => setShowAddPaypal(true)}
                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-gray-400 transition-colors bg-white"
              >
                <span className="font-poppins text-[14px] sm:text-[15px] text-gray-800">
                  PayPal
                </span>
                <ChevronRight className="text-gray-400" size={20} />
              </button>

              {/* Google Pay */}
              <button className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-gray-400 transition-colors bg-white">
                <div className="flex items-center gap-2">
                  <Image
                    src="/google2.svg"
                    alt="Google Pay"
                    width={50}
                    height={20}
                    className="h-4 w-auto object-contain"
                  />
                  <span className="font-poppins text-[14px] sm:text-[15px] text-gray-800">
                    Pay
                  </span>
                </div>
                <ChevronRight className="text-gray-400" size={20} />
              </button>
            </div>

            {/* Footer text */}
            <div className="flex items-start justify-center gap-2 mt-90 px-4">
              <Lock size={16} className="text-gray-600 shrink-0 mt-0.5" />
              <p className="font-poppins text-gray-600 text-[12px] sm:text-[13px] text-center max-w-62.5 leading-relaxed">
                Your payment details are encrypted and never shared with
                Krafters.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Debit/Credit Card Modal */}
      {showAddCard && (
        <div className="fixed inset-0 z-120 flex flex-col justify-end animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowAddCard(false)}
          ></div>

          {/* Bottom Sheet */}
          <div className="relative bg-white w-full h-[90vh] rounded-t-2xl p-4 sm:p-6 pb-8 animate-in slide-in-from-bottom-full duration-300 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[18px] sm:text-[20px] font-poppins font-bold">
                {editingMethodId ? "Edit Debit/Credit Card" : "Add Debit/Credit Card"}
              </h3>
              <button
                onClick={() => {
                  setShowAddCard(false);
                  setEditingMethodId(null);
                  setCardForm({ number: "", expires: "", cvv: "", name: "", postCode: "", country: "" });
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 -mr-2"
              >
                <X size={24} strokeWidth={3} />
              </button>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-6">
              {/* Payment Method Group */}
              <div>
                <label className="block text-[14px] font-poppins font-bold text-gray-900 mb-2">
                  Payment Method
                </label>
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white divide-y divide-gray-200 flex flex-col">
                  {/* Number row */}
                  <div className="flex items-center p-4">
                    <span className="w-20 text-[14px] font-poppins font-bold text-gray-800">
                      Number
                    </span>
                    <input
                      type="text"
                      placeholder="Required"
                      value={cardForm.number}
                      onChange={(e) => setCardForm({ ...cardForm, number: e.target.value })}
                      className="flex-1 pl-3 text-[14px] font-poppins outline-none placeholder:text-gray-400"
                    />
                  </div>

                  {/* Expires row */}
                  <div className="flex items-center p-4">
                    <span className="w-20 text-[14px] font-poppins font-bold text-gray-800 capitalize">
                      Expires
                    </span>
                    <input
                      type="text"
                      placeholder="MM/YYYY"
                      value={cardForm.expires}
                      onChange={(e) => setCardForm({ ...cardForm, expires: e.target.value })}
                      className="flex-1 pl-3 text-[14px] font-poppins outline-none placeholder:text-gray-400"
                    />
                  </div>

                  {/* CVV row */}
                  <div className="flex items-center p-4">
                    <span className="w-20 text-[14px] font-poppins font-bold text-gray-800">
                      CVV
                    </span>
                    <input
                      type="text"
                      placeholder="Security Code"
                      value={cardForm.cvv}
                      onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value })}
                      className="flex-1 text-[14px] font-poppins outline-none placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </div>

              {/* Billing Name */}
              <div>
                <label className="block text-[14px] font-qurova text-gray-900 mb-2">
                  Billing Name
                </label>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={cardForm.name}
                  onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                  className="w-full p-4 border border-gray-200 rounded-xl text-[14px] font-poppins outline-none placeholder:text-gray-400 focus:border-brand-orange bg-[#FAFAFA]"
                />
              </div>

              {/* Billing Address */}
              <div className="space-y-4">
                <label className="block text-[14px] font-poppins font-bold text-gray-900 -mb-2">
                  Billing Address
                </label>

                <div className="pt-4">
                  <label className="block text-[13px] font-qurova text-gray-700 mb-1">
                    Post Code
                  </label>
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="w-full p-4 border border-gray-200 rounded-xl text-[14px] font-poppins outline-none placeholder:text-gray-400 focus:border-brand-orange bg-[#FAFAFA]"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-qurova text-gray-700 mb-1">
                    Country/Region
                  </label>
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="w-full p-4 border border-gray-200 rounded-xl text-[14px] font-poppins outline-none placeholder:text-gray-400 focus:border-brand-orange bg-[#FAFAFA]"
                  />
                </div>
              </div>
            </div>

            {/* Done Button */}
            <div className="mt-4 pt-2 space-y-3">
              <button
                className="w-full bg-brand-orange hover:bg-orange-600 text-white font-poppins text-[16px] py-3.5 rounded-xl transition-colors"
                onClick={handleAddCard}
              >
                {editingMethodId ? "Update Card" : "Done"}
              </button>
              
              {editingMethodId && (
                <button
                  className="w-full bg-[#FE29291A] hover:bg-red-600 text-[#FE2929] font-poppins text-[16px] py-3.5 rounded-xl transition-colors"
                  onClick={handleDeleteCard}
                >
                  Delete Card
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add SEPA Direct Debit Modal */}
      {showAddSepa && (
        <div className="fixed inset-0 z-120 flex flex-col justify-end animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowAddSepa(false)}
          ></div>

          {/* Bottom Sheet */}
          <div className="relative bg-white w-full h-[90vh] rounded-t-2xl p-4 sm:p-6 pb-8 animate-in slide-in-from-bottom-full duration-300 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[18px] sm:text-[20px] font-poppins font-bold">
                {editingMethodId ? "Edit SEPA Direct Debit" : "Add SEPA Direct Debit"}
              </h3>
              <button
                onClick={() => {
                  setShowAddSepa(false);
                  setEditingMethodId(null);
                  setSepaForm({ firstName: "", lastName: "", iban: "", bic: "", postCode: "", country: "", consent: false });
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 -mr-2"
              >
                <X size={24} strokeWidth={3} />
              </button>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
              {/* First Name */}
              <div>
                <label className="block text-[14px] font-qurova text-gray-900 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  placeholder="First Name"
                  className="w-full p-4 border border-gray-200 rounded-xl text-[14px] font-poppins outline-none placeholder:text-gray-400 focus:border-brand-orange bg-[#FAFAFA]"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-[14px] font-qurova text-gray-900 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  placeholder="Last Name"
                  className="w-full p-4 border border-gray-200 rounded-xl text-[14px] font-poppins outline-none placeholder:text-gray-400 focus:border-brand-orange bg-[#FAFAFA]"
                />
              </div>

              {/* IBAN */}
              <div>
                <label className="block text-[14px] font-qurova text-gray-900 mb-2">
                  IBAN
                </label>
                <input
                  type="text"
                  placeholder="DE02 1223 1223 1223 1223 1223 1223"
                  className="w-full p-4 border border-gray-200 rounded-xl text-[14px] font-poppins outline-none placeholder:text-gray-400 focus:border-brand-orange bg-[#FAFAFA]"
                />
              </div>

              {/* BIC */}
              <div>
                <label className="block text-[14px] font-qurova text-gray-900 mb-2">
                  BIC
                </label>
                <input
                  type="text"
                  placeholder="0000 0000"
                  className="w-full p-4 border border-gray-200 rounded-xl text-[14px] font-poppins outline-none placeholder:text-gray-400 focus:border-brand-orange bg-[#FAFAFA]"
                />
              </div>

              {/* Checkbox */}
              <div className="flex items-start gap-3 pt-2">
                <input
                  type="checkbox"
                  className="w-4.5 h-4.5 mt-0.5 border-2 border-brand-orange rounded cursor-pointer appearance-none checked:bg-brand-orange relative before:content-[''] before:absolute before:inset-0 before:bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22%23ffffff%22%3e%3cpath fill-rule=%22evenodd%22 d=%22M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z%22 clip-rule=%22evenodd%22/%3e%3c/svg%3e')] before:opacity-0 checked:before:opacity-100 transition-colors"
                />
                <p className="font-poppins text-[13px] text-gray-700 leading-normal">
                  I hereby confirm the SEPA Direct Debit Mandate to Kraftigos.de
                </p>
              </div>

              {/* Billing Address */}
              <div className="space-y-4 pt-4">
                <label className="block text-[14px] font-poppins font-bold text-gray-900 -mb-2">
                  Billing Address
                </label>

                <div className="pt-4">
                  <label className="block text-[13px] font-qurova text-gray-700 mb-1">
                    Post Code
                  </label>
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="w-full p-4 border border-gray-200 rounded-xl text-[14px] font-poppins outline-none placeholder:text-gray-400 focus:border-brand-orange bg-[#FAFAFA]"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-qurova text-gray-700 mb-1">
                    Country/Region
                  </label>
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="w-full p-4 border border-gray-200 rounded-xl text-[14px] font-poppins outline-none placeholder:text-gray-400 focus:border-brand-orange bg-[#FAFAFA]"
                  />
                </div>
              </div>
            </div>

            {/* Done Button */}
            <div className="mt-4 pt-2 space-y-3">
              <button
                className="w-full bg-brand-orange hover:bg-orange-600 text-white font-poppins text-[16px] py-3.5 rounded-xl transition-colors"
                onClick={handleAddSepa}
              >
                {editingMethodId ? "Update SEPA" : "Done"}
              </button>
              
              {editingMethodId && (
                <button
                  className="w-full bg-[#FE29291A] hover:bg-red-600 text-[#FE2929] font-poppins text-[16px] py-3.5 rounded-xl transition-colors"
                  onClick={handleDeleteCard}
                >
                  Delete SEPA Account
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Connect PayPal Modal */}
      {showAddPaypal && (
        <div className="fixed inset-0 z-120 flex flex-col justify-end animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowAddPaypal(false)}
          ></div>

          {/* Bottom Sheet */}
          <div className="relative bg-white w-full h-[90vh] rounded-t-2xl p-4 sm:p-6 pb-8 animate-in slide-in-from-bottom-full duration-300 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[18px] sm:text-[20px] font-poppins font-medium">
                Connect Paypal
              </h3>
              <button
                onClick={() => setShowAddPaypal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 -mr-2"
              >
                <X size={24} strokeWidth={3} />
              </button>
            </div>

            {/* Content body */}
            <div className="flex-1 flex flex-col items-center justify-center -mt-20">
              {/* Animation Graphic */}
              <div className="flex flex-col items-center justify-center gap-1">
                {/* Kraftigo Text Logo */}
                <Image
                  src="/craft.svg"
                  alt="Krafitgo"
                  width={100}
                  height={35}
                  className="w-30 h-auto object-contain mb-2"
                />

                {/* Connecting Line Animation */}
                <div className="flex flex-col items-center py-2 h-16 w-10">
                  <div className="w-0.5 h-4 bg-brand-orange border-l border-brand-orange border-dashed"></div>

                  {/* Orbiting Ring Element */}
                  <div className="relative flex items-center justify-center w-6 h-6 my-1">
                    <div className="absolute inset-0 border-[3px] border-brand-orange rounded-full flex items-center justify-center"></div>
                  </div>

                  <div className="w-0.5 h-4 bg-brand-orange border-l border-brand-orange border-dashed"></div>
                </div>

                {/* PayPal Text Logo */}
                <Image
                  src="/paypal.svg"
                  alt="PayPal"
                  width={100}
                  height={25}
                  className="w-25 h-auto object-contain mt-2"
                />
              </div>

              {/* Launching Status Text */}
              <p className="font-poppins text-[13px] text-gray-500 mt-10">
                Launching paypal
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentFlowModal;
