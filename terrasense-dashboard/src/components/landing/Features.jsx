import React, { useRef, useState, useEffect } from 'react';
import { CheckCircle2, Droplets, Thermometer, Zap, Activity, ShieldCheck, Target } from 'lucide-react';
import useScrollAnimation from '../../hooks/useScrollAnimation';

// Phase 1 Illustrations
import WaterDrop from '../illustrations/WaterDrop';

const LeafIcon = ({ color = "#52B788" }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.24 12.24C20.24 16.65 16.65 20.24 12.24 20.24C7.83 20.24 4.24 16.65 4.24 12.24C4.24 7.83 12.24 3.76 12.24 3.76C12.24 3.76 20.24 7.83 20.24 12.24Z" fill={color} />
  </svg>
);

// --- MOCKUP 1: LIVE MONITORING ---
const LiveMonitoringMockup = () => {
  const [moisture, setMoisture] = useState(67);
  
  useEffect(() => {
    const cycle = [65, 66, 67, 68, 67];
    let idx = 0;
    const timer = setInterval(() => {
      idx = (idx + 1) % cycle.length;
      setMoisture(cycle[idx]);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative flex items-center justify-center w-full">
      {/* Organic Shape Backdrop (Solid) */}
      <div className="absolute inset-0 bg-[#D8F3DC] rounded-[70%_30%_40%_60%_/_40%_70%_30%_60%] transform rotate-12 scale-110 opacity-30 animate-pulse" />
      
      <div className="bg-white rounded-[2rem] shadow-2xl p-8 w-full max-w-sm border border-[#D8F3DC] relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#52B788] animate-pulse" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Live Telemetry</span>
          </div>
          <div className="bg-[#F5F9F5] text-[#2D6A4F] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
             Sensor #01
          </div>
        </div>

        <div className="space-y-6">
          <MetricRow icon={<Droplets size={16} className="text-[#4A90D9]" />} label="Moisture" val={`${moisture}%`} color="text-[#4A90D9]" barColor="bg-[#4A90D9]" width="w-[80%]" />
          <MetricRow icon={<Thermometer size={16} className="text-[#FF6B35]" />} label="Temperature" val="28°C" color="text-[#FF6B35]" barColor="bg-[#FF6B35]" width="w-[65%]" />
          <MetricRow icon={<Zap size={16} className="text-[#F9C74F]" />} label="TDS Level" val="1,100" color="text-[#F9C74F]" barColor="bg-[#F9C74F]" width="w-[70%]" />
        </div>

        <div className="mt-10 pt-6 border-t border-[#F5F9F5]">
          <div className="bg-[#D8F3DC] text-[#2D6A4F] px-4 py-2 rounded-xl text-[10px] font-bold flex items-center gap-2 uppercase tracking-widest">
             <div className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F] animate-pulse" /> Health Optimal
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricRow = ({ icon, label, val, color, barColor, width }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="bg-[#FAF7F2] p-2 rounded-xl border border-[#D8F3DC]/30">{icon}</div>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
      </div>
      <span className={`text-lg font-black tracking-tighter ${color}`}>{val}</span>
    </div>
    <div className="w-full bg-[#FAF7F2] h-1.5 rounded-full overflow-hidden">
      <div className={`${barColor} h-full ${width} rounded-full transition-all duration-1000`} />
    </div>
  </div>
);

// --- MOCKUP 3: FERTILIZER RECOMMENDATION ---
const FertilizerMockup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="bg-white rounded-[2rem] shadow-2xl p-10 w-full max-w-sm border border-[#D8F3DC] relative">
      <div className="mb-10">
        <span className="inline-block bg-[#FAF7F2] text-[#B45F43] px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#B45F43]/10 mb-8">
          Nutrient Strategist
        </span>
        <h3 className="text-6xl font-serif italic text-[#1B4332] tracking-tight leading-none mb-4" style={{ fontFamily: '"Playfair Display", serif' }}>K-Rich</h3>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Potassium Concentration</p>
      </div>

      <div className="space-y-4 mb-10">
         <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
           <span>ML Confidence</span>
           <span className="text-[#52B788]">91.4%</span>
         </div>
         <div className="w-full h-2 bg-[#FAF7F2] rounded-full overflow-hidden">
            <div className={`bg-[#52B788] h-full transition-all duration-[1000ms] ${isVisible ? 'w-[91.4%]' : 'w-0'}`} />
         </div>
      </div>

      <div className="space-y-6">
         <div className="flex items-center gap-4">
            <LeafIcon color="#52B788" />
            <div className="flex-1 text-sm font-bold text-gray-700">Foliage Density</div>
            <span className="text-xs font-black text-[#52B788]">Optimal</span>
         </div>
         <div className="flex items-center gap-4">
            <LeafIcon color="#B45F43" />
            <div className="flex-1 text-sm font-bold text-gray-700">Root Absorption</div>
            <span className="text-xs font-black text-gray-400">Target</span>
         </div>
      </div>
    </div>
  );
};

// --- MOCKUP 4: LANGUAGE TOGGLE ---
const LanguageMockup = () => {
  const [lang, setLang] = useState('EN');
  
  const texts = {
    EN: "Your field telemetry shows optimal hydration. Harvest expected in 12 days.",
    KN: "ನಿಮ್ಮ ಫೀಲ್ಡ್ ಟೆಲಿಮೆಟ್ರಿ ಅತ್ಯುತ್ತಮ ಹೈಡ್ರೇಶನ್ ತೋರಿಸುತ್ತದೆ. 12 ದಿನಗಳಲ್ಲಿ ಕೊಯ್ಲು ನಿರೀಕ್ಷಿಸಲಾಗಿದೆ.",
    HI: "आपकी फील्ड टेलीमेट्री इष्टतम हाइड्रेशन दिखाती है। 12 दिनों में कटाई की उम्मीद है।",
    TE: "మీ ఫీల్డ్ టెలిమెట్రీ సరైన హైడ్రేషన్‌ను చూపుతుంది. 12 రోజుల్లో కోత ఆశించవచ్చు."
  };

  const langs = [
    { code: 'EN', name: 'EN' },
    { code: 'KN', name: 'ಕನ್ನಡ' },
    { code: 'HI', name: 'हिंदी' },
    { code: 'TE', name: 'తెలుగు' }
  ];

  return (
    <div className="relative p-10 bg-[#FAF7F2] rounded-[3rem] border border-[#D8F3DC]/50 shadow-inner">
      <div className="bg-white rounded-[2rem] shadow-xl p-8 w-full max-w-sm border border-[#D8F3DC]/20">
        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-8 block">Global Accessibility</span>
        
        <div className="grid grid-cols-2 gap-3 mb-10">
          {langs.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`rounded-xl py-4 text-xs font-bold transition-all ${
                lang === l.code 
                  ? 'bg-[#1B4332] text-white shadow-xl' 
                  : 'bg-[#F5F9F5] text-gray-400 hover:bg-[#D8F3DC]/30'
              }`}
            >
              {l.name}
            </button>
          ))}
        </div>

        <div className="bg-[#D8F3DC]/20 rounded-2xl p-6 border border-[#52B788]/10">
          <p className="text-base text-[#1B4332] font-serif italic leading-relaxed" style={{ fontFamily: '"Playfair Display", serif' }}>
            {texts[lang]}
          </p>
        </div>
      </div>
    </div>
  );
};

