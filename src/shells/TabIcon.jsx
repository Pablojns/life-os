const ICONS = {
  quests: 'M4 7h16v3H4zm0 7h10v3H4zM4 4h7v2H4z',
  habits: 'M12 3v3M6.5 5.2l2 2.2M17.5 5.2l-2 2.2M5 13a7 7 0 1 0 8-6.7',
  notes: 'M6 3h9l5 5v13H6zM15 3v5h5',
  rewards: 'M4 8h16v3c-3 0-4 2-4 4H8c0-2-1-4-4-4zm3 7h10v6H7z',
  stats: 'M5 19V9h3v10zm6 0V5h3v14zm6 0v-7h3v7z',
  finance: 'M12 3l8 4v5c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10V7z',
  agenda: 'M5 5h14v14H5zm3-2v4m8-4v4M5 10h14',
  coach: 'M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm-7 16c1.4-3.4 4-5 7-5s5.6 1.6 7 5',
  arena: 'M4 18l5-8 3 4 4-7 4 11',
}

export default function TabIcon({ id }) {
  const d = ICONS[id] || ICONS.quests
  return (
    <svg className="tab-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
