const Bull=require('bull');

const reviewQueue=new Bull('review-queue',{
    reids:process.env.REDIS_URL,
    defaultJobOptions:{
        attempts:3, //retry failed jobs upto 3 times
        backoff:{
            type:'exponential',
            delay:2000 //2 seconds wait 2s->4s->8s between retries
    },
    removeOnComplete:100,  //keep last 100 completed jobs in redis
    removeOnFail:50 //keep last 50 failed jobs for debugging
    }
});



//queue event logging
reviewQueue.on('completed',(job)=>{
    console.log(`[Queue] Job ${job.id} completed - PR #${job.data.prNumber}`);
})


//for failed jobs, log the error
reviewQueue.on('failed',(job,err)=>{
    console.error(`[Queue] Job ${job.id} FAILED - PR #${job.data.prNumber} - | Error: ${err.message}`);
})


reviewQueue.on('stalled',(job)=>{
    console.warn(`[Queue] Job ${job.id} stalled - PR #${job.data.prNumber}`);
})


module.exports=reviewQueue;