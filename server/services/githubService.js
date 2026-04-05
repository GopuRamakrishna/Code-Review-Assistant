const {Octokit}=require('@octokit/rest');


//single octokit instance for the entire application
const octokit=new Octokit({
    auth:process.env.GITHUB_TOKEN
})


//fetch the raw unified diff from a pull-requuest
async function getPRDiff(owner,repo,pullNumber){
    const {data}=await octokit.pulls.get({
        owner,
        repo,
        pull_number:pullNumber,
        mediaType:{format:'diff'} // it returns raw diff text
    })
    return data;
}

//fetch the list of files changes in a pr
async function getPRFiles(owner,repo,pullNumber){
    const {data}=await octokit.pulls.listFiles({
        owner,repo,pull_number:pullNumber
    });
    return data; // returns array of {filename,status,additions,deletions,patch}
}

//post inline review comment on a specific diff line
async function postReviewComment(owner,repo,pullNumber,comments,commitId){
    // await octokit.pulls.createReview({
    //     owner,repo,pull_number:pullNumber,
    //     event:'COMMENT',
    //     comments //array of {path,position,body}
    // });

    for (const comment of comments) {
    try {
      await octokit.pulls.createReviewComment({
        owner,
        repo,
        pull_number: pullNumber,
        path: comment.path,
        line: comment.lineNumber,   // ✅ use line
        side: "RIGHT",              // ✅ valid here
        body: comment.body,
        commit_id: commitId         // ✅ specify the commit ID
      });

    } catch (err) {
      console.log("Skipping invalid comment:", err.message);
    }
  }

// try {
//       await octokit.pulls.createReviewComment({
//         owner,
//         repo,
//         pull_number: pullNumber,
//         event:'COMMENT',             
//         comments
//     });

//     } catch (err) {
//       console.log("Skipping invalid comment and the error is:: ", err.message);
//     }

}


module.exports={getPRDiff,getPRFiles,postReviewComment}