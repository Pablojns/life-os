import { StyleSheet, Text, View } from 'react-native'
import { useNotifications } from '../hooks/useNotifications'
import { useTheme } from '../context/ThemeContext'

export function ToastHost() {
  const { toasts } = useNotifications()
  const { theme } = useTheme()
  return (
    <View pointerEvents="none" style={styles.stack}>
      {toasts.map((toast) => (
        <View
          key={toast.id}
          style={[
            styles.toast,
            {
              backgroundColor: theme.colors.surface,
              borderColor: toast.type === 'error' ? theme.colors.danger : theme.colors.primary,
            },
          ]}
        >
          <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.body }}>{toast.message}</Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  stack: { position: 'absolute', left: 16, right: 16, bottom: 88, gap: 8, zIndex: 40 },
  toast: { padding: 12, borderWidth: 1 },
})
