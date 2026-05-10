import { GoogleGenAI, Type } from "@google/genai";

const getApiKey = () => {
  const key = (process.env.GEMINI_API_KEY) || (import.meta as any).env.VITE_GEMINI_API_KEY || "";
  if (!key || key === "MY_GEMINI_API_KEY" || key === "undefined" || key === "null") {
    console.warn("Gemini API Key is missing or invalid.");
    return "";
  }
  return key;
};

let aiInstance: any = null;
const getAI = () => {
  const key = getApiKey();
  if (!key) return null;
  if (!aiInstance) {
    try { aiInstance = new GoogleGenAI({ apiKey: key }); }
    catch (e) { console.error("Failed to initialize GoogleGenAI:", e); return null; }
  }
  return aiInstance;
};

// ── Rule-based soil classifier (instant, no API needed) ────────────────────
export function classifySoil(moisture: number, temperature: number, ec: number): string {
  if (ec > 4.0)                     return "Salinity Stress";
  if (moisture < 20)                return "Water Deficiency";
  if (temperature > 38)             return "Heat Stress";
  if (ec > 2.5 && moisture > 40)   return "Over-Fertilization";
  if (ec < 0.5)                     return "Nutrient Imbalance";
  return "Normal";
}

// ── Stress Duration Calculator ─────────────────────────────────────────────
// Walks backwards through readings to find how long the current stress has persisted
export interface StressDuration {
  consecutiveReadings: number;
  durationMinutes: number;
  startMoisture: number;
  currentMoisture: number;
  startEC: number;
  currentEC: number;
  startTemp: number;
  currentTemp: number;
}

export function calculateStressDuration(
  readings: any[],
  currentClass: string
): StressDuration | null {
  if (!readings || readings.length < 2 || currentClass === "Normal") return null;

  let count = 0;
  for (const r of readings) {
    const cls = r.classification || classifySoil(r.moisture, r.temperature, r.ec);
    if (cls === currentClass) count++;
    else break;
  }

  if (count < 2) return null;

  const newest = readings[0];
  const oldest = readings[Math.min(count - 1, readings.length - 1)];

  const newestTime = newest.timestamp?.toDate?.()?.getTime?.() ?? Date.now();
  const oldestTime = oldest.timestamp?.toDate?.()?.getTime?.() ?? newestTime;
  const durationMinutes = Math.round((newestTime - oldestTime) / 60_000);

  return {
    consecutiveReadings: count,
    durationMinutes: Math.max(durationMinutes, count), // at least 1 min per reading
    startMoisture: oldest.moisture,
    currentMoisture: newest.moisture,
    startEC: oldest.ec,
    currentEC: newest.ec,
    startTemp: oldest.temperature,
    currentTemp: newest.temperature,
  };
}

// ── Structured Recommendation Schema ───────────────────────────────────────
const RECOMMENDATION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    immediateAction: {
      type: Type.STRING,
      description: "One clear, urgent sentence the farmer should do RIGHT NOW."
    },
    irrigationPrescription: {
      type: Type.OBJECT,
      properties: {
        volumeLitersPerSqM: { type: Type.NUMBER, description: "Liters of water per square meter" },
        timing: { type: Type.STRING, description: "When to irrigate, e.g. 'Within 2 hours' or 'At 6 AM tomorrow'" },
        method: { type: Type.STRING, description: "Drip, sprinkler, flood, or manual" },
        duration: { type: Type.STRING, description: "How long to run irrigation" },
      },
      required: ["volumeLitersPerSqM", "timing", "method", "duration"],
    },
    fortyEightHourPlan: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Ordered list of specific tasks for the next 48 hours, each starting with a time like 'Hour 0:', 'Hour 6:', etc."
    },
    riskIfUntreated: {
      type: Type.STRING,
      description: "One sentence describing the specific crop damage that will occur if the farmer does nothing."
    },
    fertilizerNote: {
      type: Type.STRING,
      description: "Specific fertilizer recommendation or 'No fertilizer change needed' if not applicable."
    },
    confidencePercent: {
      type: Type.NUMBER,
      description: "Your confidence in this prescription, 0-100."
    },
    urgency: {
      type: Type.STRING,
      description: "One of: CRITICAL, HIGH, MEDIUM, LOW"
    },
  },
  required: ["immediateAction", "irrigationPrescription", "fortyEightHourPlan", "riskIfUntreated", "fertilizerNote", "confidencePercent", "urgency"],
};

