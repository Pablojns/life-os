/**
 * OpenWeatherMap + ciclo do dia.
 * Chave gratuita: https://openweathermap.org/api (Current Weather)
 */
const WEATHER_KEY = import.meta.env.VITE_WEATHER_KEY
const BASE = 'https://api.openweathermap.org/data/2.5'
export const WEATHER_CACHE_KEY = 'lifeos-weather'
export const DEFAULT_CITY = 'Londrina'

export const TIMES_OF_DAY = ['dawn', 'morning', 'afternoon', 'sunset', 'evening', 'midnight']

const FALLBACK_WEATHER = {
  condition: 'Clear',
  description: 'céu limpo',
  temp: 22,
  icon: '01d',
  city: DEFAULT_CITY,
  source: 'fallback',
}

export function getTimeOfDay(date = new Date()) {
  const h = date.getHours()
  if (h >= 5 && h < 7) return 'dawn'
  if (h >= 7 && h < 12) return 'morning'
  if (h >= 12 && h < 17) return 'afternoon'
  if (h >= 17 && h < 20) return 'sunset'
  if (h >= 20 && h < 23) return 'evening'
  return 'midnight'
}

export function parseTimeOfDay(value) {
  return TIMES_OF_DAY.includes(value) ? value : null
}

function normalize(data, source) {
  const first = data?.weather?.[0]
  if (!first || data?.main?.temp == null) return null
  return {
    condition: first.main,
    description: first.description,
    temp: Math.round(data.main.temp),
    icon: first.icon,
    city: data.name || DEFAULT_CITY,
    source,
  }
}

export function readCachedWeather() {
  try {
    const raw = localStorage.getItem(WEATHER_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.condition) return null
    return { ...parsed, source: 'cache' }
  } catch {
    return null
  }
}

export function writeCachedWeather(weather) {
  try {
    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({ ...weather, cachedAt: Date.now() }))
  } catch {
    /* ignore quota */
  }
}

async function requestWeather(query) {
  if (!WEATHER_KEY) return null
  const res = await fetch(`${BASE}/weather?${query}&appid=${WEATHER_KEY}&units=metric&lang=pt_br`)
  if (!res.ok) return null
  return normalize(await res.json(), 'api')
}

export async function getWeather(city = DEFAULT_CITY) {
  const data = await requestWeather(`q=${encodeURIComponent(city)}`)
  if (data) {
    writeCachedWeather(data)
    return data
  }
  return readCachedWeather() || { ...FALLBACK_WEATHER, city }
}

export async function getWeatherByCoords(lat, lon) {
  const data = await requestWeather(`lat=${lat}&lon=${lon}`)
  if (data) {
    writeCachedWeather(data)
    return data
  }
  return getWeather(DEFAULT_CITY)
}

export function getWeatherIcon(condition) {
  switch (condition) {
    case 'Rain':
    case 'Drizzle':
      return '🌧'
    case 'Thunderstorm':
      return '⛈'
    case 'Snow':
      return '❄'
    case 'Clouds':
      return '☁'
    case 'Mist':
    case 'Fog':
    case 'Haze':
      return '🌫'
    default:
      return '☀'
  }
}

export function getWeatherCode(condition) {
  switch (condition) {
    case 'Rain':
    case 'Drizzle':
      return 'RAIN'
    case 'Thunderstorm':
      return 'THUN'
    case 'Snow':
      return 'SNOW'
    case 'Clouds':
      return 'CLD'
    default:
      return 'CLR'
  }
}
