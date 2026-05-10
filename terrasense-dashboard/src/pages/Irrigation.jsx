import { useState, useEffect } from 'react'
import { Droplets, Activity, Power, Waves, Loader2, Clock, CheckCircle2, ShieldCheck, Zap, BarChart3, CloudRain } from 'lucide-react'
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts'
import { supabase } from '../supabaseClient'
import { useApp } from '../contexts/AppContext'

const StatCard = ({ icon: Icon, label, value, subtext, color, bgColor }) => (
  <div className="flex flex-col gap-8 bg-white rounded-[3rem] shadow-2xl shadow-emerald-900/5 border border-[#FAF7F2] p-10 group hover:border-[#D8F3DC] transition-all duration-500">
    <div className={`p-5 w-fit rounded-2xl ${bgColor} ${color} shadow-inner group-hover:rotate-6 transition-transform duration-500`}>
      <Icon size={32} strokeWidth={2} />
    </div>
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 mb-2">{label}</p>
      <h3 className="text-5xl font-black text-[#1B4332] tracking-tighter tabular-nums" style={{ fontFamily: '"Inter", sans-serif' }}>{value}</h3>
      <div className="flex items-center gap-3 mt-4">
        <div className={`w-2 h-2 rounded-full ${color.replace('text-', 'bg-')} animate-pulse shadow-[0_0_8px_currentColor]`} />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
          {subtext}
        </p>
      </div>
    </div>
  </div>
)

import IrrigationCard from '../components/IrrigationCard/IrrigationCard'

