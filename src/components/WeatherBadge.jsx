import { useTheme } from '../context/ThemeContext'
import { useWorld } from '../context/WorldContext'
import { getWeatherCode, getWeatherIcon } from '../lib/weather'
import styles from './WeatherBadge.module.css'

function flavorCity(theme, city) {
  if (theme === 'skyrim') return 'Winterhold'
  if (theme === 'naruto') return 'Konoha'
  return city || 'Londrina'
}

export default function WeatherBadge() {
  const { theme } = useTheme()
  const { weather, city } = useWorld()
  const place = flavorCity(theme, city)
  const icon = getWeatherIcon(weather.condition)
  const temp = `${weather.temp}°C`

  let label = `${icon} ${temp} ${place}`
  if (theme === 'skyrim') label = `${icon} ${temp} · ${place}`
  if (theme === 'naruto') label = `${icon} ${temp} · ${place}`
  if (theme === 'solo') label = `[${getWeatherCode(weather.condition)}] ${temp} · ÁREA: ${place}`
  if (theme === 'clean') label = `${icon} ${weather.temp}° ${place}`

  return (
    <p className={`${styles.badge} ${styles[theme] || ''}`} data-weather-badge="true" title={weather.description}>
      {label}
    </p>
  )
}
