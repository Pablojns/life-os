import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, Vibration, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated'
import { daysInMonth, monthDate, normalizeDate, toISODate } from '../../lib/dates'
import { useHabits } from '../../hooks/useHabits'
import { useTheme } from '../../context/ThemeContext'
import { Field, ThemedButton } from '../../components/ui'
import { Sheet } from '../../components/Sheet'
import { LevelUpOverlay } from '../../components/LevelUpOverlay'

function Cell({ checked, onPress }: { checked: boolean; onPress: () => void }) {
  const { theme } = useTheme()
  const scale = useSharedValue(1)
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  return (
    <Pressable
      accessibilityLabel={checked ? 'Hábito marcado' : 'Marcar hábito'}
      onPress={() => {
        scale.value = withSequence(withSpring(1.15), withSpring(1))
        Vibration.vibrate(12)
        onPress()
      }}
    >
      <Animated.View
        style={[
          styles.cell,
          style,
          {
            backgroundColor: checked ? theme.colors.primary : theme.colors.surfaceMid,
            borderColor: theme.colors.primary,
          },
        ]}
      />
    </Pressable>
  )
}

export default function HabitsScreen() {
  const { theme } = useTheme()
  const { habits, checks, loading, fetchHabits, addHabit, toggleCheck } = useHabits()
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const total = daysInMonth(month, year)
  const days = useMemo(() => Array.from({ length: total }, (_, index) => index + 1), [total])
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [levelUp, setLevelUp] = useState<number | null>(null)

  async function onToggle(habitId: string, day: number) {
    const date = monthDate(year, month, day)
    if (date > toISODate()) return
    const result = await toggleCheck(habitId, date)
    if (result?.leveledUp) setLevelUp(result.newLevel)
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.bg }} contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View style={styles.row}>
        <Text style={{ color: theme.colors.primary, fontFamily: theme.fonts.display, fontSize: 22 }}>{theme.labels.habits}</Text>
        <ThemedButton label="+ Hábito" onPress={() => setOpen(true)} />
      </View>
      {habits.map((habit) => (
        <View key={habit.id} style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceMid }]}>
          <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.display }}>{habit.name}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.grid}>
            {days.map((day) => {
              const date = monthDate(year, month, day)
              const checked = checks.some((check) => check.habit_id === habit.id && normalizeDate(check.check_date) === date)
              return <Cell key={`${habit.id}-${day}`} checked={checked} onPress={() => onToggle(habit.id, day)} />
            })}
          </ScrollView>
        </View>
      ))}
      {!habits.length && !loading ? (
        <Text style={{ color: theme.colors.textMuted }}>Nenhum hábito ainda. Comece por um só.</Text>
      ) : null}
      <Sheet open={open} title="Novo hábito" onClose={() => setOpen(false)}>
        <Field label="Nome" value={name} onChangeText={setName} />
        <ThemedButton
          label="Salvar"
          onPress={async () => {
            await addHabit(name, 5)
            setName('')
            setOpen(false)
            fetchHabits()
          }}
        />
      </Sheet>
      <LevelUpOverlay level={levelUp} onClose={() => setLevelUp(null)} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  card: { padding: 14, gap: 10, borderWidth: 1 },
  grid: { gap: 6, paddingVertical: 4 },
  cell: { width: 32, height: 32, borderWidth: 1 },
})
