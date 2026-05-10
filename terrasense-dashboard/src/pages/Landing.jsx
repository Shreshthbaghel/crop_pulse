import { Link } from 'react-router-dom'
import { Leaf, BarChart3, Droplets, Zap, ShieldCheck, Globe, ChevronRight } from 'lucide-react'

const FeatureCard = ({ icon: Icon, title, desc }) => (
  <div className="card-glass p-8 space-y-4 hover:translate-y-[-8px] transition-all duration-500 group">
    <div className="w-14 h-14 bg-primary-100 text-primary-700 rounded-2xl flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-colors duration-500">
      <Icon size={28} />
    </div>
    <h3 className="text-xl font-serif italic font-bold text-natural-text">{title}</h3>
    <p className="text-sm opacity-60 leading-relaxed">{desc}</p>
  </div>
)

export default function Landing() {
  return (
    <div className="min-h-screen bg-natural-bg text-natural-text overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4 md:px-12 md:py-6 flex items-center justify-between backdrop-blur-md bg-white/30 border-b border-white/20">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white font-serif font-bold text-2xl italic shadow-xl">C</div>
          <span className="text-2xl font-serif italic font-bold text-primary-700 tracking-tight">CropPulse</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/login" className="text-sm font-bold uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity hidden md:block">
            About
          </Link>
          <Link to="/login" className="px-8 py-3 bg-primary-600 text-white font-bold rounded-2xl shadow-lg hover:bg-primary-700 hover:scale-105 transition-all active:scale-95">
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 md:pt-48 md:pb-32 flex flex-col items-center text-center max-w-6xl mx-auto">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-100 rounded-full blur-[120px] opacity-40 -z-10" />
        <div className="absolute bottom-0 right-[-10%] w-[40%] h-[40%] bg-soil-100 rounded-full blur-[120px] opacity-40 -z-10" />

        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 border border-primary-100 rounded-full text-primary-700 text-[10px] font-bold uppercase tracking-[0.2em] mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Zap size={12} fill="currentColor" />
          The Future of Agriculture is Here
        </div>

        <h1 className="text-5xl md:text-8xl font-serif italic font-bold text-primary-800 leading-[1.1] mb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          Precision Farming <br />
          <span className="text-primary-600">Powered by AI</span>
        </h1>

        <p className="text-lg md:text-xl opacity-60 max-w-2xl mb-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">
          Monitor your soil health in real-time, get AI-driven fertilizer recommendations, 
          and optimize your irrigation with CropPulse.
        </p>

        <div className="flex flex-col md:flex-row gap-4 animate-in fade-in slide-in-from-bottom-16 duration-1000">
          <Link to="/login" className="px-12 py-5 bg-primary-600 text-white font-bold text-lg rounded-3xl shadow-2xl shadow-primary-200 hover:bg-primary-700 hover:translate-y-[-4px] transition-all flex items-center gap-2">
            Get Started Now <ChevronRight size={20} />
          </Link>
          <button className="px-12 py-5 bg-white border-2 border-natural-border text-natural-text font-bold text-lg rounded-3xl hover:bg-natural-bg transition-all">
            Watch Demo
          </button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-3 gap-8">
        <FeatureCard 
          icon={BarChart3} 
          title="Live Soil Intel" 
          desc="Real-time monitoring of Moisture, Temperature, and TDS levels with sub-second precision."
        />
        <FeatureCard 
          icon={Leaf} 
          title="AI Recommendations" 
          desc="Proprietary ML models suggest the perfect fertilizer blend based on your unique soil profile."
        />
        <FeatureCard 
          icon={Droplets} 
          title="Smart Irrigation" 
          desc="Predictive watering schedules that save up to 40% more water while increasing crop yield."
        />
      </section>

      {/* Trust Banner */}
      <section className="bg-white border-y border-natural-border py-12 overflow-hidden">
        <div className="flex justify-around items-center opacity-30 grayscale gap-12 flex-wrap px-6">
          <div className="flex items-center gap-2 font-bold text-xl"><ShieldCheck size={24}/> Certified Analytics</div>
          <div className="flex items-center gap-2 font-bold text-xl"><Globe size={24}/> Used in 20+ Regions</div>
          <div className="flex items-center gap-2 font-bold text-xl"><Leaf size={24}/> Eco-Friendly Tech</div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 text-center space-y-6">
        <div className="flex items-center justify-center gap-2 opacity-50">
          <div className="w-6 h-6 bg-primary-600 rounded flex items-center justify-center text-white font-serif font-bold text-xs italic">C</div>
          <span className="font-serif italic font-bold text-primary-700">CropPulse</span>
        </div>
        <p className="text-xs font-bold uppercase tracking-widest opacity-30">
          © 2026 CropPulse Agriculture Systems • All Rights Reserved
        </p>
      </footer>
    </div>
  )
}
