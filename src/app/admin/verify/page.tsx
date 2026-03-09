"use client";

import React, { useState } from "react";
import Image from "next/image";
import { 
  CheckCircle2, 
  XCircle, 
  Eye, 
  ShieldCheck, 
  Search, 
  Filter,
  MoreVertical,
  Download
} from "lucide-react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import toast from "react-hot-toast";

const pendingUsers = [
  {
    id: "1",
    name: "Alex Johnson",
    email: "alex.j@example.com",
    trade: "Plumbing",
    submittedAt: "2026-03-08T10:30:00Z",
    documents: [
      { name: "ID Front", type: "IMAGE", url: "/images/doc-placeholder.png" },
      { name: "Work Permit", type: "PDF", url: "#" }
    ]
  },
  {
    id: "2",
    name: "Sarah Miller",
    email: "sarah.m@test.com",
    trade: "Electrical",
    submittedAt: "2026-03-07T15:45:00Z",
    documents: [
      { name: "Passport", type: "IMAGE", url: "/images/doc-placeholder.png" }
    ]
  },
  {
    id: "3",
    name: "Marco Rossi",
    email: "marco@italy-craft.com",
    trade: "Carpentry",
    submittedAt: "2026-03-08T09:00:00Z",
    documents: [
      { name: "National ID", type: "IMAGE", url: "/images/doc-placeholder.png" },
      { name: "Certificates", type: "PDF", url: "#" }
    ]
  }
];

export default function AdminVerificationPage() {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const router = useRouter(); // Initialize useRouter

  const handleApprove = (userId: string) => {
    toast.success("User approved and notified!");
    setSelectedUser(null);
    router.push("/tasker/dashboard"); // Redirect to tasker dashboard
  };

  const handleReject = (userId: string) => {
    toast.error("Verification rejected. User will be asked to re-upload.");
    setSelectedUser(null);
  };

  return (
    <main className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1D2939] text-white p-6 hidden lg:block">
        <div className="mb-10">
           <Image src="/taskerLogo.svg" alt="Logo" width={140} height={40} className="brightness-0 invert" />
        </div>
        <nav className="space-y-2">
           <div className="bg-brand-orange/10 text-brand-orange p-3 rounded-lg flex items-center gap-3">
              <ShieldCheck size={20} />
              <span className="font-bold">Verifications</span>
           </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-xl font-gerat font-bold text-gray-800">Admin Panel / Document Verification</h1>
          <div className="flex items-center gap-4">
             <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search users..." 
                  className="pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm border-transparent focus:bg-white focus:ring-1 focus:ring-brand-orange outline-none transition-all"
                />
             </div>
             <div className="w-10 h-10 rounded-full bg-brand-orange text-white flex items-center justify-center font-bold">
                AD
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
           <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                 <div>
                    <h2 className="text-[24px] font-gerat font-bold text-[#1D2939]">Pending Approvals</h2>
                    <p className="text-gray-500 font-poppins text-sm">Review and verify artisan identity documents</p>
                 </div>
                 <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 bg-white shadow-sm">
                    <Filter size={16} /> Filter
                 </button>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-4 gap-6 mb-8">
                 {[
                   { label: "Total Pending", val: "12", color: "blue" },
                   { label: "Verified Today", val: "45", color: "green" },
                   { label: "Rejected", val: "2", color: "red" },
                   { label: "Avg Review Time", val: "2.4h", color: "orange" }
                 ].map((stat, i) => (
                   <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                      <p className="text-xs text-gray-400 uppercase font-bold mb-1">{stat.label}</p>
                      <p className={`text-2xl font-gerat font-bold text-${stat.color}-600`}>{stat.val}</p>
                   </div>
                 ))}
              </div>

              {/* Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                 <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-100">
                       <tr>
                          <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Artisan</th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Trade</th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Documents</th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Submitted</th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                       {pendingUsers.map((user) => (
                         <tr key={user.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedUser(user)}>
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                     {user.name.charAt(0)}
                                  </div>
                                  <div>
                                     <p className="text-sm font-bold text-[#1D2939]">{user.name}</p>
                                     <p className="text-xs text-gray-400">{user.email}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-600">{user.trade}</td>
                            <td className="px-6 py-4">
                               <div className="flex gap-1">
                                  {user.documents.map((doc, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-gray-100 rounded-md text-[10px] font-bold text-gray-500 uppercase">
                                       {doc.name}
                                    </span>
                                  ))}
                               </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-400 font-poppins">
                               {new Date(user.submittedAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                               <button className="p-2 text-gray-400 hover:text-brand-orange">
                                  <Eye size={18} />
                               </button>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      </div>

      {/* Review Side Drawer */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-black/20" onClick={() => setSelectedUser(null)} />
           <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                 <h2 className="text-xl font-gerat font-bold">Review Artisan Profile</h2>
                 <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-gray-100 rounded-full">
                    <XCircle size={24} className="text-gray-400" />
                 </button>
              </div>

              <div className="flex-1 overflow-auto p-8 space-y-8">
                 <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-brand-orange text-white flex items-center justify-center text-3xl font-bold">
                       {selectedUser.name.charAt(0)}
                    </div>
                    <div>
                        <h3 className="text-2xl font-gerat font-bold">{selectedUser.name}</h3>
                        <p className="text-gray-500">{selectedUser.trade} Artisan</p>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <h4 className="text-sm font-bold uppercase text-gray-400">Identity Documents</h4>
                    <div className="grid grid-cols-1 gap-4">
                       {selectedUser.documents.map((doc: any, i: number) => (
                         <div key={i} className="group relative border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:border-brand-orange transition-all">
                            <div className="aspect-video bg-gray-100 flex items-center justify-center">
                               {doc.type === 'IMAGE' ? (
                                 <div className="relative w-full h-full text-center p-8 flex flex-col items-center justify-center text-gray-400">
                                     <Eye size={48} className="mb-2 opacity-20" />
                                     <p className="text-xs font-poppins">Preview of {doc.name}</p>
                                 </div>
                               ) : (
                                 <div className="text-center p-8">
                                    <Download size={48} className="mx-auto mb-2 text-gray-300" />
                                    <p className="text-sm font-bold">Download {doc.name}</p>
                                 </div>
                               )}
                            </div>
                            <div className="p-4 bg-white flex items-center justify-between">
                               <span className="text-sm font-bold text-gray-700">{doc.name}</span>
                               <button className="text-brand-orange text-xs font-bold hover:underline">Full View</button>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                    <h4 className="text-orange-900 font-bold mb-2">Checklist for Verification:</h4>
                    <ul className="space-y-3">
                       {[
                         "Photo matches identity document",
                         "ID is currently active and valid",
                         "Artisan name matches legal ID exactly",
                         "Work eligibility matches region requirements"
                       ].map((item, i) => (
                         <li key={i} className="flex gap-2 items-start text-sm text-orange-800">
                            <div className="mt-1 shrink-0 w-4 h-4 border-2 border-orange-400 rounded flex items-center justify-center" />
                            {item}
                         </li>
                       ))}
                    </ul>
                 </div>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50 grid grid-cols-2 gap-4">
                 <button 
                  onClick={() => handleReject(selectedUser.id)}
                  className="py-4 border border-red-200 text-red-600 bg-white rounded-xl font-bold hover:bg-red-50 transition-colors"
                 >
                    Reject Application
                 </button>
                 <Button 
                   variant="primary" 
                   className="py-4 font-bold"
                   onClick={() => handleApprove(selectedUser.id)}
                 >
                    Approve Artisan
                 </Button>
              </div>
           </div>
        </div>
      )}
    </main>
  );
}
