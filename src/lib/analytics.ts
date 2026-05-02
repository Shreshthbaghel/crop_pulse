/**
 * Forensic trend analysis and forecasting for agricultural sensors.
 * Implements linear regression for simple time-series prediction.
 */

export interface TrendResult {
  slope: number;
  predictionTimeMinutes: number | null; // Minutes until threshold hit
  direction: "Increasing" | "Decreasing" | "Stable";
}

export function analyzeMoistureTrend(readings: any[], threshold: number = 25): TrendResult {
  if (readings.length < 5) {
    return { slope: 0, predictionTimeMinutes: null, direction: "Stable" };
  }

  // Use the last 10 readings for trend
  const recent = [...readings].slice(0, 10).reverse();
  const n = recent.length;
  
  // X is time in minutes from the first reading
  const startTime = recent[0].timestamp?.toDate().getTime() || Date.now();
  const data = recent.map((r, i) => ({
    x: (r.timestamp?.toDate().getTime() - startTime) / 60000, 
    y: r.moisture
  }));

  // Linear Regression (Least Squares)
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (const p of data) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumX2 += p.x * p.x;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  let predictionTimeMinutes = null;
  if (slope < -0.01) { // Decreasing
    // moisture = slope * time + intercept
    // threshold = slope * time + intercept => time = (threshold - intercept) / slope
    const timeToHit = (threshold - intercept) / slope;
    const currentTimeMinutes = (Date.now() - startTime) / 60000;
    predictionTimeMinutes = Math.max(0, timeToHit - currentTimeMinutes);
  }

  return {
    slope,
    predictionTimeMinutes: predictionTimeMinutes && predictionTimeMinutes < 1440 ? Math.round(predictionTimeMinutes) : null,
    direction: slope > 0.05 ? "Increasing" : slope < -0.05 ? "Decreasing" : "Stable"
  };
}
