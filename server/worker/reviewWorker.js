const reviewQueue=require('../queues/reviewQueue');

const PullRequest=require('../models/PullRequest');

const {getPRFiles,postReviewComment}=require('../services/githubService');
const {parseDiff}=require('../services/diffParser');
const {runRules}=require('../services/ruleEngine');


//process upto 2 jobs at a time
reviewQueue.process(2,async (job)=>{
    const {owner,repo,prNumber}=job.data;

    console.log(`[Worker] Job ${job.id} started Processing PR #${prNumber} from ${owner}/${repo}`);

    //mark PR as analysing in MogoDB
    await PullRequest.findOneAndUpdate(
        {repoFullName:`${owner}/${repo}`,prNumber}, //indexing on these fields makes this query fast
        {$set:{status:'analysing'}}
    )

    try{
    //fetch the all the changed files with their diffs

    const files=await getPRFiles(owner,repo,prNumber);
    const jsFiles=files.filter(f=> f.filename.match(/\.(js|ts|jsx|tsx)$/) && f?.patch)

    console.log(`[Worker] Job ${job.id} - Fetched ${jsFiles.length} JS?TS files to analyse`);

    const allFindings=[];

    //run the parse diff + rulengine on each file
    for(let i=0;i<jsFiles.length;i++){

         const file=jsFiles[i];

         console.log(`[Worker] Job ${job.id} - Analysing file ${file.filename}`);

         const parsedLines=parseDiff(file.patch);

         console.log('Parsed lines:', parsedLines.slice(0, 3));


         const findings=runRules(parsedLines,file.filename);

         allFindings.push(...findings);

         //report progress percentage to BULL (0-80% for analysis)
         await job.progress(Math.round(((i+1)/jsFiles.length)*80));
    }
    console.log(`[Worker] Job ${job.id} - Analysis completed with ${allFindings.length} findings`);

    //Post inlie github review comments
    if(allFindings.length>0){
        const githubComments = allFindings.map(f => ({
                    path: f.path,
                    position: f.position,
                    body: `[${f.severity.toUpperCase()}] ${f.body}`
                    }));
        
              await postReviewComment(owner, repo, prNumber, githubComments);
    //    await postReviewComment(owner,repo,prNumber,allFindings);
       console.log(`[Worker] Job ${job.id} - Posted ${allFindings.length} review comments to PR #${prNumber}`); 
    }

    await job.progress(90) //90% done, waiting for github API

    // - Save findings +marks done in DB
    await PullRequest.findOneAndUpdate(
        {repoFullName:`${owner}/${repo}`,prNumber},
        {
            $set:{
                status:'done',
                findings:allFindings.map(f=>({
                    path: f.path,
                    lineNumber: f.lineNumber || null,
                    position:f.position,
                    body:f.body,
                    severity:f.severity || 'warning',
                    source:'rule',
                    confindence:null,
                    feedback:null

                }))
            }
        }
    );
    await job.progress(100) //100% done

    console.log(`[Worker] Job ${job.id} - PR #${prNumber} marked as done in DB`);
    return {prNumber,findings:allFindings.length};
}catch(err){
    //mark PR as failed in DB
    await PullRequest.findOneAndUpdate({
        repoFullName:`${owner}/${repo}`,prNumber},
        { $set:{ status:'failed' }} );

        console.error(`[Worker] Job ${job.id} - Failed to process PR #${prNumber} - Error: ${err.message}`);
        throw err; //rethrow to let BULL handle retries and backoff
}
}
);

console.log('Review Worker is up and running, waiting for jobs...');