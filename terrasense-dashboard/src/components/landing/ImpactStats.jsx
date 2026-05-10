import React, { useRef } from 'react';
import { Clock, TrendingUp, Database, Quote } from 'lucide-react';
import useScrollAnimation from '../../hooks/useScrollAnimation';
import FloatingLeaves from '../illustrations/FloatingLeaves';

export default function ImpactStats() {
  const containerRef = useRef(null);
  useScrollAnimation(containerRef, 0);

  const stats = [
    {
      num: "4hrs",
      label: "Early Warning Window",
      sub: "Detect stress before visible signs appear.",
      color: "text-[#2D6A4F]",
      bgColor: "bg-[#D8F3DC]",
      icon: <Clock size={28} />
    },
    {
      num: "30%",
      label: "Yield Preservation",
      sub: "Prevent crop loss with predictive alerts.",
      color: "#B45F43",
      bgColor: "bg-[#FAF7F2]",
      icon: <TrendingUp size={28} />
    },
    {
      num: "1,500+",
      label: "Samples Analyzed",
      sub: "Trained on regional soil profile data.",
      color: "text-[#4A90D9]",
      bgColor: "bg-[#EBF5FF]",
      icon: <Database size={28} />
    }
  ];

  return (
    <section id="impact" className="py-24 md:py-32 bg-[#FAF7F2] relative overflow-hidden">
      {/* Decorative Leaves */}
      <div className="absolute top-0 right-0 w-64 h-64 opacity-10 transform translate-x-1/2 -translate-y-1/2">
        <FloatingLeaves count={3} />
      </div>

      <div className="max-w-7xl mx-auto px-8 md:px-16 relative z-10">
        <div ref={containerRef} className="text-center mb-24 animate-ready">
          <span className="text-xl font-serif text-[#52B788] block mb-4" style={{ fontFamily: '"Playfair Display", serif' }}>The Impact</span>
          <h2 className="text-4xl md:text-6xl font-black text-gray-900 leading-tight tracking-tight" style={{ fontFamily: '"Playfair Display", serif' }}>
            Built to make a difference.
          </h2>
          <div className="w-16 h-1 bg-[#2D6A4F] mx-auto mt-8 rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-24">
          {stats.map((stat, i) => (
            <div 
              key={i} 
              className={`animate-ready p-12 bg-white rounded-[2.5rem] shadow-xl shadow-black/5 hover:shadow-2xl transition-all duration-700 hover:-translate-y-2 group border border-[#D8F3DC]/30`}
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <div className={`w-14 h-14 ${stat.bgColor} rounded-2xl flex items-center justify-center mb-10 group-hover:rotate-6 transition-transform duration-500`} style={{ color: stat.color === "#B45F43" ? "#B45F43" : undefined }}>
                {stat.icon}
              </div>
              <div className={`text-6xl font-serif tracking-tighter mb-6 ${stat.color === "#B45F43" ? "text-[#B45F43]" : stat.color}`} style={{ fontFamily: '"Playfair Display", serif' }}>
                {stat.num}
              </div>
              <h4 className="text-xl font-black text-gray-900 mb-3 tracking-tight" style={{ fontFamily: '"Inter", sans-serif' }}>
                {stat.label}
              </h4>
              <p className="text-sm text-gray-500 font-medium leading-relaxed" style={{ fontFamily: '"Inter", sans-serif' }}>
                {stat.sub}
              </p>
            </div>
          ))}
        </div>

        {/* Product Statement Quote */}
        <div className="animate-ready">
           <div className="bg-[#1B4332] rounded-[3rem] p-12 md:p-24 relative overflow-hidden group shadow-2xl">
              <div className="absolute -top-10 -left-10 text-[#52B788] opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                 <Quote size={200} fill="currentColor" />
              </div>
              
              <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto">
                 <h3 className="text-3xl md:text-5xl font-serif text-white leading-[1.3] mb-12" style={{ fontFamily: '"Playfair Display", serif' }}>
                    "CropPulse detects what the eye cannot see — giving farmers the time they need to act."
                 </h3>
                 <div className="flex items-center gap-6">
                    <div className="w-12 h-0.5 bg-[#F9C74F] opacity-50" />
                    <span className="text-[#F9C74F] font-black uppercase tracking-[0.4em] text-[10px]" style={{ fontFamily: '"Inter", sans-serif' }}>
                       CropPulse AI System
                    </span>
                    <div className="w-12 h-0.5 bg-[#F9C74F] opacity-50" />
                 </div>
              </div>
           </div>
        </div>
      </div>
    </section>
  );
}
