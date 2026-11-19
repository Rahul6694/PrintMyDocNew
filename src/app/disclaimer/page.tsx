import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { SUPPORT_EMAIL } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Disclaimer — PrintMyDoc",
  description: "PrintMyDoc is software for print shops. What we are responsible for, and what stays with the shop.",
};

const sections = [
  {
    id: "software",
    title: "We are software, not your print shop",
    body: (
      <p>
        PrintMyDoc provides a software-as-a-service platform. Each shop using PrintMyDoc is an independent business. We are
        not a printing service, a courier or a document bureau, and we are not a party to the deal between a shop and its
        customer. When a customer pays for and collects a print, that transaction is between the customer and that shop.
      </p>
    ),
  },
  {
    id: "shop-responsibility",
    title: "Your printer, your consumables, your licences",
    body: (
      <>
        <p>Every shop using PrintMyDoc remains fully responsible for:</p>
        <ul>
          <li>the printer, computer, drivers and internet connection at the shop;</li>
          <li>paper, ink, toner, and keeping the machines serviced;</li>
          <li>trade licences, GST registration, tax filings and any local permission needed to run a print shop;</li>
          <li>the rates shown to customers and the quality of work handed over the counter.</li>
        </ul>
        <p>Nothing in PrintMyDoc creates a partnership, franchise, agency or employment relationship with any shop.</p>
      </>
    ),
  },
  {
    id: "print-quality",
    title: "Print quality depends on your machine",
    body: (
      <p>
        What comes out of the printer depends on the shop&apos;s hardware, driver settings, paper and ink. Colour, sharpness,
        margins and alignment may differ from the preview on the customer&apos;s phone. Options such as A3 or double-sided
        printing work only if the shop has a printer capable of them.
      </p>
    ),
  },
  {
    id: "customer-files",
    title: "Files uploaded by customers",
    body: (
      <>
        <p>
          Customers who upload documents through a PrintMyDoc shop page or WhatsApp are solely responsible for what they send —
          its legality, its copyright and its appropriateness. We do not review or approve customer documents. How files are
          stored and deleted is explained in our <Link href="/privacy-policy">Privacy Policy</Link>.
        </p>
        <p>
          Sending obscene, defamatory, fraudulent, infringing or otherwise unlawful material is prohibited, and we may suspend
          access where misuse is reported or reasonably suspected.
        </p>
      </>
    ),
  },
  {
    id: "payments",
    title: "Payments",
    body: (
      <p>
        Online payments are processed by Razorpay — either through PrintMyDoc&apos;s account, with the amount added to the
        shop&apos;s collected balance for withdrawal, or through the shop&apos;s own Razorpay account if it has connected one. We
        do not collect or store card numbers, CVVs or UPI PINs. Payment failures and settlement disputes are handled with the
        payment provider and the shop concerned, as described in our <Link href="/refund-policy">Refund Policy</Link>.
      </p>
    ),
  },
  {
    id: "uptime",
    title: "Internet, uptime and updates",
    body: (
      <p>
        PrintMyDoc depends on internet at both the customer&apos;s and the shop&apos;s end, and on third-party hosting, messaging
        and payment providers. We do not promise uninterrupted or error-free service. Maintenance, provider outages, power cuts
        or a local network problem can interrupt printing. Where a job cannot be delivered at once, it stays in the queue and
        prints when connectivity returns.
      </p>
    ),
  },
  {
    id: "earnings",
    title: "Earnings examples are illustrative",
    body: (
      <p>
        Any figures shown on our website — such as prints per day, monthly earnings, or how quickly a plan pays for itself —
        are <strong>illustrations, not promises</strong>. Real income depends on the shop&apos;s location, footfall, pricing and
        effort. PrintMyDoc makes no guarantee of revenue, customers or business results.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Limitation of liability",
    tone: "warn" as const,
    body: (
      <>
        <p>
          To the maximum extent permitted by law, PrintMyDoc is not liable for indirect, incidental, special or consequential
          losses — including lost business, lost profit, wasted paper or ink, loss of goodwill, loss of data or business
          interruption — arising from use of, or inability to use, the website, the dashboard or the PrintMyDoc Agent.
        </p>
        <p>
          Our total liability for any claim is limited to the subscription fees the affected shop paid us in the three months
          before the claim arose, as set out in our <Link href="/terms-and-conditions">Terms &amp; Conditions</Link>.
        </p>
      </>
    ),
  },
  {
    id: "external-links",
    title: "External links",
    body: (
      <p>
        Our website may link to third-party sites and services we do not control, such as payment providers and download
        hosts. We are not responsible for their content, availability or policies, and a link is not an endorsement.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes and governing law",
    body: (
      <>
        <p>
          This Disclaimer may be updated as PrintMyDoc changes; the date at the top shows when it was last revised. It is
          governed by the laws of India, as set out in our Terms &amp; Conditions.
        </p>
        <p>
          Questions? Write to <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. If you do not agree with any part of this
          Disclaimer, please stop using PrintMyDoc.
        </p>
      </>
    ),
  },
];

export default function DisclaimerPage() {
  return (
    <LegalPage
      title="Disclaimer"
      eyebrow="⚖️ Legal"
      path="/disclaimer"
      tagline="SaaS software · your shop is yours"
      intro={
        <p>
          <strong>PrintMyDoc</strong> is software, not a printing business. We supply the customer order page, the job queue,
          the shop dashboard and the desktop Agent that sends a job to a shop&apos;s printer. Everything physical — the printer,
          paper, ink, counter and shop — belongs to the shop owner. The service is provided on an &quot;as is&quot; and &quot;as
          available&quot; basis.
        </p>
      }
      note={
        <>
          PrintMyDoc provides only the software — the printer, paper, ink and shop belong to the shop owner. Whatever file a
          customer sends is that customer&apos;s responsibility. Earnings examples on the website are illustrations, not a
          guarantee.
        </>
      }
      sections={sections}
    />
  );
}
