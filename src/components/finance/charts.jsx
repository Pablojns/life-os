import { CHART_COLORS, formatBRL } from '../../lib/money'
import styles from '../Finance.module.css'

function polar(cx, cy, radius, angle) {
  const rad = ((angle - 90) * Math.PI) / 180
  return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)]
}

function slicePath(cx, cy, radius, start, end) {
  if (end - start >= 359.9) return `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx - 0.01} ${cy - radius} Z`
  const [x1, y1] = polar(cx, cy, radius, end)
  const [x2, y2] = polar(cx, cy, radius, start)
  const large = end - start > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${x2} ${y2} A ${radius} ${radius} 0 ${large} 1 ${x1} ${y1} Z`
}

export function DonutChart({ items, label = 'Distribuição' }) {
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1
  let angle = 0
  const slices = items.map((item, index) => {
    const size = (item.value / total) * 360
    const path = slicePath(80, 80, 70, angle, angle + Math.max(size, 0.01))
    angle += size
    return { ...item, path, color: item.color || CHART_COLORS[index % CHART_COLORS.length], pct: Math.round((item.value / total) * 100) }
  })

  return (
    <div className={styles.chartBox}>
      <svg viewBox="0 0 160 160" className={styles.donut} aria-label={label}>
        {slices.map((slice) => (
          <path key={slice.name} d={slice.path} fill={slice.color} />
        ))}
        <circle cx="80" cy="80" r="38" fill="var(--color-surface)" />
      </svg>
      <ul className={styles.legend}>
        {slices.map((slice) => (
          <li key={slice.name}>
            <span style={{ background: slice.color }} />
            {slice.name} · {slice.pct}% · {formatBRL(slice.value)}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function BarChart({ series }) {
  const max = Math.max(...series.flatMap((item) => [item.income, item.expense]), 1)
  return (
    <svg viewBox="0 0 360 180" className={styles.bars} aria-label="Receitas e despesas dos últimos 6 meses">
      {series.map((item, index) => {
        const x = 40 + index * 52
        const incomeH = (item.income / max) * 120
        const expenseH = (item.expense / max) * 120
        return (
          <g key={item.label}>
            <rect x={x} y={140 - incomeH} width="16" height={incomeH} fill="var(--color-success)" rx="2" />
            <rect x={x + 20} y={140 - expenseH} width="16" height={expenseH} fill="var(--color-danger)" rx="2" />
            <text x={x + 18} y="158" textAnchor="middle" fontSize="8" fill="var(--color-text-muted)">
              {item.label}
            </text>
          </g>
        )
      })}
      <text x="8" y="20" fontSize="8" fill="var(--color-text-muted)">
        {formatBRL(max)}
      </text>
    </svg>
  )
}
