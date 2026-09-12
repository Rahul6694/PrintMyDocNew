import Link from "next/link";

export default function FinalCta() {
  return (
    <section className="max-w-4xl mx-auto px-6 py-20 text-center">
      <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to modernize your print counter?</h2>
      <p className="text-base-500 mb-8 max-w-lg mx-auto">
        Bring WhatsApp orders, walk-in QR uploads, pricing, and printer release into one connected
        merchant workflow.
      </p>
      <Link
        href="/register"
        className="inline-block rounded-xl px-8 py-4 font-semibold text-white bg-gradient-to-r from-accent-500 to-success hover:opacity-90 transition-opacity"
      >
        Join as a Merchant →
      </Link>
      <p className="text-sm text-base-500 mt-6">
        Merchant-controlled pricing · Secure customer portals · Connected printer workflow
      </p>
    </section>
  );
}
