import { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useTheme } from '../context/ThemeContext'

export default function ChatBubble() {
  const { theme } = useTheme()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      {open ? (
        <View style={[styles.panel, { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary }]}>
          <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.display }}>Assistente</Text>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Como posso ajudar?"
            placeholderTextColor={theme.colors.textMuted}
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.primary }]}
          />
        </View>
      ) : null}
      <Pressable
        accessibilityLabel="Abrir assistente"
        onPress={() => setOpen((value) => !value)}
        style={[styles.fab, { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary }]}
      >
        <Text style={{ color: theme.colors.primary, fontSize: 18 }}>💬</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', right: 16, bottom: 24 },
  panel: { width: 260, minHeight: 120, marginBottom: 10, padding: 12, borderWidth: 1 },
  input: { marginTop: 8, borderWidth: 1, minHeight: 40, paddingHorizontal: 8 },
  fab: { width: 56, height: 56, borderRadius: 28, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
})
