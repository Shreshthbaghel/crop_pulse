import { useEffect, useState, useMemo } from "react";
import { collection, query, orderBy, limit, onSnapshot, updateDoc, doc, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useSimulation } from "./SimulationProvider";
import { getSoilRecommendations } from "../lib/gemini";
import { predictIrrigation } from "../lib/weather";
import { analyzeMoistureTrend, TrendResult } from "../lib/analytics";
import { User } from "firebase/auth";
import { 
  Activity, 
  AlertTriangle, 
  BarChart3, 
  Cloud, 
  Download,
  Droplets, 
  History, 
  Info, 
  LayoutDashboard, 
  LogOut, 
  Play, 
  RefreshCcw,
  Settings, 
  Square, 
  Sun, 
  Thermometer, 
  Zap 
} from "lucide-react";
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
import { format } from "date-fns";
import { motion, AnimatePresence } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DashboardProps {
  onLogout: () => void;
  user: User;
}

export function Dashboard({ onLogout, user }: DashboardProps) {
  const { isSimulating, toggleSimulation, triggerScenario } = useSimulation();
  const [readings, setReadings] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [recommendation, setRecommendation] = useState<any>(null);
  const [loadingRec, setLoadingRec] = useState(false);
  const [trend, setTrend] = useState<TrendResult | null>(null);
  const [mlPrediction, setMlPrediction] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "readings"), 
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc"), 
      limit(30)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const d = doc.data();
        return { 
          id: doc.id, 
          ...d,
          chartTime: d.timestamp ? d.timestamp.toDate().getTime() : Date.now(),
          displayTime: d.timestamp ? format(d.timestamp.toDate(), "HH:mm") : "..."
        };
      });
      setReadings(data);
      
      // Calculate Trends
      if (data.length >= 5) {
        setTrend(analyzeMoistureTrend(data));
      }

      if (data.length > 0) {
        const latest = data[0];
        getRecommendation(latest);
        getMLPrediction(latest);
      }
    }, (error) => {
      console.error("Firestore Readings Error:", error);
    });

    const aq = query(
      collection(db, "alerts"), 
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc"), 
      limit(20)
    );
    const aUnsubscribe = onSnapshot(aq, (snapshot) => {
      setAlerts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Firestore Alerts Error:", error);
    });

    return () => {
      unsubscribe();
      aUnsubscribe();
    };
  }, []);

  const getRecommendation = async (metrics: any) => {
    if (loadingRec) return;
    setLoadingRec(true);
    const rec = await getSoilRecommendations({ ...metrics, history: readings.slice(0, 5) });
    setRecommendation(rec);
    setLoadingRec(false);
  };

  const getMLPrediction = async (metrics: any) => {
    try {
      const response = await fetch("/api/predict-crop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moisture: metrics.moisture,
          temperature: metrics.temperature,
          ec: metrics.ec
        })
      });
      const data = await response.json();
      setMlPrediction(data);
    } catch (error) {
      console.error("ML API Error:", error);
    }
  };

  const exportData = () => {
    const csvRows = [
      ["Timestamp", "Moisture (%)", "Temperature (C)", "EC (dS/m)", "Status"],
      ...readings.map(r => [
        r.timestamp?.toDate().toISOString() || "",
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
      await updateDoc(doc(db, "alerts", id), { resolved: true });
    } catch (error) {
      console.error("Resolution Error:", error);
    }
  };

  const latestReading = readings[0] || { moisture: 0, temperature: 0, ec: 0, classification: "Waiting..." };
  const { weather } = useSimulation();
  
  const irrigation = useMemo(() => {
    return predictIrrigation(latestReading.moisture, weather);
  }, [latestReading, weather]);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-natural-bg text-natural-text border-8 border-natural-border-muted overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 border-b lg:border-r border-natural-border bg-natural-bg z-10 flex flex-col">
        <div className="p-8 border-b border-natural-border">
          <h1 className="text-3xl font-serif italic text-natural-primary tracking-tight">TerraSense</h1>
          <p className="text-[10px] uppercase tracking-widest font-bold opacity-40 mt-1">AI Soil Intel</p>
        </div>
        
        <nav className="p-4 space-y-1 flex-1">
          <NavItem active={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon={<LayoutDashboard size={18} />} label="Dashboard" />
          <NavItem active={activeTab === "analytics"} onClick={() => setActiveTab("analytics")} icon={<BarChart3 size={18} />} label="Analysis" />
          <NavItem active={activeTab === "alerts"} onClick={() => setActiveTab("alerts")} icon={<AlertTriangle size={18} />} label="Security" />
          <NavItem active={activeTab === "history"} onClick={() => setActiveTab("history")} icon={<History size={18} />} label="Archives" />
        </nav>

        <div className="p-4 border-t border-natural-border bg-white bg-opacity-50">
          <div className="flex items-center gap-3 p-2 mb-4">
            <img src={user.photoURL || ""} alt={user.displayName || ""} className="w-8 h-8 rounded-full border border-natural-border" />
            <div className="overflow-hidden">
               <p className="text-[10px] font-bold truncate">{user.displayName}</p>
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

        <div className="p-6 border-t border-natural-border bg-[#F8F7F2]">
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
               <div className={cn("w-2 h-2 rounded-full", isSimulating ? "bg-green-500 animate-pulse" : "bg-natural-accent")} />
               <div className="text-xs font-semibold uppercase tracking-wider">{isSimulating ? "Phase 1 Active" : "Phase 1 Standby"}</div>
             </div>
             <div className="text-[10px] font-mono opacity-40 uppercase tracking-widest text-right">
              v1.0.4-dev<br/>UTC: {format(new Date(), "HH:mm")}
             </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-8">
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard label="Moisture" value={`${latestReading.moisture}%`} icon={<Droplets />} variant="primary" />
                  <div className="bg-white p-6 rounded-3xl border border-natural-border shadow-sm flex flex-col justify-between">
                     <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                           <RefreshCcw className={cn("text-natural-accent", (isSimulating || readings.length > 0) && "animate-spin-slow")} size={16} />
                           <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Sensor Heartbeat</span>
                        </div>
                        <div className="px-2 py-1 bg-green-50 text-green-700 text-[9px] font-bold rounded-lg uppercase tracking-tight">Node: Active</div>
                     </div>
                     <div className="flex-1">
                        <h4 className="text-xl font-serif italic mb-1">
                          {readings[0]?.timestamp ? format(readings[0].timestamp.toDate(), "HH:mm:ss") : "Direct Feed"}
                        </h4>
                        <p className="text-[10px] font-mono opacity-40 uppercase leading-snug">
                          {readings.length > 0 ? "Last packet received successfully" : "Waiting for initial hardware handshake..."}
                        </p>
                        {trend && (
                          <div className="mt-2 flex items-center gap-2">
                             <div className={cn("w-1.5 h-1.5 rounded-full", trend.direction === "Decreasing" ? "bg-red-500" : "bg-green-500")} />
                             <span className="text-[9px] font-bold opacity-30 uppercase tracking-widest">{trend.direction} Trend Detected</span>
                          </div>
                        )}
                     </div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-natural-border shadow-sm flex flex-col justify-between">
                     <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                           <Cloud className="text-natural-accent" size={18} />
                           <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Smart Irrigation</span>
                        </div>
                        {weather ? (
                          <span className="text-[10px] font-mono font-bold bg-natural-accent bg-opacity-10 text-natural-accent py-1 px-2 rounded-lg">{weather.condition}</span>
                        ) : (
                          <span className="text-[10px] font-mono opacity-20">API Required</span>
                        )}
                     </div>
                     <div className="flex-1">
                        <h4 className={cn("text-xl font-serif italic mb-1", irrigation.status === "Irrigate Now" ? "text-red-600" : "text-natural-primary")}>
                           {irrigation.status}
                        </h4>
                        <p className="text-[10px] font-mono opacity-40 uppercase leading-snug">
                           {irrigation.reason}
                        </p>
                        {trend?.predictionTimeMinutes && (
                          <p className="mt-2 text-[9px] font-bold text-natural-accent uppercase animate-pulse">
                            Critical threshold in ~{trend.predictionTimeMinutes}m
                          </p>
                        )}
                     </div>
                  </div>
                  <StatCard label="EC Index" value={`${latestReading.ec} dS/m`} icon={<Activity />} variant="accent" />
                  <StatCard 
                    label="Current Status" 
                    value={latestReading.classification} 
                    icon={<Zap />} 
                    variant={latestReading.classification === "Normal" ? "primary" : "accent"}
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

                    <div className="bg-[#EBE9E1] p-8 rounded-3xl">
                       <h3 className="text-xs uppercase font-bold opacity-40 mb-6 tracking-widest">Live Event Log</h3>
                       <div className="space-y-4">
                          {readings.slice(0, 4).map((r, i) => (
                            <div key={r.id || i} className="bg-white rounded-2xl p-4 shadow-sm border border-natural-border flex items-center justify-between transition-transform hover:scale-[1.01]">
                              <div className="flex items-center gap-4">
                                <div className="text-[10px] font-bold text-natural-accent uppercase py-1 px-2 bg-natural-accent bg-opacity-10 rounded-lg">
                                  {r.classification}
                                </div>
                                <p className="text-xs font-medium opacity-80">
                                  Sensors detected {r.classification.toLowerCase()} patterns.
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
                    <div className="bg-white p-8 rounded-3xl border border-natural-border shadow-sm">
                      <h3 className="text-xs uppercase font-bold opacity-40 mb-6 tracking-widest text-[#D27D56]">Scenario Injection</h3>
                      <div className="grid grid-cols-1 gap-2">
                        <SimulationButton onClick={() => triggerScenario("Salinity")} label="Inject Salinity" color="bg-natural-accent" />
                        <SimulationButton onClick={() => triggerScenario("Drought")} label="Forced Drought" color="bg-natural-dark" />
                        <SimulationButton onClick={() => triggerScenario("Fertilizer")} label="Fertilizer Spike" color="bg-natural-primary" />
                      </div>
                      <p className="text-[9px] font-mono opacity-40 mt-4 leading-tight">These buttons manually inject extreme sensor values into the AI engine to test classification.</p>
                    </div>

                    <div className="bg-natural-primary p-8 rounded-3xl text-white relative overflow-hidden">
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-6">
                          <Info size={16} className="text-natural-accent" />
                          <h3 className="text-xs uppercase font-bold tracking-widest opacity-60">Agronomic Analysis</h3>
                        </div>
                        <div className={cn("space-y-4", loadingRec && "animate-pulse")}>
                          <p className="text-lg font-serif italic leading-relaxed min-h-[60px]">
                            {loadingRec ? "Processing multi-layer soil datasets..." : recommendation?.recommendation || "Awating stable data stream for AI analysis."}
                          </p>
                          
                          {!loadingRec && recommendation && (
                            <div className="space-y-4 pt-4 border-t border-white border-opacity-10">
                              <div>
                                <span className="text-[9px] uppercase font-bold opacity-40 block mb-1">Reasoning</span>
                                <p className="text-[11px] opacity-70 leading-relaxed font-mono">{recommendation.reasoning}</p>
                              </div>
                              
                              <div>
                                <span className="text-[9px] uppercase font-bold opacity-40 block mb-1">Recommended Actions</span>
                                <ul className="space-y-1">
                                  {recommendation.nextSteps?.map((step: string, i: number) => (
                                    <li key={i} className="text-[11px] flex items-center gap-2">
                                      <span className="w-1 h-1 bg-natural-accent rounded-full" />
                                      {step}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div className="flex justify-between items-center pt-2">
                                <span className="text-[9px] uppercase font-bold opacity-40">Decision Confidence</span>
                                <span className="text-[10px] font-mono font-bold text-natural-accent">{(recommendation.confidence * 100).toFixed(1)}%</span>
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8 pb-32"
              >
                <div className="bg-white p-8 rounded-3xl border border-natural-border shadow-sm">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xs uppercase font-bold opacity-40 tracking-widest">RF-ML Crop Prediction Engine</h3>
                    <div className="px-3 py-1 bg-green-100 text-green-700 text-[9px] font-bold rounded-full uppercase tracking-widest">Random Forest Active</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-4">
                      <p className="text-sm italic font-serif leading-relaxed">
                        {mlPrediction ? (
                          `Based on current soil moisture (${latestReading.moisture}%) and thermal stability (${latestReading.temperature}°C), 
                          the Random Forest model predicts high yield potential for ${mlPrediction.cropType.toLowerCase()}.`
                        ) : (
                          "Model is analyzing soil profile for optimal crop selection..."
                        )}
                        {mlPrediction?.isAnomaly && (
                          <span className="block mt-2 text-red-600 font-bold text-[10px] uppercase">
                            Warning: {mlPrediction.anomalyReason}
                          </span>
                        )}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {mlPrediction?.recommendedCrops.map((crop: string) => (
                          <div key={crop} className="px-4 py-2 bg-natural-bg border border-natural-border rounded-xl text-[10px] font-bold uppercase">Optimal: {crop}</div>
                        ))}
                      </div>
                    </div>
                    <div className="p-6 bg-[#FDFCF8] border border-natural-border rounded-2xl">
                      <div className="flex items-center justify-between mb-4">
                         <span className="text-[10px] font-bold opacity-40 uppercase">Confidence Score</span>
                         <span className="text-lg font-mono font-bold text-natural-accent">
                           {mlPrediction ? `${(mlPrediction.confidence * 100).toFixed(1)}%` : "--.-%"}
                         </span>
                      </div>
                      <div className="w-full h-2 bg-[#EBE9E1] rounded-full overflow-hidden">
                        <div className="h-full bg-natural-accent transition-all duration-1000" style={{ width: mlPrediction ? `${mlPrediction.confidence * 100}%` : '0%' }}></div>
                      </div>
                      <p className="mt-4 text-[9px] font-mono opacity-40 uppercase leading-snug">
                        Classification based on 50 decision trees targeting {mlPrediction?.cropType || "soil"} patterns.
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
                  <h3 className="text-2xl font-serif italic mb-6">Aggregated Intelligence</h3>
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
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8 pb-32"
              >
                <div className="bg-white rounded-3xl border border-natural-border overflow-hidden shadow-sm">
                  <div className="p-8 bg-red-50 border-b border-natural-border">
                    <h3 className="text-xl font-bold uppercase tracking-widest text-red-900 flex items-center gap-2">
                       <AlertTriangle size={20} />
                       Security Audit Log
                    </h3>
                    <p className="text-[10px] font-mono opacity-60 mt-1 uppercase">Tracking node anomalies and authentication events</p>
                  </div>
                  <div className="p-8">
                    <div className="space-y-4">
                      {alerts.map((a, i) => (
                        <div key={a.id || i}>
                          <AuditItem 
                            time={a.timestamp ? format(a.timestamp.toDate(), "HH:mm:ss") : "Now"}
                            event={a.message}
                            status={a.type}
                          />
                        </div>
                      ))}
                      {alerts.length === 0 && (
                        <p className="text-center py-20 text-[10px] font-mono opacity-20 uppercase tracking-[0.2em]">No security breaches recorded</p>
                      )}
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
                      <button 
                        onClick={exportData}
                        className="flex items-center gap-2 px-4 py-2 bg-natural-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-opacity-90 active:scale-95 transition-all shadow-md"
                      >
                        <Download size={14} />
                        Export dataset (.CSV)
                      </button>
                   </div>
                   <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-natural-border bg-white italic font-serif">
                            <th className="p-4 pl-8 text-xs font-semibold">Temporal Stamp</th>
                            <th className="p-4 text-xs font-semibold">Classification</th>
                            <th className="p-4 text-xs font-semibold">Metrics (M/T/EC)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {readings.map((r, i) => (
                            <tr key={r.id || i} className="border-b border-natural-border border-opacity-30 hover:bg-[#FDFCF8] transition-colors">
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

            {activeTab !== "overview" && activeTab !== "history" && activeTab !== "analytics" && activeTab !== "alerts" && (
               <motion.div 
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }} 
                 className="flex flex-col items-center justify-center py-40 border-2 border-dashed border-natural-border rounded-3xl"
               >
                 <h3 className="text-3xl font-serif italic text-natural-primary opacity-20 mb-4 capitalize">{activeTab} Module</h3>
                 <p className="text-[10px] font-mono uppercase tracking-widest opacity-40 italic">Coming soon to Phase 2 of TerraSense</p>
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
        "w-full flex items-center gap-4 p-4 text-[11px] font-bold uppercase tracking-[0.15em] transition-all rounded-xl",
        active ? "bg-white text-natural-primary shadow-sm border border-natural-border" : "opacity-40 hover:opacity-100"
      )}
    >
      <span className={cn("transition-colors", active ? "text-natural-accent" : "text-current")}>{icon}</span>
      {label}
    </button>
  );
}

function StatCard({ label, value, icon, variant = "primary" }: { label: string, value: string, icon: any, variant?: "primary" | "accent" }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-natural-border shadow-sm relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-default">
      <div className="relative z-10">
        <div className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-40 group-hover:text-natural-accent transition-colors">{label}</div>
        <div className="text-2xl font-serif text-natural-text">{value}</div>
      </div>
      <div className={cn(
        "absolute -right-4 -bottom-4 opacity-5 transition-transform group-hover:scale-110 group-hover:opacity-10",
        variant === "primary" ? "text-natural-primary" : "text-natural-accent font-bold"
      )}>
        {/* Large icon background */}
        {icon && <div className="w-24 h-24 flex items-center justify-center">{icon}</div>}
      </div>
    </div>
  );
}
