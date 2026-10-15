import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { SUPPORT_EMAIL } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms & Conditions — PrintMyDoc",
  description: "The terms that govern use of PrintMyDoc by print shops and their customers.",
};

const mail = (
  <a href={`mailto:${SUPPORT_EMAIL}`} className="text-accent-400 hover:underline">
    {SUPPORT_EMAIL}
  </a>
);

const sections = [
  {
    id: "acceptance",
    title: "Acceptance of terms",
    body: (
      <>
        <p>
          These Terms &amp; Conditions (&quot;Terms&quot;) govern your use of the PrintMyDoc website, dashboard, public
          order pages, print agent and related services (the &quot;Service&quot;). By creating an account or placing an
          order, you agree to these Terms and to our{" "}
          <Link href="/privacy-policy" className="text-accent-400 hover:underline">
            Privacy Policy
          </Link>
          . If you do not agree, please do not use the Service.
        </p>
        <p>
          &quot;Merchant&quot; means a print shop or business with a PrintMyDoc account. &quot;Customer&quot; means a
          person who places a print order with a Merchant through the Service.
        </p>
      </>
    ),
  },
  {
    id: "accounts",
    title: "Merchant accounts",
    body: (
      <ul className="list-disc pl-5 flex flex-col gap-1.5">
        <li>You must be at least 18 years old and able to enter into a binding contract.</li>
        <li>You must provide accurate business and contact information and keep it up to date.</li>
        <li>
          You are responsible for all activity under your account, including activity by employees you add, and for
          keeping login credentials secure.
        </li>
        <li>You are responsible for holding any licences, registrations and tax filings your business requires.</li>
      </ul>
    ),
  },
  {
    id: "plans",
    title: "Plans, billing and credits",
    body: (
      <>
        <p>
          Merchants pay a subscription fee for the plan they choose. Plans differ by monthly order limits and support
          level, as shown on our pricing page at the time of purchase. Prices are in Indian Rupees and may be subject to
          applicable taxes.
        </p>
        <ul className="list-disc pl-5 flex flex-col gap-1.5">
          <li>Subscriptions are billed in advance for each billing period and must be renewed to keep the Service active.</li>
          <li>When a plan&apos;s order limit is reached, new orders may be blocked until you upgrade or the period renews.</li>
          <li>Purchased credits are used for the features they are sold for and are not exchangeable for cash.</li>
          <li>We may change prices with prior notice; changes apply from your next billing period.</li>
        </ul>
        <p>
          Subscription fees and credits are non-refundable once the billing period has started, except where required by
          law or where we are unable to provide the Service due to our own fault. See our{" "}
          <Link href="/refund-policy" className="text-accent-400 hover:underline">
            Refund &amp; Cancellation Policy
          </Link>{" "}
          for details.
        </p>
      </>
    ),
  },
  {
    id: "orders-payments",
    title: "Customer orders and payments",
    body: (
      <>
        <p>
          When a Customer places an order, the contract for printing is between the Customer and the Merchant. PrintMyDoc
          provides the technology only and is not a party to that sale. The Merchant sets its own prices and is
          responsible for print quality, fulfilment, pickup or delivery, and handling complaints.
        </p>
        <p>
          Online payments are processed through Razorpay. Where the platform collects payments on a Merchant&apos;s
          behalf, the Merchant may request a withdrawal of the collected amount to its UPI or bank account. Withdrawals are
          reviewed before payout and may be held or reversed in case of suspected fraud, chargebacks or disputes.
        </p>
        <p>
          Refunds for print orders are handled as described in our{" "}
          <Link href="/refund-policy" className="text-accent-400 hover:underline">
            Refund &amp; Cancellation Policy
          </Link>
          . Customers should contact the shop first; if a payment issue cannot be resolved, write to {mail}.
        </p>
      </>
    ),
  },
  {
    id: "content",
    title: "Uploaded content",
    body: (
      <>
        <p>
          You keep ownership of documents and files you upload. You give PrintMyDoc and the relevant Merchant a limited
          permission to store, process and print those files solely to provide the Service.
        </p>
        <p>You must not upload or print content that:</p>
        <ul className="list-disc pl-5 flex flex-col gap-1.5">
          <li>you do not have the right to copy or print, or that infringes anyone&apos;s copyright or trademark;</li>
          <li>is illegal, obscene, defamatory, or promotes violence or hatred;</li>
          <li>is a forged or fraudulent document, or currency, stamp paper or government ID made to deceive;</li>
          <li>contains malware or is designed to disrupt the Service.</li>
        </ul>
        <p>Merchants may refuse any order, and we may remove content or suspend accounts that break these rules.</p>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    body: (
      <ul className="list-disc pl-5 flex flex-col gap-1.5">
        <li>Do not attempt to access another shop&apos;s data, or probe, scan or break the Service&apos;s security.</li>
        <li>Do not resell, copy or reverse-engineer the Service or print agent except as permitted by law.</li>
        <li>Do not use WhatsApp features to send spam or to message people who have not contacted your shop.</li>
        <li>Do not abuse the referral programme, for example with fake or self-referrals.</li>
      </ul>
    ),
  },
  {
    id: "third-party",
    title: "Third-party services",
    body: (
      <p>
        The Service integrates with third parties such as Razorpay and the Meta WhatsApp Cloud API. Your use of those
        services is also subject to their own terms. PrintMyDoc only supports the official WhatsApp Cloud API, and
        Merchants are responsible for complying with WhatsApp&apos;s Business and Commerce policies. We are not
        responsible for outages or changes in third-party services.
      </p>
    ),
  },
  {
    id: "print-agent",
    title: "Print agent and printers",
    body: (
      <p>
        The PrintMyDoc print agent runs on the Merchant&apos;s own computer and sends jobs to the Merchant&apos;s own
        printers. Merchants are responsible for their hardware, paper, ink, network and the correct configuration of
        printers. We are not liable for wasted materials or misprints caused by printer settings, hardware faults or
        connectivity issues.
      </p>
    ),
  },
  {
    id: "suspension",
    title: "Suspension and termination",
    body: (
      <p>
        You may stop using the Service at any time by contacting us. We may suspend or terminate an account that breaks
        these Terms, fails to pay, or puts other users or the Service at risk. Pending withdrawals of legitimately earned
        amounts will be settled after any open disputes or chargebacks are resolved.
      </p>
    ),
  },
  {
    id: "disclaimer",
    title: "Disclaimers and limitation of liability",
    body: (
      <>
        <p>
          The Service is provided &quot;as is&quot; and &quot;as available&quot;. We work to keep it reliable but do not
          guarantee it will be uninterrupted or error-free.
        </p>
        <p>
          To the maximum extent permitted by law, PrintMyDoc is not liable for indirect, incidental or consequential
          losses, including lost profits or data. Our total liability for any claim relating to the Service is limited to
          the subscription fees you paid us in the three months before the claim arose.
        </p>
      </>
    ),
  },
  {
    id: "indemnity",
    title: "Indemnity",
    body: (
      <p>
        You agree to indemnify PrintMyDoc against claims, losses and expenses arising from your breach of these Terms,
        content you upload or print, or — for Merchants — your dealings with your Customers.
      </p>
    ),
  },
  {
    id: "law",
    title: "Governing law",
    body: (
      <p>
        These Terms are governed by the laws of India. Any dispute will be subject to the exclusive jurisdiction of the
        courts where PrintMyDoc is registered, after the parties first try to resolve it in good faith.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: (
      <p>
        We may update these Terms from time to time. The &quot;Last updated&quot; date above shows when they last
        changed. Continuing to use the Service after changes take effect means you accept the updated Terms.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: <p>Questions about these Terms can be sent to {mail}.</p>,
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      intro={
        <p>
          Please read these Terms carefully. They explain the rules for using PrintMyDoc, what you can expect from us, and
          what we expect from you.
        </p>
      }
      sections={sections}
    />
  );
}
