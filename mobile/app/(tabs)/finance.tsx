import { useMemo, useState } from 'react'
import { SectionList, StyleSheet, Text, View } from 'react-native'
import { CATEGORY_ICONS, EXPENSE_CATEGORIES, INCOME_CATEGORIES, formatBRL } from '../../lib/money'
import { toISODate } from '../../lib/dates'
import { useFinances } from '../../hooks/useFinances'
import { useTheme } from '../../context/ThemeContext'
import { Field, ThemedButton } from '../../components/ui'
import { Sheet } from '../../components/Sheet'

export default function FinanceScreen() {
  const { theme } = useTheme()
  const { transactions, loading, fetchTransactions, addTransaction, summary, balance } = useFinances()
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Alimentação')
  const [description, setDescription] = useState('')

  const sections = useMemo(() => {
    const groups = new Map<string, any[]>()
    transactions.forEach((item) => {
      const key = String(item.transaction_date).slice(0, 10)
      groups.set(key, [...(groups.get(key) || []), item])
    })
    return [...groups.entries()].map(([title, data]) => ({ title, data }))
  }, [transactions])

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={fetchTransactions}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 16 }}>
            <View style={styles.summary}>
              <View style={[styles.box, { backgroundColor: theme.colors.surface }]}>
                <Text style={{ color: theme.colors.textMuted }}>Receitas</Text>
                <Text style={{ color: theme.colors.success, fontFamily: theme.fonts.display }}>{formatBRL(summary.income)}</Text>
              </View>
              <View style={[styles.box, { backgroundColor: theme.colors.surface }]}>
                <Text style={{ color: theme.colors.textMuted }}>Despesas</Text>
                <Text style={{ color: theme.colors.danger, fontFamily: theme.fonts.display }}>{formatBRL(summary.expense)}</Text>
              </View>
              <View style={[styles.box, { backgroundColor: theme.colors.surface }]}>
                <Text style={{ color: theme.colors.textMuted }}>Saldo</Text>
                <Text style={{ color: theme.colors.primary, fontFamily: theme.fonts.display }}>{formatBRL(balance)}</Text>
              </View>
            </View>
            <ThemedButton label="+ Transação" onPress={() => setOpen(true)} />
          </View>
        }
        renderSectionHeader={({ section }) => (
          <Text style={{ color: theme.colors.primary, fontFamily: theme.fonts.display, marginTop: 12 }}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <View style={[styles.row, { borderColor: theme.colors.surfaceMid }]}>
            <Text>{CATEGORY_ICONS[item.category] || '✨'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.colors.text }}>{item.description || item.category}</Text>
              <Text style={{ color: theme.colors.textMuted }}>{item.category}</Text>
            </View>
            <Text style={{ color: item.type === 'income' ? theme.colors.success : theme.colors.danger }}>
              {item.type === 'income' ? '+' : '-'}
              {formatBRL(item.amount)}
            </Text>
          </View>
        )}
      />
      <Sheet open={open} title="Nova transação" onClose={() => setOpen(false)}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <ThemedButton
              label="Receita"
              variant={type === 'income' ? 'primary' : 'ghost'}
              onPress={() => {
                setType('income')
                setCategory('Salário')
              }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedButton
              label="Despesa"
              variant={type === 'expense' ? 'primary' : 'ghost'}
              onPress={() => {
                setType('expense')
                setCategory('Alimentação')
              }}
            />
          </View>
        </View>
        <Field label="Valor" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
        <Field label="Categoria" value={category} onChangeText={setCategory} placeholder={categories[0]} />
        <Field label="Descrição" value={description} onChangeText={setDescription} />
        <ThemedButton
          label="Registrar"
          onPress={async () => {
            await addTransaction(Number(amount), type, category, description, toISODate())
            setAmount('')
            setDescription('')
            setOpen(false)
          }}
        />
      </Sheet>
    </View>
  )
}

const styles = StyleSheet.create({
  summary: { gap: 8 },
  box: { padding: 14, gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1 },
})
