import { useState, useEffect } from 'react';
import { 
  FileText, Download, Calendar, Filter, Database, 
  History, Loader2, ChevronRight, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { supabaseApi } from '../services/supabaseApi';
import { useApp } from '../contexts/AppContext';

export default function ArchivePage() {
  const { session } = useApp();
  const [filters, setFilters] = useState({
    dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    zoneId: 'all',
    format: 'csv'
  });
  
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [recentReadings, setRecentReadings] = useState([]);
  const [isExporting, setIsExporting] = useState(false);

  const fetchArchiveData = async () => {
    setLoading(true);
    try {
      const readings = await supabaseApi.fetchReadingsForExport(filters);
      setRecentReadings(readings.slice(0, 10));
      
      const downloadLogs = await supabaseApi.getDownloadHistory();
      setHistory(downloadLogs);
    } catch (err) {
      console.error("Archive fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchiveData();
  }, [filters.dateFrom, filters.dateTo, filters.zoneId]);

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const data = await supabaseApi.fetchReadingsForExport(filters);
      if (!data.length) {
        alert("No records found for the selected range.");
        return;
      }

      let content = "";
      let mimeType = "";
      const filename = `irrigation_readings_${filters.zoneId}_${filters.dateFrom}_to_${filters.dateTo}.${filters.format}`;

      if (filters.format === 'csv') {
        const headers = ["Recorded At", "Zone ID", "Moisture (%)", "Flow (L/m)", "Temp (C)", "Pressure (bar)", "Status"];
        const rows = data.map(r => [
          r.recorded_at, 
          r.zone_id, 
          r.soil_moisture, 
          r.water_flow_rate, 
          r.temperature, 
          r.pressure, 
          r.irrigation_sessions?.status || 'N/A'
        ].join(","));
        content = [headers.join(","), ...rows].join("\n");
        mimeType = "text/csv";
      } else {
        content = JSON.stringify(data, null, 2);
        mimeType = "application/json";
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      // Log download to Supabase
      await supabaseApi.logDownload({
        downloaded_by: session?.user?.email || 'Anonymous',
        file_name: filename,
        format: filters.format,
        date_from: filters.dateFrom,
        date_to: filters.dateTo,
        row_count: data.length
      });
      
      fetchArchiveData(); // Refresh history
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <main className="p-8 md:p-12 space-y-12 max-w-[1500px] mx-auto w-full animate-ready">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
           <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#EBF5FF] flex items-center justify-center text-[#4A90D9]">
                 <Database size={18} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#4A90D9]">Archive Repository</span>
           </div>
           <h1 className="text-4xl md:text-5xl font-black text-[#1B4332] tracking-tighter mb-4" style={{ fontFamily: '"Playfair Display", serif' }}>Hydration Archives</h1>
           <p className="text-[11px] font-black text-gray-400 tracking-widest uppercase flex items-center gap-2">
              <span className="w-4 h-[1px] bg-gray-200"></span>
              Historical Sensor Governance
           </p>
        </div>
      </div>

      {/* Controls Card */}
      <div className="bg-white rounded-[3rem] shadow-2xl shadow-emerald-900/5 p-12 border border-[#FAF7F2] grid grid-cols-1 lg:grid-cols-4 gap-10">
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-300 flex items-center gap-2">
            <Calendar size={14} /> Date From
          </label>
          <input 
            type="date" 
            value={filters.dateFrom}
            onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
            className="w-full bg-[#FAF7F2] border-none rounded-2xl p-4 text-sm font-bold text-[#1B4332] focus:ring-2 focus:ring-[#2D6A4F]"
          />
        </div>
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-300 flex items-center gap-2">
            <Calendar size={14} /> Date To
          </label>
          <input 
            type="date" 
            value={filters.dateTo}
            onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
            className="w-full bg-[#FAF7F2] border-none rounded-2xl p-4 text-sm font-bold text-[#1B4332] focus:ring-2 focus:ring-[#2D6A4F]"
          />
        </div>
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-300 flex items-center gap-2">
            <Filter size={14} /> Zone
          </label>
          <select 
            value={filters.zoneId}
            onChange={(e) => setFilters({...filters, zoneId: e.target.value})}
            className="w-full bg-[#FAF7F2] border-none rounded-2xl p-4 text-sm font-bold text-[#1B4332] focus:ring-2 focus:ring-[#2D6A4F] appearance-none"
          >
            <option value="all">All Zones</option>
            <option value="zone-alpha">Zone Alpha</option>
            <option value="zone-beta">Zone Beta</option>
          </select>
        </div>
        <div className="flex items-end">
          <button 
            onClick={handleDownload}
            disabled={isExporting}
            className="w-full bg-[#1B4332] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-xl shadow-emerald-900/10 active:scale-95 disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
            {isExporting ? 'Processing...' : 'Generate Export'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
        {/* Preview Table */}
        <div className="xl:col-span-2 bg-white rounded-[3rem] shadow-2xl shadow-emerald-900/5 border border-[#FAF7F2] overflow-hidden">
          <div className="p-8 border-b border-[#FAF7F2] flex items-center justify-between">
            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">Snapshot Preview (Last 10)</h4>
            <div className="flex gap-2">
              {['csv', 'json'].map(fmt => (
                <button 
                  key={fmt}
                  onClick={() => setFilters({...filters, format: fmt})}
                  className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${filters.format === fmt ? 'bg-[#2D6A4F] text-white' : 'bg-[#F5F9F5] text-[#2D6A4F]'}`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#FAF7F2]/50 text-[10px] font-black uppercase tracking-widest text-[#2D6A4F]">
                  <th className="px-8 py-4">Time</th>
                  <th className="px-8 py-4">Zone</th>
                  <th className="px-8 py-4">Moisture</th>
                  <th className="px-8 py-4 text-right">Flow Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FAF7F2]">
                {loading ? (
                   <tr><td colSpan="4" className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-[#D8F3DC]" size={32} /></td></tr>
                ) : !recentReadings.length ? (
                  <tr><td colSpan="4" className="p-20 text-center text-gray-300 text-[10px] font-black uppercase tracking-widest">No matching records</td></tr>
                ) : (
                  recentReadings.map((r, i) => (
                    <tr key={i} className="hover:bg-[#F5F9F5]/50 transition-colors">
                      <td className="px-8 py-6 text-[11px] font-black text-[#1B4332] tabular-nums">
                        {new Date(r.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">{r.zone_id}</td>
                      <td className="px-8 py-6 text-[11px] font-black text-[#2D6A4F]">{r.soil_moisture}%</td>
                      <td className="px-8 py-6 text-right font-black text-[#4A90D9]">{r.water_flow_rate} L/m</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* History Log */}
        <div className="bg-white rounded-[3rem] shadow-2xl shadow-emerald-900/5 border border-[#FAF7F2] p-10 flex flex-col h-full">
           <div className="flex items-center gap-4 mb-10">
              <div className="w-10 h-10 rounded-2xl bg-[#F5F9F5] flex items-center justify-center text-[#2D6A4F]">
                 <History size={20} />
              </div>
              <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">Export History</h4>
           </div>
           
           <div className="flex-1 space-y-6 overflow-y-auto max-h-[500px] pr-2">
              {history.map((item, idx) => (
                <div key={idx} className="group p-6 rounded-[2rem] bg-[#FAF7F2]/50 border border-transparent hover:border-[#D8F3DC] hover:bg-white transition-all cursor-pointer">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${item.format === 'csv' ? 'bg-[#D8F3DC] text-[#2D6A4F]' : 'bg-[#EBF5FF] text-[#4A90D9]'}`}>
                      {item.format}
                    </span>
                    <span className="text-[9px] font-black text-gray-300 tabular-nums">
                      {new Date(item.downloaded_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-[11px] font-black text-[#1B4332] truncate mb-2">{item.file_name}</p>
                  <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                    <CheckCircle2 size={12} className="text-[#52B788]" />
                    {item.row_count} Rows Exported
                  </div>
                </div>
              ))}
              {!history.length && (
                 <div className="flex flex-col items-center justify-center py-20 text-center gap-4 opacity-30">
                    <AlertCircle size={48} strokeWidth={1} />
                    <p className="text-[10px] font-black uppercase tracking-widest">Archive Empty</p>
                 </div>
              )}
           </div>
        </div>
      </div>
    </main>
  );
}
