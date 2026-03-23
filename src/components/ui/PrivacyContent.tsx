import type { ReactNode } from "react";

// ─── Reusable section helpers ─────────────────────────────────────────────────

const Section = ({
  number,
  title,
  children,
}: {
  number?: string;
  title: string;
  children: ReactNode;
}) => (
  <section className="mb-8">
    <h3 className="text-[16px] sm:text-[17px] font-gerat font-bold text-[#1D2939] mb-3 flex items-start gap-2">
      {number && (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#FF66001A] text-[#FF6600] text-[12px] font-bold shrink-0 mt-0.5">
          {number}
        </span>
      )}
      {title}
    </h3>
    <div className="space-y-3 text-[14px] font-poppins text-gray-700 leading-relaxed pl-8">
      {children}
    </div>
  </section>
);

const Sub = ({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) => (
  <div className="mb-2">
    <p className="font-semibold text-[#1D2939] mb-1">{title}</p>
    {children && <div className="pl-2">{children}</div>}
  </div>
);

const Ul = ({ items }: { items: string[] }) => (
  <ul className="list-disc pl-5 space-y-1 mt-1">
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
);

const DataTable = ({
  rows,
}: {
  rows: [string, string][];
}) => (
  <div className="overflow-x-auto mt-2 rounded-xl border border-gray-100">
    <table className="w-full text-[13px] font-poppins">
      <thead>
        <tr className="bg-[#FF66000D]">
          <th className="text-left px-4 py-2 font-semibold text-[#1D2939]">
            Data Type
          </th>
          <th className="text-left px-4 py-2 font-semibold text-[#1D2939]">
            Retention Period
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([type, period], i) => (
          <tr
            key={i}
            className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
          >
            <td className="px-4 py-2 text-gray-700">{type}</td>
            <td className="px-4 py-2 text-gray-500">{period}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ─── Main Content ─────────────────────────────────────────────────────────────

export const PrivacyContent = () => (
  <article>
    {/* Banner */}
    <div className="mb-8 p-4 rounded-2xl bg-[#FF66000D] border border-[#FF66001A]">
      <p className="text-[13px] font-poppins text-[#FF6600] font-semibold mb-1">
        Kraftigö Privacy Policy
      </p>
      <p className="text-[12px] font-poppins text-gray-600">
        Created 04 March 2026 · Processed in accordance with GDPR, BDSG &
        TTDSG
      </p>
    </div>

    <Section number="1" title="Introduction">
      <p>
        Welcome to Kraftigö. This Privacy Policy explains how we collect, use,
        store, and protect personal data when you access or use our platform.
      </p>
      <p>
        Our platform connects skilled craftsmen ("Krafters") with clients
        seeking services — helping address shortages in skilled trades and
        improving access to reliable professionals.
      </p>
      <p>We process data in compliance with:</p>
      <Ul
        items={[
          "General Data Protection Regulation (GDPR)",
          "German Federal Data Protection Act (BDSG)",
          "Telecommunications and Telemedia Data Protection Act (TTDSG)",
          "Other applicable European and national data protection laws",
        ]}
      />
      <p>
        By using our platform, you agree to the collection and processing of
        data as described in this policy.
      </p>
    </Section>

    <Section number="2" title="Data Controller">
      <p>
        The controller responsible for data processing under Article 4(7) GDPR
        is:
      </p>
      <div className="mt-2 p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
        <p className="font-semibold text-[#1D2939]">Kraftigö</p>
        <p>
          Email:{" "}
          <span className="text-[#FF6600]">info@kraftigö.com.de</span>
        </p>
      </div>
    </Section>

    <Section number="3" title="Categories of Personal Data We Collect">
      <Sub title="3.1 Account Information">
        <Ul
          items={[
            "Full name",
            "Email address",
            "Phone number",
            "Password (encrypted)",
          ]}
        />
      </Sub>

      <Sub title="3.2 Profile Information">
        <p className="text-[13px] text-gray-500 mb-1">For Krafters:</p>
        <Ul
          items={[
            "Professional skills and trade categories",
            "Work experience & certifications",
            "Portfolio images",
            "Location / service area & availability",
            "Ratings and reviews",
          ]}
        />
        <p className="text-[13px] text-gray-500 mt-3 mb-1">For Clients:</p>
        <Ul
          items={[
            "Job requests & project descriptions",
            "Location",
            "Preferred schedule",
            "Ratings and feedback",
          ]}
        />
      </Sub>

      <Sub title="3.3 Communication Data">
        <Ul
          items={[
            "Messages exchanged between users",
            "Customer support communications",
            "Notifications and responses",
          ]}
        />
      </Sub>

      <Sub title="3.4 Technical Data">
        <Ul
          items={[
            "IP address, device type, operating system, browser type",
            "Access time & usage logs",
            "Application activity",
          ]}
        />
      </Sub>

      <Sub title="3.5 Payment Information">
        <Ul
          items={[
            "Payment transaction records",
            "Billing details",
            "Payment provider identifiers",
          ]}
        />
        <p className="mt-1 text-[13px] text-gray-500">
          Sensitive payment data is handled directly by third-party payment
          processors.
        </p>
      </Sub>
    </Section>

    <Section number="4" title="Purpose of Data Processing">
      <Sub title="Platform Functionality">
        <Ul
          items={[
            "Creating and managing user accounts",
            "Connecting craftsmen with clients",
            "Enabling job postings and service requests",
          ]}
        />
      </Sub>
      <Sub title="Communication">
        <Ul
          items={[
            "Allowing users to communicate within the platform",
            "Providing customer support",
          ]}
        />
      </Sub>
      <Sub title="Service Improvement">
        <Ul
          items={[
            "Improving platform performance",
            "Developing new features",
            "Analysing usage trends",
          ]}
        />
      </Sub>
      <Sub title="Security and Fraud Prevention">
        <Ul
          items={[
            "Preventing misuse or fraud",
            "Verifying user identity where necessary",
            "Monitoring suspicious activities",
          ]}
        />
      </Sub>
      <Sub title="Legal Compliance">
        <Ul
          items={[
            "Complying with legal obligations",
            "Responding to lawful requests from authorities",
          ]}
        />
      </Sub>
    </Section>

    <Section number="5" title="Legal Basis for Processing">
      <div className="space-y-3">
        {[
          {
            basis: "Contract Performance — Art. 6(1)(b)",
            desc: "Processing necessary to provide the services of the platform.",
          },
          {
            basis: "Legitimate Interest — Art. 6(1)(f)",
            desc: "Improving platform security, performance, and reliability.",
          },
          {
            basis: "Consent — Art. 6(1)(a)",
            desc: "For optional services such as marketing communications and analytics.",
          },
          {
            basis: "Legal Obligation — Art. 6(1)(c)",
            desc: "Compliance with applicable laws and regulatory requirements.",
          },
        ].map(({ basis, desc }) => (
          <div
            key={basis}
            className="p-3 rounded-xl border border-gray-100 bg-gray-50"
          >
            <p className="font-semibold text-[#1D2939] text-[13px]">{basis}</p>
            <p className="text-[13px] text-gray-600 mt-0.5">{desc}</p>
          </div>
        ))}
      </div>
    </Section>

    <Section number="6" title="Data Sharing and Third Parties">
      <p>
        We may share personal data with trusted third parties when necessary to
        operate the platform:
      </p>
      <Ul
        items={[
          "Hosting Providers — cloud infrastructure for our platform",
          "Payment Processors — secure handling of financial transactions",
          "Analytics Providers — understanding platform performance",
          "Legal Authorities — when required by law or to protect safety",
        ]}
      />
      <p className="mt-2">
        All service providers are required to comply with GDPR. Data Processing
        Agreements (DPAs) are established where required.
      </p>
    </Section>

    <Section number="7" title="International Data Transfers">
      <p>
        If personal data is transferred outside the European Economic Area
        (EEA), appropriate safeguards will be implemented, including:
      </p>
      <Ul
        items={[
          "Standard Contractual Clauses approved by the European Commission",
          "Adequacy decisions",
          "Other lawful mechanisms permitted by GDPR",
        ]}
      />
    </Section>

    <Section number="8" title="Data Retention">
      <p>
        Personal data is stored only for as long as necessary to fulfil the
        purposes described in this policy:
      </p>
      <DataTable
        rows={[
          ["Account information", "Until account deletion"],
          ["Communication data", "Up to 3 years"],
          ["Technical logs", "30–90 days"],
          ["Financial records", "Up to 10 years (legal requirement)"],
        ]}
      />
      <p className="mt-3 text-[13px] text-gray-500">
        Data may be retained longer when required by law.
      </p>
    </Section>

    <Section number="9" title="Your Rights Under GDPR">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {[
          { right: "Right of Access", desc: "Request access to your stored personal data." },
          { right: "Right to Rectification", desc: "Request correction of inaccurate information." },
          { right: "Right to Erasure", desc: "Request deletion of your data where legally permitted." },
          { right: "Right to Restrict Processing", desc: "Request limitations on how your data is used." },
          { right: "Right to Data Portability", desc: "Receive a copy of your data in a portable format." },
          { right: "Right to Object", desc: "Object to processing based on legitimate interests." },
        ].map(({ right, desc }) => (
          <div
            key={right}
            className="p-3 rounded-xl border border-gray-100 bg-[#FF66000A]"
          >
            <p className="font-semibold text-[#1D2939] text-[13px]">{right}</p>
            <p className="text-[12px] text-gray-600 mt-0.5">{desc}</p>
          </div>
        ))}
      </div>
      <p className="mt-4">
        Submit requests to:{" "}
        <span className="text-[#FF6600] font-semibold">
          info@kraftigö.com.de
        </span>
      </p>
      <p className="mt-1">
        You also have the right to lodge a complaint with the competent State
        Data Protection Authority (Landesdatenschutzbehörde).
      </p>
    </Section>

    <Section number="10" title="Cookies and Tracking">
      <p>
        Our platform may use cookies or similar technologies to maintain user
        sessions, improve functionality, and analyse usage patterns.
      </p>
      <p>
        Non-essential cookies are only activated after obtaining your consent,
        in accordance with GDPR and TTDSG. You may manage cookie preferences
        through your browser or platform settings.
      </p>
    </Section>

    <Section number="11" title="Data Security">
      <p>We implement appropriate technical and organisational measures including:</p>
      <Ul
        items={[
          "Encrypted communication (HTTPS)",
          "Secure authentication mechanisms",
          "Restricted access to sensitive data",
          "Regular security monitoring & vulnerability testing",
        ]}
      />
      <p className="mt-2 text-[13px] text-gray-500">
        Despite these efforts, no system can guarantee complete security.
      </p>
    </Section>

    <Section number="12" title="Children's Privacy">
      <p>
        Our platform is not intended for individuals under the age of 16. We do
        not knowingly collect personal data from minors. If such data is
        discovered, it will be deleted promptly.
      </p>
    </Section>

    <Section number="13" title="Changes to This Policy">
      <p>
        We may update this Privacy Policy from time to time. Users will be
        notified of significant changes through the platform or via email.
      </p>
    </Section>

    <Section number="14" title="Contact">
      <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
        <p className="font-semibold text-[#1D2939]">Kraftigö</p>
        <p>
          Email:{" "}
          <span className="text-[#FF6600]">info@kraftigö.com.de</span>
        </p>
      </div>
    </Section>

    {/* Footer */}
    <div className="border-t border-gray-100 pt-6 mt-4">
      <p className="text-[12px] font-poppins text-gray-400 text-center">
        Created 04 March 2026 · Kraftigö
      </p>
    </div>
  </article>
);
