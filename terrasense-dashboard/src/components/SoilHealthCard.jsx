import { ShieldCheck, Clock, Leaf, Activity } from 'lucide-react'
import { useMQTT } from '../contexts/MQTTContext'
import { formatDistanceToNow } from 'date-fns'
import Card from './ui/Card'
import Badge from './ui/Badge'
import { useLanguage } from '../contexts/LanguageContext'

export default function SoilHealthCard() {
  const { sensorData, lastUpdated } = useMQTT()
  const { t } = useLanguage()

  console.log("[SoilHealthCard] Current SensorData:", sensorData);

  const calculateHealth = (data) => {
    if (!data) return null
    let mScore = 0
    const mDist = data.moisture < 40 ? 40 - data.moisture : data.moisture > 70 ? data.moisture - 70 : 0
    if (mDist === 0) mScore = 100
    else if (mDist <= 10) mScore = 75
    else if (mDist <= 25) mScore = 50
    else if (mDist <= 40) mScore = 25
    else mScore = 0

    let tScore = 0
    const tDist = data.temperature < 20 ? 20 - data.temperature : data.temperature > 35 ? data.temperature - 35 : 0
    if (tDist === 0) tScore = 100
    else if (tDist <= 5) tScore = 75
    else if (tDist <= 10) tScore = 50
    else if (tDist <= 15) tScore = 25
    else tScore = 0

    let tdsScore = 0
    const tds = data.tds
    if (tds >= 600 && tds <= 1600) tdsScore = 100
    else if ((tds >= 500 && tds < 600) || (tds > 1600 && tds <= 1800)) tdsScore = 75
    else if ((tds >= 300 && tds < 500) || (tds > 1800 && tds <= 2000)) tdsScore = 50
    else if ((tds >= 100 && tds < 300) || (tds > 2000 && tds <= 2500)) tdsScore = 25
    else tdsScore = 0

    return Math.round((mScore * 0.35) + (tScore * 0.25) + (tdsScore * 0.40))
  }

  const rawScore = calculateHealth(sensorData)
  const score = rawScore !== null ? Math.min(100, Math.max(0, rawScore)) : null
  
  const color = '#FF6B35'

  return (
    <div 
      className="bg-[#1B4332] rounded-[3rem] p-10 flex flex-col items-center min-h-[500px] shadow-2xl shadow-emerald-900/20 relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:rotate-45 transition-transform duration-1000">
         <Leaf size={120} className="text-[#95D5B2]" />
      </div>

      <div className="w-full mb-12 flex justify-between items-center relative z-10">
         <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#95D5B2]">{t('CropPulse_ai_diagnosis')}</h4>
         <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white">
            <Activity size={14} />
         </div>
      </div>
      
      <div className="relative flex items-center justify-center mb-10 z-10">
        <svg className="w-52 h-52 transform -rotate-90">
          <circle cx="104" cy="104" r="88" stroke="rgba(149, 213, 178, 0.05)" strokeWidth="14" fill="transparent" />
          <circle 
            cx="104" cy="104" r="88" stroke="#52B788" strokeWidth="14" fill="transparent" 
            strokeDasharray={2 * Math.PI * 88}
            strokeDashoffset={score !== null ? (2 * Math.PI * 88) * (1 - score / 100) : (2 * Math.PI * 88)}
            strokeLinecap="round"
            className="transition-all duration-[1500ms] ease-out"
          />
          <text 
            x="50%" y="52%" dominantBaseline="middle" textAnchor="middle" 
            className="text-6xl font-black transition-colors duration-500 fill-white"
            transform="rotate(90 104 104)"
            style={{ fontFamily: '"Inter", sans-serif' }}
          >
            {score !== null ? score : '—'}
          </text>
        </svg>
        <div className="absolute -bottom-4 bg-[#B45F43] px-4 py-1.5 rounded-full text-[9px] font-black text-white uppercase tracking-widest shadow-lg">
           {t('health_index')}
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center gap-4 z-10">
        <div className={`px-6 py-3 rounded-2xl border border-white/10 shadow-xl font-black text-xs uppercase tracking-widest ${sensorData?.classification?.toLowerCase() === 'healthy' || sensorData?.classification?.toLowerCase() === 'normal' ? 'bg-[#52B788] text-white' : 'bg-white text-[#1B4332]'}`}>
          {t(sensorData?.classification) || sensorData?.classification || t('calibrating')}
        </div>
        
        <div className="flex items-center gap-3 text-[10px] font-black text-[#95D5B2] uppercase tracking-[0.2em]">
          <ShieldCheck size={14} />
          {sensorData?.confidence ? (sensorData.confidence * (sensorData.confidence <= 1 ? 100 : 1)).toFixed(0) : 0}% {t('confidence')}
        </div>
      </div>

      <div className="w-full mt-auto pt-8 border-t border-white/5 flex items-center justify-between z-10">
        <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">
           {lastUpdated ? `${t('sync')}: ${formatDistanceToNow(lastUpdated)}` : t('offline')}
        </span>
        <div className="flex gap-1">
           <div className="w-1 h-1 rounded-full bg-[#52B788] animate-pulse" />
           <div className="w-1 h-1 rounded-full bg-[#52B788] animate-pulse [animation-delay:200ms]" />
           <div className="w-1 h-1 rounded-full bg-[#52B788] animate-pulse [animation-delay:400ms]" />
        </div>
      </div>
    </div>
  )
}
