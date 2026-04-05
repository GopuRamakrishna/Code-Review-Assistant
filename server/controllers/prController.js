const PullRequest=require('../models/PullRequest');

const reviewQueue=require('../queues/reviewQueue');

//get the emitReviewEvent helper to emit events from the worker
const {emitReviewEvent}=require('../src/socket');

async function handlePREvent(payload){


   const {number,pull_request,repository}=payload;

   const [owner,repo]=repository.full_name.split('/');

   //save PR to MongoDB with status pending
   await PullRequest.findOneAndUpdate(
    {repoFullName:repository.full_name,prNumber:number},
    {
      $set:{
        repoFullName: repository.full_name,
        prNumber:     number,
        title:        pull_request.title,
        author:       pull_request.user.login,
        status:       'pending',
        linesChanged: pull_request.additions + pull_request.deletions,
        filesChanged: pull_request.changed_files,
        findings:     []
      }
    },
    {upsert:true,new:true} //create new or update existing
   );

  console.log(`[Controller] PR #${number} saved → pending`);

  //enqueue job - woker dones all heavy lifting (fetching files, parsing diffs, running rules, posting comments, updating DB)
  const job=await reviewQueue.add({
    owner,
    repo,
    prNumber:number,
    title:pull_request.title,
    author:pull_request.user.login,
    commitId:pull_request.head.sha
  });


  //Emit PR queued -dashboard shows card immediately with "pending" status, updated to "analysing" when worker picks up the job, then "done" or "failed"
  emitReviewEvent('review:queued',{
    prNumber:number,
    repo:repository.full_name,
    title:pull_request.title,
    author:pull_request.user.login,
    status:'pending'
  })

console.log(`[Controller] PR #${number} queued as job ${job.id}`);
  // Webhook handler returns 200 right after this — done in <50ms

}
module.exports={handlePREvent};



// //get the require functions from gihubservices
// const {getPRFiles,postReviewComment}=require('../services/githubService');

// //import the PR Model
// const PullRequest=require('../models/PullRequest');

// //get the parseDiff 
// const {parseDiff}=require('../services/diffParser');

// //import the rule engine
// const {runRules}=require('../services/ruleEngine');

// async function handlePREvent(payload) {
//   const { action, number, pull_request, repository } = payload;

//   const [owner,repo]=repository.full_name.split('/');


//   //save 1:persist the PR to MongoDB immedeiately
//   //upsert handles both new prs and "synchronize" events (new commits)
//   let prDoc=await PullRequest.findOneAndUpdate(   
//     {repoFullName:repository.full_name,prNumber:number},
//     {
//       $set:{
//         repoFullName:repository.full_name,
//         prNumber:number,
//         title:pull_request.title,
//         author:pull_request.user.login,
//         status:'pending',
//         linesChanged:pull_request.additions+pull_request.deletions,
//         filesChanged:pull_request.changed_files,
//         findings:[] //clear old findings on new commits
//       }
//     },{
//       upsert:true,new:true
//     }
//   );
//   console.log(`[DB] PR #${number} saved → status: pending`);


//   try{

//   //sace 2:mark as analysing
//   prDoc.status='analysing';
//   await prDoc.save();
//   console.log(`[DB] PR #${number} updated → status: analysing`);



//     //fetch the all the changed files with their diffs
//     const files=await getPRFiles(owner,repo,number);
//     console.log(`fetched ${files.length} changed files`)

//     //process each file
//     const allFindings=[];
//     for(const file of files){
//       //only analyse the JS/TS files for now
//       if(!file.filename.match(/\.(js|ts|jsx|tsx)$/)) continue;

//       if(!file?.patch) continue; //skip if no diff available (eg:binary files)

//       console.log(`Analyzing ${file.filename}`)

//       //3.parse the diff into the structured lines with positions
//       const parsedLines=parseDiff(file.patch);
//       console.log('Parsed lines:', parsedLines.slice(0, 3));


//       // run the static rule engine on added lines
//       const findings=runRules(parsedLines,file.filename);
//       allFindings.push(...findings);
//     }
//     console.log(`found ${allFindings.length} issues`);

//     //post findings as review comments (if any)
//     if(allFindings.length>0){

//       const githubComments = allFindings.map(f => ({
//             path: f.path,
//             position: f.position,
//             body: `[${f.severity.toUpperCase()}] ${f.body}`
//             }));

//       // await postReviewComment(owner,repo,number,allFindings);
//       await postReviewComment(owner, repo, number, githubComments);
//       console.log(`posted ${allFindings.length} comments to PR #${number}`)
//     }

//     //save 3 mark as done
//     prDoc.status='done';
//     prDoc.findings=allFindings.map(f=>({
//       path:f.path,
//       lineNumber:f.lineNumber || null,
//       position:f.position,
//       body:f.body,
//       severity:f.severity  || 'warning',
//       source:'rule',
//       confidence:null,  //null for rules,0-1 for ML
//       feedback:null
//     }));

//     await prDoc.save();
//     console.log(`[DB] PR #${number} updated → status: done with ${allFindings.length} findings`);



//   }catch(err){

//     //save 4 mark failed as dashboard doesn't show comments if PR is failed
//     await PullRequest.findOneAndUpdate(
//       {repoFullName:repository.full_name,prNumber:number},
//       {$set:{status:'failed'}}
//     );
//     console.error(`[DB] PR #${number} → status: failed`, err.message);
//   }

//   // console.log('===================================');
//   // console.log(`PR #${number} — ${action.toUpperCase()}`);
//   // console.log(`Title:  ${pull_request.title}`);
//   // console.log(`Author: ${pull_request.user.login}`);
//   // console.log(`Repo:   ${repository.full_name}`);
//   // console.log(`Branch: ${pull_request.head.ref} → ${pull_request.base.ref}`);
//   // console.log(`Files:  ${pull_request.changed_files} changed`);
//   // console.log(`Diff:   ${pull_request.additions}+ ${pull_request.deletions}-`);
//   // console.log('===================================');

// }

// module.exports = { handlePREvent };
