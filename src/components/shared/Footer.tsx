"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {LegalModal} from "@/components/ui/LegalModal";
import { PrivacyContent } from "@/components/ui/PrivacyContent";

const Footer = () => {
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  return (
    <>
      <div className="border-t border-[#0000001A] py-4 flex items-center justify-between">
        <ul className="flex text-[12px] items-center gap-4">
          <li>
            <Link href="/" className="hover:text-brand-orange transition-colors">
              Home
            </Link>
          </li>
          <li>
            <Link href="/user/support" className="hover:text-brand-orange transition-colors">
              About Us
            </Link>
          </li>
          <li>
            <button
              onClick={() => setShowPrivacyModal(true)}
              className="hover:text-brand-orange transition-colors"
            >
              Privacy Policy
            </button>
          </li>
          <li>
            <Link href="/user/support" className="hover:text-brand-orange transition-colors">
              Contact Us
            </Link>
          </li>
        </ul>
        <Image
          src="/craft.svg"
          alt="kraftigö logo"
          width={108}
          height={58}
          priority
          className="w-28 h-auto object-contain"
        />
      </div>

      <LegalModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        title="Privacy Policy"
      >
        <PrivacyContent />
      </LegalModal>
    </>
  );
};

export default Footer;
