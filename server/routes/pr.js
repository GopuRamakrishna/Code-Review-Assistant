const exp=require('express')

const PullRequest=require('../models/PullRequest');

const router=exp.Router();


//GET /api/prs -- all PRS sorted newest first, excluding findings for performance
router.get('/',async(req,res)=>{
    try{
        const prs=await PullRequest
        .find({})
        .sort({createdAt:-1})  // Sort by createdAt in descending order
        .select('-findings') // Exclude the findings field from the response
        .limit(50);
        res.json({success:true,data:prs});
    }catch(err){
        res.status(500).json({success:false,error:err.message});
    }
})


//get /api/prs/:id -- get a specific PR by ID

router.get('/:id',async(req,res)=>{
      try{
        const pr=await PullRequest.findById(req.params.id);
        if(!pr) return res.status(404).json({success:false,error:'PR not found'});
        res.json({success:true,data:pr});
      }catch(err){
        res.status(500).json({success:false,error:err.message});
      }
})


//Get /api/prs/stats/summary -- summary stats for dashboard

router.get('/stats/summary',async(req,res)=>{
    try{
        const [total,done,failed,findings]=await Promise.all([
            PullRequest.countDocuments(),
            PullRequest.countDocuments({status:'done'}),
            PullRequest.countDocuments({status:'failed'}),
            PullRequest.aggregate([
                {$unwind:'$findings'},
                {$count:'total'}
            ])
        ])

        res.json(
            {
                success:true,
                data:{
                    totalPRs:total,
                    reviewed:done,
                    failed:failed,
                    totalFindings:findings[0]?.total || 0
                }});

    }catch(err){
        res.status(500).json({success:false,error:err.message});
    }
})



module.exports=router;