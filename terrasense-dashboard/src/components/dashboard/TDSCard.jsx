import { useEffect, useState } from 'react'
import { FlaskConical } from 'lucide-react'
import Card from '../ui/Card'
import { useLanguage } from '../../contexts/LanguageContext'

export default function TDSCard({ value = 0, trend = 'stable' }) {
  const { t } = useLanguage()
  const [isFlashing, setIsFlashing] = useState(false)

  useEffect(() => {
    if (value !== 0) {
      setIsFlashing(true)
      const timer = setTimeout(() => setIsFlashing(false), 600)
      return () => clearTimeout(timer)
    }
  }, [value])

  return (
    <div 
      className={`bg-white rounded-[2rem] p-8 shadow-2xl shadow-emerald-900/5 border border-[#FAF7F2] flex items-center justify-between group transition-all duration-500 ${isFlashing ? 'bg-[#F5F9F5]' : ''}`}
    >
      <div className="flex items-center gap-6">
        <div className="w-14 h-14 bg-[#F5F9F5] rounded-2xl flex items-center justify-center text-[#2D6A4F] group-hover:rotate-6 transition-all duration-500">
          <FlaskConical size={26} strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-2">{t('nutrient_level')}</p>
          <div className="flex items-baseline gap-3">
            <h4 className="text-4xl font-black text-[#1B4332] tracking-tighter tabular-nums" style={{ fontFamily: '"Inter", sans-serif' }}>{value} <span className="text-sm font-bold text-gray-300">ppm</span></h4>
            <span className={`text-xs font-black ${trend === 'up' ? 'text-[#F9C74F]' : trend === 'down' ? 'text-[#52B788]' : 'text-gray-300'}`}>
              {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '●'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
