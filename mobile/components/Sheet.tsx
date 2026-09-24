import type { ReactNode } from 'react'
import { Modal, Pressable, StyleSheet, Text } from 'react-native'
import { useTheme } from '../context/ThemeContext'

export function Sheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const { theme } = useTheme()
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} accessibilityLabel="Fechar">
        <Pressable style={[styles.sheet, { backgroundColor: theme.colors.surface }]} onPress={() => {}}>
          <Text style={{ color: theme.colors.primary, fontFamily: theme.fonts.display, fontSize: 18 }}>{title}</Text>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: { padding: 20, gap: 12, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
})
