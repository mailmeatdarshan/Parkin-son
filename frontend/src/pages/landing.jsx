import React from "react";
import Hero from "../components/hero/hero";
import Navbar from "../components/common/navBar";
import AppDemoWindow from "../components/showcase/AppDemoWindow";
import HorizontalScrollSections from "../components/showcase/HorizontalScrollSections";
import ArchitectureSection from "../components/showcase/ArchitectureSection";
import ProgressSection from "../components/showcase/ProgressSection";
import FeatureFlowSection from "../components/showcase/FeatureFlowSection";
import LiveFocusSection from "../components/showcase/LiveFocusSection";
import CtaSection from "../components/showcase/CtaSection";
import SponsorSection from "../components/showcase/SponsorSection";
import Footer from "../components/showcase/Footer";

function Landing() {
  return (
    <div className="w-full relative bg-black text-zinc-100">
      <Navbar />
      
      {/* Dark Stoic Hero Section */}
      <div id="hero-section" className="bg-black w-full">
        <Hero />
      </div>

      {/* Stoic interactive workspace preview section below hero */}
      <div className="w-full bg-black min-h-[600px] flex flex-col items-center relative z-20">
        <div className="mt-4 md:mt-8 w-full relative z-30 pb-0 md:pb-10">
          <AppDemoWindow />
        </div>
      </div>

      {/* Desktop Horizontal Scroll */}
      <div id="dashboard-section" className="hidden md:block relative bg-black">
        <HorizontalScrollSections />
        {/* Anchor to scroll exactly to the Features step (end of the 350vh scroll) */}
        <div id="features-desktop-anchor" className="absolute bottom-0 h-screen w-full pointer-events-none" />
      </div>

      {/* Mobile Vertical Stack */}
      <div id="dashboard-section-mobile" className="md:hidden flex flex-col w-full overflow-hidden bg-black">
        <ArchitectureSection />
        <ProgressSection />
        <div id="features-mobile-anchor">
          <FeatureFlowSection />
        </div>
      </div>
      
      <div id="leaderboard-section">
        <LiveFocusSection />
      </div>
      
      <CtaSection />

      <SponsorSection />

      <Footer />
    </div>
  );
}

export default Landing;