// ── Soil Recommendations (main dashboard panel) ────────────────────────────
export async function getSoilRecommendations(metrics: {
  moisture: number;
  temperature: number;
  ec: number;
  classification: string;
  confidence?: number;
  anomalyScore?: number;
  forecast?: { t1h?: number; t2h?: number; t4h?: number; timeToThresholdMinutes?: number | null };
  history?: any[];
}) {
  const ai = getAI();
  const fallback = {
    immediateAction: "Monitor soil conditions and check sensor calibration.",
    irrigationPrescription: { volumeLitersPerSqM: 0, timing: "As needed", method: "Drip", duration: "N/A" },
    fortyEightHourPlan: ["Check soil moisture every 2 hours", "Verify irrigation system", "Calibrate EC probe"],
    riskIfUntreated: "Unable to assess — configure Gemini API Key for full analysis.",
    fertilizerNote: "No recommendation available without AI analysis.",
    confidencePercent: 0,
    urgency: "MEDIUM",
  };

  if (!ai) return fallback;

  // Step 1: Calculate stress duration from history
  const stressDuration = calculateStressDuration(metrics.history || [], metrics.classification);

  const stressContext = stressDuration
    ? `STRESS DURATION: "${metrics.classification}" has been active for ${stressDuration.consecutiveReadings} consecutive readings over ${stressDuration.durationMinutes} minutes. Moisture moved from ${stressDuration.startMoisture}% → ${stressDuration.currentMoisture}%. EC moved from ${stressDuration.startEC} → ${stressDuration.currentEC} dS/m. Temp moved from ${stressDuration.startTemp}°C → ${stressDuration.currentTemp}°C.`
    : `No sustained stress detected. Current classification: "${metrics.classification}".`;

  const forecastContext = metrics.forecast?.timeToThresholdMinutes
    ? `MOISTURE FORECAST: Critical threshold breach predicted in ~${metrics.forecast.timeToThresholdMinutes} minutes. Predicted: 1h→${metrics.forecast.t1h}%, 2h→${metrics.forecast.t2h}%, 4h→${metrics.forecast.t4h}%.`
    : metrics.forecast?.t1h !== undefined
      ? `MOISTURE FORECAST: 1h→${metrics.forecast.t1h}%, 2h→${metrics.forecast.t2h}%, 4h→${metrics.forecast.t4h}%.`
      : "No moisture forecast available.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `You are a senior precision-agriculture agronomist with 20 years of field experience in IoT-based soil management. You never give vague advice. Every recommendation includes specific quantities, specific timing, and specific methods.

SENSOR DATA:
- Soil Moisture: ${metrics.moisture}%
- Soil Temperature: ${metrics.temperature}°C
- Electrical Conductivity (EC): ${metrics.ec} dS/m

ML CLASSIFICATION: "${metrics.classification}" at ${((metrics.confidence || 0) * 100).toFixed(0)}% confidence.
Anomaly Score: ${metrics.anomalyScore?.toFixed(2) ?? "N/A"} (values below -0.1 indicate anomalous patterns).

${stressContext}

${forecastContext}

Based on ALL of the above data, provide a precise, actionable soil management prescription. Be specific — include exact water volumes, exact timing, and exact fertilizer quantities where applicable. Do NOT give generic advice.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: RECOMMENDATION_SCHEMA,
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty Gemini response");
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("Gemini error:", error);
    return fallback;
  }
}

