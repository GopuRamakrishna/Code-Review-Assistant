import React from 'react'
import { formatDistanceToNow } from 'date-fns'


const STATUS_CONFIG = {
  pending:   { label: 'Queued',     cls: 'badge-pending'   },
  analysing: { label: 'Analysing…', cls: 'badge-analysing' },
  done:      { label: 'Reviewed',   cls: 'badge-done'      },
  failed:    { label: 'Failed',     cls: 'badge-failed'    }
}

function PRCard({ pr }) {
   const cfg=STATUS_CONFIG[pr.status] || STATUS_CONFIG.pending;
   const findings=pr._findingsCount??pr.findings?.length??0;
   const ago=formatDistanceToNow(new Date(pr.createdAt),{addSuffix:true})

  return (
    <div className={`pr-card ${pr.status === 'analysing' ? 'pr-card--active' : ''}`}>

      <div className="pr-card-top">
        <span className="pr-number">#{pr.prNumber}</span>
        <span className={`badge ${cfg.cls}`}>
          {pr.status === 'analysing' && <span className="pulse-dot"/>}
          {cfg.label}
        </span>
      </div>

       <h3 className="pr-title">{pr.title}</h3>

      <div className="pr-meta">
        <span className="pr-author">{pr.author}</span>
        <span className="pr-repo">{pr.repoFullName}</span>
      </div>

      <div className="pr-card-footer">
        <div className="pr-stats">
          {pr.status === 'done' && (
            <span className={`findings-count ${findings > 0 ? 'has-findings' : 'clean'}`}>
              {findings === 0 ? 'Clean' : `${findings} issue${findings !== 1 ? 's' : ''}`}
            </span>
          )}
          {pr.filesChanged && (
            <span className="pr-files">{pr.filesChanged} file{pr.filesChanged !== 1 ? 's' : ''}</span>
          )}
        </div>
        <span className="pr-ago">{ago}</span>
      </div>
</div>

  )
}

export default PRCard