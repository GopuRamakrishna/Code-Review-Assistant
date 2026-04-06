const COLOR_MAP = {
  green: { val: '#3ecf8e', bg: '#0d2e1f' },
  red:   { val: '#f56565', bg: '#3d1a1a' },
  blue:  { val: '#4f8ef7', bg: '#1e3460' },
  default:{ val: '#e8eaf0', bg: '#1e2229' }
}

function StatsCard({ label, value, color = 'default' }) {
  const c = COLOR_MAP[color] || COLOR_MAP.default
  return (
    <div className="stats-card" style={{ background: c.bg }}>
      <span className="stats-label">{label}</span>
      <span className="stats-value" style={{ color: c.val }}>{value}</span>
    </div>
  )
}

export default StatsCard;