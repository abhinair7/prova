import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Stats } from "@/components/landing/Stats";
import { LiveCounter } from "@/components/landing/LiveCounter";
import { WhyNow } from "@/components/landing/WhyNow";
import { Architecture } from "@/components/landing/Architecture";
import { Verticals } from "@/components/landing/Verticals";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { TrustEngine } from "@/components/landing/TrustEngine";
import { FeaturedLeaderboard } from "@/components/landing/FeaturedLeaderboard";
import { ViralityLoops } from "@/components/landing/ViralityLoops";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#000000]">
      <Navbar />
      <Hero />
      <Stats />
      <LiveCounter />
      <WhyNow />
      <Verticals />
      <FeaturedLeaderboard />
      <HowItWorks />
      <TrustEngine />
      <Architecture />
      <ViralityLoops />
      <CTASection />
      <Footer />
    </main>
  );
}
