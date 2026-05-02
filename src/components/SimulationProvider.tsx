import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { db, auth } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { classifySoil } from "../lib/gemini";
import { getWeatherData } from "../lib/weather";

interface SimulationContextType {
  isSimulating: boolean;
  toggleSimulation: () => void;
  triggerScenario: (type: "Salinity" | "Drought" | "Fertilizer") => Promise<void>;
  weather: any;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [weather, setWeather] = useState<any>(null);

  useEffect(() => {
    const refreshWeather = async () => {
      const data = await getWeatherData();
      setWeather(data);
    };
    refreshWeather();
    const interval = setInterval(refreshWeather, 300000); // 5 mins
    return () => clearInterval(interval);
  }, []);

  const injectData = async (m: number, t: number, ec: number) => {
    if (!auth.currentUser) return;
    const classification = classifySoil(m, t, ec);
    await addDoc(collection(db, "readings"), {
      moisture: m,
      temperature: t,
      ec,
      classification,
      timestamp: serverTimestamp(),
      userId: auth.currentUser.uid,
    });

    if (classification !== "Normal") {
      let severity = "Warning";
      let msg = `Anomalous pattern detected: ${classification}`;

      if (ec > 5.0 || m < 15) {
        severity = "Critical";
        msg = `CRITICAL: ${classification} exceeding safe operating boundaries!`;
      } else if (ec > 3.5 || m < 28) {
        severity = "Warning";
        msg = `PROVISION ALERT: ${classification} trending toward critical stress.`;
      } else {
        severity = "Info";
        msg = `System update: ${classification} fluctuation observed in sector B-4.`;
      }

      await addDoc(collection(db, "alerts"), {
        timestamp: serverTimestamp(),
        type: severity,
        message: msg,
        resolved: false,
        userId: auth.currentUser.uid,
      });
    }
  };

  const triggerScenario = async (type: "Salinity" | "Drought" | "Fertilizer") => {
    switch(type) {
      case "Salinity": await injectData(45, 24, 4.8); break;
      case "Drought": await injectData(12, 32, 0.8); break;
      case "Fertilizer": await injectData(65, 22, 3.2); break;
    }
  };

  useEffect(() => {
    let interval: any;
    if (isSimulating && auth.currentUser) {
      interval = setInterval(() => {
        const moisture = Math.floor(Math.random() * (80 - 15) + 15);
        const temperature = Math.floor(Math.random() * (35 - 18) + 18);
        const ec = parseFloat((Math.random() * (5.5 - 0.2) + 0.2).toFixed(2));
        injectData(moisture, temperature, ec);
      }, 8000);
    }
    return () => clearInterval(interval);
  }, [isSimulating]);

  return (
    <SimulationContext.Provider value={{ isSimulating, toggleSimulation: () => setIsSimulating(!isSimulating), triggerScenario, weather }}>
      {children}
    </SimulationContext.Provider>
  );
}

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) throw new Error("useSimulation must be used within SimulationProvider");
  return context;
};