export default function Irrigation() {
  const { session } = useApp()
  const [loading, setLoading] = useState(true)
  const [readings, setReadings] = useState([])

  const fetchIrrigationData = async () => {
    try {
      const { data } = await supabase
        .from('readings')
        .select('created_at, moisture, irrigation_recommendation')
        .order('created_at', { ascending: false })
        .limit(30)
      if (data) setReadings([...data].reverse())
    } catch (e) {
      console.warn("Readings fetch failed")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchIrrigationData() }, [])

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] gap-10">
      <div className="relative">
        <div className="w-24 h-24 rounded-[2rem] border-2 border-dashed border-[#D8F3DC] animate-spin duration-[4000ms]" />
        <Droplets className="absolute inset-0 m-auto text-[#2D6A4F] animate-pulse" size={32} />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300">Fetching CropPulse Hydration Logs...</p>
    </div>
  )

  const latestMoisture = readings[readings.length - 1]?.moisture || 0
  const isNeedsWater = latestMoisture < 45

  return (
    <main className="p-8 md:p-12 space-y-12 max-w-[1500px] mx-auto w-full animate-ready">
      
      {/* Header & Control Center */}
      <div className="flex flex-col lg:flex-row items-start justify-between gap-12">
        <div className="max-w-xl">
           <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#EBF5FF] flex items-center justify-center text-[#4A90D9]">
                 <CloudRain size={18} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#4A90D9]">Resource Management</span>
           </div>
           <h1 className="text-4xl md:text-5xl font-black text-[#1B4332] tracking-tighter mb-4" style={{ fontFamily: '"Playfair Display", serif' }}>Irrigation Logistics</h1>
           <p className="text-[11px] font-black text-gray-400 tracking-widest uppercase flex items-center gap-2 mb-8">
              <span className="w-4 h-[1px] bg-gray-200"></span>
              Precision Hydration Flow
           </p>
           <p className="text-sm text-gray-500 leading-relaxed font-medium">
             Manage your field's hydration with CropPulse-AI powered sequences. Our system monitors real-time soil saturation and ambient matrix to deliver exact water requirements.
           </p>
        </div>

        <div className="w-full lg:w-auto">
          <IrrigationCard 
            zoneId="zone-alpha"
            zoneName="Main Field - Zone Alpha"
            soilMoistureLevel={latestMoisture}
            defaultDuration={15}
          />
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        <StatCard 
          icon={Waves} 
          label="Weekly Flow" 
          value="1,420 L" 
          subtext="CropPulse-Optimized Consumption" 
          color="text-[#4A90D9]"
          bgColor="bg-[#EBF5FF]"
        />
        <StatCard 
          icon={Droplets} 
          label="Field Saturation" 
          value={`${latestMoisture}%`} 
          subtext={isNeedsWater ? "Hydration Required" : "Optimal Bio-Levels"} 
          color={isNeedsWater ? "text-[#B45F43]" : "text-[#2D6A4F]"}
          bgColor={isNeedsWater ? "bg-[#FFF0ED]" : "bg-[#F5F9F5]"}
        />
        <StatCard 
          icon={Activity} 
          label="Pump Telemetry" 
          value="STANDBY" 
          subtext="Pressure Stable" 
          color="text-gray-300"
          bgColor="bg-[#FAF7F2]"
        />
      </div>

      {/* Chart Section */}
      <div className="bg-white p-12 rounded-[4rem] shadow-2xl shadow-emerald-900/5 border border-[#FAF7F2] relative overflow-hidden group">
        <div className="flex justify-between items-start mb-12 relative z-10">
          <div>
            <h4 className="text-[11px] font-black text-gray-300 uppercase tracking-[0.3em] mb-2">Saturation Cycle</h4>
            <p className="text-2xl font-black text-[#1B4332] tracking-tight" style={{ fontFamily: '"Playfair Display", serif' }}>Moisture (%) Real-time Trend</p>
          </div>
          <div className="bg-[#F5F9F5] text-[#2D6A4F] px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 border border-[#D8F3DC]">
            <Radio className="animate-pulse" size={16} /> LIVE SYNC
          </div>
        </div>
        
        <div className="h-[400px] w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={readings} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2D6A4F" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#2D6A4F" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FAF7F2" />
              <XAxis dataKey="created_at" hide />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#CBD5E1', fontSize: 10, fontWeight: 900 }}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '2rem', 
                  border: 'none', 
                  boxShadow: '0 25px 50px -12px rgba(6, 78, 59, 0.1)',
                  padding: '24px',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)'
                }}
                itemStyle={{ fontSize: '11px', fontWeight: '900', color: '#1B4332', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                labelStyle={{ display: 'none' }}
              />
              <Area 
                type="monotone" 
                dataKey="moisture" 
                stroke="#2D6A4F" 
                strokeWidth={5}
                fillOpacity={1} 
                fill="url(#colorMoisture)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent History Table */}
      <div className="bg-white overflow-hidden rounded-[4rem] shadow-2xl shadow-emerald-900/5 border border-[#FAF7F2]">
        <div className="p-10 border-b border-[#FAF7F2] flex items-center justify-between">
          <h4 className="text-[11px] font-black text-gray-300 uppercase tracking-[0.3em]">Historical Hydration Log</h4>
          <BarChart3 size={20} className="text-gray-200" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#FAF7F2]/50 text-[10px] font-black uppercase tracking-[0.2em] text-[#2D6A4F]">
                <th className="px-10 py-6">Created At</th>
                <th className="px-10 py-6">Method</th>
                <th className="px-10 py-6">AI Recommendation</th>
                <th className="px-10 py-6 text-right">Field Saturation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#FAF7F2]">
              {readings.slice(-10).reverse().map((r, i) => (
                <tr key={i} className="hover:bg-[#F5F9F5]/50 transition-colors group">
                  <td className="px-10 py-8 text-[11px] font-black text-[#1B4332] tabular-nums">
                    {new Date(r.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="px-10 py-8">
                    <div className="bg-[#FAF7F2] text-[#2D6A4F] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest w-fit border border-[#D8F3DC]">
                      DRIP FEED
                    </div>
                  </td>
                  <td className="px-10 py-8 text-[11px] text-gray-400 font-black italic tracking-tight leading-relaxed max-w-md">
                    "{r.irrigation_recommendation}"
                  </td>
                  <td className="px-10 py-8 text-right">
                    <span className={`text-lg font-black tabular-nums ${r.moisture < 45 ? 'text-[#B45F43]' : 'text-[#2D6A4F]'}`}>
                      {r.moisture}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
const Radio = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
    <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.4" />
    <circle cx="12" cy="12" r="2" />
    <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.4" />
    <path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1" />
  </svg>
)
