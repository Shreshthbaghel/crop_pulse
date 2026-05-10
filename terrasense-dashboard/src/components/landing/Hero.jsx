import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Droplets, Thermometer, Zap, Activity, ArrowUpRight } from 'lucide-react';
import useParallax from '../../hooks/useParallax';
import useScrollAnimation from '../../hooks/useScrollAnimation';
import { useApp } from '../../contexts/AppContext';

// Phase 1 Illustrations
import FarmScene from '../illustrations/FarmScene';
import HillScape from '../illustrations/HillScape';
import FloatingLeaves from '../illustrations/FloatingLeaves';
import { HoverButton } from '../ui/HoverButton';

export default function Hero() {
  const navigate = useNavigate();
  const mockupRef = useRef(null);
  const contentRef = useRef(null);

  // Parallax on Mockup
  useParallax(mockupRef, -0.15);
  
  // Entrance Animation
  useScrollAnimation(contentRef, 0);

  const { session } = useApp();

  const scrollToHow = () => {
    document.querySelector('#problem')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section 
      id="hero" 
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#B3D9F7] to-[#D8F3DC]"
    >
      {/* Floating Leaves Decoration */}
      <FloatingLeaves className="z-0 opacity-40" />

      <div className="max-w-7xl mx-auto px-8 md:px-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10 py-20 md:py-32">
        
        {/* Left Side: Content */}
        <div ref={contentRef} className="text-center lg:text-left animate-ready">
          <div className="inline-flex items-center gap-2 bg-[#FAF7F2] rounded-full px-5 py-2.5 text-[#2D6A4F] text-xs md:text-sm font-bold mb-8 shadow-sm border border-[#D8F3DC]/50">
            <span role="img" aria-label="sprout">🌱</span> Smart Farming Technology
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[1.05] mb-8 tracking-tighter" style={{ fontFamily: '"Playfair Display", serif' }}>
            <span className="text-gray-800">We Care For Your</span><br />
            <span className="text-[#2D6A4F]">Soil Deeply.</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-600 max-w-xl mx-auto lg:mx-0 mb-12 leading-relaxed font-medium" style={{ fontFamily: '"Inter", sans-serif' }}>
            Real-time soil intelligence that tells you exactly what your crops need — before they show signs of stress.
          </p>

          <div className="flex flex-wrap justify-center lg:justify-start gap-4">
            <div className="flex items-center gap-2 group">
              <HoverButton 
                onClick={() => navigate(session ? '/dashboard' : '/login')} 
              >
                {session ? 'Go to Dashboard' : 'Start Monitoring'}
              </HoverButton>
              <button 
                onClick={() => navigate(session ? '/dashboard' : '/login')} 
                className="bg-white border-2 border-[#2D6A4F] text-[#2D6A4F] p-4.5 rounded-[1.2rem] hover:bg-[#D8F3DC]/20 transition-all active:scale-95 flex items-center justify-center shadow-xl shadow-emerald-900/5 group-hover:rotate-12"
              >
                <ArrowUpRight size={22} />
              </button>
            </div>
            <button 
              onClick={scrollToHow} 
              className="bg-white border-2 border-[#2D6A4F] text-[#2D6A4F] px-10 py-5 rounded-full font-bold text-sm uppercase tracking-widest hover:bg-[#D8F3DC]/20 transition-all active:scale-95"
              style={{ fontFamily: '"Inter", sans-serif' }}
            >
              See How It Works
            </button>
          </div>
        </div>

        {/* Right Side: Farm Scene & Dashboard Card */}
        <div className="relative flex justify-center lg:justify-end">
          <div className="relative w-full max-w-lg">
            <FarmScene className="w-full h-auto drop-shadow-2xl" />
            
            {/* Floating Dashboard Card */}
            <div 
              ref={mockupRef}
              className="absolute -bottom-10 -left-10 md:-left-20 bg-white rounded-[2rem] shadow-2xl p-8 w-64 md:w-80 border border-[#D8F3DC] animate-gentleFloat z-20"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#52B788] animate-pulse" />
                  <div className="font-bold text-gray-400 text-[10px] tracking-widest uppercase" style={{ fontFamily: '"Inter", sans-serif' }}>Soil Metrics</div>
                </div>
                <div className="text-[9px] font-black text-[#52B788] uppercase tracking-widest">Live</div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[#F5F9F5] rounded-2xl border border-[#D8F3DC]/30">
                  <div className="flex items-center gap-3">
                    <Droplets className="text-[#4A90D9]" size={16} />
                    <span className="font-bold text-gray-500 text-xs" style={{ fontFamily: '"Inter", sans-serif' }}>Moisture</span>
                  </div>
                  <span className="font-black text-[#4A90D9] text-sm">68%</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-[#F5F9F5] rounded-2xl border border-[#D8F3DC]/30">
                  <div className="flex items-center gap-3">
                    <Thermometer className="text-[#FF6B35]" size={16} />
                    <span className="font-bold text-gray-500 text-xs" style={{ fontFamily: '"Inter", sans-serif' }}>Temperature</span>
                  </div>
                  <span className="font-black text-[#FF6B35] text-sm">24°C</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#F5F9F5] rounded-2xl border border-[#D8F3DC]/30">
                  <div className="flex items-center gap-3">
                    <Zap className="text-[#F9C74F]" size={16} />
                    <span className="font-bold text-gray-500 text-xs" style={{ fontFamily: '"Inter", sans-serif' }}>TDS Level</span>
                  </div>
                  <span className="font-black text-[#F9C74F] text-sm">480</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Transition: HillScape */}
      <div className="absolute bottom-0 left-0 w-full z-10 translate-y-1/2 md:translate-y-1/3">
        <HillScape />
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40 z-20">
        <ChevronDown className="text-[#2D6A4F] animate-bounce" size={20} />
        <span className="text-[#2D6A4F] text-[8px] uppercase tracking-[0.4em] font-black" style={{ fontFamily: '"Inter", sans-serif' }}>Explore</span>
      </div>
    </section>
  );
}
