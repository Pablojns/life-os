import { useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useQuests } from '../../hooks/useQuests'
import { useTheme } from '../../context/ThemeContext'
import { useNotifications } from '../../hooks/useNotifications'
import { Field, Loader, ThemedButton } from '../../components/ui'
import { Sheet } from '../../components/Sheet'
import { LevelUpOverlay } from '../../components/LevelUpOverlay'

function QuestRow({
  item,
  onComplete,
  completeLabel,
}: {
  item: any
  onComplete: (item: any) => void
  completeLabel: string
}) {
  const { theme } = useTheme()
  const translateX = useSharedValue(0)
  const gesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .onUpdate((event) => {
      translateX.value = Math.min(0, event.translationX)
    })
    .onEnd((event) => {
      if (event.translationX < -80) {
        runOnJS(onComplete)(item)
      }
      translateX.value = withTiming(0)
    })
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }))

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.card,
          style,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceMid, borderRadius: theme.radii.md },
        ]}
      >
        <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.display, fontSize: 16 }}>{item.title}</Text>
        <Text style={{ color: theme.colors.textMuted, fontFamily: theme.fonts.body }}>
          {item.xp} {theme.labels.xp}
          {item.reward ? ` · ${item.reward}` : ''}
        </Text>
        <ThemedButton label={completeLabel} onPress={() => onComplete(item)} />
      </Animated.View>
    </GestureDetector>
  )
}

export default function QuestsScreen() {
  const { theme } = useTheme()
  const { notify } = useNotifications()
  const { quests, loading, fetchQuests, addQuest, completeQuest } = useQuests()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [reward, setReward] = useState('')
  const [xp, setXp] = useState('10')
  const [levelUp, setLevelUp] = useState<number | null>(null)

  async function onAdd() {
    if (!title.trim()) return
    await addQuest(title, reward, Number(xp) || 10)
    setTitle('')
    setReward('')
    setXp('10')
    setOpen(false)
  }

  async function onComplete(item: any) {
    const result = await completeQuest(item.id, item.xp)
    notify(`Missão concluída. +${item.xp} ${theme.labels.xp}`, 'success')
    if (result?.leveledUp) setLevelUp(result.newLevel)
  }

  return (
    <View style={[styles.page, { backgroundColor: theme.colors.bg }]}>
      {loading && !quests.length ? <Loader /> : null}
      <FlatList
        data={quests}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={fetchQuests}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
        ListEmptyComponent={
          <Text style={{ color: theme.colors.textMuted, fontFamily: theme.fonts.body }}>Nenhuma missão ativa.</Text>
        }
        renderItem={({ item }) => <QuestRow item={item} onComplete={onComplete} completeLabel={theme.labels.complete} />}
      />
      <Pressable
        accessibilityLabel={theme.labels.add}
        onPress={() => setOpen(true)}
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
      >
        <Text style={{ color: theme.colors.onPrimary, fontSize: 28, lineHeight: 30 }}>+</Text>
      </Pressable>
      <Sheet open={open} title={theme.labels.add} onClose={() => setOpen(false)}>
        <Field label="Título" value={title} onChangeText={setTitle} />
        <Field label="Recompensa" value={reward} onChangeText={setReward} />
        <Field label={theme.labels.xp} value={xp} onChangeText={setXp} keyboardType="numeric" />
        <ThemedButton label="Registrar" onPress={onAdd} />
      </Sheet>
      <LevelUpOverlay level={levelUp} onClose={() => setLevelUp(null)} />
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  card: { padding: 16, gap: 8, borderWidth: 1 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
