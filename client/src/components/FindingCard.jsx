import React from 'react'

import { useState } from 'react'
import { submitFeedback } from '../services/api'
import toast from 'react-hot-toast'
import { set } from 'date-fns'

const SEV_CONFIG = {
  error:   { cls: 'sev-error',   label: 'Error'   },
  warning: { cls: 'sev-warning', label: 'Warning' },
  info:    { cls: 'sev-info',    label: 'Info'    }
}

function FindingCard({finding,prId}) {
  const [feedback,setFeedback]=useState(finding.feedback || 'none');  //none | accepted | rejected

  const [saving,setSaving]=useState(false)

  const sev=SEV_CONFIG[finding.severity] || SEV_CONFIG.warning;
  

  const handleFeedback=async(value)=>{
      if(saving || feedback===value) return;
      setSaving(true);
      try{
          await submitFeedback(prId,finding._id,value);
          setFeedback(value);
          toast.success((value === 'helpful' ? 'Marked helpful' : 'Marked not helpful'));
      }catch(err){
          
          toast.error(`Failed to save feedback ${err.message}`);
      }finally{
          setSaving(false);
      }
  }
  return (
     <div className={`finding-card finding-card--${finding.severity}`}>

      <div className="finding-header">
        <div className="finding-location">
          <span className="finding-file">{finding.path}</span>
          <span className="finding-line">line {finding.lineNumber}</span>
        </div>
        <div className="finding-badges">
          <span className={`sev-badge ${sev.cls}`}>{sev.label}</span>
          <span className="source-badge">
            {finding.source === 'ml'
              ? `AI ${finding.confidence ? Math.round(finding.confidence * 100) + '%' : ''}`
              : 'Rule'}
          </span>
        </div>
      </div>
      <p className="finding-body">{finding.body}</p>

      <div className="finding-footer">
        <span className="feedback-label">Was this helpful?</span>
        <div className="feedback-btns">
          <button
            className={`feedback-btn ${feedback === 'helpful' ? 'active-good' : ''}`}
            onClick={() => handleFeedback('helpful')}
            disabled={saving}
            title="Helpful"
          >👍</button>
          <button
            className={`feedback-btn ${feedback === 'not_helpful' ? 'active-bad' : ''}`}
            onClick={() => handleFeedback('not_helpful')}
            disabled={saving}
            title="Not helpful"
          >👎</button>
        </div>
      </div>

    </div>
  )
}

export default FindingCard