// --- MAIN FEATURES COMPONENT ---
const FeatureSection = ({ label, title, body, list, Mockup, imageLeft, isDark }) => {
  const contentRef = useRef(null);
  useScrollAnimation(contentRef, 0);

  return (
    <div className={`py-24 md:py-32 flex items-center overflow-hidden ${isDark ? 'bg-[#F5F9F5]' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto px-8 md:px-16 w-full">
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-20 items-center ${imageLeft ? '' : 'lg:flex-row-reverse'}`}>
          
          <div ref={contentRef} className={`animate-ready order-1 ${imageLeft ? 'lg:order-1' : 'lg:order-2'}`}>
            <span className="text-xl font-serif italic text-[#52B788] mb-8 block" style={{ fontFamily: '"Playfair Display", serif' }}>{label}</span>
            <h2 className="text-4xl md:text-6xl font-black text-gray-900 mb-10 leading-tight tracking-tight" style={{ fontFamily: '"Playfair Display", serif' }}>{title}</h2>
            <p className="text-lg text-gray-600 mb-12 leading-relaxed font-medium" style={{ fontFamily: '"Inter", sans-serif' }}>{body}</p>
            <ul className="space-y-6">
              {list.map((item, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div className="bg-[#2D6A4F] p-1 rounded-full mt-1 shrink-0">
                     <CheckCircle2 className="text-white" size={14} />
                  </div>
                  <span className="text-lg text-gray-800 font-bold tracking-tight" style={{ fontFamily: '"Inter", sans-serif' }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={`order-2 min-h-[400px] flex items-center justify-center ${imageLeft ? 'lg:order-2' : 'lg:order-1'}`}>
            <Mockup />
          </div>

        </div>
      </div>
    </div>
  );
};

export default function Features() {
  return (
    <section id="features">
      <FeatureSection 
        label="Edge Monitoring" 
        title="Live intelligence for every crop." 
        body="Monitor high-value fields with precision. Our sensors are calibrated to ensure maximum yield through real-time telemetry." 
        list={["Moisture & Nutrient tracking", "Real-time stress detection", "Predictive growth timelines"]} 
        Mockup={LiveMonitoringMockup}
        imageLeft={true} 
        isDark={false}
      />
      
      <FeatureSection 
        label="Precision Nutrients" 
        title="Micro-dosing for macro impact." 
        body="CropPulse calculates the exact dosage based on real-time soil data, preventing over-fertilization and optimizing soil health." 
        list={["Smart nutrient strategist", "Avoid over-fertilization", "Sustainable organic focus"]} 
        Mockup={FertilizerMockup}
        imageLeft={true} 
        isDark={false}
      />

      <FeatureSection 
        label="Global Export" 
        title="Built for the modern farmer." 
        body="Managing multiple regions? Switch between languages and units instantly while maintaining export-grade quality standards." 
        list={["Multilingual dashboards", "Export compliance focus", "Global telemetry access"]} 
        Mockup={LanguageMockup}
        imageLeft={false} 
        isDark={true}
      />
    </section>
  );
}
