import { notFound } from "next/navigation";
import { getPublicShopBySlug } from "@/lib/shop";
import OrderForm from "./OrderForm";

export default async function ShopOrderPage({ params }: { params: { slug: string } }) {
  const data = await getPublicShopBySlug(params.slug);
  if (!data) notFound();

  return (
    <main className="min-h-screen px-4 py-6 sm:py-10">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <p className="text-xs text-accent-400 font-semibold uppercase tracking-wide mb-1">
            Order online
          </p>
          <h1 className="text-2xl font-bold">{data.shop.name}</h1>
          <p className="text-base-500 text-sm mt-1">Upload, configure, and pay — pick up when ready.</p>
        </div>

        <OrderForm slug={data.shop.slug} pricing={data.pricing} portal={data.portal} settings={data.settings} />
      </div>
    </main>
  );
}
