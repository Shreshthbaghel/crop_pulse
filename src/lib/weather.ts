export async function getWeatherData(lat: number = 28.6139, lon: number = 77.2090) {
  const apiKey = (import.meta as any).env.VITE_OPENWEATHER_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
    const data = await response.json();
    return {
      temp: data.main.temp,
      humidity: data.main.humidity,
      condition: data.weather[0].main,
      description: data.weather[0].description,
      rain: data.rain ? data.rain['1h'] || 0 : 0
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
    return { status: "Irrigate Now", reason: "Moisture critical and no rain forecast" };
  }

  return { status: "Maintain", reason: "Soil conditions stable" };
}
