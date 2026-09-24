import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
})

export async function setupReminders() {
  if (Platform.OS === 'web') return
  const current = await Notifications.getPermissionsAsync()
  let status = current.status
  if (status !== 'granted') {
    const next = await Notifications.requestPermissionsAsync()
    status = next.status
  }
  if (status !== 'granted') return

  await Notifications.cancelAllScheduledNotificationsAsync()
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Life OS',
      body: 'Não esqueça de registrar seus hábitos',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour: 9,
      minute: 0,
      repeats: true,
    },
  })
}

export async function notifyRecurringDue(name: string) {
  if (Platform.OS === 'web') return
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Vencimento',
      body: `${name} vence hoje. Abra Finanças e lance em um toque.`,
    },
    trigger: null,
  })
}
