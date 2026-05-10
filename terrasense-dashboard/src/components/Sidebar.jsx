import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Leaf, 
  Bell, 
  FileText, 
  Settings, 
  Menu, 
  X,
  ShieldCheck,
  Sprout,
  Activity,
  BarChart3,
  Droplets,
  Database
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { useLanguage } from '../contexts/LanguageContext'
import { supabase } from '../supabaseClient'

const NavItem = ({ to, icon: Icon, label, active, onClick }) => (
  <Link 
    to={to} 
    onClick={onClick}
    className={`group relative flex items-center gap-3 px-6 py-4 rounded-2xl transition-all duration-500 ${
      active 
        ? 'bg-[#2D6A4F] text-white shadow-xl shadow-emerald-900/20' 
        : 'text-gray-400 hover:bg-[#F5F9F5] hover:text-[#2D6A4F]'
    }`}
  >
    <Icon size={20} className={`transition-transform duration-500 ${active ? 'scale-110' : 'group-hover:scale-110'}`} strokeWidth={2.5} />
    <span className={`text-sm tracking-tight ${active ? 'font-black' : 'font-bold'}`}>{label}</span>
    {active && (
      <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-[#95D5B2]" />
    )}
  </Link>
)

export default function Sidebar() {
  const { session } = useApp()
  const { t } = useLanguage()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)

  const farmerName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'Farmer'

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { to: '/recommendations', icon: Sprout, label: t('recommendations') },
    { to: '/alerts', icon: Activity, label: t('alerts') },
    { to: '/reports', icon: BarChart3, label: t('reports') },
    { to: '/archive', icon: Database, label: t('archive') || 'Archive' },
    { to: '/settings', icon: Settings, label: t('settings') },
  ]

  return (
    <>
      {/* Mobile Trigger */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-6 right-6 z-50 p-4 bg-white rounded-2xl shadow-xl border border-gray-100 text-[#2D6A4F]"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside className={`fixed inset-y-0 left-0 z-40 w-[300px] glass transform transition-transform duration-700 cubic-bezier(0.16, 1, 0.3, 1) md:relative md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } flex flex-col h-screen shrink-0 border-r border-white/40 shadow-2xl shadow-emerald-900/10`}>
        
        {/* Logo Section */}
        <div className="px-10 py-12 mb-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-[#1B4332] rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-emerald-900/20 group-hover:rotate-6 transition-transform duration-500">
              <Leaf size={22} fill="currentColor" />
            </div>
            <div>
               <h1 className="text-2xl font-black text-[#1B4332] tracking-tighter leading-none" style={{ fontFamily: '"Playfair Display", serif' }}>CropPulse</h1>
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#52B788] mt-2">CropPulse Intel</p>
            </div>
          </Link>
        </div>

        {/* Navigation Section */}
        <div className="px-4 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 mb-8 px-6">Management</p>
          <nav className="space-y-2">
            {navItems.map((item) => (
              <NavItem 
                key={item.to} 
                {...item} 
                active={location.pathname === item.to || (item.to === '/dashboard' && (location.pathname === '/' || location.pathname === ''))}
                onClick={() => setIsOpen(false)}
              />
            ))}
          </nav>
        </div>

        {/* Footer / User Section */}
        <div className="p-6">
          <div className="bg-[#FAF7F2] rounded-[2.5rem] p-6 border border-[#D8F3DC]/50">
             <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#2D6A4F] font-black text-lg shadow-sm border border-[#D8F3DC]">
                  {farmerName[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-[#1B4332] truncate">{farmerName}</p>
                  <div className="flex items-center gap-2 mt-1">
                     <div className="w-1.5 h-1.5 rounded-full bg-[#52B788] animate-pulse" />
                     <p className="text-[9px] font-black text-[#52B788] uppercase tracking-widest">Active</p>
                  </div>
                </div>
             </div>
             
             {/* Logout Button */}
             <button 
                onClick={async () => {
                  await supabase.auth.signOut()
                  window.location.href = '/login'
                }}
                className="w-full mt-6 flex items-center justify-center gap-3 px-6 py-4 bg-white hover:bg-[#FFF0ED] text-[#2D6A4F] hover:text-[#B45F43] rounded-2xl transition-all duration-500 border border-[#D8F3DC]/30 hover:border-[#B45F43]/30 group"
             >
                <X size={18} className="group-hover:rotate-90 transition-transform duration-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Log Out</span>
             </button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="md:hidden fixed inset-0 bg-[#1B4332]/20 backdrop-blur-md z-30 transition-all duration-500"
        />
      )}
    </>
  )
}
