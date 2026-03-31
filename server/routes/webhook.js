//import express and create the router obj using .Router()
const exp=require('express');
const router=exp.Router();

//import the verifyGithub middleware to verify the actual github req not from any attacker
const verifyGithub=require('../middlewares/verifyGithub')


//import the handle pr for later phase
const {handlePREvent}=require('../controllers/prController');


//write the post route to simple check the router
router.post('/github',verifyGithub,(req,res)=>{
      console.log(req.headers);
      const event = req.headers['x-github-event'];
      const payload = JSON.parse(req.body); // body is raw Buffer here

  console.log(`Received GitHub event: ${event}`);

//   Only care about pull_request events
  if (event === 'pull_request') {
    const action = payload.action; // opened, synchronize, closed

    if (action === 'opened' || action === 'synchronize') {
      //fire and forget - we will handle the PR event in the background, no need to make github wait for our processing
      handlePREvent(payload) //makes async but we don't await it, we want to respond to github immediately and do the processing in the background
      .catch(err=>console.error('[Webhook] handlePREvent error:', err.message));
    }
  }

  //never make the github to wait as the response time is just 12 sec
      res.status(200).json({received:true});
});


//sample testing webhoot route
router.get('/webhook',(req,res)=>{
    res.json({
        status:"success",
        message:"this is the webhook route"
    })
})

module.exports=router;