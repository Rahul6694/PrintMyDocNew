import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { SUPPORT_EMAIL } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy — PrintMyDoc",
  description: "Refund and cancellation rules for PrintMyDoc subscriptions, credits and customer print orders.",
};

const mail = (
  <a href={`mailto:${SUPPORT_EMAIL}`} className="text-accent-400 hover:underline">
    {SUPPORT_EMAIL}
  </a>
);

const sections = [
  {
    id: "scope",
    title: "What this policy covers",
    body: (
      <>
        <p>This policy explains refunds and cancellations for two kinds of payments made through PrintMyDoc:</p>
        <ul className="list-disc pl-5 flex flex-col gap-1.5">
          <li>
            <strong className="text-ink">Merchant payments</strong> — subscription plans and credits that print shops buy
            from PrintMyDoc.
          </li>
          <li>
            <strong className="text-ink">Customer order payments</strong> — money Customers pay to a print shop for a
            print order placed through a shop link, QR code or WhatsApp.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "subscriptions",
    title: "Merchant subscriptions",
    body: (
      <>
        <ul className="list-disc pl-5 flex flex-col gap-1.5">
          <li>Subscription fees are paid in advance for each billing period.</li>
          <li>
            You can stop using PrintMyDoc at any time by not renewing your plan. Your plan stays active until the end of
            the period you have already paid for.
          </li>
          <li>Once a billing period has started, its fee is not refunded, fully or partly, for unused days or orders.</li>
          <li>When you upgrade to a higher plan, the new plan&apos;s fee applies; the earlier payment is not refunded.</li>
        </ul>
        <p>We will refund a subscription payment in full if:</p>
        <ul className="list-disc pl-5 flex flex-col gap-1.5">
          <li>you were charged twice for the same plan or period;</li>
          <li>money was deducted but the plan was not activated on your account; or</li>
          <li>we were unable to provide the Service for a substantial part of the period because of a fault on our side.</li>
        </ul>
      </>
    ),
  },
  {
    id: "credits",
    title: "Credits",
    body: (
      <p>
        Credits are used for the features they are sold for and cannot be exchanged for cash. Purchased credits are not
        refundable once added to your account, except for duplicate payments or payments where the credits were not
        added.
      </p>
    ),
  },
  {
    id: "customer-orders",
    title: "Customer print orders",
    body: (
      <>
        <p>
          The print shop you order from is the seller of your print order, and refunds for orders are handled by that shop.
          In general:
        </p>
        <ul className="list-disc pl-5 flex flex-col gap-1.5">
          <li>
            <strong className="text-ink">Before printing starts</strong> — you can ask the shop to cancel the order. If the
            order has not been printed, the shop should refund the full amount.
          </li>
          <li>
            <strong className="text-ink">Rejected or failed orders</strong> — if the shop rejects your order or it fails to
            print and is not reprinted, you are entitled to a full refund of the amount paid online.
          </li>
          <li>
            <strong className="text-ink">After printing</strong> — printed documents are custom-made from your files, so
            completed orders are usually not refundable. If the print is faulty because of the shop (for example wrong
            size, colour mode or number of copies compared with your order), the shop should reprint or refund it.
          </li>
          <li>
            Mistakes in the uploaded file itself, or options you selected wrongly, are not grounds for a refund.
          </li>
          <li>Orders marked &quot;Pay at shop&quot; are settled directly with the shop.</li>
        </ul>
        <p>
          To request a refund, contact the shop first with your order details. If the shop does not respond within 3
          working days or you cannot reach an agreement, write to {mail} and we will help.
        </p>
      </>
    ),
  },
  {
    id: "how-to-request",
    title: "How to request a refund",
    body: (
      <>
        <p>Email {mail} within 7 days of the payment with:</p>
        <ul className="list-disc pl-5 flex flex-col gap-1.5">
          <li>your registered email or phone number;</li>
          <li>the payment ID or order ID, and the date and amount; and</li>
          <li>a short description of the problem, with screenshots if helpful.</li>
        </ul>
        <p>We aim to reply within 2 working days.</p>
      </>
    ),
  },
  {
    id: "processing",
    title: "Refund processing time",
    body: (
      <>
        <p>
          Approved refunds are issued to the original payment method through Razorpay. Refunds are normally initiated
          within 5–7 working days of approval. Depending on your bank or card issuer, it can take a further 5–10 working
          days for the amount to appear in your account.
        </p>
        <p>We do not refund to a different account, card or UPI ID than the one used to pay.</p>
      </>
    ),
  },
  {
    id: "merchant-payouts",
    title: "Effect on Merchant payouts",
    body: (
      <p>
        When a Customer order paid online is refunded, the refunded amount is deducted from the Merchant&apos;s collected
        balance. If it has already been withdrawn, it may be adjusted against future collections. Chargebacks raised by
        Customers through their bank are handled the same way.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <p>
        Questions about refunds or cancellations can be sent to {mail}. This policy forms part of our{" "}
        <Link href="/terms-and-conditions" className="text-accent-400 hover:underline">
          Terms &amp; Conditions
        </Link>
        .
      </p>
    ),
  },
];

export default function RefundPolicyPage() {
  return (
    <LegalPage
      title="Refund & Cancellation Policy"
      intro={
        <p>
          We want payments on PrintMyDoc to be fair and clear. This page explains when refunds are available, how to ask
          for one, and how long it takes.
        </p>
      }
      sections={sections}
    />
  );
}
