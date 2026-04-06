import React from 'react'
import { useState, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts'
import { fetchStats, fetchTrend, fetchLeaderboard, fetchSeverity, fetchFiles } from '../services/api'
import StatsCard from '../components/StatsCard'


const SEV_COLORS = { error: '#f56565', warning: '#f5a623', info: '#4f8ef7' }

function Analytics() {

  const [stats,       setStats]       = useState(null)
  const [trend,       setTrend]       = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [severity,    setSeverity]    = useState([])
  const [files,       setFiles]       = useState([])
  const [loading,     setLoading]     = useState(true)


  useEffect(()=>{
    Promise.all([fetchStats(),fetchTrend(),fetchLeaderboard(),fetchSeverity(),fetchFiles()])
    .then(([s,t,l,sv,f])=>{
      setStats(s);setTrend(t);setLeaderboard(l);setSeverity(sv);setFiles(f);
    }).finally(()=>setLoading(false))
    
  },[]);

   if (loading) return <div className="page-state">Loading analytics…</div>

  const avgFindings = stats?.totalPRs
    ? (stats.totalFindings / stats.reviewed).toFixed(1)
    : '0';

  return (
      <div className="page">
      <div className="page-header"><h1>Analytics</h1></div>

      <div className="stats-grid">
        <StatsCard label="Total PRs"       value={stats?.totalPRs     || 0} />
        <StatsCard label="Reviewed"         value={stats?.reviewed      || 0} color="green" />
        <StatsCard label="Total findings"  value={stats?.totalFindings || 0} color="red" />
        <StatsCard label="Avg per PR"      value={avgFindings}                color="blue" />
      </div>

      <div className="analytics-grid">

        <div className="chart-card">
          <h3 className="chart-title">Quality trend <span>findings per PR</span></h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d35" />
              <XAxis dataKey="prNumber" tick={{ fill: '#555b68', fontSize: 11 }}
                tickFormatter={v => `#${v}`} />
              <YAxis tick={{ fill: '#555b68', fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#161920', border: '1px solid #2a2d35', borderRadius: '8px', fontSize: '12px' }}
                labelFormatter={v => `PR #${v}`}
              />
              <Line dataKey="findings" stroke="#4f8ef7" strokeWidth={2}
                dot={{ fill: '#4f8ef7', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Severity breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={severity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d35" />
              <XAxis dataKey="_id" tick={{ fill: '#555b68', fontSize: 11 }} />
              <YAxis tick={{ fill: '#555b68', fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#161920', border: '1px solid #2a2d35', borderRadius: '8px', fontSize: '12px' }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {severity.map(s => (
                  <Cell key={s._id} fill={SEV_COLORS[s._id] || '#4f8ef7'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Team leaderboard <span>lowest issue rate = top</span></h3>
          <div className="leaderboard">
            {leaderboard.map((dev, i) => (
              <div className="leaderboard-row" key={dev._id}>
                <span className={`rank ${i === 0 ? 'rank-gold' : i === 1 ? 'rank-silver' : i === 2 ? 'rank-bronze' : ''}`}>
                  {i + 1}
                </span>
                <div className="dev-info">
                  <span className="dev-name">{dev._id}</span>
                  <span className="dev-prs">{dev.totalPRs} PRs · {dev.totalFindings} findings</span>
                </div>
                <div className="dev-rate">
                  <span className={`rate-val ${dev.totalFindings === 0 ? 'rate-clean' : ''}`}>
                    {dev.totalFindings === 0 ? 'Clean' : (dev.issueRate * 100).toFixed(1) + '%'}
                  </span>
                  <span className="rate-lbl">issue rate</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">File heatmap <span>most flagged files</span></h3>
          <div className="file-heatmap">
            {files.map((f, i) => {
              const max = files[0]?.count || 1
              const pct = Math.round((f.count / max) * 100)
              return (
                <div className="heatmap-row" key={f._id}>
                  <span className="heatmap-file">{f._id.split('/').pop()}</span>
                  <div className="heatmap-bar-wrap">
                    <div className="heatmap-bar" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="heatmap-count">{f.count}</span>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}

export default Analytics