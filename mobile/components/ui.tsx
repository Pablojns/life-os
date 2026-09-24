import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useTheme } from '../context/ThemeContext'

export function ThemedButton({
  label,
  onPress,
  disabled,
  variant = 'primary',
}: {
  label: string
  onPress: () => void
  disabled?: boolean
  variant?: 'primary' | 'ghost' | 'danger'
}) {
  const { theme } = useTheme()
  const bg = variant === 'primary' ? theme.colors.primary : variant === 'danger' ? theme.colors.danger : 'transparent'
  const color = variant === 'primary' ? theme.colors.onPrimary : theme.colors.text
  return (
    <Pressable
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, borderColor: theme.colors.primary, borderRadius: theme.radii.md, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
      ]}
    >
      <Text style={{ color, fontFamily: theme.fonts.display, letterSpacing: 0.6 }}>{label}</Text>
    </Pressable>
  )
}

export function Field({
  label,
  value,
  onChangeText,
  secure,
  keyboardType,
  placeholder,
}: {
  label: string
  value: string
  onChangeText: (value: string) => void
  secure?: boolean
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'decimal-pad'
  placeholder?: string
}) {
  const { theme } = useTheme()
  return (
    <View style={styles.field}>
      <Text style={{ color: theme.colors.textMuted, fontFamily: theme.fonts.display, fontSize: 12 }}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secure}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        autoCapitalize="none"
        style={[
          styles.input,
          {
            color: theme.colors.text,
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.surfaceMid,
            borderRadius: theme.radii.sm,
            fontFamily: theme.fonts.body,
          },
        ]}
      />
    </View>
  )
}

export function Loader() {
  const { theme } = useTheme()
  return <ActivityIndicator color={theme.colors.primary} />
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  field: { gap: 6 },
  input: { minHeight: 46, paddingHorizontal: 12, borderWidth: 1 },
})
