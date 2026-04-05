import axios from 'axios';

const api=axios.create({
    baseURL:'/api',
    timeout:10000,
    withCredentials:true
})


//Fetch all PRs (no-findings -lightweight for list view)

export const fetchPRs=async()=>{
    const {data}=await api.get('/prs');
    return data.data; //return the array of PRs
}


//fetch one PR with full findings
export const fetchPR=async(id)=>{
    const {data}=await api.get(`/prs/${id}`);
    return data.data;  
}


//fetch summary stats for analytics cards

export const fetchStats=async()=>{
    const {data}=await api.get('/prs/stats/summary');
    return data.data;
}


//submit thumbs up/down feedback on a finding
export const submitFeedback=async(prId,findingId,feedback)=>{
    const {data}=await api.patch(`/prs/${prId}/findings/${findingId}/feedback`, //patch is used for partial updates
        {feedback}
    );
    return data;
}


export default api;