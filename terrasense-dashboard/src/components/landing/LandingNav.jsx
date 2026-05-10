import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LeafIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.24 12.24C20.24 16.65 16.65 20.24 12.24 20.24C7.83 20.24 4.24 16.65 4.24 12.24C4.24 7.83 12.24 3.76 12.24 3.76C12.24 3.76 20.24 7.83 20.24 12.24Z" fill="currentColor" />
    <path d="M12.24 3.76V20.24" stroke="white" strokeWidth="0.5" strokeLinecap="round" opacity="0.3" />
  </svg>
);

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#hero' },
    { name: 'Features', href: '#features' },
    { name: 'Impact', href: '#impact' },
    { name: 'Technology', href: '#technology' },
  ];

  const handleLinkClick = (e, href) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <nav 
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-white/90 backdrop-blur-xl shadow-sm py-3 md:py-4 border-b border-[#D8F3DC]' 
          : 'bg-transparent py-5 md:py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-8 md:px-16 flex justify-between items-center">
        
        {/* Left Side: Brand */}
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className={`transition-all duration-500 transform group-hover:rotate-12 ${
            scrolled ? 'text-[#2D6A4F]' : 'text-white'
          }`}>
            <LeafIcon />
          </div>
          <span className={`font-serif italic text-2xl tracking-tight transition-colors duration-500 ${
            scrolled ? 'text-[#2D6A4F]' : 'text-white'
          }`} style={{ fontFamily: '"Playfair Display", serif' }}>
            CropPulse
          </span>
        </div>

        {/* Center: Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-10 lg:gap-14">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => handleLinkClick(e, link.href)}
              className={`text-[11px] font-bold uppercase tracking-[0.25em] transition-all duration-300 hover:text-[#52B788] ${
                scrolled ? 'text-gray-500' : 'text-white opacity-80 hover:opacity-100'
              }`}
              style={{ fontFamily: '"Inter", sans-serif' }}
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* Right Side: CTA Button & Mobile Toggle */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate('/login')}
            className={`hidden sm:block px-8 py-3 rounded-full font-bold text-[11px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-black/5 hover:scale-105 ${
              scrolled 
                ? 'bg-[#2D6A4F] text-white' 
                : 'bg-white text-[#2D6A4F]'
            }`}
            style={{ fontFamily: '"Inter", sans-serif' }}
          >
            Launch Dashboard
          </button>

          <button 
            className="md:hidden p-2 transition-transform active:scale-90"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className={scrolled ? 'text-[#2D6A4F]' : 'text-white'} size={28} />
          </button>
        </div>
      </div>

      {/* Mobile Slide-in Menu */}
      <div 
        className={`fixed inset-0 bg-[#2D6A4F] z-[60] transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) transform ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        } md:hidden`}
      >
        <div className="flex flex-col h-full p-10">
          <div className="flex justify-between items-center mb-20">
            <div className="flex items-center gap-3">
              <div className="text-white">
                <LeafIcon />
              </div>
              <span className="text-white font-serif italic text-3xl tracking-tight" style={{ fontFamily: '"Playfair Display", serif' }}>CropPulse</span>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="p-2 transition-transform active:rotate-90">
              <X className="text-white" size={36} strokeWidth={1.5} />
            </button>
          </div>

          <div className="flex flex-col gap-12 items-start justify-center flex-1">
            {navLinks.map((link, i) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className={`text-white text-5xl font-serif italic hover:text-[#D8F3DC] transition-all duration-300 transform translate-y-0 opacity-100`}
                style={{ fontFamily: '"Playfair Display", serif', transitionDelay: `${i * 100}ms` }}
              >
                {link.name}
              </a>
            ))}
          </div>

          <div className="mt-auto pt-10 border-t border-white/10">
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-white text-[#2D6A4F] py-6 rounded-[2rem] font-bold text-sm uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95"
            >
              Launch Dashboard
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
