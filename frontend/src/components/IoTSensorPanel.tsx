import React, { useState, useEffect, useRef } from "react";
import mqtt from "mqtt";
import { format } from "date-fns";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { Droplets, Zap, Waves, Wifi, WifiOff, Activity } from "lucide-react";

interface SensorReading {
  tds: number;
  ec: number;
  moisture: number;
  created_at: string;
}

function getStatus(value: number, low: number, high: number) {
  if (value >= low && value <= high) return { label: "Optimal", color: "#22c55e", bg: "bg-green-100 text-green-700" };
  const gap = value < low ? low - value : value - high;
  if (gap < (high - low) * 0.3) return { label: "Fair", color: "#D27D56", bg: "bg-amber-100 text-amber-700" };
  return { label: "Critical", color: "#ef4444", bg: "bg-red-100 text-red-700" };
}

function SensorCard({ title, value, unit, icon, low, high }: {
  title: string; value: number; unit: string; icon: React.ReactNode; low: number; high: number;
}) {
  const status = getStatus(value, low, high);
  return (
    <div className="bg-white rounded-3xl border border-natural-border p-6 shadow-sm hover:scale-[1.02] transition-transform">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-natural-bg rounded-2xl text-natural-accent">{icon}</div>
        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg ${status.bg}`}>
          {status.label}
        </span>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">{title}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-serif font-semibold" style={{ color: status.color }}>
          {typeof value === "number" ? value.toFixed(3) : "—"}
        </span>
        <span className="text-sm opacity-40">{unit}</span>
      </div>
      <div className="mt-3 text-[9px] font-mono opacity-40">
        Optimal: {low} – {high} {unit}
      </div>
    </div>
  );
}

export function IoTSensorPanel() {
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [latest, setLatest] = useState<SensorReading>({ tds: 0, ec: 0, moisture: 0, created_at: "" });
  const [status, setStatus] = useState<"Connecting" | "Connected" | "Disconnected" | "Error">("Connecting");
  const [statusDetail, setStatusDetail] = useState<string>("");
  const clientRef = useRef<ReturnType<typeof mqtt.connect> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const host = import.meta.env.VITE_HIVEMQ_HOST as string | undefined;
    const username = import.meta.env.VITE_HIVEMQ_USERNAME as string | undefined;
    const password = import.meta.env.VITE_HIVEMQ_PASSWORD as string | undefined;

    if (!host || !username || !password) {
      console.error("[HiveMQ] Missing credentials in .env — restart Vite after editing .env");
      setStatus("Error");
      setStatusDetail("Missing VITE_HIVEMQ_* in frontend/.env (restart npm run dev)");
      return;
    }

    // Defer connect so React Strict Mode's immediate unmount doesn't abort a live socket
    const timer = window.setTimeout(() => {
      if (cancelled) return;

      const url = `wss://${host}:8884/mqtt`;
      console.log("[HiveMQ] Connecting to", url);
      setStatus("Connecting");
      setStatusDetail(host);

      const client = mqtt.connect(url, {
        username,
        password,
        clientId: "CropPulse_ui_" + Math.random().toString(16).slice(2, 10),
        reconnectPeriod: 4000,
        connectTimeout: 15000,
        clean: true,
        protocolVersion: 4,
      });

      clientRef.current = client;

      client.on("connect", () => {
        if (cancelled) return;
        console.log("[HiveMQ] Connection established");
        setStatus("Connected");
        setStatusDetail("farm/data");
        client.subscribe("farm/data", { qos: 1 }, (err) => {
          if (err) console.error("[HiveMQ] Subscription error:", err);
          else console.log("[HiveMQ] Subscribed to farm/data");
        });
      });

      client.on("message", (_topic, message) => {
        if (cancelled) return;
        try {
          const data = JSON.parse(message.toString());
          const reading: SensorReading = {
            tds: data.tds || 0,
            ec: data.ec || 0,
            moisture: data.moisture || 0,
            created_at: new Date().toISOString(),
          };
          setLatest(reading);
          setReadings((prev) => [...prev.slice(-49), reading]);
        } catch (e) {
          console.error("[HiveMQ] Message parse error:", e);
        }
      });

      client.on("error", (err) => {
        console.error("[HiveMQ] MQTT Error:", err);
        if (cancelled) return;
        setStatus("Error");
        setStatusDetail(err?.message || "MQTT connection failed");
      });

      client.on("reconnect", () => {
        if (cancelled) return;
        setStatus("Connecting");
        setStatusDetail("Reconnecting…");
      });

      client.on("close", () => {
        if (cancelled) return;
        setStatus((prev) => (prev === "Connected" ? "Disconnected" : prev));
      });
    }, 100);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (clientRef.current) {
        console.log("[HiveMQ] Disconnecting client");
        clientRef.current.removeAllListeners();
        clientRef.current.end(true);
        clientRef.current = null;
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Connection Badge */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-serif italic text-natural-primary">Live ESP32 Sensor Feed</h2>
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-natural-border rounded-full shadow-sm">
          {status === "Connected"
            ? <Wifi size={14} className="text-green-500" />
            : <WifiOff size={14} className="text-red-500 animate-pulse" />
          }
          <span className="text-[10px] font-bold uppercase tracking-widest">
            HiveMQ: {status}
          </span>
        </div>
      </div>

      {/* No data state */}
      {readings.length === 0 && (
        <div className="bg-natural-dark text-white p-6 rounded-3xl flex items-center gap-4">
          <Activity size={24} className="opacity-60 animate-pulse" />
          <div>
            <p className="font-semibold">Waiting for sensor data…</p>
            <p className="text-[11px] opacity-60 font-mono mt-1">
              Listening on topic: <code>farm/data</code>
              {status === "Error" && statusDetail ? ` — ${statusDetail}` : ""}
            </p>
          </div>
        </div>
      )}

      {/* Sensor Cards */}
      {readings.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" key="sensor-cards">
            <SensorCard key="moisture" title="Moisture"  value={latest.moisture} unit="%" icon={<Droplets size={20} />} low={41}  high={80} />
            <SensorCard key="ec" title="Conductivity (EC)" value={latest.ec}  unit="dS/m" icon={<Zap size={20} />}  low={0}   high={4.5} />
            <SensorCard key="tds" title="TDS" value={latest.tds} unit="ppm" icon={<Waves size={20} />} low={100} high={500} />
          </div>

          {/* Chart */}
          <div className="bg-white rounded-3xl border border-natural-border p-6 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-4">Live Trends</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={readings}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0ede5" vertical={false} />
                  <XAxis dataKey="created_at" hide />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="#999" />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", fontSize: "11px" }}
                    formatter={(val: number) => val.toFixed(4)}
                  />
                  <Line type="monotone" dataKey="moisture" stroke="#22c55e" strokeWidth={2} dot={false} name="Moisture %" />
                  <Line type="monotone" dataKey="ec"       stroke="#D27D56" strokeWidth={2} dot={false} name="EC dS/m" />
                  <Line type="monotone" dataKey="tds"      stroke="#06b6d4" strokeWidth={2} dot={false} name="TDS ppm" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* History Table */}
          <div className="bg-white rounded-3xl border border-natural-border overflow-hidden shadow-sm">
            <div className="p-4 border-b border-natural-border">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Data History</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-natural-bg text-[10px] font-bold uppercase tracking-widest opacity-60">
                  <tr>
                    <th className="px-5 py-3 text-left">Timestamp</th>
                    <th className="px-5 py-3 text-right text-green-600">Moisture %</th>
                    <th className="px-5 py-3 text-right text-amber-600">EC dS/m</th>
                    <th className="px-5 py-3 text-right text-cyan-600">TDS ppm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-natural-border">
                  {[...readings].reverse().map((r, i) => (
                    <tr key={`history-row-${r.created_at || i}-${i}`} className="hover:bg-natural-bg transition-colors">
                      <td className="px-5 py-3 font-mono text-[11px] opacity-50">
                        {format(new Date(r.created_at), "HH:mm:ss | MMM dd")}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold">{r.moisture?.toFixed(2)}</td>
                      <td className="px-5 py-3 text-right font-semibold">{r.ec?.toFixed(4)}</td>
                      <td className="px-5 py-3 text-right font-semibold">{r.tds?.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

