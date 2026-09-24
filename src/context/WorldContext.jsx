/**
 * Clima real, ciclo do dia e gatilhos de eventos de mundo.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  DEFAULT_CITY,
  getTimeOfDay,
  getWeather,
  getWeatherByCoords,
  parseTimeOfDay,
  readCachedWeather,
} from '../lib/weather'
import { findEvent, pickRandomEvent, prefersReducedMotion } from '../lib/randomEvents'

const WorldContext = createContext(null)

const FALLBACK = {
  condition: 'Clear',
  description: 'céu limpo',
  temp: 22,
  icon: '01d',
  city: DEFAULT_CITY,
  source: 'fallback',
}

function readOverrides() {
  if (typeof window === 'undefined') return {}
  const params = new URLSearchParams(window.location.search)
  return {
    tod: parseTimeOfDay(params.get('tod')),
    weather: params.get('weather'),
    event: params.get('event'),
  }
}

function applyWorldAttrs(timeOfDay, weather, eventId) {
  const root = document.documentElement
  root.setAttribute('data-tod', timeOfDay)
  root.setAttribute('data-weather', weather?.condition || 'Clear')
  if (eventId) root.setAttribute('data-event', eventId)
  else root.removeAttribute('data-event')
  root.toggleAttribute('data-world-ready', Boolean(weather))
}

export function WorldProvider({ children }) {
  const overrides = readOverrides()
  const [weather, setWeather] = useState(() => readCachedWeather() || FALLBACK)
  const [timeOfDay, setTimeOfDayState] = useState(() => overrides.tod || getTimeOfDay())
  const [city, setCity] = useState(() => weather.city || DEFAULT_CITY)
  const [event, setEvent] = useState(null)
  const [forcedWeather, setForcedWeather] = useState(overrides.weather || null)

  const setTimeOfDay = useCallback((value) => {
    const next = parseTimeOfDay(value)
    if (next) setTimeOfDayState(next)
  }, [])

  const triggerEvent = useCallback((theme, eventId) => {
    if (prefersReducedMotion()) return null
    const picked = eventId ? findEvent(theme, eventId) : pickRandomEvent(theme)
    if (!picked) return null
    const next = { ...picked, startedAt: Date.now() }
    setEvent(next)
    window.setTimeout(() => {
      setEvent((current) => (current?.startedAt === next.startedAt ? null : current))
    }, picked.duration)
    return next
  }, [])

  useEffect(() => {
    if (overrides.tod) return undefined
    const tick = () => setTimeOfDayState(getTimeOfDay())
    tick()
    const id = window.setInterval(tick, 60_000)
    return () => window.clearInterval(id)
  }, [overrides.tod])

  useEffect(() => {
    let cancelled = false

    async function load(cityName) {
      try {
        const data = cityName ? await getWeather(cityName) : await getWeather(DEFAULT_CITY)
        if (cancelled || !data) return
        setWeather(data)
        setCity(data.city)
      } catch {
        const cached = readCachedWeather()
        if (!cancelled && cached) {
          setWeather(cached)
          setCity(cached.city)
        }
      }
    }

    async function boot() {
      if (!navigator.geolocation) {
        await load(DEFAULT_CITY)
        return
      }
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const data = await getWeatherByCoords(position.coords.latitude, position.coords.longitude)
            if (cancelled || !data) return
            setWeather(data)
            setCity(data.city)
          } catch {
            await load(DEFAULT_CITY)
          }
        },
        () => {
          load(DEFAULT_CITY)
        },
        { timeout: 4000, maximumAge: 30 * 60 * 1000 },
      )
    }

    boot()
    const id = window.setInterval(() => load(city), 30 * 60 * 1000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [])

  useEffect(() => {
    applyWorldAttrs(timeOfDay, { ...weather, condition: forcedWeather || weather.condition }, event?.id)
  }, [timeOfDay, weather, forcedWeather, event])

  useEffect(() => {
    window.__LIFEOS_WORLD = {
      setTimeOfDay,
      setWeather: (condition) => setForcedWeather(condition),
      triggerEvent,
      getState: () => ({
        weather: { ...weather, condition: forcedWeather || weather.condition },
        timeOfDay,
        city,
        event,
      }),
    }
    return () => {
      delete window.__LIFEOS_WORLD
    }
  }, [setTimeOfDay, triggerEvent, weather, forcedWeather, timeOfDay, city, event])

  const value = useMemo(() => {
    const liveWeather = forcedWeather ? { ...weather, condition: forcedWeather } : weather
    return {
      weather: liveWeather,
      timeOfDay,
      city: liveWeather.city || city,
      event,
      setTimeOfDay,
      triggerEvent,
    }
  }, [weather, forcedWeather, timeOfDay, city, event, setTimeOfDay, triggerEvent])

  return <WorldContext.Provider value={value}>{children}</WorldContext.Provider>
}

export function useWorld() {
  const context = useContext(WorldContext)
  if (!context) {
    throw new Error('useWorld deve ser usado dentro de WorldProvider')
  }
  return context
}
