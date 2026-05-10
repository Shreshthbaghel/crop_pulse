import { useState } from 'react'
import { Play, Square, Terminal, Zap, ShieldAlert, Cpu, Activity, Wifi } from 'lucide-react'

export default function Simulation() {
  const [isRunning, setIsRunning] = useState(false)
  const [logs, setLogs] = useState(["[SYSTEM] Simulator Initialized...", "[MQTT] Connecting to broker..."])

  const addLog = (msg) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 15))

  const toggleSim = () => {
    setIsRunning(!isRunning)
    addLog(isRunning ? "Simulation Terminated" : "Simulation Deployed - Broadcasting sensor frames")
  }

  return (
    <div className="p-8 md:p-12 space-y-12 max-w-[1400px] mx-auto w-full animate-ready">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
           <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#FAF7F2] flex items-center justify-center text-[#2D6A4F]">
                 <Cpu size={18} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#2D6A4F]">Hardware Engine</span>
           </div>
           <h1 className="text-4xl md:text-5xl font-black text-[#1B4332] tracking-tighter mb-4" style={{ fontFamily: '"Playfair Display", serif' }}>Hardware Simulator</h1>
           <p className="text-[11px] font-black text-gray-400 tracking-widest uppercase flex items-center gap-2">
              <span className="w-4 h-[1px] bg-gray-200"></span>
              Virtual ESP32 & MQTT Node Environment
           </p>
        </div>
        <button 
          onClick={toggleSim}
          className={`flex items-center gap-4 px-12 py-6 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all duration-500 shadow-2xl active:scale-95 group ${
            isRunning ? 'bg-[#B45F43] text-white shadow-orange-900/20' : 'bg-[#1B4332] text-white shadow-emerald-900/20'
          }`}
        >
          {isRunning ? <><Square size={20} strokeWidth={2.5} /> TERMINATE NODE</> : <><Play size={20} strokeWidth={2.5} /> DEPLOY SIMULATOR</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Terminal Logs */}
        <div className="lg:col-span-2 bg-[#081C15] rounded-[3rem] p-10 font-mono text-xs text-[#52B788] h-[550px] overflow-auto shadow-2xl shadow-emerald-900/10 border border-white/5 relative">
          <div className="sticky top-0 bg-[#081C15]/90 backdrop-blur-md pb-6 flex justify-between items-center border-b border-white/5 mb-8">
            <div className="flex items-center gap-4">
               <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#B45F43]/30" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#F9C74F]/30" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#52B788]/30" />
               </div>
               <span className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
                  <Terminal size={14}/> Raw MQTT Stream
               </span>
            </div>
            <div className="px-4 py-1 bg-white/5 rounded-full text-[9px] text-white/20 uppercase tracking-widest font-black">
               Live Console
            </div>
          </div>
          <div className="space-y-3">
             {logs.map((log, i) => (
               <div key={i} className={`flex gap-4 ${i === 0 ? 'text-white' : 'opacity-40'}`}>
                 <span className="shrink-0 text-white/10">{logs.length - i}</span>
                 <p className="leading-relaxed font-medium">{log}</p>
               </div>
             ))}
          </div>
        </div>

        {/* Quick Controls */}
        <div className="space-y-10">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-emerald-900/5 border border-[#FAF7F2] space-y-8">
            <div className="flex items-center justify-between">
               <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-300">Network Matrix</h4>
               <Wifi size={18} className="text-[#2D6A4F]" />
            </div>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-black uppercase tracking-widest text-[#1B4332]">Signal Latency</span>
                <span className="text-xl font-black text-[#2D6A4F] tracking-tighter">24ms</span>
              </div>
              <div className="w-full h-2 bg-[#FAF7F2] rounded-full overflow-hidden">
                <div className="w-[15%] h-full bg-[#2D6A4F] rounded-full" />
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-black uppercase tracking-widest text-[#1B4332]">Packet Success</span>
                <span className="text-xl font-black text-[#2D6A4F] tracking-tighter">99.8%</span>
              </div>
              <div className="w-full h-2 bg-[#FAF7F2] rounded-full overflow-hidden">
                <div className="w-[99%] h-full bg-[#52B788] rounded-full" />
              </div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-emerald-900/5 border-2 border-dashed border-[#FFF0ED] space-y-8 group hover:border-[#B45F43] transition-colors">
             <div className="flex items-center gap-4 text-[#B45F43]">
               <ShieldAlert size={24} />
               <div>
                  <h4 className="text-[11px] font-black uppercase tracking-[0.3em]">Chaos Lab</h4>
                  <p className="text-[9px] text-gray-300 font-black uppercase tracking-widest mt-1">Stress Testing</p>
               </div>
             </div>
             <p className="text-[11px] text-gray-400 font-medium leading-relaxed italic">
               "Inject synthetic failure vectors into the AI pipeline to evaluate system resilience."
             </p>
             <button className="w-full py-5 bg-[#FFF0ED] text-[#B45F43] rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[#B45F43] hover:text-white transition-all duration-500 shadow-xl shadow-orange-900/5">
                TRIGGER API TIMEOUT
             </button>
             <button className="w-full py-5 bg-[#FAF7F2] text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-gray-100 transition-all duration-500">
                CORRUPT SENSOR BUFFER
             </button>
          </div>

          <div className="bg-[#FAF7F2] p-10 rounded-[3rem] flex flex-col items-center text-center gap-6">
             <Activity className="text-[#2D6A4F]/20" size={40} strokeWidth={1} />
             <p className="text-[10px] text-gray-300 font-black uppercase tracking-[0.3em] leading-relaxed">
               Simulator version: v2.4.1-stable
             </p>
          </div>
        </div>
      </div>
    </div>
  )
}
