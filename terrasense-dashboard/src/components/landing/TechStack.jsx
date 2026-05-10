import React, { useRef } from 'react';
import { Zap, Radio, Code, Server, Brain, Database, Sparkles, Cloud, BarChart2, ChevronRight } from 'lucide-react';
import useScrollAnimation from '../../hooks/useScrollAnimation';
import TreeRow from '../illustrations/TreeRow';

const techs = [
  { 
    name: "ESP32", 
    role: "Hardware", 
    icon: <Zap size={22} />, 
    color: "#52B788", 
    tag: "MCU", 
    desc: "Reads sensors every 30 seconds" 
  },
  { 
    name: "HiveMQ", 
    role: "Comm", 
    icon: <Radio size={22} />, 
    color: "#4A90D9", 
    tag: "MQTT", 
    desc: "Routes MQTT messages to backend" 
  },
  { 
    name: "React 18", 
    role: "Frontend", 
    icon: <Code size={22} />, 
    color: "#95D5B2", 
    tag: "SPA", 
    desc: "Renders live dashboard updates" 
  },
  { 
    name: "FastAPI", 
    role: "Server", 
    icon: <Server size={22} />, 
    color: "#5C3D2E", 
    tag: "API", 
    desc: "Serves ML predictions in <50ms" 
  },
  { 
    name: "scikit-learn", 
    role: "Intelligence", 
    icon: <Brain size={22} />, 
    color: "#F9C74F", 
    tag: "ML", 
    desc: "Trains Random Forest models" 
  },
  { 
    name: "Supabase", 
    role: "Database", 
    icon: <Database size={22} />, 
    color: "#2D6A4F", 
    tag: "SQL", 
    desc: "Stores all readings with RLS" 
  },
  { 
    name: "Gemini", 
    role: "AI Advice", 
    icon: <Sparkles size={22} />, 
    color: "#C77DFF", 
    tag: "LLM", 
    desc: "Generates crop advice text" 
  },
  { 
    name: "Weather", 
    role: "Weather", 
    icon: <Cloud size={22} />, 
    color: "#B3D9F7", 
    tag: "API", 
    desc: "Provides rainfall forecasts" 
  },
  { 
    name: "ML Models", 
    role: "Classifier", 
    icon: <BarChart2 size={22} />, 
    color: "#FF6B35", 
    tag: "RF", 
    desc: "Classifies 6 stress conditions" 
  }
];

export default function TechStack() {
  const headerRef = useRef(null);
  useScrollAnimation(headerRef, 0);

  return (
    <section id="technology" className="py-32 md:py-48 bg-[#1C1C1C] relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: `radial-gradient(rgba(255,255,255,0.2) 1px, transparent 0)`, backgroundSize: '40px 40px' }} />

      <div className="max-w-7xl mx-auto px-8 md:px-16 relative z-10">
        <div ref={headerRef} className="animate-ready text-center mb-24">
          <span className="text-[#52B788] font-black text-[10px] uppercase tracking-[0.4em] mb-6 block">Our Foundation</span>
          <h2 className="text-4xl md:text-6xl font-black text-white mb-8 leading-tight tracking-tight" style={{ fontFamily: '"Playfair Display", serif' }}>
            Production-grade tech stack.
          </h2>
          <div className="w-24 h-1 bg-[#2D6A4F] mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {techs.map((tech, index) => (
            <TechCard key={index} tech={tech} index={index} />
          ))}
        </div>
      </div>

      {/* Decorative TreeRow Silhouette at the bottom */}
      <div className="absolute bottom-0 left-0 w-full z-0 opacity-10 pointer-events-none transform translate-y-1/4">
        <TreeRow className="text-[#2D6A4F]" />
      </div>
    </section>
  );
}

function TechCard({ tech, index }) {
  const cardRef = useRef(null);
  useScrollAnimation(cardRef, index * 80);
  
  return (
    <div 
      ref={cardRef} 
      className="animate-ready group bg-white/[0.03] border border-white/[0.08] rounded-[2.5rem] p-10 hover:bg-white/[0.06] hover:border-white/20 transition-all duration-700 cursor-default shadow-2xl shadow-black/20"
    >
      <div className="flex justify-between items-start mb-10">
        <div 
          className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-700 shadow-inner group-hover:scale-110 group-hover:rotate-6"
          style={{ backgroundColor: `${tech.color}20`, color: tech.color }}
        >
          {tech.icon}
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-all duration-700 transform group-hover:translate-x-2">
          <ChevronRight className="text-white/20" size={20} />
        </div>
      </div>
      
      <h3 className="text-xl md:text-3xl font-black text-white mb-3 tracking-tighter" style={{ fontFamily: '"Inter", sans-serif' }}>
        {tech.name}
      </h3>
      <p className="text-[#52B788] text-[10px] font-bold uppercase tracking-[0.3em] mb-8">
        {tech.role}
      </p>

      <div className="max-h-0 overflow-hidden group-hover:max-h-[80px] transition-all duration-700 ease-in-out">
        <p className="text-sm text-white/50 font-medium leading-relaxed pb-8" style={{ fontFamily: '"Inter", sans-serif' }}>
          {tech.desc}
        </p>
      </div>

      <div className="flex">
        <span className="text-[10px] font-black uppercase tracking-widest text-white/30 border border-white/10 px-4 py-2 rounded-full group-hover:border-white/30 transition-colors">
          {tech.tag}
        </span>
      </div>
    </div>
  );
}
