import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Link } from 'expo-router'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { Field, ThemedButton } from '../../components/ui'

function toAuthMessage(error: any) {
  const text = error?.message || ''
  if (/invalid login/i.test(text)) return 'E-mail ou senha incorretos.'
  if (/email not confirmed/i.test(text)) return 'Confirme seu e-mail antes de entrar.'
  return text || 'Não foi possível entrar na jornada.'
}

export default function LoginScreen() {
  const { theme } = useTheme()
  const { signIn, signInWithGoogle } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit() {
    if (!email.includes('@') || password.length < 6) {
      setError('Informe um e-mail válido e senha com 6+ caracteres.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await signIn(email.trim(), password)
    } catch (err) {
      setError(toAuthMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function onGoogle() {
    setBusy(true)
    setError('')
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(toAuthMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <View style={[styles.page, { backgroundColor: theme.colors.bg }]}>
      <Text style={[styles.kicker, { color: theme.colors.primary, fontFamily: theme.fonts.display }]}>Life OS</Text>
      <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.fonts.display }]}>Entrar na jornada</Text>
      <Field label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="voce@email.com" />
      <Field label="Senha" value={password} onChangeText={setPassword} secure />
      {error ? <Text style={{ color: theme.colors.danger, fontFamily: theme.fonts.body }}>{error}</Text> : null}
      <ThemedButton label={busy ? 'Entrando...' : 'Entrar'} onPress={onSubmit} disabled={busy} />
      <ThemedButton label="Entrar com Google" onPress={onGoogle} disabled={busy} variant="ghost" />
      <Link href="/(auth)/register" asChild>
        <Pressable accessibilityLabel="Criar conta">
          <Text style={{ color: theme.colors.primary, textAlign: 'center', fontFamily: theme.fonts.body }}>Criar conta</Text>
        </Pressable>
      </Link>
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, justifyContent: 'center', padding: 24, gap: 14 },
  kicker: { letterSpacing: 3, textTransform: 'uppercase' },
  title: { fontSize: 28, marginBottom: 8 },
})
