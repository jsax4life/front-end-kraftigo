"use client";

import { useState, type ReactNode } from "react";

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
      <span>{title}</span>
    </h3>
    <div className="space-y-3 text-[14px] font-poppins text-gray-700 leading-relaxed pl-8">
      {children}
    </div>
  </section>
);

const Sub = ({
  number,
  children,
}: {
  number: string | number;
  children: ReactNode;
}) => (
  <div className="mb-2.5">
    <span className="font-semibold text-[#1D2939]">({number}) </span>
    {children}
  </div>
);

interface TermsContentProps {
  initialTab?: "customer" | "krafter" | "impressum";
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const TermsContent = ({ initialTab = "customer" }: TermsContentProps) => {
  const [activeTab, setActiveTab] = useState<"customer" | "krafter" | "impressum">(
    initialTab
  );

  return (
    <article className="text-[#1D2939]">
      {/* ── Tabs Navigation ── */}
      <div className="flex items-center gap-2 mb-6 p-1 bg-gray-100 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab("customer")}
          className={`flex-1 py-2 px-3 text-xs sm:text-sm font-poppins font-medium rounded-lg transition-all ${
            activeTab === "customer"
              ? "bg-white text-[#FF6600] shadow-sm font-semibold"
              : "text-gray-600 hover:text-[#1D2939]"
          }`}
        >
          Customer Terms
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("krafter")}
          className={`flex-1 py-2 px-3 text-xs sm:text-sm font-poppins font-medium rounded-lg transition-all ${
            activeTab === "krafter"
              ? "bg-white text-[#FF6600] shadow-sm font-semibold"
              : "text-gray-600 hover:text-[#1D2939]"
          }`}
        >
          Krafter Terms
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("impressum")}
          className={`flex-1 py-2 px-3 text-xs sm:text-sm font-poppins font-medium rounded-lg transition-all ${
            activeTab === "impressum"
              ? "bg-white text-[#FF6600] shadow-sm font-semibold"
              : "text-gray-600 hover:text-[#1D2939]"
          }`}
        >
          Legal Notice
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* 1. LEGAL NOTICE (IMPRESSUM) */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {activeTab === "impressum" && (
        <div className="animate-in fade-in duration-200">
          <div className="mb-6 p-4 rounded-2xl bg-[#FF66000D] border border-[#FF66001A]">
            <p className="text-[14px] font-gerat text-[#FF6600] font-bold mb-1">
              Legal Notice (Impressum)
            </p>
            <p className="text-[12px] font-poppins text-gray-600">
              Information pursuant to Section 5 Digitale-Dienste-Gesetz (DDG)
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-4 text-[14px] font-poppins text-gray-700">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">
                Platform Operator
              </p>
              <p className="text-base font-bold text-[#1D2939]">Kraftigö</p>
              <p>Operated by: Adams Hassan, sole proprietor (Einzelunternehmen)</p>
              <p>Auf der Borg 26</p>
              <p>59494 Soest</p>
              <p>Germany</p>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">
                Contact
              </p>
              <p>
                Email:{" "}
                <a
                  href="mailto:info@kraftigo.com"
                  className="text-[#FF6600] hover:underline"
                >
                  info@kraftigo.com
                </a>
              </p>
              <p>Telephone: +49 1590 7955564</p>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* 2. CUSTOMER TERMS AND CONDITIONS */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {activeTab === "customer" && (
        <div className="animate-in fade-in duration-200">
          {/* Header Banner */}
          <div className="mb-8 p-4 rounded-2xl bg-[#FF66000D] border border-[#FF66001A]">
            <p className="text-[14px] font-gerat text-[#FF6600] font-bold mb-1">
              Customer Terms and Conditions
            </p>
            <p className="text-[12px] font-poppins text-gray-600">
              Kraftigö | Version: 25 October 2026
            </p>
          </div>

          <Section number="1" title="Scope, operator and language">
            <Sub number="1">
              These terms govern the use of the Kraftigö website, app and related
              marketplace services (together, the &ldquo;Platform&rdquo;) by customers.
            </Sub>
            <Sub number="2">
              The Platform is operated by Adams Hassan, trading as Kraftigö, a sole
              proprietor at Auf der Borg 26, 59494 Soest, Germany; email:{" "}
              <a
                href="mailto:info@kraftigo.com"
                className="text-[#FF6600] hover:underline"
              >
                info@kraftigo.com
              </a>
              ; telephone: +49 1590 7955564 (&ldquo;Kraftigö&rdquo;, &ldquo;we&rdquo;).
            </Sub>
            <Sub number="3">
              These Terms are provided in the language version displayed to the
              customer before booking. If Kraftigö makes multiple language
              versions available, the Platform will identify the applicable
              version before the customer books. Mandatory statutory rights remain
              unaffected.
            </Sub>
            <Sub number="4">Version: 25 October 2026.</Sub>
          </Section>

          <Section number="2" title="Kraftigö’s role">
            <Sub number="1">
              Kraftigö operates as an online marketplace that enables customers to
              discover, contact, book and pay for services offered by independent
              providers (&ldquo;Krafters&rdquo;).
            </Sub>
            <Sub number="2">
              The customer’s free account agreement is with Kraftigö. The service
              contract for a particular booking is formed directly between the
              customer and the Krafter.
            </Sub>
            <Sub number="3">
              Kraftigö is an intermediary and is not the service provider. The
              Krafter is responsible for the agreed service, including its
              performance, quality, permits and safety. This does not exclude
              liability that Kraftigö has under mandatory law or for its own acts or
              omissions.
            </Sub>
            <Sub number="4">
              Krafters act independently and set their own prices, service
              descriptions and availability. Kraftigö does not guarantee that a
              provider is suitable for a customer’s specific needs merely because
              a profile is displayed.
            </Sub>
            <Sub number="5">
              Before booking, the Platform identifies whether a Krafter states that
              they are acting as a business or as a private individual. This
              status is based on information collected and checks performed by
              Kraftigö; it is not a guarantee that a provider’s legal
              classification can never change.
            </Sub>
          </Section>

          <Section
            number="3"
            title="Provider information, search ranking and reviews"
          >
            <Sub number="1">
              The Platform displays the provider information required by
              applicable law and information supplied by the Krafter.
            </Sub>
            <Sub number="2">
              Search results may take into account relevance to the request,
              category, distance, availability, reviews, reliability indicators
              and profile completeness. The relative importance of these factors
              may vary according to the search and filters selected. Krafters
              cannot pay for a higher organic ranking; any paid placement, if
              introduced, will be clearly labelled.
            </Sub>
            <Sub number="3">
              Customers may be offered sorting or filtering options such as price,
              rating or distance where those features are available.
            </Sub>
            <Sub number="4">
              Reviews are intended to reflect actual customer experiences. Where
              the Platform states that reviews are from verified bookings, it will
              publish reviews only after checks linking them to a booking.
              Kraftigö will not claim that all reviews are verified unless this is
              technically and operationally true.
            </Sub>
            <Sub number="5">
              The Platform may moderate or remove unlawful, deceptive or
              policy-violating reviews, following applicable law and its published
              process.
            </Sub>
          </Section>

          <Section number="4" title="Eligibility and account">
            <Sub number="1">
              Customers must be of legal age and legally capable of entering into
              the relevant contract.
            </Sub>
            <Sub number="2">
              Customers must provide accurate information, keep it current, protect
              their login credentials and notify Kraftigö promptly of suspected
              unauthorised access.
            </Sub>
            <Sub number="3">
              One account per person is permitted unless Kraftigö authorises
              otherwise. Customers must not impersonate others or misuse another
              person’s information.
            </Sub>
            <Sub number="4">
              Customers may close their account through the Platform or by
              contacting{" "}
              <a
                href="mailto:support@kraftigo.com"
                className="text-[#FF6600] hover:underline"
              >
                support@kraftigo.com
              </a>
              . Account closure does not cancel a booking already agreed with a
              Krafter or remove legal record-retention duties.
            </Sub>
          </Section>

          <Section number="5" title="Booking and contract formation">
            <Sub number="1">
              The booking screen will show the Krafter’s identity/status, service
              description, date and time, service location where relevant, total
              price and any additional costs agreed in advance.
            </Sub>
            <Sub number="2">
              The customer must be able to review and correct the order before
              submitting it. The final order button must unambiguously indicate a
              payment obligation, for example &ldquo;Jetzt zahlungspflichtig
              buchen&rdquo;.
            </Sub>
            <Sub number="3">
              By submitting the booking, the customer makes a binding offer to enter
              into the service contract with the named Krafter.
            </Sub>
            <Sub number="4">
              The service contract is concluded when the Krafter accepts the
              booking through the Platform. The customer will receive confirmation
              on a durable medium, normally by email, including the booking
              details, applicable terms and required consumer information.
            </Sub>
            <Sub number="5">
              If the Krafter does not accept within 5 hours, the request expires.
              Any payment authorisation will be cancelled; if a payment was
              captured, it will be refunded promptly. The timing of any release or
              refund may depend on the payment method and bank.
            </Sub>
          </Section>

          <Section number="6" title="Prices, taxes and additional costs">
            <Sub number="1">
              The Krafter sets the service price. Before the customer submits the
              booking, the Platform displays the total amount payable, including
              any applicable taxes and mandatory charges, and clearly identifies
              any optional or separately agreed costs.
            </Sub>
            <Sub number="2">
              The Krafter is responsible for determining and stating their tax
              status. Kraftigö does not provide tax advice to Krafters.
            </Sub>
            <Sub number="3">
              No customer platform fee is currently charged. If this changes, any
              fee will be disclosed clearly before the customer commits to the
              relevant booking and will apply only where legally permitted.
            </Sub>
          </Section>

          <Section number="7" title="Payment and refunds">
            <Sub number="1">
              Kraftigö uses Stripe for payment processing and Stripe Connect
              Express for Krafter onboarding and payouts. The primary
              listed-booking flow uses Stripe PaymentIntents with manual capture.
              Payment is first authorised and, when the applicable
              booking-completion conditions are met, captured. Different booking
              types and payment methods may follow different flows.
            </Sub>
            <Sub number="2">
              In the primary listed-booking flow, the customer first authorises
              payment. Authorisation reserves the amount subject to Stripe,
              card-network and payment-method rules; it is not the same as final
              capture or settlement. Following the applicable completion workflow,
              Kraftigö’s backend may capture the payment through Stripe. Once
              captured, the payment settles into Kraftigö’s Stripe platform
              balance under the described integration, subject to Stripe’s
              processing and settlement arrangements. Kraftigö does not hold
              money.
            </Sub>
            <Sub number="3">
              Kraftigö records the Krafter’s expected earnings in its internal
              ledger. After completion is confirmed under the applicable booking
              rules, the internal ledger may mark the earnings as released and
              create a payout record. This internal ledger entry is a record of an
              amount attributable to the Krafter; it is not a separate bank account
              and does not, by itself, mean the Krafter has received a bank payout.
              The documented default payout hold period is seven days, but actual
              timing depends on production configuration, eligibility checks and
              Stripe.
            </Sub>
            <Sub number="4">
              Eligible withdrawals are requested by an authenticated Krafter.
              Kraftigö checks the connected-account status, payout capabilities,
              outstanding requirements, disputes and any recorded wallet debt. For
              an eligible payout, Kraftigö creates a Stripe Transfer to the
              Krafter’s connected account, after which Stripe manages payout to the
              Krafter’s verified bank account.
            </Sub>
            <Sub number="5">
              Payment authorisation, capture, internal earnings release and payout
              to a Krafter’s bank account are separate events and may occur at
              different times.
            </Sub>
            <Sub number="6">
              Payments are processed under the applicable Stripe terms and
              configuration. Stripe’s use does not, by itself, determine whether
              Kraftigö complies with all laws applicable to its business model.
              Kraftigö does not represent that its internal ledger is a legally
              segregated escrow account or that customer funds are held in a
              regulated escrow arrangement.
            </Sub>
            <Sub number="7">
              Refunds, cancellations, transfer reversals and chargebacks are
              handled through the applicable Stripe and Platform workflow.
              Processing times may depend on Stripe, the payment method and the
              customer’s bank. Any refund promise made in these Terms remains
              subject to mandatory law and must be operationally supported.
            </Sub>
            <Sub number="8">
              Payments made outside the Platform are not processed through this
              payment workflow. This does not waive rights the customer may have
              against the Krafter under applicable law.
            </Sub>
            <Sub number="9">
              Kraftigö may issue invoices electronically in the Krafter’s name and
              on their behalf. Krafters remain responsible for providing accurate
              invoicing and tax information and fulfilling their tax obligations.
              Kraftigö may separately invoice its own fees where applicable.
            </Sub>
          </Section>

          <Section
            number="8"
            title="Cancellation, provider no-show and cancellation fees"
          >
            <Sub number="1">
              This cancellation policy does not limit any statutory right of
              withdrawal or other mandatory consumer rights.
            </Sub>
            <Sub number="2">
              Customers may cancel confirmed bookings free of charge more than 24
              hours before the scheduled service. Cancellations made 12 to 24 hours
              before the appointment may incur a fee of 10% of the service price,
              capped at €8. Cancellations made less than 12 hours before the
              appointment may incur a fee of 20%, capped at €15. Any applicable fee
              is payable to the Krafter as compensation for reserved time,
              processed through the Platform, and charged only where lawful and
              disclosed before booking.
            </Sub>
            <Sub number="3">
              If the customer is unavailable at the agreed location and time, the
              Krafter must attempt to contact the customer and wait at least 15
              minutes before reporting a no-show. Kraftigö may request supporting
              evidence and will review a disputed report before applying a fee. A
              verified customer no-show may be treated as a cancellation made less
              than 12 hours before the appointment, subject to the fee cap and
              applicable law.
            </Sub>
            <Sub number="4">
              If a Krafter cancels or fails to attend without a valid reason, the
              customer will receive a refund of the service amount paid.
              Unjustified cancellations, delays of 15 minutes or more without
              adequate communication, and no-shows may result in reliability
              warnings or booking restrictions. Repeated or serious violations may
              result in temporary suspension or account termination. Genuine
              emergencies will be reviewed case by case.
            </Sub>
          </Section>

          <Section number="9" title="Statutory right of withdrawal">
            <Sub number="1">
              Where a consumer concludes a distance service contract with a
              Krafter acting as a business, the consumer may have a statutory
              14-day right of withdrawal. Whether an exception applies depends on
              the specific service and circumstances. No general waiver of statutory
              withdrawal rights is intended.
            </Sub>
            <Sub number="2">
              The identity of the contracting Krafter and the withdrawal recipient
              must be shown clearly. Where Kraftigö provides the withdrawal
              function on the Krafter’s behalf, it does so as an authorised
              recipient for that purpose. The function will be provided in
              accordance with applicable law.
            </Sub>
            <Sub number="3">
              If a consumer asks for a service to begin during the withdrawal
              period, the Platform must obtain the legally required express request
              and acknowledgement. If the consumer withdraws after performance
              has begun, a proportionate payment may be due only where the
              statutory conditions are met. The right of withdrawal is lost after
              full performance only if the required statutory conditions and
              consents have been satisfied.
            </Sub>
            <Sub number="4">
              The Platform will show the applicable withdrawal notice and model form
              for the relevant Krafter and service before booking where required.
            </Sub>
          </Section>

          <Section number="10" title="Service complaints and reports">
            <Sub number="1">
              Customers should first raise service-quality or performance issues
              with the Krafter through the Platform’s help and support section or
              by contacting{" "}
              <a
                href="mailto:support@kraftigo.com"
                className="text-[#FF6600] hover:underline"
              >
                support@kraftigo.com
              </a>{" "}
              as soon as reasonably possible. This does not shorten statutory
              limitation periods or remove mandatory rights.
            </Sub>
            <Sub number="2">
              Customers may also contact Kraftigö at{" "}
              <a
                href="mailto:support@kraftigo.com"
                className="text-[#FF6600] hover:underline"
              >
                support@kraftigo.com
              </a>
              . Kraftigö may facilitate communication, review platform conduct
              and, where authorised and technically possible, arrange a refund
              under the applicable policy. Unless expressly stated otherwise,
              Kraftigö does not adjudicate the Krafter’s legal liability for the
              service.
            </Sub>
            <Sub number="3">
              Users can report suspected illegal content, fraud, unsafe services,
              impersonation or violations of the terms through{" "}
              <a
                href="mailto:support@kraftigo.com"
                className="text-[#FF6600] hover:underline"
              >
                support@kraftigo.com
              </a>
              . Reports will be reviewed under the Platform’s applicable
              notice-and-action process.
            </Sub>
            <Sub number="4">
              Nothing in these terms limits a customer’s statutory rights against
              the Krafter or Kraftigö.
            </Sub>
          </Section>

          <Section number="11" title="User content and reviews">
            <Sub number="1">
              Users may submit content only if they have the necessary rights and
              lawful basis to do so. Content must not be unlawful, deceptive,
              defamatory, discriminatory, threatening, infringing or disclose
              another person’s confidential or personal information without a
              lawful basis.
            </Sub>
            <Sub number="2">
              Users grant Kraftigö a non-exclusive, worldwide, royalty-free
              licence for the duration and purposes necessary to host, display,
              reproduce and technically adapt content for operating and promoting
              the Platform within the service. Any broader off-platform marketing
              use of a person’s image or content requires a separate appropriate
              legal basis or consent.
            </Sub>
            <Sub number="3">
              Kraftigö may restrict or remove content where required by law or
              where reasonably necessary to enforce these terms. Where legally
              required, it will provide a statement of reasons and an available
              route to challenge the decision.
            </Sub>
            <Sub number="4">
              Reviews must be honest and based on genuine experience. Fake
              reviews, review manipulation, undisclosed incentives and reviews
              posted by a person about their own or closely connected profile are
              prohibited.
            </Sub>
          </Section>

          <Section number="12" title="Prohibited use">
            <p>
              Users must not: (a) provide materially false information; (b)
              request or provide illegal services or undeclared work; (c) harass,
              threaten, discriminate against or defraud another user; (d)
              infringe intellectual-property, privacy or personality rights; (e)
              upload malicious code or interfere with Platform security; (f)
              scrape or automatically extract data without permission; (g) evade
              payment or safety controls; or (h) misuse customer or provider data
              for purposes unrelated to a booking.
            </p>
          </Section>

          <Section number="13" title="Suspension and termination">
            <p>
              If there are specific indications of fraud, illegal activity, safety
              risk or a material breach, Kraftigö may take proportionate
              measures such as requesting information, restricting an offer,
              removing content, suspending an account or terminating the account.
              It will consider the circumstances and applicable law.
            </p>
          </Section>

          <Section number="14" title="Liability and insurance">
            <Sub number="1">
              Krafters act as independent service providers and are responsible
              for the performance, quality and safety of their services. To the
              extent permitted by law, Kraftigö is not responsible for a Krafter’s
              acts or omissions unless liability is attributable to Kraftigö
              under applicable law. Kraftigö’s liability for slight negligence is
              limited to breaches of essential contractual obligations and to
              foreseeable, typical damages. Nothing in these Terms excludes or
              limits liability where such exclusion or limitation is prohibited by
              law, including liability for injury to life, body or health,
              intentional misconduct, gross negligence or liability under the
              German Product Liability Act.
            </Sub>
            <Sub number="2">
              For slight negligence, Kraftigö is liable only for breach of an
              essential contractual obligation and only for damage that was
              foreseeable and typical for the contract. For other slightly
              negligent breaches, liability is excluded to the extent permitted by
              law.
            </Sub>
            <Sub number="3">
              The limitations above do not apply where prohibited by mandatory law
              and do not limit the Krafter’s liability for their own services.
              Kraftigö remains responsible for its own contractual duties and
              legally attributable conduct.
            </Sub>
            <Sub number="4">
              Kraftigö endeavours to maintain a secure and available Platform but
              does not guarantee uninterrupted availability. This does not exclude
              statutory rights or liability where exclusion is prohibited.
            </Sub>
            <Sub number="5">
              Krafters are expected to maintain appropriate insurance covering
              accidental damage to customers’ property arising from their services.
              Kraftigö does not currently provide insurance coverage for such
              risks. Any future insurance offered by Kraftigö will apply only if
              expressly confirmed and will be subject to the relevant policy
              terms, coverage limits, deductibles and exclusions.
            </Sub>
          </Section>

          <Section number="15" title="Data protection">
            <p>
              Personal data is processed as described in Kraftigö’s separate
              Privacy Policy, available through the Platform. Information needed
              to perform a booking may be shared with the relevant Krafter,
              payment provider and other disclosed service providers as described
              in that policy.
            </p>
          </Section>

          <Section number="16" title="Changes">
            <p>
              The version of these terms applicable to a booking is the version
              disclosed when the customer makes that booking. Changes to the
              ongoing account relationship will be notified where required.
              Changes that materially affect a customer’s rights or obligations
              require consent where required by law. A blanket clause allowing
              unilateral changes without a valid legal basis is not intended.
            </p>
          </Section>

          <Section number="17" title="Governing law and disputes">
            <p>
              German law applies, without depriving consumers of mandatory
              protections under the law that would otherwise apply to them. Any
              jurisdiction clause applies only to the extent legally permitted.
              Kraftigö is not willing or obliged to participate in consumer
              arbitration proceedings unless a statutory obligation applies.
            </p>
          </Section>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* 3. KRAFTER TERMS AND CONDITIONS */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {activeTab === "krafter" && (
        <div className="animate-in fade-in duration-200">
          {/* Header Banner */}
          <div className="mb-8 p-4 rounded-2xl bg-[#FF66000D] border border-[#FF66001A]">
            <p className="text-[14px] font-gerat text-[#FF6600] font-bold mb-1">
              Krafter Terms and Conditions
            </p>
            <p className="text-[12px] font-poppins text-gray-600">
              Kraftigö | Version: 25 October 2026
            </p>
          </div>

          <Section number="1" title="Scope and marketplace role">
            <p>
              These terms apply to providers offering services through Kraftigö
              (&ldquo;Krafters&rdquo;). Kraftigö is operated by Adams Hassan,
              trading as Kraftigö, a sole proprietor at Auf der Borg 26, 59494
              Soest, Germany, and provides marketplace/intermediation services.
              The service contract is between the Krafter and the customer.
              Kraftigö is not the service provider unless a booking explicitly
              says otherwise. No minimum number of bookings or income is
              promised.
            </p>
          </Section>

          <Section number="2" title="Independent status and lawful operation">
            <p>
              The Krafter acts in their own name, on their own account and
              responsibility, determines whether to accept bookings and sets their
              own prices, availability and service method. The Krafter may work
              for other clients and platforms. Nothing in these terms overrides
              the factual circumstances or mandatory law governing employment
              status. The Krafter is responsible for required trade registrations,
              residence/work authorisation, professional qualifications, permits,
              taxes, social-security obligations, invoices and appropriate
              insurance.
            </p>
          </Section>

          <Section number="3" title="Eligibility, status and verification">
            <p>
              Krafters must be of age and must have a residence status and work
              authorisation permitting the activity in Germany. They must
              accurately declare whether they act as a business or private
              individual and promptly update changes. They must provide accurate
              profile and tax information and cooperate with legally required
              verification. Kraftigö may request proportionate evidence and
              restrict onboarding or payouts if legally required information is
              missing. Collect only the identity data needed for a defined purpose,
              protect it, and delete it when no longer needed unless retention is
              legally required.
            </p>
          </Section>

          <Section number="4" title="Prohibited or restricted services">
            <p>
              Krafters may not list or perform unlawful services, undeclared work,
              services requiring a permit or services prohibited by Platform
              policy. Until approved through a category-specific compliance
              process, do not offer regulated/high-risk categories such as
              electrical/gas/water installations, regulated craft activities,
              medical or nursing services, childcare, passenger transport,
              legal/tax advice or security services. A general disclaimer does not
              replace permits or legally required professional qualifications.
            </p>
          </Section>

          <Section number="5" title="Profiles, offers and prices">
            <p>
              The Krafter is responsible for the accuracy, legality and
              completeness of their profile, service description, price, tax
              status, availability, qualifications and photographs. Prices must be
              displayed in the legally required manner, including applicable taxes
              and mandatory charges. If the small-business VAT exemption under
              Section 19 UStG applies, the Krafter must use accurate wording and
              must not imply that VAT is charged. The Krafter must have rights and
              any required permissions for uploaded content.
            </p>
          </Section>

          <Section number="6" title="Bookings and performance">
            <p>
              The Krafter may accept or decline each booking request. Acceptance
              forms the service contract directly with the customer. The Krafter
              must perform accepted services carefully, safely, on time and as
              agreed; comply with applicable law; communicate material changes
              promptly; and not discriminate unlawfully. The Krafter must not
              request payment outside the Platform in order to evade agreed
              platform rules or payment controls. If the service cannot be
              performed, the Krafter must notify the customer and cancel through
              the Platform promptly.
            </p>
          </Section>

          <Section number="7" title="Withdrawal and consumer information">
            <p>
              Where a consumer contracts with a Krafter acting as a business,
              statutory distance-selling and withdrawal rules may apply. The
              Krafter authorises Kraftigö, where the Platform provides the
              relevant functionality, to provide required notices and receive
              withdrawal declarations on the Krafter’s behalf. The Krafter must
              supply accurate identity, address, service and withdrawal
              information. Work must not begin during a withdrawal period unless
              the required express customer request and acknowledgements have been
              obtained. This clause does not transfer the Krafter’s legal duties to
              Kraftigö.
            </p>
          </Section>

          <Section number="8" title="Stripe and payment processing">
            <Sub number="1">
              Kraftigö uses Stripe for card payments and Stripe Connect Express
              for Krafter onboarding and payouts. The primary listed-booking flow
              uses Stripe PaymentIntents with manual capture. The customer first
              authorises payment; after the applicable completion conditions are
              satisfied, the backend captures the payment through Stripe.
            </Sub>
            <Sub number="2">
              In the primary listed-booking flow, the captured payment settles into
              Kraftigö’s Stripe platform balance under the applicable Stripe
              arrangements. Kraftigö records the Krafter’s attributable earnings
              in an internal ledger. This ledger is an accounting record, not a
              separate bank account, and an internal &ldquo;released&rdquo; status
              does not mean the money has reached the Krafter’s bank account.
            </Sub>
            <Sub number="3">
              The standard payout hold period is seven days. After the hold
              period, an authenticated Krafter may request a withdrawal, subject
              to connected-account status, payout eligibility, outstanding
              verification requirements, disputes and recorded wallet debt. For
              eligible payouts, Kraftigö creates a Stripe Transfer to the
              Krafter’s connected account, and Stripe manages the subsequent
              payout to the Krafter’s verified bank account.
            </Sub>
            <Sub number="4">
              To receive payouts, the Krafter must complete Stripe Connect Express
              onboarding and meet Stripe’s applicable verification and payout
              requirements. Stripe may request identity, bank or other
              information and may delay payouts or request further information
              under its own terms.
            </Sub>
            <Sub number="5">
              The Krafter authorises Kraftigö to transmit to Stripe the onboarding,
              identity-status, payment and transaction information necessary for
              payment processing and compliance. Kraftigö’s application does not
              store full card numbers, card security codes, Krafter bank account
              numbers or Connect identity-verification documents. Stripe hosts the
              card-entry and Connect onboarding flows. Further information about
              data sharing, roles, retention and recipients is set out in the
              separate Privacy Policy.
            </Sub>
            <Sub number="6">
              Refunds, transfer reversals, disputes and chargebacks are handled
              under the relevant Platform workflow and Stripe terms. The Krafter
              may be financially responsible for chargebacks, payment-provider
              fees or related amounts where the applicable Stripe agreement and
              law provide for that responsibility. The allocation of negative
              balances, refund costs and dispute losses follows the applicable
              agreements and Platform rules disclosed to the Krafter.
            </Sub>
            <Sub number="7">
              Different booking types and dispute-resolution situations may follow
              different payment, capture, transfer or refund workflows. A test or
              fallback Stripe account must never be used as a real Krafter’s payout
              destination.
            </Sub>
            <Sub number="8">
              Kraftigö uses booking-linked payment records, completion-based
              processing in the primary listed-booking flow, a configurable payout
              hold, connected-account eligibility checks, dispute and
              wallet-debt checks, refund and cancellation handling, idempotency
              protections and verified Stripe webhook signatures. These controls
              do not replace applicable legal, financial, anti-money-laundering,
              data-protection or other regulatory obligations.
            </Sub>
            <Sub number="9">
              Stripe’s involvement does not by itself establish that Kraftigö is
              exempt from payment-services regulation or any other legal
              requirement.
            </Sub>
            <Sub number="10">
              The Krafter must not misrepresent the payment flow to customers or
              ask customers to pay outside the Platform to evade disclosed
              Platform rules. Any commission, provider fee, payout timing or
              chargeback allocation will be disclosed before the Krafter accepts
              bookings and must comply with applicable law.
            </Sub>
          </Section>

          <Section number="9" title="Platform commission and fees">
            <p>
              Launch commission: no Kraftigö commission is charged for eligible
              bookings made through 30 November 2026. From 1 December 2026, the
              commission is 12% of the service price for eligible completed and
              paid bookings, plus VAT if legally chargeable. Stripe/payment-provider
              fees are allocated as disclosed during onboarding and in the
              provider’s own terms. Any change to the commission or new fee will
              be notified in advance, apply prospectively, and give the Krafter a
              reasonable opportunity to terminate before it takes effect. No
              commission is charged on a booking that is fully cancelled or fully
              refunded, except where a clearly disclosed and lawful charge
              applies.
            </p>
          </Section>

          <Section number="10" title="Taxes and platform reporting">
            <p>
              The Krafter remains responsible for their own tax returns and tax
              payments. Where Kraftigö provides an invoicing feature, the Krafter
              authorises Kraftigö to generate, issue and deliver invoices
              electronically in the Krafter’s name and on their behalf, using
              information supplied by the Krafter. The Krafter must provide
              accurate and complete invoicing and tax information and remains
              responsible for its accuracy and for their own tax obligations.
              Kraftigö may separately invoice its own fees where applicable.
              Kraftigö may be legally required under the Platform Tax
              Transparency Act (PStTG/DAC7) to collect, verify, retain and report
              provider identity and transaction information to the German Federal
              Central Tax Office or another competent authority. The scope and
              exceptions depend on the law and the type of activity; the
              exemption for certain low-volume sellers of goods must not be
              presented as a general exemption for personal services. Krafters
              must provide accurate required information and promptly update it.
              Where reporting rules require it, Kraftigö may have to restrict an
              account or payments if information remains incomplete.
            </p>
          </Section>

          <Section
            number="11"
            title="Cancellation, safety and customer complaints"
          >
            <p>
              The Krafter must cancel only where reasonably justified, notify the
              customer and Kraftigö promptly, and use the Platform cancellation
              flow. Krafters must arrive at the agreed time and notify the
              customer and Kraftigö promptly if delayed; delays of 15 minutes or
              more without adequate communication may be recorded as reliability
              incidents. If a customer is unavailable, the Krafter must attempt
              contact, wait at least 15 minutes and submit a no-show report with
              supporting evidence. If the Krafter cancels or fails to attend
              without a valid reason, the customer will receive a refund of the
              service amount paid. Unjustified cancellations, no-shows, repeated
              lateness, credible safety complaints, fraud indicators or unlawful
              conduct may result in proportionate warnings, booking restrictions,
              suspension or termination. Genuine emergencies and disputed reports
              will be reviewed fairly.
            </p>
          </Section>

          <Section number="12" title="Liability, indemnity and insurance">
            <p>
              The Krafter is responsible under applicable law for their service,
              including injury, property damage, defects, permits and professional
              conduct. To the extent permitted by law, the Krafter must reimburse
              Kraftigö for reasonable losses and legal costs resulting from a
              third-party claim caused by the Krafter’s culpable breach of law or
              these terms, provided Kraftigö promptly notifies the Krafter and
              allows reasonable participation in the defence. This does not cover
              loss caused by Kraftigö’s own fault and does not override mandatory
              law. Krafters must maintain insurance required by law and any
              category-specific insurance condition disclosed before they accept
              bookings. Krafters are also expected to maintain appropriate
              insurance covering accidental damage to customers’ property arising
              from their services. Kraftigö does not currently provide insurance
              coverage for such risks. Any future insurance offered by Kraftigö
              will apply only if expressly confirmed and will be subject to the
              relevant policy terms, coverage limits, deductibles and exclusions.
            </p>
          </Section>

          <Section number="13" title="Content licence and customer data">
            <p>
              The Krafter grants Kraftigö a non-exclusive, royalty-free licence
              for the term of the account to host, display and technically adapt
              profile content as needed to operate the Platform. Separate consent
              or another valid legal basis is required for broader advertising use
              where applicable. Customer data may be used only for the relevant
              booking, legal compliance and other purposes disclosed in the
              Privacy Policy. Krafters must keep customer data secure, must not
              add customers to marketing lists without a valid legal basis, and
              must delete or return data when no longer needed unless retention is
              required by law.
            </p>
          </Section>

          <Section
            number="14"
            title="Platform transactions and anti-circumvention"
          >
            <p>
              For 12 months after a customer is first introduced to the Krafter
              through Kraftigö, the Krafter must not deliberately use the
              introduction to evade a clearly disclosed platform fee or payment
              rule by moving the same booking off-platform. This restriction does
              not prevent a Krafter from serving their pre-existing clients,
              obtaining clients independently, or working elsewhere.
            </p>
          </Section>

          <Section
            number="15"
            title="Content moderation, suspension and termination"
          >
            <p>
              Kraftigö may investigate credible reports, request information,
              restrict an offer, remove content or suspend/terminate an account
              where necessary and proportionate for legal compliance, safety,
              fraud prevention or material breach. Where required, Kraftigö will
              provide a statement of reasons and a route to challenge the decision.
              The Krafter may appeal by contacting{" "}
              <a
                href="mailto:info@kraftigo.com"
                className="text-[#FF6600] hover:underline"
              >
                info@kraftigo.com
              </a>
              ; appeals will be reviewed by a person where required by law. The
              Krafter may terminate the account through the platform, subject to
              bookings already accepted and applicable legal retention obligations.
            </p>
          </Section>

          <Section number="16" title="Changes, governing law">
            <p>
              Changes to these terms will be notified in text form with reasonable
              advance notice and will apply prospectively. Material changes
              require consent where the law requires it. German law applies
              subject to mandatory protections. Any jurisdiction clause applies
              only to the extent legally permitted. If one provision is invalid,
              the remaining provisions remain effective to the extent permitted by
              law.
            </p>
          </Section>
        </div>
      )}

      {/* ── Footer timestamp ── */}
      <div className="border-t border-gray-100 pt-6 mt-8">
        <p className="text-[12px] font-poppins text-gray-400 text-center">
          Version: 25 October 2026 · Kraftigö
        </p>
      </div>
    </article>
  );
};
