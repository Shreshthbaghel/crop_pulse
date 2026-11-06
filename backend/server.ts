import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import mqtt from "mqtt";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import { sendSMSNotification, isTwilioReady } from "./services/twilioService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Config ────────────────────────────────────────────────────────────────
const ML_SERVER_URL  = process.env.ML_SERVER_URL  || "http://localhost:8000";
const MQTT_BROKER    = process.env.MQTT_BROKER    || "mqtt://broker.hivemq.com";
const MQTT_TOPIC     = "farm/data";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.warn("[Supabase] Warning: URL or Service Role Key missing from environment.");
}

const supabase = createClient(
  SUPABASE_URL || "https://placeholder.supabase.co",
  SUPABASE_SERVICE_ROLE || "placeholder-key"
);

const CLASS_NAMES = [
  "Normal",
  "Water Deficiency",
  "Salinity Stress",
  "Over-Fertilization",
  "Nutrient Imbalance",
  "Heat Stress",
];

// ── In-memory reading buffers ─────────────────────────────────────────────
// Keyed by deviceId — last 20 readings for feature engineering
interface RawReading { moisture: number; temperature: number; ec: number; timestamp_ms: number; }
const readingBuffer = new Map<string, RawReading[]>();

// Latest enriched reading per device (served to frontend via /api/latest)
const latestEnriched = new Map<string, any>();

// Farmer preferences (Soil Type, etc.)
const userPreferences = new Map<string, { soil_type: string }>();

// ── Feature engineering ───────────────────────────────────────────────────
function computeFeatures(deviceId: string, r: RawReading) {
  const history = readingBuffer.get(deviceId) || [];
  const prev = history[history.length - 1];

  const mrc = prev ? r.moisture    - prev.moisture    : 0;
  const erc = prev ? r.ec          - prev.ec          : 0;
  const trc = prev ? r.temperature - prev.temperature : 0;

  const recent = history.slice(-12); // ~last 6 min at 30s intervals
  const mrm = recent.length > 0
    ? recent.reduce((s, x) => s + x.moisture, 0) / recent.length
    : r.moisture;
  const erm = recent.length > 0
    ? recent.reduce((s, x) => s + x.ec, 0) / recent.length
    : r.ec;

  const hour = new Date().getHours();
  return { mrc, erc, trc, mrm, erm, hour };
}

