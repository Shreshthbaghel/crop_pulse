import { useState, useEffect } from 'react'
import { Leaf, RefreshCw, AlertCircle, Loader2, Thermometer, Droplets, Mountain, CheckCircle2, Zap, BarChart3, Activity } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useApp } from '../contexts/AppContext'
import { useLanguage } from '../contexts/LanguageContext'

const formatPercent = (val) => {
  if (val === null || val === undefined || val === "") return "—";
  let num = parseFloat(val);
  if (num <= 1) num = num * 100;
  return Math.min(100, num).toFixed(1);
}

const AlternativeCard = ({ name, probability }) => {
  const { t } = useLanguage()
  return (
    <div className="flex justify-between items-center group bg-white p-6 rounded-[2rem] border border-[#FAF7F2] shadow-xl shadow-emerald-900/5 hover:border-[#2D6A4F] transition-all duration-500">
      <div className="flex flex-col">
        <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] mb-2">{t('secondary_option')}</span>
        <span className="text-base font-black text-[#1B4332] group-hover:text-[#2D6A4F] transition-colors tracking-tight" style={{ fontFamily: '"Inter", sans-serif' }}>{name}</span>
      </div>
      <div className="bg-[#F5F9F5] text-[#2D6A4F] px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border border-[#D8F3DC]">
        {formatPercent(probability)}%
      </div>
    </div>
  )
}

