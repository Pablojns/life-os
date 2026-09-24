import { StyleSheet, Text, View } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { xpInCurrentLevel } from '../lib/xp'

export function HeroHeader() {
  const { theme } = useTheme()
  const { profile } = useAuth()
  const xp = profile?.total_xp ?? profile?.xp ?? 0
  const current = xpInCurrentLevel(xp)
  const level = profile?.level || 1

  return (
    <View style={[styles.wrap, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.surfaceMid }]}>
      <View>
        <Text style={[styles.title, { color: theme.colors.primary, fontFamily: theme.fonts.display }]}>Life OS</Text>
        <Text style={{ color: theme.colors.textMuted, fontFamily: theme.fonts.body }}>Diário do Herói</Text>
      </View>
      <View style={styles.right}>
        <Text style={{ color: theme.colors.textMuted, fontFamily: theme.fonts.display, fontSize: 11 }}>
          {theme.labels.xp} {current}/100
        </Text>
        <View style={[styles.track, { backgroundColor: theme.colors.bg, borderColor: theme.colors.primary }]}>
          <View style={[styles.fill, { width: `${current}%`, backgroundColor: theme.colors.primary }]} />
        </View>
        <View style={[styles.badge, { borderColor: theme.colors.primary }]}>
          <Text style={{ color: theme.colors.primary, fontFamily: theme.fonts.display }}>{level}</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  title: { fontSize: 20, letterSpacing: 2, textTransform: 'uppercase' },
  right: { alignItems: 'flex-end', gap: 4, minWidth: 120 },
  track: { width: 120, height: 8, borderWidth: 1, overflow: 'hidden' },
  fill: { height: '100%' },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