// ── ML API calls ──────────────────────────────────────────────────────────
async function mlClassify(r: RawReading, features: ReturnType<typeof computeFeatures>) {
  try {
    const res = await fetch(`${ML_SERVER_URL}/predict/classify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        moisture: r.moisture,
        temperature: r.temperature,
        ec: r.ec,
        moisture_rate_of_change: features.mrc,
        ec_rate_of_change: features.erc,
        temp_rate_of_change: features.trc,
        moisture_rolling_mean_6h: features.mrm,
        ec_rolling_mean_6h: features.erm,
        hour_of_day: features.hour,
      }),
    });
    if (!res.ok) throw new Error(`ML classify HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn("[ML] classify error:", e);
    return null;
  }
}

async function mlForecast(deviceId: string) {
  const history = readingBuffer.get(deviceId) || [];
  if (history.length < 3) return null;
  try {
    const res = await fetch(`${ML_SERVER_URL}/predict/forecast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reading_history: history.slice(-20).map(h => ({
          moisture: h.moisture,
          timestamp_ms: h.timestamp_ms,
        })),
      }),
    });
    if (!res.ok) throw new Error(`ML forecast HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn("[ML] forecast error:", e);
    return null;
  }
}

async function mlFertilizer(r: RawReading, userId?: string) {
  // Fetch farmer's soil type preference, default to "Loamy"
  const prefs = userId ? userPreferences.get(userId) : null;
  const farmerSoil = prefs?.soil_type || "Loamy";

  try {
    const res = await fetch(`${ML_SERVER_URL}/predict/fertilizer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        temperature: r.temperature,
        moisture: r.moisture,
        soil_type: farmerSoil
      }),
    });
    if (!res.ok) throw new Error(`ML fertilizer HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn("[ML] fertilizer error:", e);
    return null;
  }
}

// ── Soil Health Logic ──────────────────────────────────────────────────────
function calculateSoilHealth(moisture: number, temperature: number, ec: number) {
  const tds = ec * 500;
  
  let mScore = 0;
  const mDist = moisture < 40 ? 40 - moisture : moisture > 70 ? moisture - 70 : 0;
  if (mDist === 0) mScore = 100;
  else if (mDist <= 10) mScore = 75;
  else if (mDist <= 25) mScore = 50;
  else if (mDist <= 40) mScore = 25;
  else mScore = 0;

  let tScore = 0;
  const tDist = temperature < 20 ? 20 - temperature : temperature > 35 ? temperature - 35 : 0;
  if (tDist === 0) tScore = 100;
  else if (tDist <= 5) tScore = 75;
  else if (tDist <= 10) tScore = 50;
  else if (tDist <= 15) tScore = 25;
  else tScore = 0;

  let tdsScore = 0;
  if (tds >= 600 && tds <= 1600) tdsScore = 100;
  else if ((tds >= 500 && tds < 600) || (tds > 1600 && tds <= 1800)) tdsScore = 75;
  else if ((tds >= 300 && tds < 500) || (tds > 1800 && tds <= 2000)) tdsScore = 50;
  else if ((tds >= 100 && tds < 300) || (tds > 2000 && tds <= 2500)) tdsScore = 25;
  else tdsScore = 0;

  return Math.round((mScore * 0.35) + (tScore * 0.25) + (tdsScore * 0.40));
}

// ── Irrigation decision ───────────────────────────────────────────────────
function irrigationDecision(moisture: number, forecast: any) {
  const timeToThreshold = forecast?.timeToThresholdMinutes;

  if (moisture > 60)
    return { status: "No Irrigation Needed", reason: "Soil moisture is optimal", urgency: "low" };

  if (timeToThreshold && timeToThreshold < 60)
    return { status: "Irrigate Now", reason: `Critical threshold in ~${timeToThreshold} min`, urgency: "critical" };

  if (moisture < 25)
    return { status: "Irrigate Now", reason: "Moisture below 25% — drought risk", urgency: "high" };

  if (moisture < 35)
    return { status: "Irrigate Soon", reason: "Monitor over next 2 hours", urgency: "medium" };

  return { status: "Monitor", reason: "Conditions stable", urgency: "low" };
}

// ── Alert thresholds ──────────────────────────────────────────────────────
function evaluateAlerts(r: RawReading, classification: any) {
  const alerts: { type: string; message: string }[] = [];
  const { moisture, temperature, ec } = r;
  const cls = classification?.className || "Unknown";

  if (moisture < 15)
    alerts.push({ type: "Critical", message: `CRITICAL: Moisture at ${moisture}% — severe drought stress detected!` });
  else if (moisture < 25)
    alerts.push({ type: "Warning", message: `ALERT: Moisture dropping to ${moisture}% — irrigation required soon.` });
  else if (moisture > 85)
    alerts.push({ type: "Warning", message: `ALERT: Moisture at ${moisture}% — over-watering detected! Risk of root rot.` });

  if (ec > 5.0)
    alerts.push({ type: "Critical", message: `CRITICAL: EC at ${ec} dS/m — extreme salinity detected!` });
  else if (ec > 4.0)
    alerts.push({ type: "Warning", message: `ALERT: EC at ${ec} dS/m — rising salinity levels.` });

  if (temperature > 42)
    alerts.push({ type: "Critical", message: `CRITICAL: Soil temp ${temperature}°C — severe heat stress!` });
  else if (temperature > 38)
    alerts.push({ type: "Warning", message: `ALERT: Soil temp ${temperature}°C — high temperature threshold reached.` });

  if (classification?.isAnomaly)
    alerts.push({ type: "Warning", message: `ANOMALY: Unusual sensor behavior detected (score: ${classification.anomalyScore?.toFixed(2)}).` });

  if (cls !== "Normal" && !alerts.length)
    alerts.push({ type: "Info", message: `${cls} condition detected. Confidence: ${((classification?.confidence || 0) * 100).toFixed(1)}%` });

  return alerts;
}

let globalMqttClient: any = null;

// ── MQTT processing pipeline ──────────────────────────────────────────────
async function processReading(deviceId: string, rawData: any, userId?: string) {
  const { moisture, temperature, ec } = rawData;
  if (moisture === undefined || temperature === undefined || ec === undefined) return;

  // Validate ranges
  if (moisture < 0 || moisture > 100 || temperature < -20 || temperature > 80 || ec < 0 || ec > 20) {
    console.warn("[Pipeline] Reading out of range — skipped");
    return;
  }

  const r: RawReading = { moisture, temperature, ec, timestamp_ms: Date.now() };
  const features = computeFeatures(deviceId, r);

  // Identify user for preference lookups
  const finalUserId = userId || rawData.user_id;

  // Push to buffer
  const history = readingBuffer.get(deviceId) || [];
  history.push(r);
  if (history.length > 20) history.shift();
  readingBuffer.set(deviceId, history);

  // ML inference
  const [classification, forecast, fertilizer] = await Promise.all([
    mlClassify(r, features),
    mlForecast(deviceId),
    mlFertilizer(r, finalUserId)
  ]);

  const irrigation = irrigationDecision(moisture, forecast);
  const alerts = evaluateAlerts(r, classification);

  const enriched = {
    deviceId,
    timestamp_ms: r.timestamp_ms,
    moisture, temperature, ec,
    tds: ec * 500,
    soil_health_score: calculateSoilHealth(moisture, temperature, ec),
    classification: classification?.className ?? "Unknown",
    confidence: classification?.confidence ?? 0,
    probabilities: classification?.probabilities ?? {},
    anomalyScore: classification?.anomalyScore ?? 0,
    isAnomaly: classification?.isAnomaly ?? false,
    forecast,
    fertilizer,
    irrigation,
    alerts,
  };

  latestEnriched.set(deviceId, enriched);

  // Publish Enriched Data back to MQTT for the Frontend
  if (globalMqttClient && globalMqttClient.connected) {
    const topic = "farm/data";
    globalMqttClient.publish(topic, JSON.stringify(enriched), { qos: 1, retain: true });
  }

  // Persistence: Write to Supabase
  try {
    const insertData: any = {
      moisture,
      temperature,
      ec,
      tds: enriched.tds,
      soil_health_score: enriched.soil_health_score,
      classification: enriched.classification,
      confidence: enriched.confidence,
      anomaly_score: enriched.anomalyScore,
      is_anomaly: enriched.isAnomaly,
      forecast: enriched.forecast ?? {},
      irrigation: enriched.irrigation,
      fertilizer: enriched.fertilizer,
      device_id: deviceId
    };
    
    if (finalUserId) {
      insertData.user_id = finalUserId;
    }

    const { error: readErr } = await supabase.from("readings").insert(insertData);
    if (readErr) throw readErr;

    if (finalUserId && alerts.length > 0) {
      await supabase.from("alerts").insert(alerts.map(a => ({
        type: a.type,
        message: a.message,
        resolved: false,
        user_id: finalUserId
      })));

      // Trigger SMS for critical/warning alerts
      for (const alert of alerts) {
        if (alert.type === 'Critical' || alert.type === 'Warning') {
          await sendSMSNotification(finalUserId, alert.message);
        }
      }
    }
  } catch (e) {
    console.error("[Supabase] Failed to persist reading:", e);
  }

  console.log(
    `[Pipeline] ${deviceId} | ${enriched.classification} (${(enriched.confidence * 100).toFixed(0)}%) | ` +
    `M:${moisture}% T:${temperature}°C EC:${ec} | Irrigation: ${irrigation.status}`
  );
}

// ── Express + Vite Server ─────────────────────────────────────────────────
async function startServer() {
  const app = express();
  const PORT = 3000;
  app.use(cors({ origin: '*' }));
  app.use(express.json());

  // ── MQTT subscriber ──
  const mqttHost = process.env.VITE_HIVEMQ_HOST || "broker.hivemq.com";
  const mqttBrokerUrl = mqttHost.includes("hivemq.cloud") 
    ? `mqtts://${mqttHost}:8883` 
    : `mqtt://${mqttHost}`;

  console.log(`[MQTT] Connecting to ${mqttBrokerUrl}...`);
  
  const mqttClient = mqtt.connect(mqttBrokerUrl, {
    username: process.env.HIVEMQ_USERNAME || process.env.VITE_HIVEMQ_USERNAME,
    password: process.env.HIVEMQ_PASSWORD || process.env.VITE_HIVEMQ_PASSWORD,
  });

  globalMqttClient = mqttClient;

  mqttClient.on("connect", () => {
    console.log("[MQTT] Connected to HiveMQ Cloud");
    // Subscribe to incoming sensor data from hardware/simulator
    mqttClient.subscribe("soil/+/+");
    // Also subscribe to the output topic for state sync
    mqttClient.subscribe("farm/data");
  });

  mqttClient.on("message", (topic, message) => {
    try {
      const data = JSON.parse(message.toString());
      // Skip if this is an already enriched message from our own pipeline
      if (data.classification) return;
      
      const deviceId = data.device_id || topic.replace(/\//g, "_");
      processReading(deviceId, data).catch(console.error);
    } catch {
      console.error("[MQTT] Failed to parse message");
    }
  });

  // ── API Routes ──────────────────────────────────────────────────────────

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", message: "CropPulse Backend Active", mlServer: ML_SERVER_URL });
  });

  // Proxy: ML classify (called directly from frontend for simulation)
  app.post("/api/predict/classify", async (req, res) => {
    try {
      const mlRes = await fetch(`${ML_SERVER_URL}/predict/classify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });
      const data = await mlRes.json();
      res.json(data);
    } catch (e) {
      res.status(503).json({ error: "ML server unavailable", details: String(e) });
    }
  });

  // Proxy: ML forecast
  app.post("/api/predict/forecast", async (req, res) => {
    try {
      const mlRes = await fetch(`${ML_SERVER_URL}/predict/forecast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });
      const data = await mlRes.json();
      res.json(data);
    } catch (e) {
      res.status(503).json({ error: "ML server unavailable", details: String(e) });
    }
  });

  // Proxy: ML fertilizer
  app.post("/api/predict/fertilizer", async (req, res) => {
    try {
      const mlRes = await fetch(`${ML_SERVER_URL}/predict/fertilizer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });
      const data = await mlRes.json();
      res.json(data);
    } catch (e) {
      res.status(503).json({ error: "ML server unavailable", details: String(e) });
    }
  });

  // Sync farmer settings
  app.post("/api/user-settings", (req, res) => {
    const { userId, soil_type } = req.body;
    if (!userId || !soil_type) return res.status(400).json({ error: "Missing userId or soil_type" });
    
    userPreferences.set(userId, { soil_type });
    console.log(`[Settings] Updated soil preference for ${userId} -> ${soil_type}`);
    res.json({ success: true, soil_type });
  });

  // Proxy: Model info
  app.get("/api/model/info", async (_req, res) => {
    try {
      const mlRes = await fetch(`${ML_SERVER_URL}/model/info`);
      const data = await mlRes.json();
      res.json(data);
    } catch (e) {
      res.status(503).json({ error: "ML server unavailable", details: String(e) });
    }
  });

  // Latest enriched reading from MQTT pipeline
  app.get("/api/latest", (_req, res) => {
    const all = Object.fromEntries(latestEnriched.entries());
    res.json(all);
  });

  // Sensor data ingest (for direct HTTP posting from ESP32 as fallback)
  app.post("/api/sensor-data", async (req, res) => {
    const { moisture, temperature, ec, apiKey, device_id, user_id } = req.body;
    if (process.env.SENSOR_API_KEY && apiKey !== process.env.SENSOR_API_KEY)
      return res.status(401).json({ error: "Unauthorized" });
    if (moisture === undefined || temperature === undefined || ec === undefined)
      return res.status(400).json({ error: "Missing sensor fields" });

    const deviceId = device_id || "esp32_http_fallback";
    await processReading(deviceId, { moisture, temperature, ec, device_id: deviceId }, user_id);
    res.json({ success: true, timestamp: new Date().toISOString() });
  });

  // ── Vite / Static ───────────────────────────────────────────────────────
  // Only embed Vite when explicitly requested. Running frontend separately on
  // :5173 avoids tsx watch restart loops from Vite temp files.
  if (process.env.SERVE_FRONTEND === "true") {
    const vite = await createViteServer({
      root: path.join(__dirname, "../frontend"),
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (process.env.NODE_ENV === "production") {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n[Server] Running on http://localhost:${PORT}`);
    console.log(`[Server] ML Server at ${ML_SERVER_URL}`);
  });
}

startServer();
