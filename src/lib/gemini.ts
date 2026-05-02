import { GoogleGenAI, Type } from "@google/genai";

// According to the gemini-api skill, we should use process.env.GEMINI_API_KEY
// In Vite, this is enabled by the define block in vite.config.ts
const getApiKey = () => {
  // Consolidate possible locations of the API key
  // prioritize process.env which is mapped in vite.config.ts
  const key = (process.env.GEMINI_API_KEY) || (import.meta as any).env.VITE_GEMINI_API_KEY || "";
  
  if (!key || key === "MY_GEMINI_API_KEY" || key === "undefined" || key === "null") {
    console.warn("Gemini API Key is missing or invalid.");
    return "";
  }
  return key;
};

// Lazy initialization to avoid crash at top level
let aiInstance: any = null;
const getAI = () => {
  const key = getApiKey();
  if (!key) return null;
  if (!aiInstance) {
    try {
      aiInstance = new GoogleGenAI({ apiKey: key });
    } catch (e) {
      console.error("Failed to initialize GoogleGenAI:", e);
      return null;
    }
  }
  return aiInstance;
};

export async function getSoilRecommendations(metrics: { 
  moisture: number, 
  temperature: number, 
  ec: number, 
  classification: string,
  history?: any[] 
}) {
  const ai = getAI();
  if (!ai) {
    return {
      recommendation: "Please provide a valid Gemini API Key in the settings.",
      confidence: 0,
      reasoning: "API Key missing or set to placeholder.",
      urgency: "Medium",
      nextSteps: ["Update API Key in Settings"]
    };
  }

  try {
    const historyContext = metrics.history ? 
      `Recent history (last ${metrics.history.length} readings): ${JSON.stringify(metrics.history.map(h => ({ m: h.moisture, t: h.temperature, e: h.ec, c: h.classification })))}` : "";

    const prompt = `Act as an expert agronomist specialized in IoT-based agriculture.
Analyze these real-time soil metrics and provide strategic advice.
Current Metrics:
- Moisture: ${metrics.moisture}%
- Temperature: ${metrics.temperature}°C
- Electrical Conductivity (EC/Salinity): ${metrics.ec} mS/cm
- Automated Classification: ${metrics.classification}

${historyContext}

Your response MUST be a single JSON object.`;

    // Use gemini-3-flash-preview as recommended by the skill for general text tasks
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendation: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
            urgency: { type: Type.STRING },
            nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["recommendation", "confidence", "reasoning", "urgency", "nextSteps"]
        }
      }
    });

    console.log("Gemini Analysis Successful");
    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini");
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("Gemini Intel Error:", error);
    return {
      recommendation: "Stabilize moisture levels to baseline.",
      confidence: 0.5,
      reasoning: "Standard fallback due to processing error. Check API Key and network.",
      urgency: "Medium",
      nextSteps: ["Check sensor connection", "Calibrate EC probe", "Verify Gemini API Key"]
    };
  }
}

export function classifySoil(moisture: number, temperature: number, ec: number) {
  // Rule-based classification for instant feedback
  if (ec > 4.0) return "Salinity Stress";
  if (moisture < 20) return "Water Deficiency";
  if (ec > 2.5 && moisture > 40) return "Over-Fertilization";
  if (ec < 0.5) return "Nutrient Imbalance";
  return "Normal";
}
