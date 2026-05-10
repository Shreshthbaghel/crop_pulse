import React, { useRef } from 'react';
import { Cpu, Brain, LayoutDashboard } from 'lucide-react';
import useScrollAnimation from '../../hooks/useScrollAnimation';
import TreeRow from '../illustrations/TreeRow';

export default function HowItWorks() {
  const headerRef = useRef(null);
  useScrollAnimation(headerRef, 0);

  const steps = [
    { 
      num: "01", 
      icon: <Cpu className="text-[#2D6A4F]" size={28} />, 
      title: "Edge Telemetry", 
      desc: "Your sensor nodes measure moisture, temperature, and nutrients every 30 seconds, sync via MQTT.", 
      blobClass: "rounded-[60%_40%_30%_70%_/_60%_30%_70%_40%]",
      bgColor: "bg-[#D8F3DC]"
    },
    { 
      num: "02", 
      icon: <Brain className="text-[#B45F43]" size={28} />, 
      title: "AI Analysis", 
      desc: "Our Random Forest ML engine classifies the data into 6 specific stress conditions with 85%+ accuracy.", 
      blobClass: "rounded-[40%_60%_70%_30%_/_30%_60%_40%_70%]",
      bgColor: "bg-[#FAF7F2]"
    },
    { 
      num: "03", 
      icon: <LayoutDashboard className="text-[#4A90D9]" size={28} />, 
      title: "Real-time Insight", 
      desc: "You receive actionable fertilizer advice and soil health scores updated live on your dashboard.", 
      blobClass: "rounded-[70%_30%_40%_60%_/_40%_70%_30%_60%]",
      bgColor: "bg-[#EBF5FF]"
    }
  ];

  const conditions = [
    { name: "Optimal", color: "bg-[#52B788]" },
    { name: "Water Deficiency", color: "bg-[#4A90D9]" },
    { name: "Salinity Stress", color: "bg-[#FF6B35]" },
    { name: "Over-Fertilization", color: "bg-[#F9C74F]" },
    { name: "Heat Stress", color: "bg-[#C77DFF]" },
    { name: "Nutrient Imbalance", color: "bg-[#2D6A4F]" }
  ];

  return (
    <section id="how-it-works" className="py-24 md:py-32 bg-[#F0F7F0] overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full opacity-30 transform -translate-y-1/2">
        <TreeRow />
      </div>

      <div className="max-w-7xl mx-auto px-8 md:px-16 relative z-10">
        
        <div ref={headerRef} className="animate-ready text-center mb-24">
          <span className="text-xl font-serif italic text-[#52B788] block mb-4" style={{ fontFamily: '"Playfair Display", serif' }}>The Pipeline</span>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 leading-tight tracking-tight" style={{ fontFamily: '"Playfair Display", serif' }}>
            From sensor to insight in under 2s.
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed" style={{ fontFamily: '"Inter", sans-serif' }}>
            CropPulse connects your fields to an AI pipeline that never sleeps.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className={`animate-ready relative p-12 ${step.bgColor} ${step.blobClass} shadow-2xl shadow-black/5 hover:scale-105 transition-all duration-700 group cursor-default`}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* Background Number */}
              <div className="absolute inset-0 flex items-center justify-center opacity-5 select-none font-black text-9xl tracking-tighter text-[#2D6A4F] transform -translate-y-4 group-hover:scale-110 transition-transform duration-700">
                {step.num}
              </div>

              <div className="relative z-10">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg mb-8 group-hover:rotate-12 transition-transform duration-500">
                  {step.icon}
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight" style={{ fontFamily: '"Playfair Display", serif' }}>
                  {step.title}
                </h3>
                <p className="text-sm md:text-base text-gray-600 leading-relaxed font-medium" style={{ fontFamily: '"Inter", sans-serif' }}>
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <SummaryCard conditions={conditions} />
      </div>
    </section>
  );
}

function SummaryCard({ conditions }) {
  const ref = useRef(null);
  useScrollAnimation(ref, 400);
  return (
    <div ref={ref} className="animate-ready mt-24 bg-[#1B4332] rounded-[3rem] p-12 md:p-20 shadow-2xl relative overflow-hidden group">
      {/* Decorative Tree Silhouettes */}
      <div className="absolute top-0 left-0 h-full w-48 opacity-10 pointer-events-none transform -translate-x-12">
         <TreeRow className="h-full w-auto rotate-90" />
      </div>
      <div className="absolute top-0 right-0 h-full w-48 opacity-10 pointer-events-none transform translate-x-12">
         <TreeRow className="h-full w-auto -rotate-90" />
      </div>
      
      <div className="flex flex-col lg:flex-row items-center justify-between gap-16 relative z-10">
        <div className="max-w-md text-center lg:text-left">
          <span className="text-[#F9C74F] font-black text-[10px] uppercase tracking-[0.4em] mb-6 block">Neural Intelligence</span>
          <h4 className="text-3xl md:text-4xl font-black text-white mb-6 tracking-tight leading-tight" style={{ fontFamily: '"Playfair Display", serif' }}>
            6 Stress Conditions Classified
          </h4>
          <p className="text-base text-white/50 font-medium leading-relaxed" style={{ fontFamily: '"Inter", sans-serif' }}>
            Our models identify specific, actionable states based on real-world agricultural data.
          </p>
        </div>

        <div className="flex flex-wrap justify-center lg:justify-end gap-5 max-w-xl">
          {conditions.map((c) => (
            <div key={c.name} className="flex items-center gap-4 bg-white/5 border border-white/10 px-6 py-4 rounded-2xl transition-all hover:bg-white/10 hover:border-white/20 cursor-default">
              <div className={`w-3 h-3 rounded-full ${c.color} shadow-lg`} />
              <span className="text-white text-[11px] font-bold uppercase tracking-widest">{c.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
