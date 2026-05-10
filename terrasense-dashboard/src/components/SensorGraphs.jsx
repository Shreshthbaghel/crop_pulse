import { useState, useEffect } from 'react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts'
import { Radio, Heart, Zap, Thermometer } from 'lucide-react'
import { useMQTT } from '../contexts/MQTTContext'
import { useLanguage } from '../contexts/LanguageContext'

// UI Components
import Card from './ui/Card'
import Badge from './ui/Badge'

const CustomTooltip = ({ active, payload, label }) => {
  const { t } = useLanguage()
  if (active && payload && payload.length) {
    return (
      <Card className="!p-5 shadow-2xl border-black/[0.03] backdrop-blur-xl bg-white/90 rounded-2xl">
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">{t('time')}: {label}</p>
        <div className="space-y-3">
          {payload.map((entry) => (
            <div key={entry.name} className="flex items-center gap-4">
              <div className="w-2.5 h-2.5 rounded-full shadow-inner" style={{ backgroundColor: entry.color }} />
              <p className="text-xs font-black text-brand-dark">
                <span className="text-gray-400 font-bold uppercase tracking-tighter mr-2">{t(entry.name.toLowerCase())}:</span> {entry.value}
                <span className="text-[9px] ml-1 opacity-40">
                  {entry.name === 'Moisture' ? '%' : entry.name === 'Temp' ? '°C' : 'ppm'}
                </span>
              </p>
            </div>
          ))}
        </div>
      </Card>
    )
  }
  return null
}

const StatusCard = ({ title, value, unit, icon: Icon, color, isUpdating }) => (
  <Card className={`flex flex-col justify-between group rounded-[2.5rem] border-none shadow-xl shadow-black/[0.02] ${isUpdating ? 'value-flash' : ''}`}>
    <div className="flex justify-between items-start p-2">
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-300 mb-3">{title}</p>
        <div className="flex items-baseline gap-1.5">
          <h4 className="text-4xl font-black text-brand-dark tracking-tighter tabular-nums">{value ?? '--'}</h4>
          <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{unit}</span>
        </div>
      </div>
      <div className={`p-4 rounded-2xl ${color} shadow-inner transition-transform group-hover:scale-110 duration-500`}>
        <Icon size={24} strokeWidth={2.5} />
      </div>
    </div>
  </Card>
)

export default function SensorGraphs({ hideStatusCards = false }) {
  const { sensorData, connectionStatus, sensorHistory = [] } = useMQTT()
  const { t } = useLanguage()
  const [isUpdating, setIsUpdating] = useState(false)

  const chartData = sensorHistory.length > 0 
    ? sensorHistory.map(h => ({
        name: h.time || new Date(h.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        moisture: h.moisture,
        temperature: h.temperature,
        tds: h.tds
      }))
    : [
        { name: '08:00:00', moisture: 65, temperature: 24, tds: 450 },
        { name: '10:00:00', moisture: 58, temperature: 26, tds: 480 },
        { name: '12:00:00', moisture: 72, temperature: 22, tds: 420 },
        { name: '14:00:00', moisture: 68, temperature: 25, tds: 460 },
        { name: '16:00:00', moisture: 62, temperature: 27, tds: 510 },
        { name: '18:00:00', moisture: 55, temperature: 28, tds: 540 },
        { name: '20:00:00', moisture: 70, temperature: 23, tds: 430 },
      ]

  const calculateHealth = (data) => {
    if (!data) return null
    const mScore = Math.max(0, Math.min(100, (data.moisture / 70) * 100))
    const tScore = Math.max(0, Math.min(100, (35 - data.temperature) * 4))
    const ecScore = Math.max(0, Math.min(100, (data.tds / 1000) * 100))
    return Math.round((mScore * 0.5) + (tScore * 0.3) + (ecScore * 0.2))
  }

  const healthScore = calculateHealth(sensorData)

  useEffect(() => {
    if (sensorData) {
      setIsUpdating(true)
      const timer = setTimeout(() => setIsUpdating(false), 1500)
      return () => clearTimeout(timer)
    }
  }, [sensorData])

  const latest = sensorData || { moisture: '--', temperature: '--', tds: '--' }

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center">
        <Badge className="!px-5 !py-2.5 bg-white shadow-sm border border-black/[0.03] flex items-center gap-4 rounded-2xl">
          <div className="relative">
            <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-brand-green' : 'bg-semantic-warning'}`} />
            {connectionStatus === 'connected' && <div className="absolute inset-0 w-2 h-2 bg-brand-green rounded-full animate-ping" />}
          </div>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-3">
            <Radio size={14} className="opacity-50" />
            Mesh: {connectionStatus === 'connected' ? t('stable_sync') : t('reconnecting')}
          </span>
        </Badge>
      </div>

      {!hideStatusCards && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <StatusCard title={t('health_index')} value={healthScore} unit="/ 100" icon={Heart} color="text-brand-green bg-brand-green-surface" isUpdating={isUpdating} />
          <StatusCard title={t('soil_tds')} value={latest.tds} unit="ppm" icon={Zap} color="text-brand-orange bg-brand-orange-surface" isUpdating={isUpdating} />
          <StatusCard title={t('node_temp')} value={latest.temperature} unit="°C" icon={Thermometer} color="text-semantic-info bg-brand-bg border border-black/[0.03]" isUpdating={isUpdating} />
        </div>
      )}

      <div className="h-[400px] w-full p-2 min-h-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#CBD5E1', fontSize: 10, fontWeight: 800 }}
              dy={15}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#CBD5E1', fontSize: 10, fontWeight: 800 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="top" 
              align="right" 
              iconType="circle"
              formatter={(value) => <span className="text-[9px] font-black uppercase tracking-widest">{t(value.toLowerCase())}</span>}
              wrapperStyle={{ paddingBottom: '40px', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#CBD5E1' }}
            />
            <Line 
              type="monotone" 
              name="Moisture" 
              dataKey="moisture" 
              stroke="#1B4332" 
              strokeWidth={4} 
              dot={{ r: 4, fill: '#1B4332', strokeWidth: 2, stroke: '#fff' }} 
              activeDot={{ r: 8 }}
            />
            <Line 
              type="monotone" 
              name="Temp" 
              dataKey="temperature" 
              stroke="#B45F43" 
              strokeWidth={3} 
              dot={{ r: 3, fill: '#B45F43', strokeWidth: 2, stroke: '#fff' }}
            />
            <Line 
              type="monotone" 
              name="TDS" 
              dataKey="tds" 
              stroke="#88A9B3" 
              strokeWidth={3} 
              dot={{ r: 3, fill: '#88A9B3', strokeWidth: 2, stroke: '#fff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
