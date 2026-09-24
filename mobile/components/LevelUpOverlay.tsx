import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { useTheme } from '../context/ThemeContext'
import { ThemedButton } from './ui'

export function LevelUpOverlay({ level, onClose }: { level: number | null; onClose: () => void }) {
  const { theme } = useTheme()
  if (!level) return null
  return (
    <Modal transparent animationType="fade" visible>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary }]}>
          <Text style={{ color: theme.colors.primary, fontFamily: theme.fonts.display, letterSpacing: 2 }}>EVOLUÇÃO</Text>
          <Text style={{ color: theme.colors.primary, fontFamily: theme.fonts.display, fontSize: 36 }}>
            {theme.labels.level} {level}
          </Text>
          <ThemedButton label="Continuar jornada" onPress={onClose} />
          <Pressable accessibilityLabel="Fechar evolução" onPress={onClose} />
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.72)', padding: 24 },
  card: { width: '100%', padding: 24, gap: 12, alignItems: 'center', borderWidth: 1 },
})
