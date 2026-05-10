import { Zap, Droplets, Thermometer, FlaskConical, AlertTriangle } from 'lucide-react'
import { supabase } from '../supabaseClient'

export default function ScenarioInjectors({ userId }) {
  const inject = async (type) => {
    const scenarios = {
      drought: { moisture: 15, temperature: 38, tds: 800, classification: 'Water Deficiency', message: 'CRITICAL: Severe moisture deficit detected.' },
      salinity: { moisture: 45, temperature: 28, tds: 2400, classification: 'Salinity Stress', message: 'WARNING: Elevated TDS levels detected.' },
      heat: { moisture: 50, temperature: 45, tds: 900, classification: 'Heat Stress', message: 'WARNING: Soil temperature exceeding safety thresholds.' },
      overfert: { moisture: 60, temperature: 26, tds: 3200, classification: 'Over-Fertilization', message: 'CRITICAL: Toxic nutrient concentration detected.' },
      imbalance: { moisture: 55, temperature: 24, tds: 400, classification: 'Nutrient Imbalance', message: 'INFO: Nutrient levels below optimal range.' }
    }

    const data = scenarios[type]
    
    // Insert Mock Reading
    await supabase.from('readings').insert({
      user_id: userId,
      moisture: data.moisture,
      temperature: data.temperature,
      tds: data.tds,
      classification: data.classification,
      is_anomaly: true,
      timestamp: new Date().toISOString()
    })

    // Insert Alert
    await supabase.from('alerts').insert({
      user_id: userId,
      type: 'Scenario Injection',
      severity: type === 'drought' || type === 'overfert' ? 'critical' : 'warning',
      message: data.message,
      triggered_at: new Date().toISOString(),
      resolved: false
    })

    alert(`Injected ${type} scenario!`)
  }

  return (
    <div className="fixed bottom-16 right-8 z-40 flex flex-col gap-3 animate-in slide-in-from-right-8 duration-500">
      <div className="bg-white p-4 rounded-3xl shadow-2xl border border-natural-border space-y-3">
        <p className="text-[9px] font-bold uppercase tracking-widest opacity-40 text-center border-b pb-2">Inject Scenarios</p>
        
        <button onClick={() => inject('drought')} className="w-full flex items-center gap-3 p-2 hover:bg-danger-50 text-danger-600 rounded-xl transition-all">
          <Droplets size={16} /> <span className="text-[10px] font-bold uppercase">Drought</span>
        </button>
        <button onClick={() => inject('salinity')} className="w-full flex items-center gap-3 p-2 hover:bg-warning-50 text-warning-600 rounded-xl transition-all">
          <Zap size={16} /> <span className="text-[10px] font-bold uppercase">Salinity</span>
        </button>
        <button onClick={() => inject('heat')} className="w-full flex items-center gap-3 p-2 hover:bg-danger-50 text-danger-600 rounded-xl transition-all">
          <Thermometer size={16} /> <span className="text-[10px] font-bold uppercase">Heat Stress</span>
        </button>
        <button onClick={() => inject('overfert')} className="w-full flex items-center gap-3 p-2 hover:bg-primary-50 text-primary-600 rounded-xl transition-all">
          <FlaskConical size={16} /> <span className="text-[10px] font-bold uppercase">Over-Fert</span>
        </button>
      </div>
    </div>
  )
}
