import { useState, useEffect } from 'react'
import { 
  Brain, Download, TrendingUp, Loader2, Sparkles, FileText, Leaf, Activity, CheckCircle2, BarChart3, Database
} from 'lucide-react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { supabase } from '../supabaseClient'
import { useApp } from '../contexts/AppContext'
import { useLanguage } from '../contexts/LanguageContext'

const getMockMonthlyData = (t) => [
  { month: t('jan'), score: 82 },
  { month: t('feb'), score: 78 },
  { month: t('mar'), score: 91 },
  { month: t('apr'), score: 85 },
  { month: t('may'), score: 88 },
  { month: t('jun'), score: 94 },
]

export default function Reports() {
  const { session } = useApp()
  const { t, language } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [latest, setLatest] = useState(null)
  const [history, setHistory] = useState([])

  const fetchReportData = async () => {
    try {
      const { data: latestReading } = await supabase.from('readings').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle()
      const { data: hist } = await supabase.from('readings').select('*').order('created_at', { ascending: false }).limit(30)
      if (latestReading) setLatest(latestReading)
      if (hist) setHistory(hist)
    } catch (e) {
      console.warn("Report data fetch failed")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReportData() }, [])

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] gap-10">
      <div className="relative">
        <div className="w-24 h-24 rounded-[2rem] border-2 border-dashed border-[#D8F3DC] animate-spin duration-[5000ms]" />
        <Database className="absolute inset-0 m-auto text-[#2D6A4F] animate-pulse" size={32} />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300">{t('loading_prefs')}</p>
    </div>
  )

  const healthScore = latest?.soil_health_score || 85

  const exportToCSV = async () => {
    setIsExporting(true)
    try {
      const { data } = await supabase.from('readings').select('*').order('created_at', { ascending: false })
      if (!data || data.length === 0) return
      const headers = [t('timestamp'), `${t('moisture')} (%)`, `${t('temp')} (°C)`, `${t('tds')} (ppm)`, t('diagnosis'), t('health_index')]
      const csvRows = data.map(r => [`"${r.created_at}"`, r.moisture, r.temperature, r.tds, `"${r.classification}"`, r.soil_health_score].join(','))
      const csvContent = [headers.join(','), ...csvRows].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `CropPulse_Report_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <main className="p-8 md:p-12 space-y-12 max-w-[1500px] mx-auto w-full animate-ready relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[url('/dashboard_nature_pattern.png')] bg-contain bg-no-repeat opacity-[0.02] pointer-events-none -z-10 animate-gentleFloat" />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
           <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#EBF5FF] flex items-center justify-center text-[#4A90D9]">
                 <FileText size={18} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#4A90D9]">{t('archive_intel')}</span>
           </div>
           <h1 className="text-4xl md:text-5xl font-black text-[#1B4332] tracking-tighter mb-4" style={{ fontFamily: '"Playfair Display", serif' }}>{t('historical_insights')}</h1>
           <p className="text-[11px] font-black text-gray-400 tracking-widest uppercase flex items-center gap-2">
              <span className="w-4 h-[1px] bg-gray-200"></span>
              {t('CropPulse_growth_archives')}
           </p>
        </div>

        <button 
          onClick={exportToCSV}
          disabled={isExporting}
          className="flex items-center gap-4 bg-[#1B4332] px-8 py-4 rounded-2xl shadow-xl shadow-emerald-900/20 text-[10px] font-black uppercase tracking-widest text-white hover:scale-105 transition-all duration-500 active:scale-95"
        >
          {isExporting ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
          {isExporting ? t('calibrating') : t('download_archive')}
        </button>
      </div>

      {/* AI Hero Section */}
      <div className="p-16 md:p-20 relative overflow-hidden group rounded-[4rem] bg-[#1B4332] text-white shadow-2xl shadow-emerald-900/20 transition-all duration-1000">
        <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform duration-1000 pointer-events-none">
          <Brain size={350} strokeWidth={1} />
        </div>
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-5 gap-16 items-center">
          <div className="lg:col-span-3 space-y-12">
            <div className="bg-white/10 backdrop-blur-md px-6 py-2.5 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest w-fit flex items-center gap-3 text-[#95D5B2]">
              <Sparkles size={16} className="text-[#F9C74F]" /> {t('CropPulse_narrative')}
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.1] tracking-tighter" style={{ fontFamily: '"Playfair Display", serif' }}>
              {t('predicted_yield_efficiency')}: <span className="text-[#F9C74F]">92%</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/60 leading-relaxed font-medium max-w-2xl italic">
              "{latest?.gemini_advice || t('CropPulse_narrative_default')}"
            </p>
          </div>

          <div className="lg:col-span-2 bg-white/5 backdrop-blur-2xl rounded-[3rem] p-12 border border-white/10 shadow-inner">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-12 text-white/30">{t('vector_reasoning')}</h4>
            <div className="space-y-10">
              {[
                { label: t('hydration_cycle'), value: t('optimized'), color: 'bg-[#52B788]' },
                { label: t('nutrient_absorption'), value: t('high'), color: 'bg-[#52B788]' },
                { label: t('stress_biomarkers'), value: t('nominal'), color: '#F9C74F' },
                { label: t('anomalies'), value: t('zero'), color: 'bg-[#52B788]' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{item.label}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-black text-white tracking-widest uppercase">{item.value}</span>
                    <div className={`w-2 h-2 rounded-full ${typeof item.color === 'string' && item.color.startsWith('bg-') ? item.color : ''} shadow-[0_0_12px_rgba(255,255,255,0.2)] animate-pulse`} style={!item.color.startsWith('bg-') ? {backgroundColor: item.color} : {}} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Trends Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        <div className="lg:col-span-2 bg-white p-12 rounded-[4rem] shadow-2xl shadow-emerald-900/5 border border-[#FAF7F2] relative overflow-hidden group">
          <div className="flex justify-between items-center mb-12 relative z-10">
            <div>
              <h4 className="text-[11px] font-black text-gray-300 uppercase tracking-[0.3em] mb-2">{t('historical_regression')}</h4>
              <p className="text-2xl font-black text-[#1B4332] tracking-tight" style={{ fontFamily: '"Playfair Display", serif' }}>{t('CropPulse_health_progression')}</p>
            </div>
            <div className="bg-[#F5F9F5] text-[#2D6A4F] px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 border border-[#D8F3DC]">
              <TrendingUp size={16} /> +4.2% {t('growth')}
            </div>
          </div>
          <div className="h-[350px] w-full p-4 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={history && history.length > 0 ? [...history].reverse() : getMockMonthlyData(t)} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FAF7F2" />
                <XAxis 
                  dataKey={history && history.length > 0 ? "created_at" : "month"} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#CBD5E1' }}
                  tickFormatter={(val) => (history && history.length > 0) ? new Date(val).toLocaleDateString([], { month: 'short', day: 'numeric' }) : val}
                  dy={15}
                />
                <YAxis hide domain={[0, 100]} />
                <Tooltip 
                  cursor={{ fill: 'rgba(27, 67, 50, 0.02)', radius: 12 }}
                  contentStyle={{ borderRadius: '2rem', border: 'none', boxShadow: '0 25px 50px -12px rgba(6, 78, 59, 0.1)', padding: '24px' }}
                />
                <Bar dataKey={history && history.length > 0 ? (history[0]?.soil_health_score !== undefined ? "soil_health_score" : "moisture") : "score"} radius={[12, 12, 12, 12]} barSize={12}>
                  {(history && history.length > 0 ? [...history].reverse() : getMockMonthlyData(t)).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === (history && history.length > 0 ? history.length - 1 : 5) ? '#2D6A4F' : '#F1F5F9'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-12">
          <div className="bg-white rounded-[3rem] shadow-2xl shadow-emerald-900/5 p-10 border-l-[12px] border-l-[#2D6A4F] border-y border-r border-[#FAF7F2] group hover:scale-[1.02] transition-all">
             <p className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-300 mb-4">{t('health_index')}</p>
             <h3 className="text-6xl font-black text-[#1B4332] tracking-tighter tabular-nums" style={{ fontFamily: '"Inter", sans-serif' }}>{healthScore}</h3>
             <div className="flex items-center gap-3 mt-6">
                <CheckCircle2 size={16} className="text-[#52B788]" />
                <p className="text-[10px] font-black text-[#52B788] uppercase tracking-[0.2em]">{t('top_10_regional')}</p>
             </div>
          </div>
          <div className="bg-white rounded-[3rem] shadow-2xl shadow-emerald-900/5 p-10 border-l-[12px] border-l-[#4A90D9] border-y border-r border-[#FAF7F2] group hover:scale-[1.02] transition-all">
             <p className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-300 mb-4">{t('stable_sequence')}</p>
             <h3 className="text-6xl font-black text-[#1B4332] tracking-tighter tabular-nums" style={{ fontFamily: '"Inter", sans-serif' }}>12 {t('days')}</h3>
             <div className="flex items-center gap-3 mt-6">
                <Activity size={16} className="text-[#4A90D9]" />
                <p className="text-[10px] font-black text-[#4A90D9] uppercase tracking-[0.2em]">{t('zero_anomalies')}</p>
             </div>
          </div>
          <div className="bg-[#1B4332] rounded-[3rem] shadow-2xl shadow-emerald-900/20 flex flex-col items-center text-center gap-8 py-12 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(149,213,178,0.1),transparent)]" />
            <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center text-white/20 shadow-inner group-hover:rotate-12 transition-transform">
              <Download size={32} strokeWidth={1.5} />
            </div>
            <div className="space-y-3 relative z-10">
               <h4 className="text-xl font-black text-white tracking-tight" style={{ fontFamily: '"Playfair Display", serif' }}>{t('weekly_summaries')}</h4>
               <p className="text-[10px] text-[#95D5B2] font-black uppercase tracking-[0.3em] leading-relaxed px-10">
                 {t('dispatched_monday')}
               </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
