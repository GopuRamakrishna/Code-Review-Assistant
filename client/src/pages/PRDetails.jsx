import React from 'react'
import { useState, useEffect }  from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { formatDistanceToNow }   from 'date-fns'
import { fetchPR }               from '../services/api'
import FindingCard               from '../components/FindingCard'


const STATUS_CONFIG = {
  pending:   { label: 'Queued',     cls: 'badge-pending'   },
  analysing: { label: 'Analysing…', cls: 'badge-analysing' },
  done:      { label: 'Reviewed',   cls: 'badge-done'      },
  failed:    { label: 'Failed',     cls: 'badge-failed'    }
}


function PRDetails() {
     const {id}=useParams();
     const navigate=useNavigate();
     const [pr,setPR]=useState(null);

     const [loading,setLoading]=useState(true);

     const [filter,setFilter]=useState('all');   //all | error | warning | info

     useEffect(()=>{
      fetchPR(id)
      .then(data=>setPR(data))
      .catch(()=>navigate('/prs'))
      .finally(()=>setLoading(false));
     },[id]);

     if(loading) return <div className='page-state'>Loading...</div>;
     if(!pr) return null;


  const cfg      = STATUS_CONFIG[pr.status] || STATUS_CONFIG.pending
  const findings = pr.findings || []
  const filtered = filter === 'all'
    ? findings
    : findings.filter(f => f.severity === filter)

  const counts = {
    error:   findings.filter(f => f.severity === 'error').length,
    warning: findings.filter(f => f.severity === 'warning').length,
    info:    findings.filter(f => f.severity === 'info').length,
  }

  return (
     <div className="page">

      <button className="back-btn" onClick={() => navigate('/prs')}>
        ← Back to PRs
      </button>

      <div className="detail-header">
        <div className="detail-header-top">
          <span className="pr-number">#{pr.prNumber}</span>
          <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
        </div>
        <h1 className="detail-title">{pr.title}</h1>
        <div className="detail-meta">
          <span>by <strong>{pr.author}</strong></span>
          <span className="dot-sep">·</span>
          <span>{pr.repoFullName}</span>
          <span className="dot-sep">·</span>
          <span>{formatDistanceToNow(new Date(pr.createdAt), { addSuffix: true })}</span>
        </div>
      </div>

      <div className="detail-stats">
        <div className="stat-pill">
          <span className="stat-val">{pr.filesChanged || 0}</span>
          <span className="stat-lbl">files</span>
        </div>

        <div className="stat-pill">
          <span className="stat-val">{pr.linesChanged || 0}</span>
          <span className="stat-lbl">lines changed</span>
        </div>
        <div className={`stat-pill ${counts.error > 0 ? 'stat-error' : ''}`}>
          <span className="stat-val">{counts.error}</span>
          <span className="stat-lbl">errors</span>
        </div>
        <div className={`stat-pill ${counts.warning > 0 ? 'stat-warning' : ''}`}>
          <span className="stat-val">{counts.warning}</span>
          <span className="stat-lbl">warnings</span>
        </div>
        <div className="stat-pill">
          <span className="stat-val">{counts.info}</span>
          <span className="stat-lbl">info</span>
        </div>

      </div>

      <div className="findings-section">
        <div className="findings-header">
          <h2>Findings <span className="findings-total">{findings.length}</span></h2>
          <div className="filter-pills">
            {['all', 'error', 'warning', 'info'].map(f => (
              <button
                key={f}
                className={`filter-pill ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? `All (${findings.length})` : `${f} (${counts[f]})`}
              </button>
            ))}
          </div>
        </div>
         {findings.length === 0 ? (
          <div className="clean-state">
            <span className="clean-icon">✓</span>
            <p>No issues found — clean PR!</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="page-state">No {filter} findings</div>
        ) : (
          <div className="findings-list">
            {filtered.map((f, i) => (
              <FindingCard key={f._id || i} finding={f} prId={pr._id} />
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

export default PRDetails