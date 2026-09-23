import { toNumber } from './money'

function splitLine(line, delimiter) {
  const cells = []
  let current = ''
  let quoted = false
  for (const char of line) {
    if (char === '"') {
      quoted = !quoted
      continue
    }
    if (char === delimiter && !quoted) {
      cells.push(current.trim())
      current = ''
      continue
    }
    current += char
  }
  cells.push(current.trim())
  return cells
}

function detectDelimiter(header) {
  return (header.match(/;/g) || []).length > (header.match(/,/g) || []).length ? ';' : ','
}

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function parseDate(value) {
  const text = String(value || '').trim()
  const br = text.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (br) return `${br[3]}-${br[2]}-${br[1]}`
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return iso[0]
  return ''
}

function detectBank(headers) {
  const blob = headers.map(normalize).join('|')
  if (blob.includes('identificador') && blob.includes('descricao')) return 'Nubank'
  if (blob.includes('docto') || (blob.includes('credito') && blob.includes('debito'))) return 'Bradesco'
  if (blob.includes('lancamento') && blob.includes('historico')) return 'Itaú'
  if (blob.includes('data lancamento') || blob.includes('tipo transacao')) return 'Inter'
  if (blob.includes('lancamento')) return 'Itaú'
  return 'Genérico'
}

function findIndex(headers, aliases) {
  return headers.findIndex((header) => aliases.some((alias) => normalize(header).includes(alias)))
}

export function parseBankCSV(text) {
  const raw = String(text || '').replace(/^\uFEFF/, '').trim()
  const lines = raw.split(/\r?\n/).filter((line) => line.trim())
  if (lines.length < 2) return { bank: 'Desconhecido', rows: [], errors: lines.length }

  const delimiter = detectDelimiter(lines[0])
  const headers = splitLine(lines[0], delimiter)
  const bank = detectBank(headers)
  const dateIdx = findIndex(headers, ['data'])
  const descIdx = findIndex(headers, ['descricao', 'historico', 'lancamento', 'titulo'])
  const amountIdx = findIndex(headers, ['valor'])
  const creditIdx = findIndex(headers, ['credito'])
  const debitIdx = findIndex(headers, ['debito'])
  const typeIdx = findIndex(headers, ['tipo'])

  const rows = []
  let errors = 0

  for (const line of lines.slice(1)) {
    const cells = splitLine(line, delimiter)
    const date = parseDate(cells[dateIdx])
    const description = cells[descIdx] || cells[1] || 'Importado'
    let amount = 0
    let type = 'expense'

    if (creditIdx >= 0 || debitIdx >= 0) {
      const credit = toNumber(cells[creditIdx])
      const debit = toNumber(cells[debitIdx])
      if (credit > 0) {
        amount = credit
        type = 'income'
      } else {
        amount = Math.abs(debit)
        type = 'expense'
      }
    } else {
      const parsed = toNumber(cells[amountIdx] || cells[cells.length - 1])
      amount = Math.abs(parsed)
      const typeHint = normalize(cells[typeIdx] || '')
      if (parsed < 0 || /debito|saida|despesa/.test(typeHint)) type = 'expense'
      else if (parsed > 0 || /credito|entrada|receita/.test(typeHint)) type = 'income'
    }

    if (!date || !amount) {
      errors += 1
      continue
    }

    rows.push({
      date,
      description,
      amount,
      type,
      category: type === 'income' ? 'Outros' : 'Outros',
    })
  }

  return { bank, rows, errors }
}
