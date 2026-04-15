import express from 'express';
import axios from 'axios';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Hyperlocal weather + sowing calendar
router.get('/', verifyToken, async (req, res) => {
  const { lat = '28.6', lon = '77.2', city = 'Delhi' } = req.query;

  // Demo weather data when no API key
  if (!process.env.OPENWEATHER_API_KEY || process.env.OPENWEATHER_API_KEY === 'demo') {
    const today = new Date();
    const forecast = Array.from({ length: 5 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const temps = [32, 34, 29, 31, 33];
      const conditions = ['Partly Cloudy', 'Sunny', 'Light Rain', 'Clear', 'Humid'];
      const icons = ['⛅', '☀️', '🌧️', '🌤️', '🌫️'];
      return {
        date: d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }),
        temp_max: temps[i],
        temp_min: temps[i] - 8,
        condition: conditions[i],
        icon: icons[i],
        humidity: 60 + i * 5,
        rain_chance: i === 2 ? 70 : 20,
      };
    });

    const month = today.getMonth() + 1;
    let sowingAdvice = getSowingAdvice(month);

    return res.json({
      city,
      current: {
        temp: 31,
        feels_like: 34,
        humidity: 65,
        condition: 'Partly Cloudy',
        icon: '⛅',
        wind_speed: 12,
      },
      forecast,
      sowing_calendar: sowingAdvice,
      demo_mode: true,
    });
  }

  try {
    const weatherRes = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric&cnt=40`
    );
    const data = weatherRes.data;

    const current = {
      temp: Math.round(data.list[0].main.temp),
      feels_like: Math.round(data.list[0].main.feels_like),
      humidity: data.list[0].main.humidity,
      condition: data.list[0].weather[0].description,
      icon: `https://openweathermap.org/img/wn/${data.list[0].weather[0].icon}@2x.png`,
      wind_speed: Math.round(data.list[0].wind.speed * 3.6),
    };

    // Group by day
    const dayMap = {};
    data.list.forEach(item => {
      const date = item.dt_txt.split(' ')[0];
      if (!dayMap[date]) dayMap[date] = { temps: [], weather: [] };
      dayMap[date].temps.push(item.main.temp);
      dayMap[date].weather.push(item.weather[0].description);
    });

    const forecast = Object.entries(dayMap).slice(0, 5).map(([date, vals]) => ({
      date: new Date(date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }),
      temp_max: Math.round(Math.max(...vals.temps)),
      temp_min: Math.round(Math.min(...vals.temps)),
      condition: vals.weather[0],
    }));

    const month = new Date().getMonth() + 1;
    const sowing_calendar = getSowingAdvice(month);

    res.json({ city: data.city.name, current, forecast, sowing_calendar });
  } catch (err) {
    res.status(500).json({ error: 'Weather service unavailable', details: err.message });
  }
});

function getSowingAdvice(month) {
  const seasons = {
    kharif: [6, 7, 8, 9, 10, 11],
    rabi: [11, 12, 1, 2, 3, 4],
    zaid: [3, 4, 5, 6],
  };

  if (seasons.kharif.includes(month)) {
    return {
      season: 'Kharif',
      icon: '🌧️',
      status: 'Active Season',
      crops: ['Rice', 'Cotton', 'Maize', 'Soybean', 'Groundnut', 'Jowar'],
      tip: 'Kharif season — ideal time for rice, cotton, and maize sowing. Ensure field drainage before monsoon arrives.',
      next_action: month <= 7 ? '🌱 Best time to sow Kharif crops now!' : '🌾 Prepare for harvest in 4-6 weeks.',
    };
  } else if (seasons.rabi.includes(month)) {
    return {
      season: 'Rabi',
      icon: '❄️',
      status: 'Active Season',
      crops: ['Wheat', 'Mustard', 'Peas', 'Chickpea', 'Lentil', 'Barley'],
      tip: 'Rabi season underway — wheat and mustard thrive in cool weather. Monitor night temperatures.',
      next_action: month <= 1 ? '🌱 Sowing window open for Rabi crops!' : '🌾 Rabi harvest approaching.',
    };
  }
  return {
    season: 'Zaid / Off-Season',
    icon: '☀️',
    status: 'Off-Peak',
    crops: ['Watermelon', 'Cucumber', 'Bitter Gourd', 'Moong Dal', 'Sunflower'],
    tip: 'Zaid season — good for short-duration vegetables and pulses. Irrigation is critical in summer.',
    next_action: '🔄 Plan for upcoming Kharif season. Prepare land and procure seeds.',
  };
}

export default router;
