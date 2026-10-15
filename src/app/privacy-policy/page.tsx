import type { Metadata } from "next";
import LegalPage, { SUPPORT_EMAIL } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy — PrintMyDoc",
  description: "How PrintMyDoc collects, uses, stores and protects personal data of merchants and their customers.",
};

const mail = (
  <a href={`mailto:${SUPPORT_EMAIL}`} className="text-accent-400 hover:underline">
    {SUPPORT_EMAIL}
  </a>
);

const sections = [
  {
    id: "who-we-are",
    title: "Who we are",
    body: (
      <>
        <p>
          PrintMyDoc (&quot;PrintMyDoc&quot;, &quot;we&quot;, &quot;us&quot;) provides software that lets print shops
          (&quot;Merchants&quot;) accept print orders online through a shop link, QR code or WhatsApp, calculate prices,
          collect payments and send jobs to their printers.
        </p>
        <p>
          This policy covers two groups of people: <strong className="text-ink">Merchants</strong> who sign up for a
          PrintMyDoc account (and their employees), and <strong className="text-ink">Customers</strong> who place print
          orders with a Merchant through PrintMyDoc.
        </p>
        <p>
          For Customer orders, the Merchant decides why and how the order data is used, and PrintMyDoc processes that data
          on the Merchant&apos;s behalf. Questions about a specific order are best directed to the shop you ordered from.
        </p>
      </>
    ),
  },
  {
    id: "data-we-collect",
    title: "Information we collect",
    body: (
      <>
        <p className="text-ink font-medium">From Merchants</p>
        <ul className="list-disc pl-5 flex flex-col gap-1.5">
          <li>Account details: name, shop name, email address, phone number, address and login password (stored hashed).</li>
          <li>Business settings: pricing, discounts, logo, printer configuration and customer-portal preferences.</li>
          <li>Payout details you provide for withdrawals, such as UPI ID or bank account details.</li>
          <li>Integration credentials you choose to connect, such as WhatsApp Cloud API tokens or payment-gateway keys (stored encrypted).</li>
          <li>Employee accounts you create, and referral activity.</li>
        </ul>
        <p className="text-ink font-medium mt-2">From Customers</p>
        <ul className="list-disc pl-5 flex flex-col gap-1.5">
          <li>Contact details entered with an order, such as name and phone number.</li>
          <li>The documents and photos uploaded for printing, and the print options chosen.</li>
          <li>Messages exchanged with a Merchant&apos;s WhatsApp number when the Merchant uses our WhatsApp integration.</li>
        </ul>
        <p className="text-ink font-medium mt-2">Collected automatically</p>
        <ul className="list-disc pl-5 flex flex-col gap-1.5">
          <li>Session cookies needed to keep you signed in, and a local preference for light or dark theme.</li>
          <li>Basic technical data such as IP address, browser type and request logs, used for security and troubleshooting.</li>
          <li>Status data from the PrintMyDoc print agent installed on a Merchant&apos;s computer, such as printer names and job results.</li>
        </ul>
        <p>
          We do not use advertising trackers, and we do not store full card numbers — payments are handled by our payment
          partner.
        </p>
      </>
    ),
  },
  {
    id: "how-we-use",
    title: "How we use information",
    body: (
      <ul className="list-disc pl-5 flex flex-col gap-1.5">
        <li>To create and operate accounts, process orders and deliver files to the Merchant&apos;s printer.</li>
        <li>To calculate prices, collect payments, process subscriptions, credits, referrals and withdrawals.</li>
        <li>To send transactional emails and WhatsApp messages related to accounts and orders.</li>
        <li>To respond to support and contact requests.</li>
        <li>To detect, prevent and investigate fraud, abuse and security incidents.</li>
        <li>To comply with legal, tax and accounting obligations.</li>
      </ul>
    ),
  },
  {
    id: "sharing",
    title: "How information is shared",
    body: (
      <>
        <p>We do not sell personal data. We share it only as needed to run the service:</p>
        <ul className="list-disc pl-5 flex flex-col gap-1.5">
          <li>
            <strong className="text-ink">With the Merchant</strong> — Customer orders, files and contact details are
            visible to the shop you order from and its employees.
          </li>
          <li>
            <strong className="text-ink">Payment processing</strong> — Razorpay processes online payments and payouts
            under its own privacy policy.
          </li>
          <li>
            <strong className="text-ink">Messaging</strong> — Meta (WhatsApp Cloud API) when a Merchant connects WhatsApp,
            and email providers for transactional email.
          </li>
          <li>
            <strong className="text-ink">Hosting and infrastructure</strong> providers that store and serve our application
            and data.
          </li>
          <li>
            <strong className="text-ink">Legal reasons</strong> — when required by law, court order or a government
            authority, or to protect the rights and safety of our users and the public.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "retention",
    title: "Data retention",
    body: (
      <>
        <p>
          Merchant account data is kept while the account is active. After an account is closed we delete or anonymise it
          within a reasonable period, except records we must keep for tax, accounting or legal purposes.
        </p>
        <p>
          Uploaded documents are stored so the Merchant can print and manage them. Merchants can delete files from their
          dashboard at any time. Customers who want an uploaded file removed should contact the shop or write to us.
        </p>
      </>
    ),
  },
  {
    id: "security",
    title: "Security",
    body: (
      <p>
        We use HTTPS in transit, hashed passwords, encrypted storage for integration secrets, signed session cookies and
        access controls that separate each shop&apos;s data. No system is perfectly secure, so please use a strong password
        and keep your login details private. If you believe your account has been compromised, contact us immediately.
      </p>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights",
    body: (
      <>
        <p>
          Subject to applicable law, including India&apos;s Information Technology Act, 2000 and the Digital Personal Data
          Protection Act, 2023, you may ask to:
        </p>
        <ul className="list-disc pl-5 flex flex-col gap-1.5">
          <li>access the personal data we hold about you;</li>
          <li>correct or update inaccurate data;</li>
          <li>delete your data or close your account;</li>
          <li>withdraw consent where processing is based on consent;</li>
          <li>nominate another person to exercise your rights in case of death or incapacity.</li>
        </ul>
        <p>Email {mail} from the address linked to your account. We may need to verify your identity before acting.</p>
      </>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>
        Merchant accounts are for people aged 18 or over. Customers under 18 should place orders with the involvement of a
        parent or guardian. We do not knowingly collect children&apos;s data for any other purpose.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        We may update this policy from time to time. The &quot;Last updated&quot; date above shows when it last changed.
        For significant changes we will notify Merchants by email or in the dashboard.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact & grievances",
    body: (
      <p>
        For privacy questions, requests or complaints, contact our Grievance Officer at {mail}. We aim to acknowledge
        complaints within 24 hours and resolve them within 15 days.
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={
        <p>
          This Privacy Policy explains what information PrintMyDoc collects, why we collect it, and the choices you have.
          By using PrintMyDoc you agree to the practices described here.
        </p>
      }
      sections={sections}
    />
  );
}
