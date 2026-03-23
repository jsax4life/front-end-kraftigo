import type { ReactNode } from "react";

// ─── Reusable section helpers ─────────────────────────────────────────────────

const Section = ({ number, title, children }: { number?: string; title: string; children: ReactNode }) => (
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

const Sub = ({ number, children }: { number: string; children: ReactNode }) => (
  <div className="mb-2">
    <span className="font-semibold text-[#1D2939]">({number}) </span>
    {children}
  </div>
);

const Ul = ({ items }: { items: string[] }) => (
  <ul className="list-disc pl-5 space-y-1 mt-1">
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
);

// ─── Main Content ─────────────────────────────────────────────────────────────

export const TermsContent = () => (
  <article>
    {/* Effective date banner */}
    <div className="mb-8 p-4 rounded-2xl bg-[#FF66000D] border border-[#FF66001A]">
      <p className="text-[13px] font-poppins text-[#FF6600] font-semibold mb-1">Kraftigö Terms of Use</p>
      <p className="text-[12px] font-poppins text-gray-600">
        Please read these terms carefully before using the Kraftigö platform. By registering or using the platform, you agree to these Terms of Use.
      </p>
    </div>

    <Section number="1" title="General Provisions; Scope of Application">
      <Sub number="1">
        <strong>Platform Operator.</strong> Kraftigö operates a digital marketplace platform (the "Platform") enabling clients to discover, contact, and book services from local Krafters — including barbers, braiders, moving companies, carpenters, and other tradespeople.
      </Sub>
      <Sub number="2">
        <strong>Role as Intermediary.</strong> Kraftigö acts solely as an intermediary between clients and Krafters. Service contracts are concluded directly between the client and the Krafter. Kraftigö is not a party to any such agreement.
      </Sub>
      <Sub number="3">
        <strong>Scope of Application.</strong> These Terms govern access to and use of the Kraftigö application and website by clients. By registering or using the Platform, you agree to these Terms.
      </Sub>
      <Sub number="4">
        <strong>Amendments.</strong> We may modify these Terms to reflect technical or legal developments. Clients will be notified at least six (6) weeks before changes take effect. Continued use after the notice period constitutes acceptance.
      </Sub>
    </Section>

    <Section number="2" title="Eligibility and Registration">
      <Sub number="1">
        <strong>Age Requirement.</strong> The Platform may only be used by individuals aged 16 or above.
      </Sub>
      <Sub number="2">
        <strong>Registration.</strong> To access booking and messaging features, clients must register with:
        <Ul items={["Valid email address", "First and last name", "Phone number", "Postal code / city location"]} />
      </Sub>
      <Sub number="3">
        <strong>Accuracy.</strong> Clients must provide and maintain truthful, accurate, and complete information.
      </Sub>
      <Sub number="4">
        <strong>Account Security.</strong> Clients are solely responsible for the confidentiality of their login credentials and must notify us immediately of any unauthorised access.
      </Sub>
      <Sub number="5">
        <strong>Multiple Accounts.</strong> Creating multiple Customer accounts is prohibited.
      </Sub>
    </Section>

    <Section number="3" title="Platform Services">
      <Sub number="1">
        <strong>Core Services</strong> provided to clients include:
        <Ul items={[
          "Search and discovery of local Krafters by category",
          "Viewing Krafter profiles, portfolios, ratings, and reviews",
          "Direct messaging between clients and Krafters",
          "Booking and appointment scheduling",
          "Secure payment processing (where applicable)",
          "Rating and review system",
        ]} />
      </Sub>
      <Sub number="2">
        <strong>Free Usage.</strong> Registration and general use of the Platform is free of charge. Additional fees for premium features will be clearly disclosed before purchase.
      </Sub>
      <Sub number="3">
        <strong>Availability.</strong> We strive for 95% availability on an annual average, excluding maintenance, force majeure, and cyberattacks that could not be prevented with reasonable security measures.
      </Sub>
      <Sub number="4">
        <strong>No Guarantee of Match.</strong> We do not guarantee that a suitable Krafter will be available in your area or will respond to your inquiry.
      </Sub>
    </Section>

    <Section number="4" title="Booking and Contract Conclusion">
      <Sub number="1">
        <strong>Dual Contract Structure.</strong> Using our Platform creates two separate legal relationships: one between Kraftigö and the client, and a separate service contract between the client and the Krafter.
      </Sub>
      <Sub number="2">
        <strong>Customer Requests.</strong> Submitting a service request constitutes a non-binding invitation for Krafters to submit offers. You are not obligated to accept any offer.
      </Sub>
      <Sub number="3">
        <strong>Offer and Acceptance.</strong> A binding service contract is only formed when the client expressly accepts a Krafter's offer. Kraftigö is not involved in this contract.
      </Sub>
      <Sub number="4">
        <strong>Booking Confirmation.</strong> Upon acceptance, both parties receive a confirmation summarising the service, price, time, and location.
      </Sub>
      <Sub number="5">
        <strong>Payment Processing.</strong> Payment is collected by Kraftigö as the Krafter's commercial agent and held until service completion or 48 hours after service, whichever is earlier. Accepted methods: credit card, PayPal, SOFORT, SEPA direct debit.
      </Sub>
    </Section>

    <Section number="5" title="Ranking Transparency (P2B & DSA Art. 27)">
      <Sub number="1">
        <strong>Main Ranking Parameters:</strong>
        <Ul items={[
          "Proximity to your location (40%)",
          "Average rating from reviews (25%)",
          "Response rate and speed (15%)",
          "Profile completeness (10%)",
          "Completed bookings through the Platform (10%)",
        ]} />
      </Sub>
      <Sub number="2">
        <strong>Paid Placement.</strong> Krafters with premium subscriptions may receive enhanced visibility, clearly marked with "Sponsored" or "Premium" labels.
      </Sub>
    </Section>

    <Section number="6" title="Customer Obligations">
      <Sub number="1">
        <strong>Lawful Use.</strong> Clients may not post false or fraudulent requests, harass Krafters, or use the Platform for illegal purposes.
      </Sub>
      <Sub number="2">
        <strong>Respect for Appointments.</strong> Clients must honour confirmed appointments or provide at least 24 hours notice for cancellations. Late cancellations attract a 20% booking fee charge applied to both clients and Krafters.
      </Sub>
      <Sub number="3">
        <strong>Payment Obligation.</strong> Accepting a Krafter's offer creates a binding payment obligation for the agreed price.
      </Sub>
    </Section>

    <Section number="7" title="Ratings and Reviews">
      <p>Clients warrant that reviews reflect genuine personal experiences, are factually accurate, and do not contain inappropriate or incentivised content. We reserve the right to remove reviews that violate these Terms.</p>
    </Section>

    <Section number="8" title="Liability">
      <Sub number="1">
        <strong>No Liability for Krafter Services.</strong> Kraftigö expressly disclaims liability for the quality, safety, or legality of services provided by Krafters or any resulting loss or damage.
      </Sub>
      <Sub number="2">
        <strong>Platform Liability.</strong> Kraftigö is liable without limitation for damages caused by intentional or grossly negligent conduct. In cases of slight negligence, liability is limited to foreseeable typical damages arising from breach of material contractual obligations.
      </Sub>
    </Section>

    <Section number="9" title="Data Protection">
      <p>We process personal data in compliance with the GDPR, BDSG, and TMG. Full details are provided in our separate Privacy Policy. Clients have rights of access, rectification, erasure, portability, and the right to lodge a complaint with a supervisory authority.</p>
    </Section>

    <Section number="10" title="Right of Withdrawal (Consumers)">
      <p>If you are a consumer (§ 13 BGB), you have the right to withdraw from this contract within <strong>14 days</strong> without giving any reason. To exercise this right, contact us at <span className="text-[#FF6600]">widerruf@kraftigö.com</span>.</p>
    </Section>

    <Section number="11" title="Governing Law & Dispute Resolution">
      <p>These Terms are governed by the laws of the Federal Republic of Germany. For disputes, clients may contact our in-app support or email <span className="text-[#FF6600]">info@kraftigö.com</span>.</p>
      <p className="mt-2">The EU Online Dispute Resolution platform is available at: <span className="text-[#FF6600] break-all">https://ec.europa.eu/consumers/odr/</span></p>
    </Section>

    {/* Divider */}
    <div className="border-t border-gray-100 pt-6 mt-4">
      <p className="text-[12px] font-poppins text-gray-400 text-center">
        Last updated March 2025 · Kraftigö 
      </p>
    </div>
  </article>
);
