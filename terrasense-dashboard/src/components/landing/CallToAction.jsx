import React, { useRef } from 'react';
import { Leaf, ArrowRight, Terminal, Mail, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useParallax from '../../hooks/useParallax';
import useScrollAnimation from '../../hooks/useScrollAnimation';
import FarmScene from '../illustrations/FarmScene';

const ButterflyIcon = ({ className = "" }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 18C12 18 8 21 5 18C2 15 2 11 5 10C5 10 7 12 12 13M12 18C12 18 16 21 19 18C22 15 22 11 19 10C19 10 17 12 12 13M12 18V8M12 8C12 8 16 5 19 8C22 11 22 15 19 16C19 16 17 14 12 13M12 8C12 8 8 5 5 8C2 11 2 15 5 16C5 16 7 14 12 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const LeafCard = ({ children, className = "" }) => (
  <div className={`bg-white rounded-[70%_30%_40%_60%_/_40%_70%_30%_60%] p-8 shadow-2xl border border-[#D8F3DC]/30 ${className}`}>
    {children}
  </div>
);

export default function CallToAction() {
  const navigate = useNavigate();
  const bgRef = useRef(null);
  const contentRef = useRef(null);

  useParallax(bgRef, 0.2);
  useScrollAnimation(contentRef, 0);

  const navLinks = [
    { name: 'Home', href: '#hero' },
    { name: 'Features', href: '#features' },
    { name: 'Impact', href: '#impact' },
    { name: 'Technology', href: '#technology' }
  ];

  const handleLinkClick = (e, href) => {
    e.preventDefault();
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="cta" className="relative min-h-screen flex flex-col items-center justify-center bg-[#1B4332] overflow-hidden py-24" style={{ backgroundColor: '#1B4332' }}>
      
      {/* FarmScene Texture Background */}
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none flex items-center justify-center scale-150 transform rotate-3">
        <FarmScene />
      </div>

      <div ref={bgRef} className="absolute inset-0 pointer-events-none will-change-transform opacity-30">
        <div className="absolute top-[20%] left-[10%] w-96 h-96 bg-[#52B788]/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-[#4A90D9]/10 rounded-full blur-[150px]" />
      </div>

      <div ref={contentRef} className="animate-ready max-w-5xl mx-auto px-8 text-center relative z-10 flex-1 flex flex-col justify-center items-center">
        <div className="mb-12 inline-block animate-gentleFloat">
          <div className="w-24 h-24 bg-white/5 rounded-[3rem] flex items-center justify-center text-[#52B788] backdrop-blur-xl border border-white/10 shadow-2xl">
            <Leaf size={48} strokeWidth={1} />
          </div>
        </div>
        
        <h2 className="text-5xl md:text-8xl font-black text-white mb-10 leading-tight tracking-tighter" style={{ fontFamily: '"Playfair Display", serif' }}>
          See CropPulse <br /> <span className="italic text-[#95D5B2]">in Action</span>
        </h2>
        
        <p className="text-xl md:text-2xl text-white/50 mb-16 max-w-2xl mx-auto font-medium" style={{ fontFamily: '"Inter", sans-serif' }}>
          Built for the farmer. Powered by AI. <br />Ready for your field today.
        </p>

        {/* CTA Section with Leaf-Shaped Floating Cards */}
        <div className="relative pt-10 pb-20 w-full flex justify-center">
          
          {/* Left Leaf Card */}
          <div className="absolute left-0 top-0 hidden lg:block animate-float">
            <LeafCard className="rotate-[-12deg] w-56">
              <div className="flex items-center gap-4">
                <div className="w-2.5 h-2.5 rounded-full bg-[#52B788] animate-pulse" />
                <div className="text-left">
                  <div className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Active Node</div>
                  <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Reading: 30s ago</div>
                </div>
              </div>
            </LeafCard>
          </div>

          {/* Right Leaf Card */}
          <div className="absolute right-0 bottom-0 hidden lg:block animate-float" style={{ animationDelay: '1s' }}>
            <LeafCard className="rotate-[8deg] w-64">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-[#F5F9F5] rounded-full flex items-center justify-center text-[#4A90D9] shadow-inner">
                   <ShieldCheck size={20} />
                </div>
                <div className="text-left">
                  <div className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Soil Health</div>
                  <div className="text-[9px] font-black text-[#52B788] uppercase tracking-widest">Normal — 94%</div>
                </div>
              </div>
            </LeafCard>
          </div>

          <div className="flex flex-col items-center gap-10">
            <div className="flex items-center gap-4 text-[#52B788] text-xs font-black uppercase tracking-[0.4em] bg-white/5 px-6 py-3 rounded-full border border-white/5">
               <div className="w-2 h-2 rounded-full bg-[#52B788] animate-pulse" />
               Monitoring active
            </div>

            <button 
              onClick={() => navigate('/login')} 
              className="group relative bg-white text-[#1B4332] px-16 py-7 rounded-[2.5rem] font-black text-xl md:text-3xl hover:scale-105 transition-all shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] flex items-center gap-6"
              style={{ fontFamily: '"Inter", sans-serif' }}
            >
              Launch Dashboard <ArrowRight className="group-hover:translate-x-3 transition-transform" size={32} strokeWidth={3} />
            </button>
            
            <div className="flex items-center gap-4 opacity-30">
               <ButterflyIcon className="text-white animate-leafDrift" />
               <span className="text-white text-[11px] font-bold uppercase tracking-[0.4em]">
                 Instant Access • Multilingual
               </span>
               <ButterflyIcon className="text-white animate-leafDrift" style={{ animationDelay: '-3s' }} />
            </div>
          </div>
        </div>
      </div>

      <footer className="w-full max-w-7xl mx-auto px-8 md:px-16 pb-16 relative z-10">
        <div className="h-px w-full bg-white/10 mb-16" />
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-16">
          <div className="flex flex-col items-center md:items-start gap-6">
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="p-2 bg-white/10 rounded-xl group-hover:rotate-12 transition-transform">
                <Leaf className="text-[#52B788]" size={24} />
              </div>
              <span className="text-white font-serif italic text-3xl tracking-tight" style={{ fontFamily: '"Playfair Display", serif' }}>CropPulse</span>
            </div>
            <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.3em]">Sustainable Agriculture • AI Intelligence</p>
          </div>

          <div className="flex gap-12">
            {navLinks.map(l => (
              <a 
                key={l.name} 
                href={l.href} 
                onClick={(e) => handleLinkClick(e, l.href)} 
                className="text-white/30 hover:text-white text-[11px] font-bold uppercase tracking-widest transition-all"
                style={{ fontFamily: '"Inter", sans-serif' }}
              >
                {l.name}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-10">
            <a href="#" className="text-white/20 hover:text-white transition-all transform hover:scale-110">
              <Terminal size={22} />
            </a>
            <a href="#" className="text-white/20 hover:text-white transition-all transform hover:scale-110">
              <Mail size={22} />
            </a>
          </div>
        </div>

        <div className="text-center mt-20 flex items-center justify-center gap-4">
          <ButterflyIcon className="text-[#52B788] opacity-20 w-4 h-4" />
          <p className="text-white/10 text-[10px] font-bold uppercase tracking-[0.6em]">
            Made with 🌱 for farmers everywhere
          </p>
          <ButterflyIcon className="text-[#52B788] opacity-20 w-4 h-4" />
        </div>
      </footer>
    </section>
  );
}