export default function Recommendations() {
  const { session } = useApp()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [latestReading, setLatestReading] = useState(null)
  const [recommendation, setRecommendation] = useState(null)
  const [error, setError] = useState(null)

  const fetchData = async () => {
    if (!session?.user?.id) return
    setLoading(true)
    setError(null)
    
    try {
      const { data: prof } = await supabase.from('profiles').select('soil_type').eq('id', session.user.id).maybeSingle()
      setProfile(prof)

      const { data: reading } = await supabase.from('readings').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle()
      setLatestReading(reading)

      if (prof?.soil_type && reading) {
        const aiServerUrl = import.meta.env.VITE_AI_SERVER_URL || 'http://localhost:8000';
        const response = await fetch(`${aiServerUrl}/predict/fertilizer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            temperature: reading.temperature,
            moisture: reading.moisture,
            soil_type: prof.soil_type,
            userId: session.user.id
          })
        })
        if (!response.ok) throw new Error("AI service busy")
        const result = await response.json()
        setRecommendation(result)
      } else if (!prof?.soil_type) {
        setError("Please define your Soil Type in Settings to enable recommendations.")
      }
    } catch (err) {
      setError("Unable to connect to AI engine. Please check status.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [session])

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] gap-10">
      <div className="relative">
        <div className="w-24 h-24 rounded-[2rem] border-2 border-dashed border-[#D8F3DC] animate-spin duration-[4000ms]" />
        <Leaf className="absolute inset-0 m-auto text-[#2D6A4F] animate-pulse" size={32} />
      </div>
      <div className="text-center">
         <p className="text-[10px] font-black text-[#52B788] tracking-[0.4em] uppercase mb-4">{t('CropPulse_strategist')}</p>
         <p className="text-2xl font-black text-[#1B4332] tracking-tighter" style={{ fontFamily: '"Playfair Display", serif' }}>{t('calculating_nutrients')}</p>
      </div>
    </div>
  )

  return (
    <main className="p-8 md:p-12 space-y-12 max-w-[1500px] mx-auto w-full animate-ready relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[url('/dashboard_nature_pattern.png')] bg-contain bg-no-repeat opacity-[0.02] pointer-events-none -z-10 animate-gentleFloat" />
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
           <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#D8F3DC] flex items-center justify-center text-[#2D6A4F]">
                 <BarChart3 size={18} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#52B788]">{t('strategy_engine')}</span>
           </div>
           <h1 className="text-4xl md:text-5xl font-black text-[#1B4332] tracking-tighter mb-4" style={{ fontFamily: '"Playfair Display", serif' }}>{t('nutrient_optimization')}</h1>
           <p className="text-[11px] font-black text-gray-400 tracking-widest uppercase flex items-center gap-2">
              <span className="w-4 h-[1px] bg-gray-200"></span>
              {t('ai_analysis')}
           </p>
        </div>
        <button 
          onClick={fetchData} 
          className="flex items-center gap-4 bg-white px-8 py-4 rounded-2xl shadow-xl shadow-emerald-900/5 text-[10px] font-black uppercase tracking-widest text-[#2D6A4F] hover:bg-[#2D6A4F] hover:text-white transition-all duration-500 active:scale-95"
        >
          <RefreshCw size={16} /> {t('recalculate')}
        </button>
      </div>

      {error ? (
        <div className="bg-white p-20 flex flex-col items-center text-center gap-10 rounded-[3rem] shadow-2xl shadow-emerald-900/5 border border-[#FAF7F2]">
          <div className="p-8 bg-[#FFF0ED] text-[#B45F43] rounded-[2.5rem]">
            <AlertCircle size={64} strokeWidth={1} />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-[#1B4332] tracking-tighter" style={{ fontFamily: '"Playfair Display", serif' }}>Analysis Halted</h2>
            <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed font-medium">{error}</p>
          </div>
          <button onClick={fetchData} className="bg-[#B45F43] text-white px-12 py-5 rounded-[1.5rem] font-black text-sm tracking-widest shadow-xl shadow-orange-900/20 hover:scale-105 active:scale-95 transition-all">Retry Analysis</button>
        </div>
      ) : !recommendation?.fertilizer_recommendation ? (
        <div className="p-20 flex flex-col items-center text-center gap-10 rounded-[3rem] border-2 border-dashed border-[#D8F3DC] bg-white/50">
          <RefreshCw size={80} strokeWidth={1} className="animate-spin text-[#D8F3DC]" />
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-[#1B4332] tracking-tighter" style={{ fontFamily: '"Playfair Display", serif' }}>Processing Data</h2>
            <p className="text-sm text-gray-400 max-w-xs mx-auto font-medium leading-relaxed">Awaiting final sensor confirmation to generate advice.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          <div className="lg:col-span-2 space-y-12">
            <div className="p-16 relative overflow-hidden group min-h-[450px] flex flex-col justify-center rounded-[4rem] bg-[#1B4332] text-white shadow-2xl shadow-emerald-900/20 transition-all duration-1000">
              <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:rotate-45 transition-transform duration-1000">
                <Leaf size={300} />
              </div>
              <div className="relative z-10 space-y-12">
                <div className="flex items-center gap-5">
                  <div className="bg-white/10 backdrop-blur-md px-6 py-2.5 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest text-[#95D5B2]">{t('perfect_match')}</div>
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">
                    {t('confidence')}: {formatPercent(recommendation.confidence)}%
                  </span>
                </div>
                
                <h2 className="text-7xl md:text-8xl font-black text-white tracking-tighter leading-none" style={{ fontFamily: '"Playfair Display", serif' }}>
                  {recommendation?.fertilizer_recommendation}
                </h2>

                <p className="text-xl md:text-2xl text-white/60 max-w-xl leading-relaxed font-medium">
                  {t('optimized_for')} <span className="text-white font-black underline decoration-[#B45F43]/40 underline-offset-8">{t(profile?.soil_type)}</span> {t('soil_with_moisture')} <span className="text-white font-black">{latestReading?.moisture}%</span>.
                </p>

                <div className="pt-10 border-t border-white/10 flex items-center gap-4">
                   <div className="w-3 h-3 rounded-full bg-[#B45F43] animate-pulse shadow-[0_0_12px_rgba(180,95,67,0.8)]" />
                   <p className="text-xs font-black uppercase tracking-[0.2em] text-[#F9C74F]">
                    ACTION: {t('immediate_application')}
                   </p>
                </div>
              </div>
            </div>

            <div className="space-y-8">
               <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-300 px-8">{t('alternative_strategy')}</h4>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[0, 1, 2].map((idx) => {
                  const alt = recommendation?.top_3?.[idx + 1]
                  return <AlternativeCard key={idx} name={alt?.fertilizer || "—"} probability={alt?.probability} />
                })}
               </div>
            </div>
          </div>

          <div className="space-y-12">
            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-300 px-8">{t('environmental_matrix')}</h4>
            <div className="bg-white space-y-10 p-12 rounded-[3rem] shadow-2xl shadow-emerald-900/5 border border-[#FAF7F2] relative">
              <div className="flex items-center gap-6 group">
                <div className="w-16 h-16 bg-[#F5F9F5] rounded-3xl flex items-center justify-center text-[#2D6A4F] shadow-inner group-hover:rotate-6 transition-all">
                  <Mountain size={32} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">{t('soil_type')}</p>
                  <p className="text-2xl font-black text-[#1B4332] tracking-tight">{profile?.soil_type || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 group">
                <div className="w-16 h-16 bg-[#FFF0ED] rounded-3xl flex items-center justify-center text-[#FF6B35] shadow-inner group-hover:rotate-6 transition-all">
                  <Thermometer size={32} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">{t('ambient_temp')}</p>
                  <p className="text-2xl font-black text-[#1B4332] tracking-tight">{latestReading?.temperature ? `${latestReading.temperature}°C` : "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 group">
                <div className="w-16 h-16 bg-[#EBF5FF] rounded-3xl flex items-center justify-center text-[#4A90D9] shadow-inner group-hover:rotate-6 transition-all">
                  <Droplets size={32} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">{t('hydration')}</p>
                  <p className="text-2xl font-black text-[#1B4332] tracking-tight">{latestReading?.moisture ? `${latestReading.moisture}%` : "—"}</p>
                </div>
              </div>
              
              <div className="pt-10 border-t border-[#FAF7F2] space-y-6">
                <div className="flex items-center gap-4 text-[#52B788]">
                  <div className="bg-[#D8F3DC] p-2 rounded-xl">
                    <CheckCircle2 size={20} />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest">{t('model_verified')}</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed font-medium italic">
                  "{t('prediction_computed')}"
                </p>
              </div>
            </div>

          </div>
        </div>
      )}
    </main>
  )
}
