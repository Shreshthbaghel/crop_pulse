export async function getWeatherData(lat: number = 28.6139, lon: number = 77.2090) {
  const apiKey = (import.meta as any).env.VITE_OPENWEATHER_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&cnt=1`);
    const data = await response.json();
    
    if (!data.list || data.list.length === 0) return null;
    
    const current = data.list[0];
    return {
      temp: current.main.temp,
      humidity: current.main.humidity,
      condition: current.weather[0].main,
      description: current.weather[0].description,
      rain: current.rain ? current.rain['3h'] || 0 : 0,
      pop: current.pop || 0 // Probability of precipitation
    };
  } catch (error) {
    console.error("Weather Fetch Error:", error);
    return null;
  }
}

export function predictIrrigation(soilMoisture: number, weather: any) {
  if (!weather) return { status: "Unknown", reason: "Weather data unavailable" };

  const willRain = weather.rain > 0.5 || ["Rain", "Drizzle", "Thunderstorm"].includes(weather.condition);
  
  if (soilMoisture > 60) {
    return { status: "No Irrigation", reason: "Soil moisture is optimal" };
  }

  if (willRain) {
    return { status: "Delay Irrigation", reason: `Rain detected (${weather.condition}). Save water.` };
  }

  if (soilMoisture < 30) {
    return { status: "Irrigate this morning", reason: "Soil is dry and no rain expected" };
  }

  return { status: "No irrigation needed today", reason: "Soil conditions stable" };
}
