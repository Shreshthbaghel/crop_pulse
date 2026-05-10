import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useSimulation } from "./SimulationProvider";
import { getSoilRecommendations, getCropAdvisorAdvice } from "../lib/gemini";
import { predictIrrigation } from "../lib/weather";
import { analyzeMoistureTrend, TrendResult, getOptimalRanges } from "../lib/analytics";
import { User } from "@supabase/supabase-js";
import { 
  Activity, 
  AlertTriangle, 
  BarChart3, 
  Bug,
  Calendar,
  CheckCircle2,
  Cloud, 
  Cpu,
  Download,
  Droplets, 
  FileText,
  Filter,
  History, 
  Info, 
  LayoutDashboard, 
  Leaf,
  LogOut, 
  Minus,
  Play, 
  RefreshCcw,
  Search,
  Settings, 
  Square, 
  Sun, 
  Thermometer, 
  TrendingDown,
  TrendingUp,
  Wifi,
  WifiOff,
  Zap 
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { IoTSensorPanel } from "./IoTSensorPanel";
import { format } from "date-fns";
import { motion, AnimatePresence } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function getStressBadgeClass(cls: string) {
  const m: Record<string, string> = {
    "Normal": "stress-badge-normal",
    "Water Deficiency": "stress-badge-drought",
    "Salinity Stress": "stress-badge-salinity",
    "Over-Fertilization": "stress-badge-overfert",
    "Nutrient Imbalance": "stress-badge-nutrient",
    "Heat Stress": "stress-badge-heat",
  };
  return m[cls] ?? "bg-gray-100 text-gray-700";
}

function getStressTextColor(cls: string) {
  const m: Record<string, string> = {
    "Normal": "text-green-700",
    "Water Deficiency": "text-amber-700",
    "Salinity Stress": "text-red-700",
    "Over-Fertilization": "text-orange-700",
    "Nutrient Imbalance": "text-purple-700",
    "Heat Stress": "text-red-900",
  };
  return m[cls] ?? "text-gray-700";
}

interface DashboardProps {
  onLogout: () => void;
  user: User;
}

export function Dashboard({ onLogout, user }: DashboardProps) {
  const { isSimulating, toggleSimulation, triggerScenario, weather, lastTrace, lastInjectedScenario } = useSimulation();
  const isDevMode = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("devmode") === "true";
  const [readings, setReadings] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [recommendation, setRecommendation] = useState<any>(null);
  const [loadingRec, setLoadingRec] = useState(false);
  const [trend, setTrend] = useState<TrendResult | null>(null);
  const [mlPrediction, setMlPrediction] = useState<any>(null);
  const [cropType, setCropType] = useState("Tomatoes");
  const [growthStage, setGrowthStage] = useState("Vegetative");
  const [irrigationMethod, setIrrigationMethod] = useState("Drip");
  const [soilType, setSoilType] = useState("Loamy");
  const [region, setRegion] = useState("Tropical");
  const [advisorResult, setAdvisorResult] = useState<any>(null);
  const [loadingAdvisor, setLoadingAdvisor] = useState(false);

  const [historyFilter, setHistoryFilter] = useState("All");
  const [historySearch, setHistorySearch] = useState("");

  const [irrigationLogs, setIrrigationLogs] = useState<any[]>([
    { date: new Date(Date.now() - 86400000 * 2), duration: 45, volume: 15, method: "Drip" }, // mock data
  ]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);

  // Track mounted state so async callbacks don't setState after unmount
  const mountedRef = useRef(true);
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  // Auto-start simulation if no readings appear quickly and we're not in dev mode
  useEffect(() => {
    if (!mountedRef.current || isDevMode) return;
    const timer = setTimeout(() => {
      if (readings.length === 0 && !isSimulating) {
        toggleSimulation();
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [readings.length, isSimulating, toggleSimulation, isDevMode]);

  useEffect(() => {
    if (!user) return;

    // 1. Initial Fetch Readings
    const fetchReadings = async () => {
      const { data, error } = await supabase
        .from("readings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) {
        console.error("Supabase Readings Fetch Error:", error);
        return;
      }

      if (!mountedRef.current) return;

      const formatted = data.map(d => ({
        ...d,
        chartTime: new Date(d.created_at).getTime(),
        displayTime: format(new Date(d.created_at), "HH:mm")
      }));

      setReadings(formatted);
      if (formatted.length >= 5) setTrend(analyzeMoistureTrend(formatted));
      if (formatted.length > 0) {
        getRecommendation(formatted[0]);
        getMLPrediction(formatted[0]);
      }
    };

    fetchReadings();

    // 2. Real-time Subscription for Readings
    const readingsSub = supabase
      .channel('readings-channel')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'readings', 
        filter: `user_id=eq.${user.id}` 
      }, (payload) => {
        if (!mountedRef.current) return;
        const d = payload.new;
        const newReading = {
          ...d,
          chartTime: new Date(d.created_at).getTime(),
          displayTime: format(new Date(d.created_at), "HH:mm")
        };
        setReadings(prev => [newReading, ...prev].slice(0, 30));
      })
      .subscribe();

    // 3. Initial Fetch Alerts
    const fetchAlerts = async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (!error && mountedRef.current) setAlerts(data);
    };

    fetchAlerts();

    // 4. Real-time Subscription for Alerts
    const alertsSub = supabase
      .channel('alerts-channel')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'alerts', 
        filter: `user_id=eq.${user.id}` 
      }, () => {
        fetchAlerts(); // Refresh all alerts on change
      })
      .subscribe();

    return () => {
      readingsSub.unsubscribe();
      alertsSub.unsubscribe();
    };
  }, []);

  // 5. Sync farmer settings (Soil Type) to backend for AI logic
  useEffect(() => {
    if (user?.id) {
      fetch("/api/user-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, soil_type: soilType })
      }).catch(err => console.error("[Sync] Settings sync failed:", err));
    }
  }, [soilType, user?.id]);

  const getRecommendation = async (metrics: any) => {
    if (loadingRec) return;
    setLoadingRec(true);
    try {
      const rec = await getSoilRecommendations({ ...metrics, history: readings.slice(0, 5) });
      if (mountedRef.current) setRecommendation(rec);
    } catch (e) { console.error("Rec error:", e); }
    if (mountedRef.current) setLoadingRec(false);
  };

  const getMLPrediction = async (metrics: any) => {
    try {
      const response = await fetch("/api/predict/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moisture: metrics.moisture,
          temperature: metrics.temperature,
          ec: metrics.ec,
          hour_of_day: new Date().getHours(),
        })
      });
      const data = await response.json();
      if (mountedRef.current) setMlPrediction(data);
    } catch (error) {
      console.error("ML API Error:", error);
    }
  };

  const handleGetAdvice = async () => {
    if (loadingAdvisor) return;
    setLoadingAdvisor(true);
    const latest = readings[0] || {};
    const result = await getCropAdvisorAdvice({
      cropType,
      growthStage,
      irrigationMethod,
      soilType,
      region,
      moisture: latest.moisture ?? 0,
      temperature: latest.temperature ?? 0,
      ec: latest.ec ?? 0,
      classification: latest.classification ?? "Normal",
      confidence: latest.confidence ?? 0.5,
      forecast: latest.forecast,
      history: readings.slice(0, 20),
    });
    setAdvisorResult(result);
    setLoadingAdvisor(false);
  };

  const exportData = () => {
    const csvRows = [
      ["Timestamp", "Moisture (%)", "Temperature (C)", "EC (dS/m)", "Status"],
      ...readings.map(r => [
        r.created_at || "",
        r.moisture,
        r.temperature,
        r.ec,
        r.classification
      ])
    ];

    const csvContent = csvRows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `soil_data_${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resolveAlert = async (id: string) => {
    try {
      const { error } = await supabase
        .from("alerts")
        .update({ resolved: true })
        .eq("id", id);
      if (error) throw error;
    } catch (error) {
      console.error("Resolution Error:", error);
    }
  };

  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const element = document.getElementById("pdf-report-template");
      if (!element) return;
      
      element.style.position = "fixed";
      element.style.left = "0";
      element.style.top = "0";
      element.style.zIndex = "-1";
      element.style.opacity = "1";
      
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`CropPulse_Daily_Report_${format(new Date(), "yyyy-MM-dd")}.pdf`);
      
      element.style.position = "absolute";
      element.style.left = "-9999px";
      element.style.opacity = "0";
    } catch (error) {
      console.error("PDF generation failed:", error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const latestReading = readings[0] || { moisture: 0, temperature: 0, ec: 0, classification: "Waiting..." };
  
  const latestReadingTime = latestReading.created_at ? new Date(latestReading.created_at).getTime() : Date.now();
  const isOffline = readings.length > 0 && !isSimulating && (Date.now() - latestReadingTime > 5 * 60 * 1000);
  const isPestRisk = latestReading.moisture > 70 && latestReading.temperature > 28;

  const optimalRanges = useMemo(() => {
    return getOptimalRanges(cropType, growthStage);
  }, [cropType, growthStage]);

  const irrigation = useMemo(() => {
    return predictIrrigation(latestReading.moisture, weather);
  }, [latestReading, weather]);

  // Dynamic soil health score derived from real sensor values
  const soilHealthScore = useMemo(() => {
    if (readings.length === 0) return null;
    const { moisture, temperature, ec, is_anomaly, confidence, classification } = latestReading;
    if (moisture == null || temperature == null || ec == null) return null;

    // Score each parameter out of 100 based on deviation from ideal range
    function paramScore(val: number, low: number, high: number, absMin: number, absMax: number) {
      if (val >= low && val <= high) return 100;
      const deviation = val < low ? (low - val) : (val - high);
      const maxDeviation = val < low ? (low - absMin) : (absMax - high);
      return Math.max(0, Math.round(100 - (deviation / (maxDeviation || 1)) * 100));
    }

    const mScore = paramScore(moisture,    41, 80,  0,  100); // weight 35%
    const tScore = paramScore(temperature, 18, 24,  0,   60); // weight 30%
    const eScore = paramScore(ec,          0, 4.5,  0,   10); // weight 25%

    let score = Math.round(mScore * 0.35 + tScore * 0.30 + eScore * 0.25);

    // Anomaly penalty: -15 pts
    if (is_anomaly) score = Math.max(0, score - 15);

    // ML confidence boost: up to +10 pts if classification is Normal and confidence is high
    if (classification === "Normal" && confidence != null) {
      score = Math.min(100, score + Math.round(confidence * 10));
    }

    return Math.min(100, Math.max(0, score));
  }, [latestReading, readings.length]);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-natural-bg text-natural-text border-8 border-natural-border-muted overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 lg:h-screen sticky top-0 border-b lg:border-r border-natural-border bg-natural-bg z-20 flex flex-col shrink-0">
        <div className="p-8 border-b border-natural-border">
          <h1 className="text-3xl font-serif italic text-natural-primary tracking-tight">CropPulse</h1>
          <p className="text-[10px] uppercase tracking-widest font-bold opacity-40 mt-1">AI Soil Intel</p>
        </div>
        
        <nav className="p-4 flex gap-2 lg:gap-0 lg:flex-col lg:space-y-1 overflow-x-auto no-scrollbar flex-1 border-b lg:border-b-0 border-natural-border">
          <NavItem active={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon={<LayoutDashboard size={18} />} label="Home" />
          {isDevMode && <NavItem active={activeTab === "analytics"} onClick={() => setActiveTab("analytics")} icon={<BarChart3 size={18} />} label="Soil Insights" />}
          <NavItem active={activeTab === "alerts"} onClick={() => setActiveTab("alerts")} icon={<AlertTriangle size={18} />} label="Alerts" />
          <NavItem active={activeTab === "irrigation"} onClick={() => setActiveTab("irrigation")} icon={<Calendar size={18} />} label="Irrigation" />
          <NavItem active={activeTab === "reports"} onClick={() => setActiveTab("reports")} icon={<FileText size={18} />} label="Reports" />
          <NavItem active={activeTab === "history"} onClick={() => setActiveTab("history")} icon={<History size={18} />} label="History" />
          <NavItem active={activeTab === "live"} onClick={() => setActiveTab("live")} icon={<Wifi size={18} className={activeTab === "live" ? "animate-pulse" : ""} />} label="Live Sensors" />
          <NavItem active={activeTab === "advisor"} onClick={() => setActiveTab("advisor")} icon={<Leaf size={18} />} label="My Crops" />
          {isDevMode && <NavItem active={activeTab === "simulation"} onClick={() => setActiveTab("simulation")} icon={<Cpu size={18} />} label="Simulation" />}
        </nav>

        <div className="p-4 border-t border-natural-border bg-white bg-opacity-50">
          <div className="flex items-center gap-3 p-2 mb-4">
            <img src={user.user_metadata?.avatar_url || ""} alt={user.user_metadata?.full_name || ""} className="w-8 h-8 rounded-full border border-natural-border" />
            <div className="overflow-hidden">
               <p className="text-[10px] font-bold truncate">{user.user_metadata?.full_name || user.email}</p>
               <p className="text-[9px] opacity-40 truncate">Active Node</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-2 p-2 text-[10px] uppercase font-bold opacity-40 hover:opacity-100 hover:text-red-600 transition-all"
          >
            <LogOut size={14} />
            Disconnect
          </button>
        </div>

        {isDevMode && (
          <div className="p-6 border-t border-natural-border bg-natural-bg">
            <button 
              onClick={toggleSimulation}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm",
                isSimulating 
                  ? "bg-natural-accent text-white hover:bg-opacity-90" 
                  : "bg-natural-dark text-white hover:bg-opacity-90"
              )}
            >
              {isSimulating ? <Square size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
              {isSimulating ? "Stop Simulation" : "Deploy Simulator"}
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="p-8 border-b border-natural-border flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-serif italic text-natural-primary">Monitoring Hub</h2>
            <p className="text-sm uppercase tracking-widest font-semibold opacity-40">System Dashboard — 2026 Edition</p>
          </div>
          
          <div className="hidden sm:flex gap-4 items-center">
             <div className="px-4 py-2 bg-white border border-natural-border rounded-xl shadow-sm flex items-center gap-3">
               <div className={cn("w-2 h-2 rounded-full", !isOffline ? "bg-green-500" : "bg-red-500 animate-pulse")} />
               <div className="text-xs font-semibold uppercase tracking-wider">{!isOffline ? "System Active" : "Sensor Offline"}</div>
             </div>
             {isDevMode && (
               <div className="text-[10px] font-mono opacity-40 uppercase tracking-widest text-right">
                v1.0.4-dev<br/>UTC: {format(new Date(), "HH:mm")}
               </div>
             )}
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-8">
          <AnimatePresence>
            {activeTab === "overview" && (
              <motion.div 
                key="tab-overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Top Row: Health Dial, Soil Status/Pest, Weather Widget */}
                {readings.length === 0 && !isSimulating && !isDevMode && (
                  <div className="bg-natural-dark text-white p-8 rounded-3xl border border-natural-border shadow-sm flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left mb-6">
                    <div className="w-16 h-16 bg-white bg-opacity-10 rounded-full flex items-center justify-center shrink-0">
                      <WifiOff size={24} className="opacity-80" />
                    </div>
                    <div>
                      <h3 className="text-xl font-serif mb-2">Connect Your Sensor</h3>
                      <p className="text-[11px] font-mono opacity-70 max-w-lg">
                        CropPulse is waiting for data. Power on your IoT node and ensure it has network access to begin streaming live soil analytics.
                      </p>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <SoilHealthDial
                    score={soilHealthScore}
                    moisture={latestReading.moisture}
                    temperature={latestReading.temperature}
                    ec={latestReading.ec}
                    isAnomaly={latestReading.is_anomaly}
                    classification={latestReading.classification}
                    ranges={optimalRanges}
                  />

                  <div className="bg-white p-6 rounded-3xl border border-natural-border shadow-sm flex flex-col justify-between hover:scale-[1.02] transition-transform cursor-default relative overflow-hidden">
                    {isOffline && (
                      <div className="absolute top-0 left-0 w-full bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest text-center py-1 flex items-center justify-center gap-2">
                        <WifiOff size={10} /> Sensor Offline
                      </div>
                    )}
                    <div className={cn("text-[10px] font-bold uppercase tracking-widest mb-3 opacity-40", isOffline && "mt-4")}>Current Soil Condition</div>
                    
                    <div className="flex-1">
                      <span className={cn("inline-block px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider mb-3", getStressBadgeClass(latestReading.classification))}>
                        {latestReading.classification || "Unknown"}
                      </span>
                      {latestReading.confidence != null && (
                        <div className="space-y-1 mb-4">
                          <div className="flex justify-between text-[9px] font-mono opacity-40">
                            <span>Reliability</span>
                            <span className="font-bold opacity-100">{(latestReading.confidence*100).toFixed(0)}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-natural-border rounded-full overflow-hidden">
                            <div className="h-full bg-natural-accent transition-all duration-700" style={{width:`${latestReading.confidence*100}%`}}/>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {isPestRisk && (
                      <div className="mt-2 bg-red-50 text-red-700 border border-red-200 rounded-xl p-3 flex items-center gap-3">
                        <div className="bg-red-100 p-2 rounded-lg text-red-600"><Bug size={16} /></div>
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-widest">Pest & Disease Risk</div>
                          <div className="text-[9px] opacity-70 font-mono">High moisture + temp combination</div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-natural-border shadow-sm flex flex-col justify-between">
                     <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                           <Cloud className="text-natural-accent" size={18} />
                           <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Weather & Irrigation</span>
                        </div>
                        {weather ? (
                          <span className="text-[10px] font-mono font-bold bg-natural-accent bg-opacity-10 text-natural-accent py-1 px-2 rounded-lg">{weather.condition}</span>
                        ) : (
                          <span className="text-[10px] font-mono opacity-20">API Required</span>
                        )}
                     </div>
                     <div className="flex-1 flex flex-col justify-end">
                        <h4 className={cn("text-xl font-serif italic mb-1", irrigation.status === "Irrigate Now" ? "text-red-600" : "text-natural-primary")}>
                           {irrigation.status}
                        </h4>
                        <p className="text-[10px] font-mono opacity-40 uppercase leading-snug mb-2">
                           {irrigation.reason}
                        </p>
                        {weather && (
                          <div className="pt-3 border-t border-natural-border grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-[9px] font-bold uppercase tracking-widest opacity-40">Today's Temp</div>
                              <div className="text-sm font-mono font-bold mt-1">{weather.temp.toFixed(1)}°C</div>
                            </div>
                            <div>
                              <div className="text-[9px] font-bold uppercase tracking-widest opacity-40">Rain Probability</div>
                              <div className="text-sm font-mono font-bold mt-1">
                                {typeof weather.pop === 'number' && !isNaN(weather.pop) ? `${(weather.pop * 100).toFixed(0)}%` : 'Unavailable'}
                              </div>
                            </div>
                          </div>
                        )}
                     </div>
                  </div>
                </div>

                {/* Metric Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard 
                    label="Moisture" 
                    value={`${latestReading.moisture}%`} 
                    icon={<Droplets />} 
                    variant="primary" 
                    trendDirection={trend?.direction} 
                    trendRate={trend?.slope ? trend.slope * 60 : undefined} 
                    optimalRange={optimalRanges.moisture}
                    currentRawValue={latestReading.moisture}
                    maxScale={100}
                  />
                  <StatCard 
                    label="Temperature" 
                    value={`${latestReading.temperature}°C`} 
                    icon={<Thermometer />} 
                    variant="primary" 
                    trendDirection={trend?.tempDirection} 
                    trendRate={undefined} // don't have temp rate readily available from trend object, but direction is there
                    optimalRange={optimalRanges.temp}
                    currentRawValue={latestReading.temperature}
                    maxScale={50}
                  />
                  <StatCard 
                    label="Salt Level" 
                    value={`${latestReading.ec} dS/m`} 
                    icon={<Activity />} 
                    variant="accent" 
                    trendDirection={trend?.ecDirection} 
                    trendRate={undefined}
                    optimalRange={optimalRanges.ec}
                    currentRawValue={latestReading.ec}
                    maxScale={5}
                  />
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
                  {/* Chart Panes */}
                  <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-8 rounded-3xl border border-natural-border shadow-sm">
                      <div className="flex justify-between items-center mb-8">
                        <h3 className="font-serif text-lg">Soil Activity Stream</h3>
                        <div className="flex gap-4">
                           <div className="flex items-center gap-2"><span className="w-3 h-3 bg-natural-primary rounded-full" /><span className="text-[10px] font-bold opacity-40 uppercase">Moisture</span></div>
                           <div className="flex items-center gap-2"><span className="w-3 h-3 bg-natural-accent rounded-full" /><span className="text-[10px] font-bold opacity-40 uppercase">Temp</span></div>
                        </div>
                      </div>
                      <div className="h-[300px] w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={[...readings].reverse()}>
                               <defs>
                                  <linearGradient id="colorMoist" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#5A5A40" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#5A5A40" stopOpacity={0}/>
                                  </linearGradient>
                               </defs>
                               <CartesianGrid strokeDasharray="3 3" stroke="#DEDCCF" vertical={false} />
                               <XAxis 
                                 dataKey="chartTime" 
                                 tickFormatter={(t) => format(new Date(t), "HH:mm")} 
                                 stroke="#3E4231" 
                                 fontSize={10} 
                                 tickLine={false}
                                 axisLine={false}
                                 minTickGap={30}
                               />
                               <YAxis stroke="#3E4231" fontSize={10} tickLine={false} axisLine={false} />
                               <Tooltip 
                                 contentStyle={{ backgroundColor: "#3E4231", border: "none", borderRadius: "12px", color: "#FDFCF8", fontFamily: "monospace", fontSize: "10px" }}
                                 itemStyle={{ color: "#FDFCF8" }}
                                 labelFormatter={(t) => format(new Date(t), "HH:mm:ss")}
                               />
                               <Area type="monotone" dataKey="moisture" stroke="#5A5A40" fillOpacity={1} fill="url(#colorMoist)" strokeWidth={2} />
                               <Area type="monotone" dataKey="temperature" stroke="#D27D56" fill="none" strokeWidth={1} strokeDasharray="4 4" />
                            </AreaChart>
                         </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-natural-border-muted p-8 rounded-3xl">
                       <h3 className="text-xs uppercase font-bold opacity-40 mb-6 tracking-widest">Live Event Log</h3>
                       <div className="space-y-4">
                          {readings.slice(0, 4).map((r, i) => (
                            <div key={r.id || i} className="bg-white rounded-2xl p-4 shadow-sm border border-natural-border flex items-center justify-between transition-transform hover:scale-[1.01]">
                              <div className="flex items-center gap-4">
                                <div className="text-[10px] font-bold text-natural-accent uppercase py-1 px-2 bg-natural-accent bg-opacity-10 rounded-lg">
                                  {r.classification}
                                </div>
                                <p className="text-xs font-medium opacity-80">
                                  Sensors detected {(r.classification || "unknown").toLowerCase()} patterns.
                                </p>
                              </div>
                              <span className="font-mono text-[9px] opacity-40 uppercase">{r.timestamp ? format(r.timestamp.toDate(), "HH:mm:ss") : "Now"}</span>
                            </div>
                          ))}
                          {readings.length === 0 && (
                            <p className="font-mono text-[10px] opacity-40 uppercase text-center py-10 italic tracking-widest">Waiting for data stream...</p>
                          )}
                       </div>
                    </div>
                  </div>

                  {/* Recommendations Sidebar */}
                  <div className="space-y-6">
                    {isDevMode && (
                      <div className="bg-white p-8 rounded-3xl border border-natural-border shadow-sm">
                        <h3 className="text-xs uppercase font-bold opacity-40 mb-6 tracking-widest text-natural-accent">Scenario Injection</h3>
                        <div className="grid grid-cols-1 gap-2">
                          <SimulationButton onClick={() => triggerScenario("Salinity")} label="Inject Salinity" color="bg-natural-accent" />
                          <SimulationButton onClick={() => triggerScenario("Drought")} label="Forced Drought" color="bg-natural-dark" />
                          <SimulationButton onClick={() => triggerScenario("Fertilizer")} label="Fertilizer Spike" color="bg-natural-primary" />
                        </div>
                        <p className="text-[9px] font-mono opacity-40 mt-4 leading-tight">These buttons manually inject extreme sensor values into the AI engine to test classification.</p>
                      </div>
                    )}

                    <div className="bg-natural-primary p-8 rounded-3xl text-white relative overflow-hidden">
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-6">
                          <Info size={16} className="text-natural-accent" />
                          <h3 className="text-xs uppercase font-bold tracking-widest opacity-60">Agronomic Analysis</h3>
                        </div>
                        <div className={cn("space-y-4", loadingRec && "animate-pulse")}>
                          <p className="text-lg font-serif italic leading-relaxed min-h-[60px]">
                            {loadingRec ? "Processing multi-layer soil datasets..." : recommendation?.immediateAction || "Awaiting stable data stream for AI analysis."}
                          </p>
                          
                          {!loadingRec && recommendation?.irrigationPrescription && (
                            <div className="space-y-6 pt-4 border-t border-white border-opacity-10">
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white bg-opacity-10 p-4 rounded-2xl">
                                  <span className="text-[9px] uppercase font-bold opacity-60 block mb-1">Irrigation Volume</span>
                                  <span className="text-xl font-serif">{recommendation.irrigationPrescription.volumeLitersPerSqM} L/m²</span>
                                </div>
                                <div className="bg-white bg-opacity-10 p-4 rounded-2xl">
                                  <span className="text-[9px] uppercase font-bold opacity-60 block mb-1">Timing</span>
                                  <span className="text-sm font-bold">{recommendation.irrigationPrescription.timing}</span>
                                </div>
                              </div>

                              <div className="flex gap-4 opacity-80 text-[10px] font-mono">
                                <div><span className="opacity-50">Method:</span> {recommendation.irrigationPrescription.method}</div>
                                <div><span className="opacity-50">Duration:</span> {recommendation.irrigationPrescription.duration}</div>
                              </div>

                              <div className="pt-2">
                                <span className="text-[9px] uppercase font-bold opacity-40 block mb-2">48-Hour Plan</span>
                                <ul className="space-y-2">
                                  {recommendation.fortyEightHourPlan?.map((step: string, i: number) => (
                                    <li key={i} className="text-[11px] flex items-start gap-2">
                                      <span className="w-1 h-1 bg-natural-accent rounded-full mt-1.5 shrink-0" />
                                      <span className="opacity-90">{step}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div className="pt-2">
                                <span className="text-[9px] uppercase font-bold opacity-40 block mb-1">ML Nutrient Recommender</span>
                                {latestReading.fertilizer ? (
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-bold text-natural-accent">{latestReading.fertilizer.fertilizer_recommendation}</p>
                                    <p className="text-[9px] font-mono opacity-60">{latestReading.fertilizer.confidence}% Match</p>
                                  </div>
                                ) : (
                                  <p className="text-[11px] opacity-80 leading-relaxed font-mono">Analyzing nutrient density...</p>
                                )}
                              </div>

                              <div className="bg-red-500 bg-opacity-20 border border-red-500 border-opacity-30 p-3 rounded-xl mt-2">
                                <span className="text-[9px] text-red-200 uppercase font-bold block mb-1">Risk if Untreated</span>
                                <p className="text-[11px] text-red-100">{recommendation.riskIfUntreated}</p>
                              </div>

                              <div className="flex justify-between items-center pt-2 border-t border-white border-opacity-10">
                                <span className="text-[9px] uppercase font-bold opacity-40">Decision Confidence</span>
                                <span className="text-[10px] font-mono font-bold text-natural-accent">{recommendation.confidencePercent}%</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="absolute -right-4 -bottom-4 opacity-5 font-serif text-9xl pointer-events-none">AI</div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl border border-natural-border shadow-sm">
                      <h3 className="text-xs uppercase font-bold opacity-40 mb-6 tracking-widest">Priority Alerts</h3>
                      <div className="space-y-4">
                        {alerts.filter(a => !a.resolved).slice(0, 4).map((a, i) => (
                          <div key={a.id || i} className={cn(
                            "p-4 border rounded-2xl group relative transition-all",
                            a.type === "Critical" ? "bg-red-50 border-red-200" : 
                            a.type === "Warning" ? "bg-orange-50 border-orange-200" : 
                            "bg-blue-50 border-blue-200"
                          )}>
                            <div className="flex items-center justify-between gap-2 mb-2">
                               <div className={cn(
                                 "flex items-center gap-2 font-extrabold uppercase tracking-wider text-[9px]",
                                 a.type === "Critical" ? "text-red-700" : 
                                 a.type === "Warning" ? "text-orange-700" : 
                                 "text-blue-700"
                               )}>
                                 <AlertTriangle size={12} />
                                 <span>{a.type} Priority</span>
                               </div>
                               <button 
                                 onClick={() => resolveAlert(a.id)}
                                 className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-bold uppercase tracking-widest text-natural-primary hover:underline"
                               >
                                 Dismiss
                               </button>
                            </div>
                            <p className="text-[13px] font-serif leading-snug">{a.message}</p>
                            <div className="mt-2 text-[8px] font-mono opacity-40 uppercase">
                               Node {i+1} // {a.timestamp ? format(a.timestamp.toDate(), "HH:mm") : "Realtime"}
                            </div>
                          </div>
                        ))}
                        {alerts.filter(a => !a.resolved).length === 0 && (
                          <div className="text-center py-12">
                             <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Zap size={20} className="text-green-600 opacity-20" />
                             </div>
                             <p className="text-[10px] font-mono opacity-40 uppercase tracking-widest italic">All systems nominal</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "analytics" && (
              <motion.div 
                key="tab-analytics"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8 pb-32"
              >
                <div className="bg-white p-8 rounded-3xl border border-natural-border shadow-sm">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xs uppercase font-bold opacity-40 tracking-widest">Crop Health Analysis</h3>
                    <div className="px-3 py-1 bg-green-100 text-green-700 text-[9px] font-bold rounded-full uppercase tracking-widest">Random Forest Active</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-4">
                      <p className="text-sm italic font-serif leading-relaxed">
                        {mlPrediction ? (
                          `Based on current soil moisture (${latestReading.moisture}%) and thermal stability (${latestReading.temperature}°C), the Random Forest model classifies this soil as "${mlPrediction.className || "Unknown"}".`
                        ) : (
                          "Model is analyzing soil profile for classification..."
                        )}
                        {mlPrediction?.isAnomaly && (
                          <span className="block mt-2 text-red-600 font-bold text-[10px] uppercase">
                            ⚠ Anomaly detected (score: {mlPrediction.anomalyScore?.toFixed(2)})
                          </span>
                        )}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {mlPrediction?.probabilities && Object.entries(mlPrediction.probabilities)
                          .sort(([,a]: any, [,b]: any) => b - a)
                          .slice(0, 3)
                          .map(([name, prob]: [string, any]) => (
                          <div key={name} className={cn("px-4 py-2 border rounded-xl text-[10px] font-bold uppercase", getStressBadgeClass(name))}>
                            {name}: {(prob * 100).toFixed(0)}%
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="p-6 bg-natural-bg border border-natural-border rounded-2xl">
                      <div className="flex items-center justify-between mb-4">
                         <span className="text-[10px] font-bold opacity-40 uppercase">Confidence Score</span>
                         <span className="text-lg font-mono font-bold text-natural-accent">
                           {mlPrediction ? `${(mlPrediction.confidence * 100).toFixed(1)}%` : "---"}
                         </span>
                      </div>
                      <div className="w-full h-2 bg-natural-border-muted rounded-full overflow-hidden">
                        <div className="h-full bg-natural-accent transition-all duration-1000" style={{ width: mlPrediction ? `${mlPrediction.confidence * 100}%` : '0%' }}></div>
                      </div>
                      <p className="mt-4 text-[9px] font-mono opacity-40 uppercase leading-snug">
                        Classification based on 100 decision trees. Class: {mlPrediction?.className || "pending"}.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-3xl border border-natural-border shadow-sm">
                    <h3 className="text-xs uppercase font-bold opacity-40 mb-6 tracking-widest">Soil Moisture Trends</h3>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={[...readings].reverse()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#DEDCCF" vertical={false} />
                          <XAxis dataKey="displayTime" fontSize={10} hide />
                          <YAxis fontSize={10} />
                          <Tooltip />
                          <Line type="monotone" dataKey="moisture" stroke="#5A5A40" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-white p-8 rounded-3xl border border-natural-border shadow-sm">
                    <h3 className="text-xs uppercase font-bold opacity-40 mb-6 tracking-widest">Salinity (EC) Distribution</h3>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={[...readings].reverse()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#DEDCCF" vertical={false} />
                          <XAxis dataKey="displayTime" fontSize={10} hide />
                          <YAxis fontSize={10} />
                          <Tooltip />
                          <Area type="monotone" dataKey="ec" fill="#D27D56" stroke="#D27D56" fillOpacity={0.1} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="bg-natural-dark p-10 rounded-3xl text-white">
                  <h3 className="text-2xl font-serif italic mb-6">Today's Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <AvgMetric label="Mean Moisture" value={`${(readings.reduce((acc, curr) => acc + curr.moisture, 0) / (readings.length || 1)).toFixed(1)}%`} />
                    <AvgMetric label="Mean Temp" value={`${(readings.reduce((acc, curr) => acc + curr.temperature, 0) / (readings.length || 1)).toFixed(1)}°C`} />
                    <AvgMetric label="Mean Salinity" value={`${(readings.reduce((acc, curr) => acc + curr.ec, 0) / (readings.length || 1)).toFixed(2)} dS/m`} />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "alerts" && (
              <motion.div 
                key="tab-alerts"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8 pb-32"
              >
                <div className="bg-white rounded-3xl border border-natural-border overflow-hidden shadow-sm">
                  <div className="p-8 border-b border-natural-border bg-[#F8F7F2]">
                    <h3 className="text-2xl font-serif italic text-natural-primary">Active Stress Alerts</h3>
                    <p className="text-[10px] font-mono opacity-60 mt-1 uppercase">Prioritized list of agronomic issues requiring attention</p>
                  </div>
                  <div className="p-8">
                    <div className="space-y-4">
                      {alerts.filter(a => !a.resolved).map((a, i) => (
                        <div key={a.id || i} className={cn(
                          "p-6 border rounded-2xl relative transition-all",
                          a.type === "Critical" ? "bg-red-50 border-red-200" : 
                          a.type === "Warning" ? "bg-orange-50 border-orange-200" : 
                          "bg-blue-50 border-blue-200"
                        )}>
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div>
                              <div className={cn(
                                "flex items-center gap-2 font-extrabold uppercase tracking-wider text-[11px] mb-2",
                                a.type === "Critical" ? "text-red-700" : 
                                a.type === "Warning" ? "text-orange-700" : 
                                "text-blue-700"
                              )}>
                                <AlertTriangle size={14} />
                                <span>{a.type} Priority</span>
                              </div>
                              <p className="text-sm font-serif leading-snug">{a.message}</p>
                              <div className="mt-4 text-[9px] font-mono opacity-60 uppercase tracking-widest">
                                Timestamp: {a.timestamp ? format(a.timestamp.toDate(), "yyyy-MM-dd HH:mm") : "Realtime"}
                              </div>
                            </div>
                            <button 
                              onClick={() => resolveAlert(a.id)}
                              className="shrink-0 px-4 py-2 bg-white border border-natural-border rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-sm hover:bg-natural-bg active:scale-95 transition-all"
                            >
                              Resolve Issue
                            </button>
                          </div>
                        </div>
                      ))}
                      {alerts.filter(a => !a.resolved).length === 0 && (
                        <div className="text-center py-20 text-[10px] font-mono uppercase tracking-[0.2em] flex flex-col items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
                             <CheckCircle2 size={32} className="text-green-500" />
                          </div>
                          <span className="opacity-40">Your soil is healthy — no issues detected today</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {alerts.filter(a => a.resolved).length > 0 && (
                  <div className="bg-white rounded-3xl border border-natural-border overflow-hidden shadow-sm opacity-60 hover:opacity-100 transition-opacity">
                    <div className="p-6 border-b border-natural-border bg-natural-bg">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-natural-primary">Resolution History</h3>
                    </div>
                    <div className="p-6">
                      <div className="space-y-2">
                        {alerts.filter(a => a.resolved).map((a, i) => (
                          <div key={a.id || i} className="flex justify-between items-center p-3 border-b border-natural-border border-opacity-30 last:border-0">
                            <div className="flex items-center gap-3">
                              <CheckCircle2 size={14} className="text-green-600" />
                              <span className="text-xs font-serif line-through opacity-70">{a.message}</span>
                            </div>
                            <span className="text-[9px] font-mono opacity-40 uppercase">
                              {a.timestamp ? format(a.timestamp.toDate(), "MMM dd, HH:mm") : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "reports" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-32">
                <div className="bg-white rounded-3xl border border-natural-border overflow-hidden shadow-sm">
                  <div className="p-8 border-b border-natural-border bg-[#F8F7F2] flex justify-between items-center">
                    <div>
                      <h3 className="text-2xl font-serif italic text-natural-primary">Daily Farm Report</h3>
                      <p className="text-[10px] font-mono opacity-60 mt-1 uppercase">Automated summary of soil health, ML advisories, and active alerts</p>
                    </div>
                  </div>
                  <div className="p-8 space-y-8">
                    <div className="p-12 border border-natural-border bg-natural-bg rounded-2xl flex flex-col items-center justify-center text-center">
                       <FileText size={48} className="text-natural-accent opacity-20 mb-6" />
                       <h4 className="text-lg font-bold font-serif mb-2">Generate PDF Report</h4>
                       <p className="text-[11px] font-mono opacity-60 max-w-sm mb-6 leading-relaxed">
                         Compiles sensor data, current AI recommendations, and pending alerts into a structured document for the selected date.
                       </p>
                       <div className="flex flex-col sm:flex-row items-center gap-4">
                         <div className="relative">
                           <Calendar size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 opacity-40" />
                           <input 
                             type="date" 
                             value={reportDate}
                             onChange={(e) => setReportDate(e.target.value)}
                             max={new Date().toISOString().split('T')[0]}
                             className="pl-9 pr-4 py-3 border border-natural-border rounded-xl text-sm font-bold bg-white focus:outline-none focus:ring-1 focus:ring-natural-accent"
                           />
                         </div>
                         <button 
                           onClick={handleGeneratePDF}
                           disabled={isGeneratingPDF || readings.length === 0}
                           className="flex items-center justify-center gap-3 px-6 py-3 bg-natural-primary text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-opacity-90 active:scale-95 transition-all shadow-md disabled:opacity-50"
                         >
                           {isGeneratingPDF ? <RefreshCcw className="animate-spin" size={16} /> : <Download size={16} />}
                           {isGeneratingPDF ? "Compiling..." : "Download Report"}
                         </button>
                       </div>
                       {readings.length === 0 && (
                         <p className="text-[10px] text-red-500 mt-4 font-bold uppercase tracking-widest">No data recorded for this date yet</p>
                       )}
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl">
                        <h5 className="text-[10px] font-bold uppercase tracking-widest text-blue-800 mb-2">Automated Delivery</h5>
                        <p className="text-[11px] font-mono text-blue-900 opacity-70 leading-relaxed">
                          Reports are also automatically generated at 06:00 AM daily and emailed to registered stakeholders.
                        </p>
                      </div>
                      <div className="bg-natural-bg border border-natural-border p-6 rounded-2xl">
                        <h5 className="text-[10px] font-bold uppercase tracking-widest text-natural-text opacity-60 mb-2">Report Contents</h5>
                        <ul className="text-[10px] font-mono opacity-60 space-y-1 list-disc pl-4">
                          <li>24-hour metric averages (Moisture, Temp, EC)</li>
                          <li>Current ML Crop Classification</li>
                          <li>Irrigation prescriptive volume and timing</li>
                          <li>Unresolved Critical/Warning alerts</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* HIDDEN PDF TEMPLATE */}
                <div id="pdf-report-template" className="absolute left-[-9999px] top-0 opacity-0 bg-white w-[800px] p-12 font-sans text-natural-text">
                  <div className="border-b-4 border-natural-primary pb-6 mb-8 flex justify-between items-end">
                    <div>
                      <h1 className="text-4xl font-serif italic text-natural-primary">CropPulse</h1>
                      <p className="text-[10px] uppercase tracking-widest font-bold opacity-60 mt-1">Daily Farm Intelligence Report</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold uppercase tracking-widest">{format(new Date(), "MMMM dd, yyyy")}</p>
                      <p className="text-[10px] font-mono opacity-60 mt-1">Generated: {format(new Date(), "HH:mm:ss")}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6 mb-10">
                    <div className="bg-[#F8F7F2] p-4 rounded-xl border border-natural-border">
                      <p className="text-[8px] uppercase font-bold opacity-40 mb-1">Current Moisture</p>
                      <p className="text-2xl font-serif">{latestReading.moisture}%</p>
                    </div>
                    <div className="bg-[#F8F7F2] p-4 rounded-xl border border-natural-border">
                      <p className="text-[8px] uppercase font-bold opacity-40 mb-1">Current Temperature</p>
                      <p className="text-2xl font-serif">{latestReading.temperature}°C</p>
                    </div>
                    <div className="bg-[#F8F7F2] p-4 rounded-xl border border-natural-border">
                      <p className="text-[8px] uppercase font-bold opacity-40 mb-1">Current EC</p>
                      <p className="text-2xl font-serif">{latestReading.ec} dS/m</p>
                    </div>
                  </div>

                  <div className="mb-10">
                    <h2 className="text-lg font-bold uppercase tracking-widest border-b border-natural-border pb-2 mb-4">ML & AI Advisory</h2>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase opacity-40 mb-1">Soil Status</p>
                        <p className="text-xl font-serif">{latestReading.classification}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase opacity-40 mb-1">Crop Config</p>
                        <p className="text-sm font-mono">{cropType} // {growthStage}</p>
                      </div>
                    </div>
                    <div className="bg-natural-bg p-4 border border-natural-border rounded-xl">
                      <p className="text-[10px] font-bold uppercase opacity-40 mb-2">Irrigation Protocol</p>
                      <p className="text-sm">{irrigation.status}: {irrigation.reason}</p>
                      {advisorResult && (
                         <p className="text-xs italic mt-2 opacity-80 border-t border-natural-border pt-2">
                           Gemini AI: "{advisorResult.immediateAction}"
                         </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h2 className="text-lg font-bold uppercase tracking-widest border-b border-natural-border pb-2 mb-4">Active Priorities</h2>
                    {alerts.filter(a => !a.resolved).length > 0 ? (
                      <div className="space-y-3">
                        {alerts.filter(a => !a.resolved).map((a, i) => (
                          <div key={i} className="flex gap-4 border-l-4 border-red-500 pl-4 py-1">
                            <span className="text-[10px] font-bold text-red-600 uppercase mt-0.5 w-16">{a.type}</span>
                            <span className="text-sm font-serif">{a.message}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs font-mono opacity-40">No unresolved alerts or critical issues.</p>
                    )}
                  </div>

                  <div className="mt-16 pt-6 border-t border-natural-border text-center">
                     <p className="text-[8px] font-mono opacity-40 uppercase tracking-widest">End of Report • CropPulse AI Backend v1.0.4</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "irrigation" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-32">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-3xl border border-natural-border overflow-hidden shadow-sm">
                      <div className="p-8 border-b border-natural-border bg-[#F8F7F2] flex justify-between items-center">
                        <div>
                          <h3 className="text-2xl font-serif italic text-natural-primary">Weekly Schedule</h3>
                          <p className="text-[10px] font-mono opacity-60 mt-1 uppercase">Actual vs Recommended Irrigation Windows</p>
                        </div>
                        <button className="px-4 py-2 bg-natural-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-opacity-90 active:scale-95 transition-all shadow-md">
                          + Log Event
                        </button>
                      </div>
                      <div className="p-8">
                        <div className="grid grid-cols-7 gap-2">
                          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => {
                            const isToday = i === new Date().getDay() - 1 || (new Date().getDay() === 0 && i === 6);
                            const hasPastLog = i === 1; // mock
                            const hasRecommended = i === 4; // mock
                            
                            return (
                              <div key={day} className={cn(
                                "border rounded-2xl p-3 h-32 flex flex-col relative transition-all",
                                isToday ? "border-natural-accent bg-natural-accent bg-opacity-5" : "border-natural-border bg-white"
                              )}>
                                <span className={cn(
                                  "text-[10px] font-bold uppercase tracking-widest",
                                  isToday ? "text-natural-accent" : "opacity-40"
                                )}>{day}</span>
                                
                                <div className="mt-auto space-y-2">
                                  {hasPastLog && (
                                    <div className="bg-blue-50 border border-blue-200 text-blue-700 text-[8px] font-mono p-1.5 rounded-lg">
                                      <div className="font-bold uppercase mb-0.5">Logged</div>
                                      15L (45m)
                                    </div>
                                  )}
                                  {hasRecommended && (
                                    <div className="bg-green-50 border border-green-200 text-green-700 text-[8px] font-mono p-1.5 rounded-lg border-dashed">
                                      <div className="font-bold uppercase mb-0.5">Predicted</div>
                                      Need ~12L
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-8">
                    <div className="bg-white p-8 rounded-3xl border border-natural-border shadow-sm">
                      <h3 className="text-xs uppercase font-bold opacity-40 mb-6 tracking-widest">Recent Logs</h3>
                      <div className="space-y-4">
                        {irrigationLogs.map((log, i) => (
                          <div key={i} className="flex justify-between items-center p-4 border border-natural-border rounded-xl">
                            <div>
                              <div className="text-[11px] font-bold uppercase tracking-widest">{format(log.date, "MMM dd")}</div>
                              <div className="text-[9px] font-mono opacity-50">{log.method}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-serif font-bold text-natural-accent">{log.volume} L</div>
                              <div className="text-[9px] font-mono opacity-50">{log.duration} min</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-start gap-4 text-blue-800">
                      <Info size={20} className="shrink-0 mt-0.5" />
                      <p className="text-[10px] uppercase font-mono leading-relaxed">
                        <strong>Auto-Tracking:</strong> The system automatically monitors soil moisture spikes. Manually log events to calibrate the exact volume (Liters) applied for accurate ML yield forecasting.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "history" && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8 pb-32"
              >
                <div className="bg-white rounded-3xl border border-natural-border overflow-hidden shadow-sm">
                   <div className="p-8 border-b border-natural-border bg-[#F8F7F2] flex justify-between items-center">
                      <div>
                        <h3 className="text-2xl font-serif italic">Sensor Archives</h3>
                        <p className="text-[10px] uppercase font-bold opacity-40 tracking-widest">Comprehensive dataset of soil health events</p>
                      </div>
                       <div className="flex items-center gap-4">
                          <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 opacity-40" />
                            <input 
                              type="text" 
                              placeholder="Search metrics..." 
                              value={historySearch}
                              onChange={(e) => setHistorySearch(e.target.value)}
                              className="pl-9 pr-4 py-2 border border-natural-border rounded-xl text-[10px] uppercase font-bold tracking-widest bg-white focus:outline-none focus:ring-1 focus:ring-natural-accent w-48"
                            />
                          </div>
                          <div className="relative">
                            <Filter size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 opacity-40" />
                            <select 
                              value={historyFilter}
                              onChange={(e) => setHistoryFilter(e.target.value)}
                              className="pl-9 pr-8 py-2 border border-natural-border rounded-xl text-[10px] uppercase font-bold tracking-widest bg-white focus:outline-none focus:ring-1 focus:ring-natural-accent appearance-none cursor-pointer"
                            >
                              <option value="All">All Classifications</option>
                              <option value="Normal">Normal</option>
                              <option value="Water Deficiency">Water Deficiency</option>
                              <option value="Salinity Stress">Salinity Stress</option>
                              <option value="Over-Fertilization">Over-Fertilization</option>
                              <option value="Nutrient Imbalance">Nutrient Imbalance</option>
                            </select>
                          </div>
                          <button 
                            onClick={exportData}
                            className="flex items-center gap-2 px-4 py-2 bg-natural-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-opacity-90 active:scale-95 transition-all shadow-md"
                          >
                            <Download size={14} />
                            Export
                          </button>
                       </div>
                    </div>
                    <div className="overflow-x-auto">
                       <table className="w-full text-left border-collapse">
                         <thead>
                           <tr className="border-b border-natural-border bg-white italic font-serif">
                             <th className="p-4 pl-8 text-xs font-semibold">Date & Time</th>
                             <th className="p-4 text-xs font-semibold">Classification</th>
                             <th className="p-4 text-xs font-semibold">Metrics (M/T/EC)</th>
                           </tr>
                         </thead>
                         <tbody>
                           {readings
                             .filter(r => historyFilter === "All" || r.classification === historyFilter)
                             .filter(r => historySearch === "" || `${r.moisture} ${r.temperature} ${r.ec}`.includes(historySearch))
                             .map((r, i) => (
                             <tr key={r.id || i} className="border-b border-natural-border border-opacity-30 hover:bg-natural-bg transition-colors">
                               <td className="p-4 pl-8 font-mono text-[10px] opacity-60 uppercase">{r.timestamp ? format(r.timestamp.toDate(), "yyyy-MM-dd // HH:mm:ss") : "Queued"}</td>
                              <td className="p-4">
                                <span className={cn(
                                  "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md",
                                  r.classification === "Normal" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                )}>
                                  {r.classification}
                                </span>
                              </td>
                              <td className="p-4 font-mono text-[10px] opacity-60">
                                {r.moisture}% moisture / {r.temperature}°C / {r.ec} dS/m
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === "live" && <IoTSensorPanel />}
          {activeTab === "advisor" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-32">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-3xl border border-natural-border shadow-sm space-y-5">
                    <div>
                      <h3 className="text-2xl font-serif italic">Crop Advisor</h3>
                      <p className="text-[10px] uppercase font-bold opacity-40 tracking-widest mt-1">Gemini AI + ML Classification Context</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase opacity-40 tracking-widest block mb-2">Crop Type</label>
                      <select value={cropType} onChange={e => setCropType(e.target.value)} className="w-full p-3 border border-natural-border rounded-xl text-sm bg-natural-bg focus:outline-none focus:ring-2 focus:ring-natural-accent">
                        {["Tomatoes","Rice","Wheat","Corn","Cotton","Potatoes","Soybeans","Sugarcane"].map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold uppercase opacity-40 tracking-widest block mb-2">Growth Stage</label>
                        <select value={growthStage} onChange={e => setGrowthStage(e.target.value)} className="w-full p-3 border border-natural-border rounded-xl text-sm bg-natural-bg focus:outline-none focus:ring-2 focus:ring-natural-accent">
                          {["Germination","Seedling","Vegetative","Flowering","Fruiting","Harvest"].map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase opacity-40 tracking-widest block mb-2">Irrigation</label>
                        <select value={irrigationMethod} onChange={e => setIrrigationMethod(e.target.value)} className="w-full p-3 border border-natural-border rounded-xl text-sm bg-natural-bg focus:outline-none focus:ring-2 focus:ring-natural-accent">
                          {["Drip","Sprinkler","Flood","Manual"].map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold uppercase opacity-40 tracking-widest block mb-2">Soil Type</label>
                        <select value={soilType} onChange={e => setSoilType(e.target.value)} className="w-full p-3 border border-natural-border rounded-xl text-sm bg-natural-bg focus:outline-none focus:ring-2 focus:ring-natural-accent">
                          {["Loamy","Clay","Sandy","Peaty","Saline"].map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase opacity-40 tracking-widest block mb-2">Climate Type</label>
                        <select value={region} onChange={e => setRegion(e.target.value)} className="w-full p-3 border border-natural-border rounded-xl text-sm bg-natural-bg focus:outline-none focus:ring-2 focus:ring-natural-accent">
                          <option value="Tropical">Tropical</option>
                          <option value="Arid">Arid (Dry)</option>
                          <option value="Temperate">Temperate</option>
                        </select>
                      </div>
                    </div>
                    <div className="p-4 bg-natural-bg rounded-xl border border-natural-border">
                      <p className="text-[9px] font-bold uppercase opacity-40 tracking-widest mb-1">Current Soil Condition</p>
                      <p className={cn("text-sm font-bold mt-1", getStressTextColor(latestReading.classification))}>{latestReading.classification === "Waiting..." ? "Awaiting Sensor Data" : latestReading.classification}</p>
                      {latestReading.confidence && <p className="text-[9px] font-mono opacity-40">{(latestReading.confidence*100).toFixed(0)}% reliability · unusual reading: {latestReading.anomalyScore?.toFixed(2) ?? "N/A"}</p>}
                    </div>
                    <button onClick={handleGetAdvice} disabled={loadingAdvisor} className="w-full py-4 bg-natural-dark text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] hover:bg-opacity-90 transition-all disabled:opacity-40 active:scale-95">
                      {loadingAdvisor ? "Consulting Gemini AI..." : "Generate Crop Advice"}
                    </button>
                    <CropTimeline currentStage={growthStage} />
                  </div>
                  <div className={cn("bg-natural-primary p-8 rounded-3xl text-white relative overflow-hidden", loadingAdvisor && "animate-pulse")}>
                    <div className="absolute -right-6 -bottom-6 opacity-5 font-serif text-9xl pointer-events-none select-none">AI</div>
                    <div className="relative z-10 space-y-5 h-[600px] overflow-y-auto no-scrollbar pb-8">
                      <div>
                        <p className="text-[9px] uppercase font-bold opacity-40 tracking-widest mb-2">AI Advice — {cropType} / {growthStage}</p>
                        {!advisorResult && !loadingAdvisor && (
                          <div className="mt-8 mb-6 p-6 border border-white border-opacity-20 rounded-2xl bg-white bg-opacity-5">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest mb-4 opacity-70">Optimal Ranges for {cropType}</h4>
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div>
                                <p className="text-[8px] uppercase opacity-50 mb-1">Moisture</p>
                                <p className="text-sm font-serif">{optimalRanges.moisture[0]}-{optimalRanges.moisture[1]}%</p>
                              </div>
                              <div>
                                <p className="text-[8px] uppercase opacity-50 mb-1">Temp</p>
                                <p className="text-sm font-serif">{optimalRanges.temperature[0]}-{optimalRanges.temperature[1]}°C</p>
                              </div>
                              <div>
                                <p className="text-[8px] uppercase opacity-50 mb-1">Salt Level</p>
                                <p className="text-sm font-serif">{optimalRanges.ec[0]}-{optimalRanges.ec[1]}</p>
                              </div>
                            </div>
                            <p className="text-[10px] font-mono mt-6 opacity-60 text-center">Select your farm details and click Generate to receive stage-specific agronomic advice.</p>
                          </div>
                        )}
                        {loadingAdvisor && <p className="text-lg font-serif italic leading-relaxed">Consulting agronomic AI database...</p>}
                        {advisorResult && !loadingAdvisor && <p className="text-lg font-serif italic leading-relaxed">{advisorResult.immediateAction}</p>}
                      </div>
                      
                      {advisorResult?.irrigationPrescription && !loadingAdvisor && (<>
                        <div className="pt-4 border-t border-white border-opacity-10">
                          <p className="text-[9px] uppercase font-bold opacity-40 mb-3">Irrigation Prescription</p>
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="bg-white bg-opacity-10 p-4 rounded-2xl">
                              <span className="text-[9px] uppercase font-bold opacity-60 block mb-1">Volume</span>
                              <span className="text-xl font-serif">{advisorResult.irrigationPrescription.volumeLitersPerSqM} L/m²</span>
                            </div>
                            <div className="bg-white bg-opacity-10 p-4 rounded-2xl">
                              <span className="text-[9px] uppercase font-bold opacity-60 block mb-1">Timing</span>
                              <span className="text-sm font-bold">{advisorResult.irrigationPrescription.timing}</span>
                            </div>
                          </div>
                          <div className="flex gap-4 opacity-80 text-[10px] font-mono pl-1">
                            <div><span className="opacity-50">Method:</span> {advisorResult.irrigationPrescription.method}</div>
                            <div><span className="opacity-50">Freq:</span> {advisorResult.irrigationPrescription.frequency}</div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-white border-opacity-10">
                          <p className="text-[9px] uppercase font-bold opacity-40 mb-3">48-Hour Plan</p>
                          <ul className="space-y-2">
                            {advisorResult.fortyEightHourPlan?.map((p: string, i: number) => (
                              <li key={i} className="text-[11px] flex items-start gap-3">
                                <span className="w-1.5 h-1.5 bg-natural-accent rounded-full mt-1.5 shrink-0"/>
                                <span className="opacity-90">{p}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="pt-4 border-t border-white border-opacity-10">
                          <p className="text-[9px] uppercase font-bold opacity-40 mb-2">Fertilizer Adjustments</p>
                          <p className="text-[11px] opacity-80 font-mono leading-relaxed">{advisorResult.fertilizerNote}</p>
                        </div>

                        <div className="bg-red-500 bg-opacity-20 border border-red-500 border-opacity-30 p-4 rounded-2xl mt-4">
                          <span className="text-[9px] text-red-200 uppercase font-bold block mb-1">Risk if Untreated</span>
                          <p className="text-[12px] text-red-100 font-medium mb-3">{advisorResult.riskIfUntreated}</p>
                          
                          <span className="text-[9px] text-red-200 uppercase font-bold block mb-1">Estimated Yield Impact</span>
                          <p className="text-[11px] font-mono text-red-100 opacity-80">{advisorResult.yieldImpact}</p>
                        </div>
                      </>)}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "simulation" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-32">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-3xl border border-natural-border shadow-sm space-y-5">
                    <div>
                      <h3 className="text-2xl font-serif italic">Scenario Injection</h3>
                      <p className="text-[10px] uppercase font-bold opacity-40 tracking-widest mt-1">Test the full AI pipeline without hardware</p>
                    </div>
                    <div className="space-y-3">
                      {([["Drought","Inject Drought","bg-amber-600"],["Salinity","Inject Salinity","bg-red-600"],["Fertilizer","Inject Over-Fertilization","bg-orange-600"],["HeatStress","Inject Heat Stress","bg-red-900"],["NutrientImbalance","Inject Nutrient Imbalance","bg-purple-700"]] as const).map(([k,label,color]) => (
                        <button key={k} onClick={() => triggerScenario(k as any)} className={cn("w-full py-3 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white hover:scale-[1.02] active:scale-95 transition-all", color)}>
                          {label}
                        </button>
                      ))}
                    </div>
                    <div className="pt-2 border-t border-natural-border space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase opacity-40 tracking-widest">Auto Simulation</span>
                        <div className={cn("w-2 h-2 rounded-full", isSimulating ? "bg-green-500 animate-pulse" : "bg-gray-300")}/>
                      </div>
                      <button onClick={toggleSimulation} className={cn("w-full py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all", isSimulating ? "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100" : "bg-natural-dark text-white hover:bg-opacity-90")}>
                        {isSimulating ? "Stop Simulation" : "Start Auto-Simulation"}
                      </button>
                      <p className="text-[9px] font-mono opacity-30 text-center">{isSimulating ? "Publishing diurnal readings every 8s..." : "Generates realistic readings with seasonal patterns"}</p>
                    </div>
                  </div>
                  <div className="bg-white p-8 rounded-3xl border border-natural-border shadow-sm">
                    <h3 className="text-xs uppercase font-bold opacity-40 mb-6 tracking-widest">AI Pipeline Trace</h3>
                    {lastTrace.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16">
                        <p className="text-[10px] font-mono opacity-30 uppercase tracking-widest text-center">Inject a scenario to trace<br/>the full AI data pipeline</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {lastTrace.map((step: any, i: number) => (
                          <div key={i} className={cn("p-3 rounded-xl border transition-all", step.status==="done" ? "pipeline-step-done" : step.status==="error" ? "pipeline-step-error" : "pipeline-step-pending")}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={cn("w-2 h-2 rounded-full shrink-0", step.status==="done" ? "bg-green-500" : step.status==="error" ? "bg-red-500" : "bg-gray-300 animate-pulse")}/>
                                <span className="font-bold text-[11px] uppercase tracking-wider">{step.step}</span>
                              </div>
                              <span className={cn("text-[9px] uppercase font-bold", step.status==="done" ? "text-green-600" : step.status==="error" ? "text-red-600" : "text-gray-400")}>{step.status}</span>
                            </div>
                            {step.detail && <p className="text-[10px] font-mono opacity-60 mt-1 ml-4">{step.detail}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                    {lastInjectedScenario && (
                      <div className="mt-4 p-3 bg-natural-bg rounded-xl border border-natural-border">
                        <p className="text-[9px] uppercase font-bold opacity-40 tracking-widest">Last Injected Scenario</p>
                        <p className="text-sm font-bold mt-0.5">{lastInjectedScenario}</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab !== "overview" && activeTab !== "analytics" && activeTab !== "alerts" && activeTab !== "history" && activeTab !== "advisor" && activeTab !== "simulation" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-40 border-2 border-dashed border-natural-border rounded-3xl">
                <h3 className="text-3xl font-serif italic text-natural-primary opacity-20 mb-4 capitalize">{activeTab} Module</h3>
                <p className="text-[10px] font-mono uppercase tracking-widest opacity-40 italic">Coming soon to Phase 2 of CropPulse</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-6 border-t border-natural-border flex justify-between items-center bg-[#F8F7F2] z-20 lg:ml-64 mr-2 mb-2 rounded-br-2xl">
        <div className="flex gap-8 overflow-x-auto no-scrollbar">
          <FooterLabel dotColor="#5A5A40" label="ESP32 Payload" />
          <FooterLabel dotColor="#D27D56" label="MQTT Stream" />
          <FooterLabel dotColor="#BC8F8F" label="ML Classifier" />
        </div>
      </footer>
    </div>
  );
}

function FooterLabel({ dotColor, label }: { dotColor: string, label: string }) {
  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dotColor }}></span>
      <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{label}</span>
    </div>
  );
}

function AvgMetric({ label, value }: { label: string, value: string }) {
  return (
    <div className="border border-white border-opacity-10 p-4 rounded-2xl">
      <div className="text-[9px] uppercase opacity-40 font-bold mb-1">{label}</div>
      <div className="text-xl font-serif">{value}</div>
    </div>
  );
}

function AuditItem({ time, event, status }: { time: string, event: string, status: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-natural-border border-opacity-30 last:border-0">
      <div className="flex items-center gap-4">
        <span className="font-mono text-[9px] opacity-40">{time}</span>
        <span className="text-[11px] font-medium">{event}</span>
      </div>
      <span className="text-[9px] font-bold uppercase tracking-widest text-green-600">{status}</span>
    </div>
  );
}

function SimulationButton({ onClick, label, color }: { onClick: () => void, label: string, color: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn("w-full py-2 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white hover:scale-[1.02] active:scale-95 transition-all", color)}
    >
      {label}
    </button>
  );
}

function NavItem({ active, icon, label, onClick }: { active: boolean, icon: any, label: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col lg:flex-row items-center gap-1 lg:gap-4 p-3 lg:p-4 text-[9px] lg:text-[11px] font-bold uppercase tracking-[0.15em] transition-all rounded-xl w-full lg:justify-start shrink-0 min-w-[80px] lg:min-w-0",
        active ? "bg-white text-natural-primary shadow-sm border border-natural-border" : "opacity-40 hover:opacity-100"
      )}
    >
      <span className={cn("transition-colors", active ? "text-natural-accent scale-110" : "text-current")}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function CropTimeline({ currentStage }: { currentStage: string }) {
  const STAGES = ["Germination", "Seedling", "Vegetative", "Flowering", "Fruiting", "Harvest"];
  const currentIndex = STAGES.indexOf(currentStage);
  
  return (
    <div className="bg-white p-6 rounded-3xl border border-natural-border shadow-sm mt-8 overflow-hidden">
      <h3 className="text-[10px] uppercase font-bold opacity-40 mb-8 tracking-widest text-center">Crop Lifecycle Timeline</h3>
      <div className="overflow-x-auto pb-4 no-scrollbar">
        <div className="relative flex justify-between items-center px-4 min-w-[500px]">
          {/* Connecting line */}
          <div className="absolute left-6 right-6 h-1 bg-natural-border top-1/2 -translate-y-1/2 z-0"></div>
          <div 
            className="absolute left-6 h-1 bg-natural-accent top-1/2 -translate-y-1/2 z-0 transition-all duration-1000"
            style={{ width: `calc(${(currentIndex / (STAGES.length - 1)) * 100}% - 24px)` }}
          ></div>
          
          {STAGES.map((stage, idx) => {
            const isPast = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            return (
              <div key={stage} className="relative z-10 flex flex-col items-center gap-2">
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center bg-white transition-colors duration-500",
                  isCurrent ? "border-natural-accent text-natural-accent scale-125" : 
                  isPast ? "border-natural-accent bg-natural-accent text-white" : "border-natural-border text-transparent"
                )}>
                  {(isPast || isCurrent) && <CheckCircle2 size={10} />}
                </div>
                <span className={cn(
                  "text-[8px] sm:text-[9px] font-bold uppercase tracking-widest absolute top-8 whitespace-nowrap",
                  isCurrent ? "text-natural-accent" : isPast ? "opacity-70" : "opacity-30"
                )}>
                  {stage}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-12 text-center text-[10px] font-mono opacity-40 uppercase tracking-widest">
        {currentIndex === 0 && "Maintain high moisture (70-80%) for seed coat rupture"}
        {currentIndex === 1 && "Monitor EC carefully to prevent root burn"}
        {currentIndex === 2 && "Optimal phase for vegetative growth tracking"}
        {currentIndex === 3 && "Critical water requirement phase. Avoid stress."}
        {currentIndex === 4 && "Maintain consistent moisture to prevent fruit splitting"}
        {currentIndex === 5 && "Reduce irrigation prior to harvest"}
      </div>
    </div>
  );
}

function StatCard({ 
  label, 
  value, 
  icon, 
  variant = "primary",
  trendDirection,
  trendRate,
  optimalRange,
  currentRawValue,
  maxScale
}: { 
  label: string, 
  value: string, 
  icon: any, 
  variant?: "primary" | "accent",
  trendDirection?: "Increasing" | "Decreasing" | "Stable",
  trendRate?: number,
  optimalRange?: number[],
  currentRawValue?: number,
  maxScale?: number
}) {
  const isOptimal = optimalRange && currentRawValue != null && currentRawValue >= optimalRange[0] && currentRawValue <= optimalRange[1];
  
  return (
    <div className="bg-white p-6 rounded-3xl border border-natural-border shadow-sm relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-default">
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-40 group-hover:text-natural-accent transition-colors">{label}</div>
          <div className="flex items-center gap-3">
            <div className="text-2xl font-serif text-natural-text">{value}</div>
            {isOptimal && (
              <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[8px] font-bold uppercase tracking-widest rounded-md">Optimal</span>
            )}
          </div>
        </div>
        
        <div className="mt-4 space-y-3">
          {optimalRange && currentRawValue != null && maxScale != null && (
            <div>
              <div className="flex justify-between text-[9px] font-bold uppercase opacity-60 mb-2">
                <span>0</span>
                <span className="text-natural-accent">Optimal range: {optimalRange[0]}-{optimalRange[1]}</span>
                <span>{maxScale}</span>
              </div>
              <div className="w-full h-2.5 bg-natural-border rounded-full relative overflow-hidden">
                {/* Optimal zone highlight */}
                <div 
                  className="absolute h-full bg-green-300" 
                  style={{ 
                    left: `${(optimalRange[0] / maxScale) * 100}%`, 
                    width: `${((optimalRange[1] - optimalRange[0]) / maxScale) * 100}%` 
                  }} 
                />
                {/* Current value marker */}
                <div 
                  className="absolute top-0 bottom-0 w-1.5 bg-natural-dark shadow-sm z-10"
                  style={{ left: `calc(${(Math.min(currentRawValue, maxScale) / maxScale) * 100}% - 3px)` }}
                />
              </div>
            </div>
          )}

          {trendDirection && (
            <div className={cn(
              "flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider",
              trendDirection === "Stable" ? "opacity-40" : trendDirection === "Increasing" ? "text-natural-accent" : "text-red-500"
            )}>
              {trendDirection === "Increasing" ? <TrendingUp size={12} /> : trendDirection === "Decreasing" ? <TrendingDown size={12} /> : <Minus size={12} />}
              <span>{trendDirection} {trendRate ? `(${trendRate > 0 ? '+' : ''}${trendRate.toFixed(2)}/hr)` : ''}</span>
            </div>
          )}
        </div>
      </div>
      <div className={cn(
        "absolute -right-4 -bottom-4 opacity-5 transition-transform group-hover:scale-110 group-hover:opacity-10",
        variant === "primary" ? "text-natural-primary" : "text-natural-accent font-bold"
      )}>
        {icon && <div className="w-24 h-24 flex items-center justify-center">{icon}</div>}
      </div>
    </div>
  );
}

interface SoilHealthDialProps {
  score: number | null;
  moisture?: number;
  temperature?: number;
  ec?: number;
  isAnomaly?: boolean;
  classification?: string;
  ranges: { moisture: number[], temp: number[], ec: number[] };
}

function SoilHealthDial({ score, moisture, temperature, ec, isAnomaly, classification, ranges }: SoilHealthDialProps) {
  const dashArray = 283;
  const safeScore = score ?? 0;
  const dashOffset = score === null ? dashArray : dashArray - (dashArray * safeScore) / 100;

  let color = "#5A5A40";
  if (score === null) color = "#DEDCCF";
  else if (safeScore < 40) color = "#ef4444";
  else if (safeScore < 70) color = "#f59e0b";
  else color = "#D27D56";

  // Parameter evaluation: score each sensor against ideal range
  const params = [
    {
      label: "Moisture",
      value: moisture,
      unit: "%",
      min: 0, max: 100,
      ideal: ranges.moisture,
      display: moisture != null ? moisture.toFixed(1) : "—",
    },
    {
      label: "Temperature",
      value: temperature,
      unit: "°C",
      min: 0, max: 60,
      ideal: ranges.temp,
      display: temperature != null ? temperature.toFixed(1) : "—",
    },
    {
      label: "EC",
      value: ec,
      unit: "dS/m",
      min: 0, max: 10,
      ideal: ranges.ec,
      display: ec != null ? ec.toFixed(2) : "—",
    },
  ];

  function getParamStatus(value: number | undefined, ideal: number[]) {
    if (value == null) return { color: "#DEDCCF", label: "N/A", pct: 0 };
    if (value >= ideal[0] && value <= ideal[1]) return { color: "#22c55e", label: "Optimal", pct: 100 };
    const low = value < ideal[0];
    const gap = low ? ideal[0] - value : value - ideal[1];
    
    // Simple severity logic
    if (gap < 5) return { color: "#D27D56", label: "Fair", pct: 90 };
    if (gap < 15) return { color: "#f59e0b", label: "Warning", pct: 70 };
    return { color: "#ef4444", label: "Critical", pct: 40 };
  }

  return (
    <div className="bg-white p-6 rounded-3xl border border-natural-border shadow-sm flex flex-col hover:scale-[1.02] transition-transform cursor-default">
      {/* Header */}
      <div className="text-[10px] font-bold uppercase tracking-widest mb-4 opacity-40">Soil Health</div>

      {/* Dial */}
      <div className="flex items-center gap-4 mb-5">
        <div className="relative w-20 h-20 shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#EBE9E1" strokeWidth="10" />
            <circle
              cx="50" cy="50" r="45"
              fill="none"
              stroke={color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-serif" style={{ color: score === null ? "#888" : color }}>
              {score === null ? "—" : safeScore}
            </span>
            {score !== null && <span className="text-[7px] font-bold uppercase tracking-widest opacity-40">/100</span>}
          </div>
        </div>

        <div>
          {score === null ? (
            <p className="text-[9px] font-mono opacity-40 uppercase">Awaiting<br/>Data</p>
          ) : (
            <>
              <p className="text-sm font-serif font-semibold" style={{ color }}>
                {safeScore >= 70 ? "Healthy" : safeScore >= 40 ? "Moderate" : "Critical"}
              </p>
              {classification && (
                <p className="text-[9px] font-mono opacity-50 mt-0.5">{classification}</p>
              )}
              {isAnomaly && (
                <span className="inline-block mt-1 text-[8px] font-bold uppercase bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                  ⚠ Anomaly
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Parameter Bars */}
      <div className="space-y-2.5">
        {params.map((p) => {
          const status = getParamStatus(p.value, p.ideal);
          return (
            <div key={p.label}>
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-[9px] font-bold uppercase tracking-wider opacity-50">{p.label}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-mono font-bold opacity-80">
                    {p.display} {p.unit}
                  </span>
                  <span
                    className="text-[7px] font-bold uppercase px-1.5 py-0.5 rounded-full"
                    style={{ background: status.color + "20", color: status.color }}
                  >
                    {status.label}
                  </span>
                </div>
              </div>
              <div className="w-full h-1.5 bg-natural-border rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: p.value != null ? `${((p.value - p.min) / (p.max - p.min)) * 100}%` : "0%",
                    background: status.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

