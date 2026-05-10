import React from 'react';

// Styles
import '../styles/landing.css';

// Components
import LandingNav from '../components/landing/LandingNav';
import Hero from '../components/landing/Hero';
import ProblemSection from '../components/landing/ProblemSection';
import HowItWorks from '../components/landing/HowItWorks';
import LiveDemo from '../components/landing/LiveDemo';
import Features from '../components/landing/Features';
import TechStack from '../components/landing/TechStack';
import ImpactStats from '../components/landing/ImpactStats';
import CallToAction from '../components/landing/CallToAction';

export default function LandingPage() {
  return (
    <div className="relative w-full min-h-screen overflow-x-hidden overflow-y-auto bg-white selection:bg-[#FF6B35] selection:text-white">
      {/* Navigation - Fixed Overlay */}
      <LandingNav />

      {/* Main Content Sections */}
      <main>
        <Hero />
        <ProblemSection />
        <HowItWorks />
        <LiveDemo />
        <Features />
        <TechStack />
        <ImpactStats />
        <CallToAction />
      </main>
    </div>
  );
}
