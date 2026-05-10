import { Wifi, Cpu, Activity, Database } from 'lucide-react'

const StatusDot = ({ label, active }) => (
  <div className="flex items-center gap-2 px-3 border-r border-white/10 last:border-0">
    <div className={`w-2 h-2 rounded-full ${active ? 'bg-primary-400 animate-pulse' : 'bg-danger-500'}`} />
    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">{label}</span>
  </div>
)

export default function DevStatusBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a] border-t border-white/10 px-6 py-2 flex items-center justify-between backdrop-blur-xl">
      <div className="flex items-center">
        <StatusDot label="ESP32 Payload" active={true} />
        <StatusDot label="MQTT Stream" active={true} />
        <StatusDot label="ML Classifier" active={true} />
        <StatusDot label="FastAPI" active={true} />
      </div>

      <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-primary-500">
        <Activity size={12} />
        Live Debugging Active • v1.0.4-beta
      </div>
    </div>
  )
}
