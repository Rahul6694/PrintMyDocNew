import LandingNav from "@/components/landing/Nav";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import ComparisonTable from "@/components/landing/ComparisonTable";
import ProductFeatures from "@/components/landing/ProductFeatures";
import WhatsAppSection from "@/components/landing/WhatsAppSection";
import QrSection from "@/components/landing/QrSection";
import PricingSection from "@/components/landing/PricingSection";
import FaqSection from "@/components/landing/FaqSection";
import ContactSection from "@/components/landing/ContactSection";
import FinalCta from "@/components/landing/FinalCta";
import Footer from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <main>
      <LandingNav />
      <Hero />
      <HowItWorks />
      <ComparisonTable />
      <ProductFeatures />
      <WhatsAppSection />
      <QrSection />
      <PricingSection />
      <FaqSection />
      <ContactSection />
      <FinalCta />
      <Footer />
    </main>
  );
}
