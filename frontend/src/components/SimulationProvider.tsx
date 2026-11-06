import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { classifySoil } from "../lib/gemini";
import { getWeatherData } from "../lib/weather";
import { User } from "@supabase/supabase-js";

export type ScenarioType = "Salinity" | "Drought" | "Fertilizer" | "HeatStress" | "NutrientImbalance";

interface PipelineTrace {
  step: string;
  status: "pending" | "done" | "error";
  detail?: string;
}

export interface LocalReading {
  moisture: number;
  temperature: number;
  ec: number;
  classification: string;
  confidence: number;
  anomaly_score: number;
  is_anomaly: boolean;
  forecast: any;
  irrigation: { status: string };
  user_id: string;
  created_at: string;
}

interface SimulationContextType {
  isSimulating: boolean;
  toggleSimulation: () => void;
  triggerScenario: (type: ScenarioType) => Promise<void>;
  weather: any;
  lastTrace: PipelineTrace[];
  lastInjectedScenario: ScenarioType | null;
  readingHistory: { moisture: number; timestamp_ms: number }[];
  latestLocalReading: LocalReading | null;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

const MAX_HISTORY = 20;

const MOCK_USER = {
  id: "dev-mock-id",
  email: "dev@example.com",
  user_metadata: { full_name: "Developer Mode" },
} as User;

async function callMLClassify(moisture: number, temperature: number, ec: number, history: { moisture: number; timestamp_ms: number }[]) {
  try {
    const mrc = history.length > 1 ? moisture - history[history.length - 1].moisture : 0;
    const res = await fetch("/api/predict/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        moisture, temperature, ec,
        moisture_rate_of_change: mrc,
        hour_of_day: new Date().getHours(),
      }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

async function callMLForecast(history: { moisture: number; timestamp_ms: number }[]) {
  if (history.length < 3) return null;
  try {
    const res = await fetch("/api/predict/forecast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reading_history: history }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

export function SimulationProvider({ children, user: userProp }: { children: ReactNode; user?: User | null }) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [weather, setWeather] = useState<any>(null);
  const [lastTrace, setLastTrace] = useState<PipelineTrace[]>([]);
  const [lastInjectedScenario, setLastInjectedScenario] = useState<ScenarioType | null>(null);
  const readingHistoryRef = useRef<{ moisture: number; timestamp_ms: number }[]>([]);
  const [readingHistory, setReadingHistory] = useState<{ moisture: number; timestamp_ms: number }[]>([]);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [latestLocalReading, setLatestLocalReading] = useState<LocalReading | null>(null);

  // Prefer App-provided user (dev mock), else Supabase session, else mock
  const user = userProp ?? authUser ?? MOCK_USER;

  useEffect(() => {
    if (userProp) return;
    supabase.auth.getUser().then(({ data: { user } }) => setAuthUser(user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [userProp]);

  const simPhaseRef = useRef(0);

  useEffect(() => {
    const refreshWeather = async () => setWeather(await getWeatherData());
    refreshWeather();
    const interval = setInterval(refreshWeather, 300_000);
    return () => clearInterval(interval);
  }, []);

  const updateTrace = (steps: PipelineTrace[]) => setLastTrace([...steps]);

  const injectData = async (m: number, t: number, ec: number, _scenario?: ScenarioType) => {
    if (!user) return;

    const trace: PipelineTrace[] = [
      { step: "Sensor Reading", status: "done", detail: `M:${m.toFixed(1)}% T:${t.toFixed(1)}°C EC:${ec.toFixed(2)}dS/m` },
      { step: "ML Classify", status: "pending" },
      { step: "ML Forecast", status: "pending" },
      { step: "Irrigation Decision", status: "pending" },
      { step: "Supabase Write", status: "pending" },
      { step: "Alert Evaluation", status: "pending" },
    ];
    updateTrace(trace);

    const history = readingHistoryRef.current;
    const mlResult = await callMLClassify(m, t, ec, history);
    trace[1] = mlResult
      ? { step: "ML Classify", status: "done", detail: `${mlResult.className} (${(mlResult.confidence * 100).toFixed(0)}%)` }
      : { step: "ML Classify", status: "error", detail: "ML server offline — using rule-based" };
    updateTrace(trace);

    const forecast = await callMLForecast(history);
    trace[2] = forecast
      ? { step: "ML Forecast", status: "done", detail: `T+1h: ${forecast.t1h ?? "N/A"}% | T+2h: ${forecast.t2h ?? "N/A"}%` }
      : { step: "ML Forecast", status: "pending", detail: "Need more history" };
    updateTrace(trace);

    const classification = mlResult?.className ?? classifySoil(m, t, ec);
    const confidence = mlResult?.confidence ?? 0.7;
    const anomalyScore = mlResult?.anomalyScore ?? 0;
    const isAnomaly = mlResult?.isAnomaly ?? false;

    const irrigationStatus = m < 25 ? "Irrigate Now" : m < 35 ? "Irrigate Soon" : "No Irrigation Needed";
    trace[3] = { step: "Irrigation Decision", status: "done", detail: irrigationStatus };
    updateTrace(trace);

    const localReading: LocalReading = {
      moisture: m,
      temperature: t,
      ec,
      classification,
      confidence,
      anomaly_score: anomalyScore,
      is_anomaly: isAnomaly,
      forecast: forecast ?? {},
      irrigation: { status: irrigationStatus },
      user_id: user.id,
      created_at: new Date().toISOString(),
    };

    // Always update the dashboard locally (works without Supabase)
    setLatestLocalReading(localReading);

    try {
      const { error } = await supabase.from("readings").insert({
        moisture: m,
        temperature: t,
        ec,
        classification,
        confidence,
        anomaly_score: anomalyScore,
        is_anomaly: isAnomaly,
        forecast: forecast ?? {},
        irrigation: { status: irrigationStatus },
        user_id: user.id,
      });
      if (error) throw error;
      trace[4] = { step: "Supabase Write", status: "done", detail: "Reading persisted" };
    } catch (e) {
      trace[4] = { step: "Supabase Write", status: "error", detail: "Local only (Supabase not configured)" };
    }
    updateTrace(trace);

    const shouldAlert = classification !== "Normal" || isAnomaly;
    if (shouldAlert) {
      let severity = "Info";
      let msg = `${classification} detected. Confidence: ${(confidence * 100).toFixed(0)}%`;

      if (ec > 5.0 || m < 15 || t > 42) {
        severity = "Critical";
        msg = `CRITICAL: ${classification} — values exceed safe operating limits! M:${m.toFixed(0)}% T:${t.toFixed(0)}°C EC:${ec.toFixed(1)}`;
      } else if (ec > 4.0 || m < 25 || t > 38) {
        severity = "Warning";
        msg = `ALERT: ${classification} trending critical. M:${m.toFixed(0)}% T:${t.toFixed(0)}°C EC:${ec.toFixed(1)}`;
      }

      try {
        const { error: alertError } = await supabase.from("alerts").insert({
          type: severity,
          message: msg,
          resolved: false,
          user_id: user.id,
        });
        if (alertError) throw alertError;
        trace[5] = { step: "Alert Evaluation", status: "done", detail: `${severity} alert raised` };
      } catch {
        trace[5] = { step: "Alert Evaluation", status: "done", detail: `${severity} (local only)` };
      }
    } else {
      trace[5] = { step: "Alert Evaluation", status: "done", detail: "No alert — conditions normal" };
    }
    updateTrace(trace);

    const newPoint = { moisture: m, timestamp_ms: Date.now() };
    const updated = [...history, newPoint].slice(-MAX_HISTORY);
    readingHistoryRef.current = updated;
    setReadingHistory([...updated]);
  };

  const triggerScenario = async (type: ScenarioType) => {
    setLastInjectedScenario(type);
    switch (type) {
      case "Salinity": await injectData(45, 24, 4.8, type); break;
      case "Drought": await injectData(11, 34, 0.9, type); break;
      case "Fertilizer": await injectData(65, 22, 3.2, type); break;
      case "HeatStress": await injectData(30, 44, 1.5, type); break;
      case "NutrientImbalance": await injectData(48, 23, 0.3, type); break;
    }
  };

  useEffect(() => {
    let interval: any;

    const tick = () => {
      simPhaseRef.current += 0.05;
      const phase = simPhaseRef.current;
      const hour = new Date().getHours();

      const baseMoisture = 45 + 12 * Math.sin(Math.PI * (hour - 14) / 12);
      const moisture = Math.max(15, Math.min(90, baseMoisture + (Math.random() - 0.5) * 6));

      const baseTemp = 24 + 7 * Math.sin(Math.PI * (hour - 5) / 12);
      const temperature = Math.max(16, Math.min(40, baseTemp + (Math.random() - 0.5) * 3));

      const ec = Math.max(0.3, Math.min(5.0, 1.4 + 0.4 * Math.sin(phase) + (Math.random() - 0.5) * 0.15));

      injectData(
        parseFloat(moisture.toFixed(2)),
        parseFloat(temperature.toFixed(2)),
        parseFloat(ec.toFixed(3))
      );
    };

    if (isSimulating && user) {
      tick(); // first reading immediately
      interval = setInterval(tick, 8000);
    }
    return () => clearInterval(interval);
  }, [isSimulating, user]);

  return (
    <SimulationContext.Provider value={{
      isSimulating,
      toggleSimulation: () => setIsSimulating((s) => !s),
      triggerScenario,
      weather,
      lastTrace,
      lastInjectedScenario,
      readingHistory,
      latestLocalReading,
    }}>
      {children}
    </SimulationContext.Provider>
  );
}

export const useSimulation = () => {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error("useSimulation must be used within SimulationProvider");
  return ctx;
};
