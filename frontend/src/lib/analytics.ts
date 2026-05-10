/**
 * CropPulse Analytics Library
 * Trend analysis, soil health scoring, and feature importance data.
 */

export interface TrendResult {
  slope: number;
  predictionTimeMinutes: number | null;
  direction: "Increasing" | "Decreasing" | "Stable";
  ecDirection: "Increasing" | "Decreasing" | "Stable";
  tempDirection: "Increasing" | "Decreasing" | "Stable";
  healthScore: number; // 0–100
}

export interface FeatureImportance {
  name: string;
  importance: number;
  label: string;
}

const MOISTURE_THRESHOLD = 25; // % critical level

function linearSlope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (values[i] - yMean);
    den += (i - xMean) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

function direction(slope: number): "Increasing" | "Decreasing" | "Stable" {
  if (slope > 0.05) return "Increasing";
  if (slope < -0.05) return "Decreasing";
  return "Stable";
}

export function analyzeMoistureTrend(readings: any[]): TrendResult {
  if (readings.length < 5) {
    return { slope: 0, predictionTimeMinutes: null, direction: "Stable", ecDirection: "Stable", tempDirection: "Stable", healthScore: 50 };
  }

  const recent = [...readings].slice(0, 10).reverse();
  const n = recent.length;
  const startTime = recent[0].timestamp?.toDate().getTime() || Date.now();

  // Moisture linear regression with time
  const data = recent.map((r) => ({
    x: (r.timestamp?.toDate().getTime() - startTime) / 60_000,
    y: r.moisture,
  }));
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (const p of data) { sumX += p.x; sumY += p.y; sumXY += p.x * p.y; sumX2 += p.x * p.x; }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX || 1);
  const intercept = (sumY - slope * sumX) / n;

  let predictionTimeMinutes: number | null = null;
  if (slope < -0.01) {
    const timeToHit = (MOISTURE_THRESHOLD - intercept) / slope;
    const currentMin = (Date.now() - startTime) / 60_000;
    const delta = Math.max(0, timeToHit - currentMin);
    if (delta < 1440) predictionTimeMinutes = Math.round(delta);
  }

  // EC and temp trends
  const ecSlope  = linearSlope(recent.map((r) => r.ec));
  const tmpSlope = linearSlope(recent.map((r) => r.temperature));

  // Health score (0–100)
  const latestM  = recent[n - 1].moisture;
  const latestEC = recent[n - 1].ec;
  const latestT  = recent[n - 1].temperature;

  let score = 100;
  // Moisture penalty
  if (latestM < 15) score -= 40;
  else if (latestM < 25) score -= 25;
  else if (latestM > 80) score -= 15;
  // EC penalty
  if (latestEC > 5) score -= 30;
  else if (latestEC > 4) score -= 20;
  else if (latestEC < 0.5) score -= 15;
  // Temp penalty
  if (latestT > 42) score -= 25;
  else if (latestT > 38) score -= 10;
  // Trend penalty
  if (slope < -0.5) score -= 10;

  return {
    slope,
    predictionTimeMinutes: predictionTimeMinutes !== null && predictionTimeMinutes < 1440 ? predictionTimeMinutes : null,
    direction: direction(slope),
    ecDirection: direction(ecSlope),
    tempDirection: direction(tmpSlope),
    healthScore: Math.max(0, Math.min(100, Math.round(score))),
  };
}

/** Static feature importance ranking matching our RF model. */
export function getFeatureImportances(): FeatureImportance[] {
  return [
    { name: "ec",                        importance: 0.28, label: "Electrical Conductivity" },
    { name: "moisture",                   importance: 0.24, label: "Soil Moisture" },
    { name: "temperature",               importance: 0.16, label: "Temperature" },
    { name: "ec_rate_of_change",         importance: 0.10, label: "EC Rate of Change" },
    { name: "moisture_rate_of_change",   importance: 0.09, label: "Moisture Rate of Change" },
    { name: "moisture_rolling_mean_6h",  importance: 0.06, label: "Moisture Rolling Mean" },
    { name: "ec_rolling_mean_6h",        importance: 0.04, label: "EC Rolling Mean" },
    { name: "temp_rate_of_change",       importance: 0.02, label: "Temp Rate of Change" },
    { name: "hour_of_day",               importance: 0.01, label: "Hour of Day" },
  ];
}

export function getOptimalRanges(cropType: string, growthStage: string) {
  // Baseline optimal ranges based on research:
  // Moisture (Vegetables): 41-80%
  // Temperature (Vegetables): 18-24°C
  // EC (Non-saline): 0-4.5 dS/m
  let ranges = {
    moisture: [41, 80],
    temp: [18, 24],
    ec: [0, 4.5]
  };

  // Adjust by crop type
  if (cropType === "Tomatoes") {
    ranges.ec = [2.0, 3.5];
    ranges.moisture = [60, 80];
  } else if (cropType === "Wheat") {
    ranges.ec = [1.0, 2.0];
    ranges.moisture = [40, 60];
  } else if (cropType === "Rice") {
    ranges.ec = [0.8, 1.8];
    ranges.moisture = [80, 100];
  } else if (cropType === "Corn") {
    ranges.ec = [1.5, 2.8];
  }

  // Adjust by growth stage
  if (growthStage === "Germination") {
    ranges.moisture = [ranges.moisture[0] + 10, ranges.moisture[1]];
    ranges.ec = [ranges.ec[0] - 0.5, ranges.ec[1] - 0.5];
  } else if (growthStage === "Flowering") {
    ranges.moisture = [ranges.moisture[0], ranges.moisture[1] - 5];
  }

  return ranges;
}

