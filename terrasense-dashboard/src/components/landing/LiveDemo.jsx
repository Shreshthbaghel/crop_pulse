import React, { useState, useEffect, useRef } from 'react';
import { Cpu, Radio, Brain, Monitor, ArrowRight, Droplets, Thermometer, Zap, ShieldCheck } from 'lucide-react';
import useScrollAnimation from '../../hooks/useScrollAnimation';

const SCENARIOS = {
  optimal: {
    name: "Optimal",
    stats: { moisture: "68%", temp: "24°C", tds: "480ppm" },
    result: "Healthy — 94%",
    color: "text-[#52B788]",
    bgColor: "bg-[#D8F3DC]"
  },
  drought: {
    name: "Dry Spell",
    stats: { moisture: "18%", temp: "32°C", tds: "510ppm" },
    result: "Critical — 91%",
    color: "text-[#B45F43]",
    bgColor: "bg-[#FAF7F2]"
  },
  salinity: {
    name: "Saline",
    stats: { moisture: "62%", temp: "26°C", tds: "1450ppm" },
    result: "Warning — 88%",
    color: "text-[#F9C74F]",
    bgColor: "bg-[#EBF5FF]"
  }
};

export default function LiveDemo() {
  const [activeTab, setActiveTab] = useState('optimal');
  const [activeStep, setActiveStep] = useState(0);
  const containerRef = useRef(null);
  
  useScrollAnimation(containerRef, 0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const scenario = SCENARIOS[activeTab];

  const steps = [
    {
      title: "1. Capture",
      subtitle: "Edge Telemetry",
      icon: <Cpu size={24} />,
      desc: "Sensors read soil moisture & nutrients every 30s.",
      blobClass: "rounded-[60%_40%_30%_70%_/_60%_30%_70%_40%]",
      content: (
        <div className="space-y-3 mt-6">
          <StatRow icon={<Droplets size={12} />} label="Moisture" val={scenario.stats.moisture} color="text-[#4A90D9]" />
          <StatRow icon={<Thermometer size={12} />} label="Temp" val={scenario.stats.temp} color="text-[#FF6B35]" />
          <StatRow icon={<Zap size={12} />} label="Nutrients" val={scenario.stats.tds} color="text-[#F9C74F]" />
        </div>
      )
    },
    {
      title: "2. Transmit",
      subtitle: "Secure MQTT",
      icon: <Radio size={24} />,
      desc: "Data syncs to our cloud mesh via encrypted MQTT.",
      blobClass: "rounded-[30%_70%_60%_40%_/_50%_60%_30%_40%]",
      content: (
        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="w-full h-1.5 bg-[#FAF7F2] rounded-full overflow-hidden">
            <div className="h-full bg-[#4A90D9] transition-all duration-[2000ms]" style={{ width: activeStep === 1 ? '100%' : '0%' }} />
          </div>
          <span className="text-[9px] font-black text-[#4A90D9] tracking-widest uppercase">Routing Live Data</span>
        </div>
      )
    },
    {
      title: "3. Predict",
      subtitle: "Neural Core",
      icon: <Brain size={24} />,
      desc: "AI identifies stress before visible damage occurs.",
      blobClass: "rounded-[50%_50%_30%_70%_/_40%_40%_60%_60%]",
      content: (
        <div className="mt-6 space-y-4">
          <div className={`h-12 rounded-xl flex items-center justify-center border border-dashed transition-all duration-500 ${activeStep === 2 ? 'border-[#B45F43] bg-[#FAF7F2]' : 'border-gray-50 bg-white'}`}>
            {activeStep === 2 ? (
               <span className="text-[9px] font-black text-[#B45F43] animate-pulse uppercase tracking-widest">Analyzing</span>
            ) : activeStep > 2 ? (
               <span className={`text-[9px] font-black uppercase tracking-widest ${scenario.color}`}>{scenario.result.split(' — ')[0]}</span>
            ) : (
               <span className="text-[9px] font-black text-gray-200 uppercase tracking-widest">Wait...</span>
            )}
          </div>
          <div className="h-1 bg-[#FAF7F2] rounded-full overflow-hidden">
             <div className={`h-full transition-all duration-1000 ${scenario.color.replace('text-', 'bg-')}`} style={{ width: activeStep >= 2 ? scenario.result.split(' — ')[1] : '0%' }} />
          </div>
        </div>
      )
    },
    {
      title: "4. Resolve",
      subtitle: "Farmer HUD",
      icon: <Monitor size={24} />,
      desc: "Receive specific fertilizer & irrigation advice.",
      blobClass: "rounded-[40%_60%_50%_50%_/_60%_40%_60%_40%]",
      content: (
        <div className={`mt-6 p-4 rounded-2xl border transition-all duration-700 ${activeStep === 3 ? 'border-[#D8F3DC] bg-[#F5F9F5]' : 'border-[#FAF7F2] bg-white opacity-40'}`}>
           <div className="flex items-center gap-2">
              <ShieldCheck className="text-[#52B788]" size={14} />
              <span className="text-[9px] font-black text-gray-900 uppercase tracking-widest">Alert Ready</span>
           </div>
        </div>
      )
    }
  ];

  return (
    <section id="live-demo" className="py-24 md:py-32 bg-white overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-8 md:px-16">
        <div ref={containerRef} className="text-center mb-24 animate-ready">
          <span className="text-xl font-serif italic text-[#52B788] block mb-4" style={{ fontFamily: '"Playfair Display", serif' }}>The Intelligence Flow</span>
          <h2 className="text-4xl md:text-6xl font-black text-gray-900 leading-tight mb-8 tracking-tight" style={{ fontFamily: '"Playfair Display", serif' }}>
            From capture to resolution.
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed font-medium" style={{ fontFamily: '"Inter", sans-serif' }}>
            Our pipeline turns complex soil chemistry into simple, actionable farming decisions in under 2 seconds.
          </p>
        </div>

        {/* Tab Selectors */}
        <div className="flex flex-wrap justify-center gap-3 mb-20">
          {Object.keys(SCENARIOS).map((key) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${
                activeTab === key ? 'bg-[#2D6A4F] text-white shadow-xl scale-105' : 'bg-[#FAF7F2] text-gray-400 hover:bg-[#D8F3DC]/50'
              }`}
            >
              {SCENARIOS[key].name}
            </button>
          ))}
        </div>

        {/* Pipeline Container - FLEX for single row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-2">
          {steps.map((step, index) => (
            <React.Fragment key={index}>
              <div className={`relative flex-1 bg-white p-6 md:p-8 transition-all duration-700 border-2 ${activeStep === index ? 'border-[#2D6A4F] shadow-2xl scale-110 z-20 ' + step.blobClass : 'border-[#FAF7F2] rounded-3xl z-10 opacity-70'}`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-all duration-700 ${activeStep === index ? 'bg-[#2D6A4F] text-white rotate-6' : 'bg-[#FAF7F2] text-gray-200'}`}>
                  {step.icon}
                </div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight" style={{ fontFamily: '"Playfair Display", serif' }}>{step.title}</h3>
                <p className="text-[9px] font-black text-[#52B788] uppercase tracking-widest mt-1 mb-3">{step.subtitle}</p>
                <p className="text-[10px] text-gray-400 font-medium leading-tight mb-4">{step.desc}</p>
                {step.content}
              </div>

              {index < steps.length - 1 && (
                <div className="hidden md:flex items-center justify-center px-2">
                  <ArrowRight className={`transition-colors duration-1000 ${activeStep === index ? 'text-[#B45F43]' : 'text-[#FAF7F2]'}`} size={20} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatRow({ icon, label, val, color }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className={color}>{icon}</span>
        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-[10px] font-black text-gray-900">{val}</span>
    </div>
  );
}
