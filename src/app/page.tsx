import dynamic from "next/dynamic";
import { Header, HeroSection } from "@/components/landing";

// Lazy load below-the-fold sections with code splitting
// Import directly from component files for proper code splitting
const FeaturesSection = dynamic(
  () =>
    import("@/components/landing/FeaturesSection").then((mod) => ({
      default: mod.FeaturesSection,
    })),
  {
    loading: () => <div className="py-24 px-6 bg-background min-h-[400px]" />,
  }
);

const BenefitsSection = dynamic(
  () =>
    import("@/components/landing/BenefitsSection").then((mod) => ({
      default: mod.BenefitsSection,
    })),
  {
    loading: () => <div className="py-24 px-6 bg-surface min-h-[400px]" />,
  }
);

const HowItWorksSection = dynamic(
  () =>
    import("@/components/landing/HowItWorksSection").then((mod) => ({
      default: mod.HowItWorksSection,
    })),
  {
    loading: () => <div className="py-24 px-6 bg-background min-h-[400px]" />,
  }
);

const PricingSection = dynamic(
  () =>
    import("@/components/landing/PricingSection").then((mod) => ({
      default: mod.PricingSection,
    })),
  {
    loading: () => <div className="py-24 px-6 bg-surface min-h-[400px]" />,
  }
);

const SocialProofSection = dynamic(
  () =>
    import("@/components/landing/SocialProofSection").then((mod) => ({
      default: mod.SocialProofSection,
    })),
  {
    loading: () => <div className="py-24 px-6 bg-background min-h-[400px]" />,
  }
);

const Footer = dynamic(
  () =>
    import("@/components/landing/Footer").then((mod) => ({
      default: mod.Footer,
    })),
  {
    loading: () => <div className="py-12 px-6 bg-surface min-h-[200px]" />,
  }
);

export default function Home() {
  return (
    <>
      <Header />
      <main className="pt-16">
        <HeroSection />
        <FeaturesSection />
        <BenefitsSection />
        <HowItWorksSection />
        <PricingSection />
        <SocialProofSection />
      </main>
      <Footer />
    </>
  );
}
