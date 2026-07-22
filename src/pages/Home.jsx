import Hero from "@/components/landing/Hero";
import StatsBar from "@/components/landing/StatsBar";
import MarketPainPoints from "@/components/landing/MarketPainPoints";
import CoreServicesPreview from "@/components/landing/CoreServicesPreview";
import CTASection from "@/components/landing/CTASection";

export default function Home() {
  return (
    <>
      <Hero />
      <StatsBar />
      <MarketPainPoints />
      <CoreServicesPreview />
      <CTASection />
    </>
  );
}