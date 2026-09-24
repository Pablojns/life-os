import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useQuests } from '../../hooks/useQuests'
import { useHabits } from '../../hooks/useHabits'
import { RANKS, rankFromLevel } from '../../lib/xp'
import { ThemedButton } from '../../components/ui'

const ATTRS = [
  { key: 'attr_forca', label: 'Força' },
  { key: 'attr_inteligencia', label: 'Inteligência' },
  { key: 'attr_vitalidade', label: 'Vitalidade' },
]

export default function StatsScreen() {
  const { theme } = useTheme()
  const { profile, updateProfile, refreshProfile, signOut } = useAuth()
  const { done } = useQuests()
  const { habits } = useHabits()
  const level = profile?.level || 1
  const rank = profile?.rank || rankFromLevel(level)
  const spent = ATTRS.reduce((sum, attr) => sum + (Number(profile?.[attr.key]) || 0), 0)
  const available = Math.max(0, level * 2 - spent)

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.bg }} contentContainerStyle={{ padding: 16, gap: 14 }}>
      <Text style={{ color: theme.colors.primary, fontFamily: theme.fonts.display, fontSize: 22 }}>Atributos</Text>
      <View style={styles.grid}>
        {[
          ['Nível', level],
          ['XP', profile?.xp || 0],
          ['Missões feitas', done.length],
          ['Hábitos', habits.length],
        ].map(([label, value]) => (
          <View key={String(label)} style={[styles.stat, { backgroundColor: theme.colors.surface }]}>
            <Text style={{ color: theme.colors.textMuted }}>{label}</Text>
            <Text style={{ color: theme.colors.primary, fontFamily: theme.fonts.display, fontSize: 22 }}>{value}</Text>
          </View>
        ))}
      </View>
      <View style={[styles.banner, { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary }]}>
        <Text style={{ color: theme.colors.textMuted }}>Rank atual</Text>
        <Text style={{ color: theme.colors.primary, fontFamily: theme.fonts.display, fontSize: 24 }}>{rank}</Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {RANKS.map((item) => (
            <View
              key={item}
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: item === rank ? theme.colors.primary : theme.colors.surfaceMid,
              }}
            />
          ))}
        </View>
      </View>
      <Text style={{ color: theme.colors.textMuted }}>Pontos disponíveis: {available}</Text>
      {ATTRS.map((attr) => (
        <View key={attr.key} style={[styles.row, { borderColor: theme.colors.surfaceMid }]}>
          <Text style={{ color: theme.colors.text, flex: 1 }}>{attr.label}</Text>
          <Text style={{ color: theme.colors.primary, marginRight: 12 }}>{profile?.[attr.key] || 0}</Text>
          <ThemedButton
            label="+"
            onPress={async () => {
              if (available <= 0) return
              await updateProfile({ [attr.key]: (Number(profile?.[attr.key]) || 0) + 1 })
              await refreshProfile()
            }}
          />
        </View>
      ))}
      <ThemedButton label="Sair" variant="danger" onPress={signOut} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat: { width: '47%', padding: 14, gap: 4 },
  banner: { padding: 16, gap: 6, borderWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1 },
})
