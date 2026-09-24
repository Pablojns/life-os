import { Redirect, Tabs } from 'expo-router'
import { Text, View } from 'react-native'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { HeroHeader } from '../../components/HeroHeader'
import { ToastHost } from '../../components/ToastHost'

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.55 }}>{emoji}</Text>
}

export default function TabsLayout() {
  const { user, loading } = useAuth()
  const { theme } = useTheme()
  if (!loading && !user) return <Redirect href="/(auth)/login" />

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <HeroHeader />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.surfaceMid,
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textMuted,
          tabBarLabelStyle: { fontFamily: theme.fonts.display, fontSize: 10 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: theme.labels.quests,
            tabBarIcon: ({ focused }) => <TabIcon emoji="⚔" focused={focused} />,
            tabBarAccessibilityLabel: theme.labels.quests,
          }}
        />
        <Tabs.Screen
          name="habits"
          options={{
            title: theme.labels.habits,
            tabBarIcon: ({ focused }) => <TabIcon emoji="📅" focused={focused} />,
            tabBarAccessibilityLabel: theme.labels.habits,
          }}
        />
        <Tabs.Screen
          name="finance"
          options={{
            title: 'Finanças',
            tabBarIcon: ({ focused }) => <TabIcon emoji="💰" focused={focused} />,
            tabBarAccessibilityLabel: 'Finanças',
          }}
        />
        <Tabs.Screen
          name="rewards"
          options={{
            title: theme.labels.rewards,
            tabBarIcon: ({ focused }) => <TabIcon emoji="🍖" focused={focused} />,
            tabBarAccessibilityLabel: theme.labels.rewards,
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            title: 'Atributos',
            tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} />,
            tabBarAccessibilityLabel: 'Atributos',
          }}
        />
      </Tabs>
      <ToastHost />
    </View>
  )
}