// ── Crop Advisor Schema ────────────────────────────────────────────────────
const CROP_ADVISOR_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    immediateAction: {
      type: Type.STRING,
      description: "The single most important thing to do right now for this crop."
    },
    irrigationPrescription: {
      type: Type.OBJECT,
      properties: {
        volumeLitersPerSqM: { type: Type.NUMBER },
        timing: { type: Type.STRING },
        method: { type: Type.STRING },
        frequency: { type: Type.STRING, description: "How often to repeat, e.g. 'Every 12 hours' or 'Once'" },
      },
      required: ["volumeLitersPerSqM", "timing", "method", "frequency"],
    },
    fortyEightHourPlan: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Ordered checklist for next 48 hours. Each item starts with a time offset."
    },
    riskIfUntreated: {
      type: Type.STRING,
      description: "Specific damage to THIS crop at THIS growth stage if no action is taken."
    },
    fertilizerNote: {
      type: Type.STRING,
      description: "Exact fertilizer type, NPK ratio, and application rate for this crop+stage, or 'None needed'."
    },
    yieldImpact: {
      type: Type.STRING,
      description: "Estimated yield impact percentage if current conditions persist vs. if corrected."
    },
    confidencePercent: { type: Type.NUMBER },
    urgency: { type: Type.STRING, description: "CRITICAL, HIGH, MEDIUM, or LOW" },
  },
  required: ["immediateAction", "irrigationPrescription", "fortyEightHourPlan", "riskIfUntreated", "fertilizerNote", "yieldImpact", "confidencePercent", "urgency"],
};

// ── Crop Advisor (Crop Advisor tab) ────────────────────────────────────────
export async function getCropAdvisorAdvice(params: {
  cropType: string;
  growthStage: string;
  irrigationMethod: string;
  soilType: string;
  region: string;
  moisture: number;
  temperature: number;
  ec: number;
  classification: string;
  confidence: number;
  forecast?: { t1h?: number; t2h?: number; timeToThresholdMinutes?: number | null };
  history?: any[];
}) {
  const ai = getAI();
  const fallback = {
    immediateAction: "Configure Gemini API Key for crop-specific advice.",
    irrigationPrescription: { volumeLitersPerSqM: 0, timing: "N/A", method: "N/A", frequency: "N/A" },
    fortyEightHourPlan: ["Set up Gemini API Key", "Run a test simulation"],
    riskIfUntreated: "Unable to assess without AI.",
    fertilizerNote: "No data.",
    yieldImpact: "Unknown.",
    confidencePercent: 0,
    urgency: "MEDIUM",
  };

  if (!ai) return fallback;

  // Stress duration from history
  const stressDuration = calculateStressDuration(params.history || [], params.classification);

  const stressContext = stressDuration
    ? `ACTIVE STRESS: "${params.classification}" persisting for ${stressDuration.consecutiveReadings} consecutive readings (~${stressDuration.durationMinutes} min). Moisture: ${stressDuration.startMoisture}% → ${stressDuration.currentMoisture}%. EC: ${stressDuration.startEC} → ${stressDuration.currentEC} dS/m.`
    : `Current classification: "${params.classification}". No sustained stress detected.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `You are a senior agronomist specializing in ${params.cropType} cultivation in ${params.region || "tropical"} regions. You have managed IoT-monitored fields for 15+ years. You NEVER give generic advice — every recommendation is calibrated to the exact crop, growth stage, and soil readings provided.

CROP PROFILE:
- Crop: ${params.cropType}
- Growth Stage: ${params.growthStage}
- Irrigation Method: ${params.irrigationMethod || "Drip"}
- Soil Type: ${params.soilType || "Loamy"}
- Region: ${params.region || "Tropical India"}

LIVE SENSOR READINGS:
- Soil Moisture: ${params.moisture}%
- Soil Temperature: ${params.temperature}°C
- Electrical Conductivity: ${params.ec} dS/m

ML CLASSIFICATION: "${params.classification}" at ${(params.confidence * 100).toFixed(0)}% confidence.

${stressContext}

${params.forecast?.timeToThresholdMinutes
  ? `⚠ URGENT: Moisture forecast predicts critical threshold breach in ~${params.forecast.timeToThresholdMinutes} minutes!`
  : params.forecast?.t1h !== undefined
    ? `Moisture forecast: 1h→${params.forecast.t1h}%, 2h→${params.forecast.t2h}%.`
    : "No forecast data."}

Given ALL the above, provide a precise prescription for this ${params.cropType} crop at ${params.growthStage} stage. Include exact water volumes, exact fertilizer quantities (NPK ratios), and specific timing. Account for the ${params.irrigationMethod || "drip"} irrigation system and ${params.soilType || "loamy"} soil water retention characteristics.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: CROP_ADVISOR_SCHEMA,
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response");
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("Crop advisor error:", error);
    return fallback;
  }
}
