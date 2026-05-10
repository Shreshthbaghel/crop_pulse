import { Globe, Bell, ChevronDown } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useMQTT } from '../contexts/MQTTContext'
import { formatDistanceToNow } from 'date-fns'

export default function Topbar() {
  const { session } = useApp()
  const { t } = useLanguage()
  const { lastUpdated, connectionStatus } = useMQTT()

  return (
    <header className="flex items-center justify-end px-12 py-8 bg-transparent gap-8 sticky top-0 z-30 pointer-events-none">
      <div className="flex items-center gap-8 pointer-events-auto bg-white/60 backdrop-blur-xl px-8 py-4 rounded-[2rem] border border-[#FAF7F2] shadow-2xl shadow-emerald-900/5">
        
        {/* Live Feed Status */}
        <div className="flex items-center gap-4 pr-8 border-r border-[#FAF7F2]">
          <div className="relative">
             <div className={`w-3 h-3 rounded-full ${connectionStatus === 'connected' ? 'bg-[#52B788] animate-pulse' : 'bg-[#F9C74F]'}`} />
             <div className={`absolute inset-0 w-3 h-3 rounded-full ${connectionStatus === 'connected' ? 'bg-[#52B788] animate-ping opacity-20' : ''}`} />
          </div>
          <div className="flex flex-col">
             <span className="text-[10px] font-black text-[#1B4332] uppercase tracking-[0.2em] leading-none">{t('live_telemetry')}</span>
             <span className="text-[9px] font-bold text-gray-400 mt-1 whitespace-nowrap">
                {lastUpdated ? `${t('updated')} ${formatDistanceToNow(lastUpdated)} ${t('ago')}` : t('awaiting_connection')}
             </span>
          </div>
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-gray-400 hover:text-[#2D6A4F] transition-all group">
          <Bell size={20} className="group-hover:rotate-12 transition-transform" />
          <div className="absolute top-2 right-2 w-2 h-2 bg-[#B45F43] rounded-full border-2 border-white shadow-sm" />
        </button>
      </div>
    </header>
  )
}
