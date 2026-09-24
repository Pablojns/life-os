import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Link } from 'expo-router'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { Field, ThemedButton } from '../../components/ui'

export default function RegisterScreen() {
  const { theme } = useTheme()
  const { signUp } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit() {
    if (!name.trim() || !email.includes('@') || password.length < 6) {
      setError('Preencha nome, e-mail válido e senha com 6+ caracteres.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await signUp(email.trim(), password, name.trim())
    } catch (err: any) {
      setError(err?.message || 'Não foi possível criar a conta.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <View style={[styles.page, { backgroundColor: theme.colors.bg }]}>
      <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.fonts.display }]}>Criar herói</Text>
      <Field label="Nome" value={name} onChangeText={setName} placeholder="Seu nome" />
      <Field label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <Field label="Senha" value={password} onChangeText={setPassword} secure />
      {error ? <Text style={{ color: theme.colors.danger }}>{error}</Text> : null}
      <ThemedButton label={busy ? 'Criando...' : 'Registrar'} onPress={onSubmit} disabled={busy} />
      <Link href="/(auth)/login" asChild>
        <Pressable accessibilityLabel="Já tenho conta">
          <Text style={{ color: theme.colors.primary, textAlign: 'center' }}>Já tenho conta</Text>
        </Pressable>
      </Link>
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, justifyContent: 'center', padding: 24, gap: 14 },
  title: { fontSize: 28 },
})
