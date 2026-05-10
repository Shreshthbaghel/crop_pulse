import { BarChart2, TrendingUp, PieChart, Info, ShieldCheck, Zap, Activity, Microscope, BarChart3, Database } from 'lucide-react'

export default function SoilInsights() {
  return (
    <div className="p-8 md:p-12 space-y-12 animate-ready max-w-[1500px] mx-auto w-full">
      <div>
        <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#FAF7F2] flex items-center justify-center text-[#2D6A4F]">
                <Microscope size={18} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#2D6A4F]">Neural Analytics</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-[#1B4332] tracking-tighter mb-4" style={{ fontFamily: '"Playfair Display", serif' }}>Bio-Intelligence Insights</h2>
        <p className="text-[11px] font-black text-gray-400 tracking-widest uppercase flex items-center gap-2">
            <span className="w-4 h-[1px] bg-gray-200"></span>
            Deep AI Confidence & Anomaly Detection
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <InsightCard label="CropPulse ML Confidence" value="98.2%" color="text-[#2D6A4F]" bgColor="bg-[#F5F9F5]" progress={98} />
        <InsightCard label="Sensor Anomaly Rate" value="2.1%" color="text-[#B45F43]" bgColor="bg-[#FFF0ED]" progress={2} />
        <InsightCard label="Mesh Nodes Active" value="3 / 3" color="text-[#2D6A4F]" bgColor="bg-[#F5F9F5]" progress={100} />
        <InsightCard label="Core API Latency" value="142ms" color="text-[#4A90D9]" bgColor="bg-[#EBF5FF]" progress={60} />
      </div>

      <div className="bg-white p-20 min-h-[500px] flex flex-col items-center justify-center text-center space-y-10 rounded-[4rem] shadow-2xl shadow-emerald-900/5 border border-[#FAF7F2] relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-5 text-[#2D6A4F] group-hover:scale-110 transition-transform duration-1000">
            <BarChart2 size={300} strokeWidth={1} />
        </div>
        
        <div className="w-24 h-24 bg-[#FAF7F2] rounded-[2.5rem] flex items-center justify-center text-[#2D6A4F]/20 relative z-10 group-hover:rotate-12 transition-transform duration-500">
            <Database size={56} strokeWidth={1} />
        </div>
        
        <div className="space-y-4 relative z-10">
          <h3 className="text-3xl font-black text-[#1B4332] tracking-tighter" style={{ fontFamily: '"Playfair Display", serif' }}>Advanced CropPulse-Matrices</h3>
          <p className="text-sm text-gray-400 max-w-sm mx-auto font-black leading-relaxed italic uppercase tracking-widest text-[10px]">
            "Processing high-resolution probability distributions and historical CropPulse cultivar correlation matrices."
          </p>
        </div>

        <div className="flex items-center gap-4 px-8 py-3 bg-[#F5F9F5] border border-[#D8F3DC] rounded-2xl text-[10px] font-black text-[#2D6A4F] uppercase tracking-[0.3em] relative z-10 shadow-lg shadow-emerald-900/5">
            <Activity size={14} className="animate-pulse" /> Computation Active
        </div>
      </div>
    </div>
  )
}

function InsightCard({ label, value, color, bgColor, progress }) {
  return (
    <div className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-emerald-900/5 border border-[#FAF7F2] flex flex-col gap-10 group hover:border-[#D8F3DC] transition-all duration-500">
      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">{label}</h4>
      <div className={`text-5xl font-black tracking-tighter tabular-nums ${color}`} style={{ fontFamily: '"Inter", sans-serif' }}>{value}</div>
      <div className="w-full h-2 bg-[#FAF7F2] rounded-full overflow-hidden">
         <div 
           className={`h-full ${color.replace('text-', 'bg-')} rounded-full transition-all duration-1000 group-hover:opacity-100 opacity-30`} 
           style={{ width: `${progress}%` }} 
         />
      </div>
    </div>
  )
}
