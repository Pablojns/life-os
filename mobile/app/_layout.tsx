import { useEffect, type ReactNode } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useFonts, Cinzel_400Regular } from '@expo-google-fonts/cinzel'
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter'
import { CrimsonText_400Regular } from '@expo-google-fonts/crimson-text'
import * as SplashScreen from 'expo-splash-screen'
import { AuthProvider } from '../context/AuthContext'
import { ThemeProvider } from '../context/ThemeContext'
import { NotificationProvider } from '../hooks/useNotifications'
import { StripeGate } from '../components/StripeGate'
import { setupReminders } from '../lib/push'

SplashScreen.preventAutoHideAsync().catch(() => {})

function FontGate({ children }: { children: ReactNode }) {
  const [loaded] = useFonts({
    Cinzel_400Regular,
    Inter_400Regular,
    Inter_600SemiBold,
    CrimsonText_400Regular,
  })

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync().catch(() => {})
      setupReminders().catch(() => {})
    }
  }, [loaded])

  if (!loaded) return null
  return <>{children}</>
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StripeGate>
        <AuthProvider>
          <ThemeProvider>
            <NotificationProvider>
              <FontGate>
                <StatusBar style="light" />
                <Stack screenOptions={{ headerShown: false }} />
              </FontGate>
            </NotificationProvider>
          </ThemeProvider>
        </AuthProvider>
      </StripeGate>
    </GestureHandlerRootView>
  )
}
