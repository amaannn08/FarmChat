import { useState, useEffect } from 'react';
import axios from 'axios';
import { CloudRain, Sun, Droplets, Leaf } from 'lucide-react';

export default function WeatherWidget({ city = 'New Delhi', lat = '28.6', lon = '77.2' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await axios.get(`/weather?lat=${lat}&lon=${lon}&city=${city}`);
        setData(res.data);
      } catch (err) {
        console.error('Weather fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, [lat, lon, city]);

  if (loading) return <div className="h-40 rounded-xl shimmer"></div>;
  if (!data) return null;

  const { current, forecast, sowing_calendar, demo_mode } = data;

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden shadow-md">
      {/* Current Weather Area */}
      <div className="p-4 bg-gradient-to-br from-[#161b22] to-[#0d1117] flex justify-between items-center border-b border-[#30363d]">
        <div>
          <div className="text-xs text-[#8b949e] font-medium uppercase tracking-wider mb-1 flex items-center gap-1">
            <MapPinIcon size={12} /> {data.city}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-4xl font-bold text-[#e6edf3]">{current.temp}°</div>
            <div>
              <div className="text-sm font-medium text-[#c9d1d9] capitalize">{current.condition}</div>
              <div className="text-xs text-[#8b949e]">Feels like {current.feels_like}°</div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 text-xs text-[#8b949e]">
          <div className="flex items-center gap-1.5 bg-[#21262d] px-2 py-1 rounded-md">
            <Droplets size={12} className="text-blue-400" /> {current.humidity}% Humidity
          </div>
          <div className="flex items-center gap-1.5 bg-[#21262d] px-2 py-1 rounded-md">
            <WindIcon size={12} className="text-gray-400" /> {current.wind_speed} km/h
          </div>
        </div>
      </div>

      {/* Sowing Calendar Banner (Amber Tier Feature) */}
      {sowing_calendar && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 p-3 px-4 flex gap-3 items-start">
          <div className="mt-0.5 text-amber-500 text-lg">{sowing_calendar.icon}</div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <h4 className="text-sm font-bold text-amber-400">{sowing_calendar.season} Season Advice</h4>
              <span className="text-[10px] uppercase font-bold bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded">Active</span>
            </div>
            <p className="text-xs text-[#c9d1d9] leading-relaxed mb-1.5">{sowing_calendar.tip}</p>
            <div className="flex flex-wrap gap-1.5">
              {sowing_calendar.crops.map(c => (
                <span key={c} className="text-[10px] bg-[#21262d] text-[#8b949e] px-1.5 py-0.5 rounded border border-[#30363d]">{c}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Forecast Strip */}
      <div className="flex justify-between p-3 px-4 bg-[#0d1117]">
        {forecast && forecast.map((day, idx) => (
          <div key={idx} className="text-center">
            <div className="text-[11px] text-[#8b949e] font-medium mb-1 w-10 truncate">{day.date.split(',')[0]}</div>
            <div className="text-md my-0.5">{getWeatherEmoji(day.condition)}</div>
            <div className="flex justify-center gap-1.5 text-[11px]">
              <span className="text-[#e6edf3] font-medium">{day.temp_max}°</span>
              <span className="text-[#8b949e]">{day.temp_min}°</span>
            </div>
          </div>
        ))}
      </div>
      
      {demo_mode && (
        <div className="text-[10px] text-center p-1 bg-[#21262d] text-[#8b949e]">
          Demo data. Connect OpenWeatherMap API for live forecasts.
        </div>
      )}
    </div>
  );
}

// Simple helpers for Icons not imported from Lucide
function MapPinIcon({ size }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>; }
function WindIcon({ size }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.8 19.6A2 2 0 1 0 14 16H2"/><path d="M17.5 8a2.5 2.5 0 1 1 2 2H2"/><path d="M9.8 4.4A2 2 0 1 1 11 8H2"/></svg>; }

function getWeatherEmoji(condition) {
  const lower = condition.toLowerCase();
  if (lower.includes('rain')) return '🌧️';
  if (lower.includes('cloud')) return '⛅';
  if (lower.includes('clear') || lower.includes('sun')) return '☀️';
  if (lower.includes('thunder')) return '⛈️';
  if (lower.includes('haze') || lower.includes('mist')) return '🌫️';
  return '🌤️';
}
