'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useMqtt } from '../../hooks/useMqtt';
import { Activity, Droplets, Zap, Waves, Wifi, WifiOff, Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const { data: liveData, connected, error: mqttError } = useMqtt('farm/data');
  const [latest, setLatest] = useState({ tds: 0, ec: 0, moisture: 0 });

  // 1. Fetch History on Load
  useEffect(() => {
    const fetchHistory = async () => {
      setLoadingHistory(true);
      const { data, error } = await supabase
        .from('sensor_data')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) console.error('❌ History Fetch Error:', error);
      else if (data) {
        setHistory(data);
        if (data.length > 0) setLatest(data[0]);
      }
      setLoadingHistory(false);
    };
    fetchHistory();
  }, []);

  // 2. Handle Live Data & DB Save
  useEffect(() => {
    if (liveData) {
      const newReading = {
        tds: Number(liveData.tds) || 0,
        ec: Number(liveData.ec) || 0,
        moisture: Number(liveData.moisture) || 0,
        created_at: new Date().toISOString(),
        id: Date.now() // Temp ID for React key
      };

      setLatest(newReading);
      // Update history list immediately for UI responsiveness
      setHistory(prev => [newReading, ...prev.slice(0, 49)]);

      const saveToDb = async () => {
        const { error } = await supabase
          .from('sensor_data')
          .insert([{ 
            tds: newReading.tds, 
            ec: newReading.ec, 
            moisture: newReading.moisture 
          }]);
        
        if (error) console.error('❌ Supabase Insert Error:', error);
        else console.log('💾 Successfully saved reading to Supabase');
      };
      saveToDb();
    }
  }, [liveData]);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">IoT Sensor Dashboard</h1>
            <p className="text-slate-400 text-sm">Real-time Telemetry via HiveMQ & Supabase</p>
          </div>
          <div className="flex items-center gap-3">
            {mqttError && <span className="text-red-500 text-[10px] font-bold uppercase">MQTT: {mqttError}</span>}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${connected ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
              {connected ? <Wifi size={16} className="text-emerald-400" /> : <WifiOff size={16} className="text-red-400" />}
              <span className={`text-xs font-bold uppercase tracking-widest ${connected ? 'text-emerald-400' : 'text-red-400'}`}>
                {connected ? 'Live' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        {/* Live Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Moisture" value={latest.moisture} unit="%" icon={<Droplets className="text-sky-400" />} />
          <StatCard title="Conductivity (EC)" value={latest.ec} unit="mS/cm" decimals={4} icon={<Zap className="text-amber-400" />} />
          <StatCard title="TDS Level" value={latest.tds} unit="ppm" decimals={2} icon={<Waves className="text-indigo-400" />} />
        </div>

        {/* History Table */}
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-slate-400" />
              <h3 className="font-semibold tracking-tight">Recent Activity Logs</h3>
            </div>
            {loadingHistory && <Loader2 className="animate-spin text-slate-500" size={16} />}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-slate-500 uppercase text-[10px] font-bold tracking-[0.1em]">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">TDS (ppm)</th>
                  <th className="px-6 py-4">EC (mS/cm)</th>
                  <th className="px-6 py-4">Moisture (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {history.length === 0 && !loadingHistory ? (
                  <tr><td colSpan="4" className="px-6 py-10 text-center text-slate-500 italic">Awaiting first sensor transmission...</td></tr>
                ) : (
                  history.map((row) => (
                    <tr key={row.id || row.created_at} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4 text-slate-500 font-mono text-xs group-hover:text-slate-300">
                        {new Date(row.created_at).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 font-medium text-indigo-400">{row.tds?.toFixed(3)}</td>
                      <td className="px-6 py-4 font-medium text-amber-400">{row.ec?.toFixed(4)}</td>
                      <td className="px-6 py-4 font-medium text-sky-400 font-semibold">{row.moisture}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

// Internal reusable stat component
function StatCard({ title, value, unit, icon, decimals = 1 }) {
  const displayValue = typeof value === 'number' ? value.toFixed(decimals) : '0';
  return (
    <div className="bg-slate-900/50 border border-white/10 p-6 rounded-2xl hover:bg-slate-900 transition-all hover:scale-[1.01] hover:border-white/20">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-white/5 rounded-xl border border-white/5 shadow-inner">{icon}</div>
      </div>
      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{title}</p>
      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-4xl font-mono font-bold tracking-tighter text-white/90">{displayValue}</span>
        <span className="text-slate-500 text-xs font-medium uppercase opacity-50">{unit}</span>
      </div>
    </div>
  );
}
