import React from 'react';
import { Zap, AlertTriangle, CheckCircle, RotateCcw, Loader2, StopCircle } from 'lucide-react';
import { useIrrigationCycle, STATES } from './useIrrigationCycle';

export default function IrrigationCard(props) {
  const {
    state,
    setState,
    elapsed,
    remaining,
    isApiLoading,
    errorMsg,
    cooldown,
    startCycle,
    stopCycle
  } = useIrrigationCycle(props);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = Math.min(100, (elapsed / (props.defaultDuration * 60)) * 100);

  return (
    <div 
      role="region" 
      aria-label={`Irrigation control for ${props.zoneName}`}
      className="max-w-[480px] w-full mx-auto bg-[#B5624A] rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden transition-all duration-500"
    >
      {/* State: IDLE */}
      {state === STATES.IDLE && (
        <div className="flex flex-col items-center text-center space-y-8">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-white/90">
            <Zap size={32} fill="currentColor" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black tracking-tight" style={{ fontFamily: '"Playfair Display", serif' }}>
              Initialize irrigation sequence?
            </h3>
            <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">
              {props.zoneName}
            </p>
          </div>
          
          <button
            aria-label="Start irrigation cycle"
            disabled={isApiLoading || cooldown > 0}
            onClick={() => {
              console.log("Start button clicked, moving to CONFIRMING");
              setState(STATES.CONFIRMING);
            }}
            className="w-full bg-white text-[#B5624A] py-5 rounded-full font-black text-sm tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50 cursor-pointer"
            style={{ position: 'relative', zIndex: 50 }}
          >
            {isApiLoading ? <Loader2 className="animate-spin mx-auto" /> : cooldown > 0 ? `COOLDOWN (${cooldown}s)` : 'START CYCLE'}
          </button>
        </div>
      )}

      {/* State: CONFIRMING */}
      {state === STATES.CONFIRMING && (
        <div className="flex flex-col items-center text-center space-y-8">
          <div className="w-16 h-16 bg-[#F9C74F]/20 rounded-full flex items-center justify-center text-[#F9C74F]">
            <AlertTriangle size={32} />
          </div>
          <h3 className="text-2xl font-black tracking-tight" style={{ fontFamily: '"Playfair Display", serif' }}>
            Are you sure?
          </h3>
          <div className="flex gap-4 w-full">
            <button
              onClick={() => setState(STATES.IDLE)}
              className="flex-1 border-2 border-white/20 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={startCycle}
              className="flex-1 bg-white text-[#B5624A] py-4 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-all cursor-pointer"
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {/* State: RUNNING */}
      {state === STATES.RUNNING && (
        <div className="flex flex-col items-center space-y-10">
          <div className="text-center space-y-2">
            <h4 className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em]">Currently Watering</h4>
            <div className="text-6xl font-black tracking-tighter" style={{ fontFamily: '"Playfair Display", serif' }}>
              {formatTime(elapsed)}
            </div>
          </div>

          <div className="w-full space-y-4">
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-1000 ease-linear shadow-[0_0_15px_rgba(255,255,255,0.5)]" 
                style={{ width: `${progress}%` }} 
              />
            </div>
            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-white/50">
              <span>Elapsed</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
          </div>

          <button
            onClick={stopCycle}
            className="w-full bg-[#1B4332] text-white py-5 rounded-full font-black text-sm tracking-widest flex items-center justify-center gap-3 hover:bg-[#081C15] transition-all cursor-pointer"
          >
            <StopCircle size={20} />
            STOP CYCLE
          </button>
        </div>
      )}

      {/* State: COMPLETED */}
      {state === STATES.COMPLETED && (
        <div className="flex flex-col items-center text-center space-y-8">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-white">
            <CheckCircle size={48} className="animate-bounce" />
          </div>
          <div className="space-y-2">
            <h3 className="text-3xl font-black tracking-tight" style={{ fontFamily: '"Playfair Display", serif' }}>
              Cycle Complete!
            </h3>
            <p className="text-white/60 text-xs font-medium">
              Zone has been successfully hydrated.
            </p>
          </div>
        </div>
      )}

      {/* State: ERROR */}
      {state === STATES.ERROR && (
        <div className="flex flex-col items-center text-center space-y-8">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center text-red-200">
            <AlertTriangle size={32} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black tracking-tight">Failed to start</h3>
            <p className="text-white/60 text-xs">{errorMsg}</p>
          </div>
          <button
            onClick={() => {
              setState(STATES.IDLE);
              startCycle();
            }}
            className="w-full bg-white text-[#B5624A] py-4 rounded-full font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw size={16} />
            RETRY
          </button>
        </div>
      )}
    </div>
  );
}
