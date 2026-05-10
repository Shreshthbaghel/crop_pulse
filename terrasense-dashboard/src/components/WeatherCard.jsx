import { Sun, Cloud, CloudRain, Droplets } from 'lucide-react'
import { useMQTT } from '../contexts/MQTTContext'

const ForecastItem = ({ day, temp, icon: Icon }) => (
  <div className="flex flex-col items-center gap-1 p-2">
    <span className="text-[10px] font-bold opacity-30 uppercase">{day}</span>
    <Icon size={16} className="text-primary-600 my-1" />
    <span className="text-xs font-bold">{temp}°</span>
  </div>
)

export default function WeatherCard() {
  const { sensorData } = useMQTT()

  const temp = sensorData?.temperature || 28
  const rainProb = sensorData?.rainProb || 12 // Default mock or from bridge
  const rec = sensorData?.irrigationAdvice || "System monitoring soil moisture..."

  // Visual logic based on rain probability
  const WeatherIcon = rainProb > 60 ? CloudRain : rainProb > 30 ? Cloud : Sun
  const iconColor = rainProb > 60 ? 'text-blue-500' : rainProb > 30 ? 'text-gray-400' : 'text-warning-500'

  if (!sensorData) return (
    <div className="bg-white p-8 rounded-[32px] flex flex-col items-center justify-center text-center opacity-50 h-full min-h-[200px] shadow-sm border border-gray-50">
      <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Weather Intel</h4>
      <p className="text-sm font-medium">Awaiting Sensor Feed</p>
    </div>
  )

  return (
    <div className="bg-white p-8 rounded-[32px] flex flex-col h-full shadow-sm border border-gray-50">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">Weather Intel</h4>
          <div className="flex items-center gap-4">
            <WeatherIcon size={40} className={iconColor} />
            <div className="flex flex-col">
              <span className="text-4xl font-bold text-gray-900 tracking-tight">{Math.round(temp)}°C</span>
              <span className="text-sm font-semibold text-gray-400 uppercase tracking-tight">{rainProb}% Rain Prob.</span>
            </div>
          </div>
        </div>
        
        {/* Simplified 3-Day Forecast */}
        <div className="flex gap-2 bg-gray-50 p-3 rounded-[20px] border border-gray-100">
          <ForecastItem day="Sun" temp={Math.round(temp + 1)} icon={Sun} />
          <ForecastItem day="Mon" temp={Math.round(temp - 1)} icon={Cloud} />
          <ForecastItem day="Tue" temp={Math.round(temp)} icon={Sun} />
        </div>
      </div>

      {/* Irrigation Recommendation */}
      <div className="mt-auto p-5 bg-primary-600 text-white rounded-[24px] shadow-lg shadow-primary-600/20 flex items-center gap-4">
        <div className="p-3 bg-white/20 rounded-xl shrink-0">
          <Droplets size={24} />
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="text-xs font-bold uppercase opacity-70 tracking-widest mb-0.5">Irrigation Advice</span>
          <p className="text-sm font-bold leading-relaxed">{rec}</p>
        </div>
      </div>
    </div>
  )
}
