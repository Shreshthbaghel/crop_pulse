import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import mqtt from "mqtt";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Config ────────────────────────────────────────────────────────────────
const ML_SERVER_URL  = process.env.ML_SERVER_URL  || "http://localhost:8000";
const MQTT_BROKER    = process.env.MQTT_BROKER    || "mqtt://broker.hivemq.com";
const MQTT_TOPIC     = "soil/#";

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

  if (ec > 5.0)
    alerts.push({ type: "Critical", message: `CRITICAL: EC at ${ec} dS/m — extreme salinity will damage roots!` });
  else if (ec > 4.0)
    alerts.push({ type: "Warning", message: `ALERT: EC at ${ec} dS/m — salinity stress detected.` });

  if (temperature > 42)
    alerts.push({ type: "Critical", message: `CRITICAL: Soil temp ${temperature}°C — heat stress will destroy crops!` });
  else if (temperature > 38)
    alerts.push({ type: "Warning", message: `ALERT: Soil temp ${temperature}°C — approaching heat stress threshold.` });

  if (classification?.isAnomaly)
    alerts.push({ type: "Warning", message: `ANOMALY: Unusual sensor pattern detected (score: ${classification.anomalyScore?.toFixed(2)}). Verify sensors.` });

  if (cls !== "Normal" && !alerts.length)
    alerts.push({ type: "Info", message: `${cls} condition detected. Confidence: ${((classification?.confidence || 0) * 100).toFixed(1)}%` });

  return alerts;
}

// ── MQTT processing pipeline ──────────────────────────────────────────────
async function processReading(deviceId: string, rawData: any) {
  const { moisture, temperature, ec } = rawData;
  if (moisture === undefined || temperature === undefined || ec === undefined) return;

  // Validate ranges
  if (moisture < 0 || moisture > 100 || temperature < -20 || temperature > 80 || ec < 0 || ec > 20) {
    console.warn("[Pipeline] Reading out of range — skipped");
    return;
  }

  const r: RawReading = { moisture, temperature, ec, timestamp_ms: Date.now() };
  const features = computeFeatures(deviceId, r);

  // Push to buffer
  const history = readingBuffer.get(deviceId) || [];
  history.push(r);
  if (history.length > 20) history.shift();
  readingBuffer.set(deviceId, history);

  // ML inference
  const [classification, forecast] = await Promise.all([
    mlClassify(r, features),
    mlForecast(deviceId),
  ]);

  const irrigation = irrigationDecision(moisture, forecast);
  const alerts = evaluateAlerts(r, classification);

  const enriched = {
    deviceId,
    timestamp_ms: r.timestamp_ms,
    moisture, temperature, ec,
    classification: classification?.className ?? "Unknown",
    confidence: classification?.confidence ?? 0,
    probabilities: classification?.probabilities ?? {},
    anomalyScore: classification?.anomalyScore ?? 0,
    isAnomaly: classification?.isAnomaly ?? false,
    forecast,
    irrigation,
    alerts,
  };

  latestEnriched.set(deviceId, enriched);

  console.log(
    `[Pipeline] ${deviceId} | ${enriched.classification} (${(enriched.confidence * 100).toFixed(0)}%) | ` +
    `M:${moisture}% T:${temperature}°C EC:${ec} | Irrigation: ${irrigation.status}`
  );
}

// ── Express + Vite Server ─────────────────────────────────────────────────
async function startServer() {
  const app = express();
  const PORT = 3000;
  app.use(express.json());

  // ── MQTT subscriber ──
  const mqttClient = mqtt.connect(MQTT_BROKER);
  mqttClient.on("connect", () => {
    console.log("[MQTT] Connected to broker");
    mqttClient.subscribe(MQTT_TOPIC);
  });
  mqttClient.on("message", (topic, message) => {
    try {
      const data = JSON.parse(message.toString());
      const deviceId = data.device_id || topic.replace(/\//g, "_");
      processReading(deviceId, data).catch(console.error);
    } catch {
      console.error("[MQTT] Failed to parse message");
    }
  });

  // ── API Routes ──────────────────────────────────────────────────────────

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", message: "TerraSense Backend Active", mlServer: ML_SERVER_URL });
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
    const { moisture, temperature, ec, apiKey, device_id } = req.body;
    if (process.env.SENSOR_API_KEY && apiKey !== process.env.SENSOR_API_KEY)
      return res.status(401).json({ error: "Unauthorized" });
    if (moisture === undefined || temperature === undefined || ec === undefined)
      return res.status(400).json({ error: "Missing sensor fields" });

    const deviceId = device_id || "esp32_http_fallback";
    await processReading(deviceId, { moisture, temperature, ec, device_id: deviceId });
    res.json({ success: true, timestamp: new Date().toISOString() });
  });

  // ── Vite / Static ───────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
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
