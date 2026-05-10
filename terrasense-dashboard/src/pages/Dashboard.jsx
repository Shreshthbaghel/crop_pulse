import { useState, useEffect } from 'react'
import { Globe, ChevronDown, ShieldCheck, Activity } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useApp } from '../contexts/AppContext'
import { useMQTT } from '../contexts/MQTTContext'
import { supabase } from '../supabaseClient'
import SensorGraphs from '../components/SensorGraphs'
import Topbar from '../components/Topbar'
import FarmProfileCard from '../components/FarmProfileCard'
import SoilHealthCard from '../components/SoilHealthCard'
import HarvestSchedule from '../components/HarvestSchedule'
import ScenarioInjectors from '../components/ScenarioInjectors'

// Dashboard Grid Components
import MoistureCard from '../components/dashboard/MoistureCard'
import TemperatureCard from '../components/dashboard/TemperatureCard'
import TDSCard from '../components/dashboard/TDSCard'
import CropGrowthActivity from '../components/CropGrowthActivity'

export default function Dashboard() {
  const { t, language, setLanguage } = useLanguage()
  const { isDevMode, session } = useApp()
  const { sensorData } = useMQTT()
  const [profile, setProfile] = useState({ growth_stage: 'Germination', crop_type: 'Nano Banana' })
  const [showLang, setShowLang] = useState(false)

  const languages = [
    { code: 'EN', label: 'English' },
    { code: 'KN', label: 'ಕನ್ನಡ (Kannada)' },
    { code: 'HI', label: 'हिंदी (Hindi)' },
    { code: 'TE', label: 'తెలుగు (Telugu)' },
    { code: 'ML', label: 'മലയാളം (Malayalam)' },
  ]
  
  const currentLang = languages.find(l => l.code === language) || languages[0]
  const farmerName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'Farmer'
  const latest = sensorData || { moisture: 0, temperature: 0, tds: 0 }

  useEffect(() => {
    if (session?.user?.id) {
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('growth_stage, crop_type')
          .eq('id', session.user.id)
          .single()
        
        if (data) setProfile(data)
      }
      fetchProfile()
    }
  }, [session])

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-nature-gradient selection:bg-[#2D6A4F] selection:text-white relative">
      <Topbar />
      
      <main className="p-8 md:p-12 space-y-12 max-w-[1600px] mx-auto w-full animate-ready relative">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[url('/dashboard_nature_pattern.png')] bg-contain bg-no-repeat opacity-[0.03] pointer-events-none -z-10 animate-gentleFloat" />

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="animate-ready">
            <div className="flex items-center gap-3 mb-4">
               <div className="w-8 h-8 rounded-lg bg-[#D8F3DC] flex items-center justify-center text-[#2D6A4F] shadow-sm">
                  <Activity size={18} />
               </div>
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#52B788]">{t('live_field_intel')}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-[#1B4332] tracking-tighter mb-4" style={{ fontFamily: '"Playfair Display", serif' }}>
              {t('welcome_back')}, <span className="font-medium text-emerald-800">{farmerName}</span>
            </h1>
            <p className="text-[11px] font-black text-gray-400 tracking-widest uppercase flex items-center gap-2">
               <span className="w-4 h-[1px] bg-gray-200"></span>
               {new Date().toLocaleDateString(language === 'EN' ? 'en-US' : language === 'KN' ? 'kn-IN' : language === 'HI' ? 'hi-IN' : 'te-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            {/* Shifted Language Selector */}
            <div className="relative">
              <button 
                onClick={() => setShowLang(!showLang)}
                className="flex items-center gap-4 bg-white px-6 py-4 rounded-2xl shadow-xl shadow-emerald-900/5 border border-[#D8F3DC]/30 text-[10px] font-black uppercase tracking-widest text-[#2D6A4F] hover:scale-105 transition-all group"
              >
                <Globe size={16} className="text-[#52B788] group-hover:rotate-12 transition-transform" />
                <span>{currentLang.label}</span>
                <ChevronDown size={14} className={`transition-transform duration-500 ${showLang ? 'rotate-180' : ''} text-gray-300`} />
              </button>

              {showLang && (
                <div className="absolute top-full right-0 mt-4 w-48 bg-white/95 backdrop-blur-2xl rounded-[1.5rem] shadow-2xl border border-[#FAF7F2] p-3 z-50 animate-ready overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#2D6A4F] to-[#52B788]" />
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code)
                        setShowLang(false)
                      }}
                      className={`w-full text-left px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all mb-1 last:mb-0 ${
                        language === lang.code ? 'text-white bg-[#2D6A4F] shadow-lg shadow-emerald-900/20' : 'text-gray-400 hover:bg-[#F5F9F5] hover:text-[#2D6A4F]'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl shadow-sm border border-[#D8F3DC]/30">
               <div className="w-2 h-2 rounded-full bg-[#52B788] animate-pulse" />
               <span className="text-[10px] font-black text-[#1B4332] uppercase tracking-widest">{t('nodes_active')}</span>
            </div>
            <div className="flex items-center gap-3 bg-[#1B4332] px-5 py-3 rounded-2xl shadow-xl shadow-emerald-900/10">
               <ShieldCheck className="text-[#95D5B2]" size={16} />
               <span className="text-[10px] font-black text-white uppercase tracking-widest">{t('encrypted_sync')}</span>
            </div>
          </div>
        </div>

        {/* Row 2: Farm Profile */}
        <div className="animate-ready [animation-delay:100ms]">
          <FarmProfileCard />
        </div>

        {/* Row 3: Main Dashboard Grid */}
        <div className="flex flex-col xl:flex-row gap-10 items-start animate-ready [animation-delay:200ms]">
          {/* Left Column (Main Insights) */}
          <div className="flex-[3] space-y-10 min-w-0 w-full">
            <CropGrowthActivity />
            
            <div className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-emerald-900/5 border border-[#FAF7F2] relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#2D6A4F] via-[#52B788] to-transparent opacity-50" />
               <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-xl font-black text-[#1B4332] tracking-tight" style={{ fontFamily: '"Playfair Display", serif' }}>{t('sensor_history')}</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{t('precision_monitoring')}</p>
                  </div>
                  <div className="flex items-center gap-3 bg-[#F5F9F5] px-4 py-2 rounded-xl">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#52B788] animate-pulse" />
                    <span className="text-[9px] font-black text-[#2D6A4F] uppercase tracking-widest">{t('realtime_stream')}</span>
                  </div>
               </div>
               <div className="relative h-[450px] w-full overflow-hidden">
                  <SensorGraphs hideStatusCards={true} />
               </div>
            </div>
          </div>

          {/* Right Column (Live Stats) */}
          <div className="flex-[2] space-y-10 min-w-[340px] w-full">
            <div className="grid grid-cols-1 gap-6">
              <MoistureCard value={latest.moisture} trend="up" />
              <TemperatureCard value={latest.temperature} trend="stable" />
              <TDSCard value={latest.tds} trend="down" />
            </div>
            
            <SoilHealthCard />
          </div>
        </div>

        {/* Row 4: Harvest Schedule */}
        <div className="pt-4 animate-ready [animation-delay:300ms]">
          <HarvestSchedule />
        </div>
        
        {isDevMode && <ScenarioInjectors userId={session?.user?.id} />}
      </main>
    </div>
  )
}
