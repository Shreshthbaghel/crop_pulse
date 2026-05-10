import React, { useRef } from 'react';
import useScrollAnimation from '../../hooks/useScrollAnimation';
import SoilCross from '../illustrations/SoilCross';

const LeafIcon = ({ color = "#52B788" }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.24 12.24C20.24 16.65 16.65 20.24 12.24 20.24C7.83 20.24 4.24 16.65 4.24 12.24C4.24 7.83 12.24 3.76 12.24 3.76C12.24 3.76 20.24 7.83 20.24 12.24Z" fill={color} />
  </svg>
);

const WarningIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 5L35 32H5L20 5Z" stroke="#B45F43" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 15V23" stroke="#B45F43" strokeWidth="2" strokeLinecap="round" />
    <circle cx="20" cy="27" r="1.5" fill="#B45F43" />
  </svg>
);

const ClockIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="15" stroke="#8B6347" strokeWidth="2" />
    <path d="M20 10V20L27 24" stroke="#8B6347" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const TargetIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="15" stroke="#4A90D9" strokeWidth="2" />
    <circle cx="20" cy="20" r="8" stroke="#4A90D9" strokeWidth="2" />
    <circle cx="20" cy="20" r="2" fill="#4A90D9" />
  </svg>
);

export default function ProblemSection() {
  const contentRef = useRef(null);
  useScrollAnimation(contentRef, 0);

  const problemCards = [
    { 
      icon: <WarningIcon />, 
      title: "No Early Warning", 
      desc: "Stress develops silently before visible symptoms appear.",
      accent: "#B45F43"
    },
    { 
      icon: <ClockIcon />, 
      title: "Manual Testing Slow", 
      desc: "Lab results take 3–5 days. Your crop cannot wait.",
      accent: "#8B6347"
    },
    { 
      icon: <TargetIcon />, 
      title: "Generic Advice Fails", 
      desc: "One-size-fits-all recommendations ignore your specific soil.",
      accent: "#4A90D9"
    }
  ];

  return (
    <section id="problem" className="relative py-24 md:py-32 bg-[#FAF7F2] overflow-hidden">
      <div className="max-w-7xl mx-auto px-8 md:px-16 relative z-10">
        <div ref={contentRef} className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center animate-ready">
          
          {/* Left: SoilCross Illustration */}
          <div className="flex justify-center lg:justify-start">
            <div className="relative group">
              <SoilCross className="w-full max-w-md transform transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#52B788]/5 rounded-full blur-[80px]" />
            </div>
          </div>

          {/* Right: Content & Cards */}
          <div>
            <span className="text-xl font-serif italic text-[#52B788] block mb-4" style={{ fontFamily: '"Playfair Display", serif' }}>The Challenge</span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight mb-12 tracking-tight" style={{ fontFamily: '"Playfair Display", serif' }}>
              Hidden stress costs farmers everything.
            </h2>
            
            <div className="flex flex-col gap-8">
              {problemCards.map((card, index) => (
                <div 
                  key={index}
                  className="bg-white rounded-[30px] p-8 shadow-xl shadow-black/5 flex gap-6 relative overflow-hidden group hover:shadow-2xl transition-all duration-500"
                >
                  {/* Left Accent Leaf */}
                  <div className="absolute top-0 left-0 h-full w-1.5 opacity-20" style={{ backgroundColor: card.accent }} />
                  <div className="absolute -left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-10 transition-opacity duration-500 transform -rotate-45">
                    <LeafIcon color={card.accent} />
                  </div>

                  <div className="shrink-0 pt-1">
                    {card.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 mb-2 tracking-tight" style={{ fontFamily: '"Inter", sans-serif' }}>{card.title}</h3>
                    <p className="text-gray-500 leading-relaxed font-medium text-sm md:text-base" style={{ fontFamily: '"Inter", sans-serif' }}>{card.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Arrow & CTA */}
            <div className="mt-16 flex items-center gap-6">
              <svg width="100" height="40" viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#2D6A4F] animate-pulse">
                <path d="M5 20C20 10 40 10 60 20C80 30 90 25 95 20M95 20L85 15M95 20L85 25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="text-2xl font-serif italic text-[#2D6A4F]" style={{ fontFamily: '"Playfair Display", serif' }}>
                CropPulse solves this
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
