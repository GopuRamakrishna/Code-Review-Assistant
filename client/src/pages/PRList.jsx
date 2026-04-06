import React from 'react'
import {useState,useEffect} from 'react'
import {useSocket} from '../hooks/useSocket'
import PRCard from '../components/PRCard'
import toast from 'react-hot-toast'
import { use } from 'react'
import { fetchPRs } from '../services/api'

function PRList() {

  const [prs,setPRs]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const {on}=useSocket();

  //intial fetch of PRs

  useEffect(()=>{
    fetchPRs()
    .then(data=>setPRs(data))
    .catch(err=>setError(err.message))
    .finally(()=>setLoading(false));
  },[]) //empty dependency array means this runs once on mount


  //live socket listener for new PRS 
   useEffect(()=>{
     //new PR appears instantly when queued
     const offQueued=on('review:queued',(data)=>{
      setPRs(prev=>{
        const exists=prev.find(p=>p.prNumber===data.prNumber);

        if(exists) return prev; //already in list
        return [{
          _id:data.prNumber+'-live',
          prNumber:data.prNumber,
          title:data.title,
          author:data.author,
          status:'pending',
          repoFullName:data.repo,
          findings:[],
          createdAt:new Date().toISOString()
        },...prev]
      })
      toast(`PR #${data.prNumber} queued for review`,{icon:'⌥'})
     })

     //status updates flow through in real time
     const offStarted=on('review:started',(data)=>{
      setPRs(prev=>prev.map(p=>p.prNumber===data.prNumber?{...p,status:'analysing'}:p))
     })

     const offComplete=on('review:complete',data=>{
      setPRs(prev=>prev.map(p=>p.prNumber===data.prNumber?{...p,status:data.status,_findingsCount:data.findings}:p))

      if(data.status==='done'){
        toast.success(`PR #${data.prNumber} reviewed - ${data.findings} findings`)
      }
     })

     //cleanup listeners on unmount

     return ()=>{
      offQueued();
      offStarted();
      offComplete();
     }

   },[on])

   if(loading) return <div className='page-state'>Loading PRs...</div>
   if(error) return <div className='page-state error'>Error loading PRs: {error}</div>


  return (
    <div className="page">
      <div className="page-header">
        <h1>Pull Requests</h1>
        <span className="pr-count">{prs.length} PRs</span>
      </div>

      {prs.length === 0 ? (
        <div className="empty-state">
          <p>No PRs reviewed yet.</p>
          <p>Open a pull request on your connected repo to get started.</p>
        </div>
      ) : (
        <div className="pr-grid">
          {prs.map(pr => <PRCard key={pr._id} pr={pr} />)}
        </div>
      )}
    </div>
  )
}

export default PRList


