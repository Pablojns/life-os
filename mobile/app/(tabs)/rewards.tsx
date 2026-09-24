import { useState } from 'react'
import { FlatList, StyleSheet, Text, View } from 'react-native'
import { useRewards } from '../../hooks/useRewards'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { Field, ThemedButton } from '../../components/ui'
import { Sheet } from '../../components/Sheet'

export default function RewardsScreen() {
  const { theme } = useTheme()
  const { profile } = useAuth()
  const { rewards, loading, fetchRewards, addReward, claimReward } = useRewards()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [cost, setCost] = useState('20')

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <FlatList
        data={rewards}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={fetchRewards}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListHeaderComponent={
          <View style={styles.head}>
            <Text style={{ color: theme.colors.primary, fontFamily: theme.fonts.display, fontSize: 22 }}>{theme.labels.rewards}</Text>
            <Text style={{ color: theme.colors.textMuted }}>XP disponível: {profile?.xp || 0}</Text>
            <ThemedButton label="+ Recompensa" onPress={() => setOpen(true)} />
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceMid }]}>
            <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.display }}>{item.name}</Text>
            <Text style={{ color: theme.colors.textMuted }}>{item.cost_xp} XP</Text>
            <ThemedButton label="Resgatar" onPress={() => claimReward(item.id, item.cost_xp)} />
          </View>
        )}
      />
      <Sheet open={open} title="Nova recompensa" onClose={() => setOpen(false)}>
        <Field label="Nome" value={name} onChangeText={setName} />
        <Field label="Custo em XP" value={cost} onChangeText={setCost} keyboardType="numeric" />
        <ThemedButton
          label="Salvar"
          onPress={async () => {
            await addReward(name, Number(cost) || 0)
            setName('')
            setOpen(false)
          }}
        />
      </Sheet>
    </View>
  )
}

const styles = StyleSheet.create({
  head: { gap: 10, marginBottom: 8 },
  card: { padding: 16, gap: 8, borderWidth: 1 },
})
