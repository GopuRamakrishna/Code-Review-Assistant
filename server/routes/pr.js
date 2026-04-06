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


//Get /api/prs/stats/trends findings per PR over (line chart)
router.get('/stats/trend',async(req,res)=>{
    try{
        const data=await PullRequest.aggregate([
            {$match:{status:'done'}},
            {$sort:{createdAt:1}}, //oldest first
            {$limit:30},
            {$project:{
                prNumber:1,
                title:1,
                createdAt:1,
                findings:{$size:'$findings'}
            }}
        ])
        res.json({success:true,data});
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




//GEt /api/prs/stats/leaderboard top contributors (bar chart)
router.get('/stats/leaderboard',async(req,res)=>{
    try{

        const data=await PullRequest.aggregate([
              {$match:{status:'done'}},
              {$group:{
                _id:'$author',
                totalPRs:{$sum:1},
                totalFindings:{$sum:{$size:'$findings'}},
                totalLines:{$sum:'$linesChanged'}
              }},
              {
                $addFields:{
                    issueRate:{
                        $cond:[
                            {$eq:['$totalLines',0]},0,
                            {$divide:['$totalFindings','$totalLines']}
                        ]
                    }
                },
            },
            {$sort:{issueRate:-1}}  //lowest rate =cleanest coder = top

        ]);
        res.json({success:true,data});

    }catch(err){
        res.status(500).json({success:false,error:err.message});
    }
})


// GET /api/prs/stats/severity — findings grouped by severity (bar chart)
router.get('/stats/severity',async(req,res)=>{
      try{

        const data=await PullRequest.aggregate([
            {$unwind:'$findings'},
            {$group:{
                _id:'$findings.severity',
                count:{$sum:1}
            }}

        ]);
        res.json({success:true,data});

      }catch(err){
        res.status(500).json({success:false,error:err.message});
      }
});


// GET /api/prs/stats/files — top flagged files (heatmap)
router.get('/stats/files', async (req, res) => {
  try {
    const data = await PullRequest.aggregate([
      { $unwind: '$findings' },
      { $group: {
        _id:   '$findings.path',
        count: { $sum: 1 }
      }},
      { $sort:  { count: -1 } },
      { $limit: 8 }
    ]);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});



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


//patch /api/prs/:id/findings/:findingId/feedback -- submit feedback for a finding
router.patch('/:id/findings/:findingId/feedback',async(req,res)=>{
      try{
        const {feedback}=req.body;
        const pr=await PullRequest.findOneAndUpdate(
            {
                _id:req.params.id,
                'findings._id':req.params.findingId
            },
            {$set:{'findings.$.feedback':feedback}},
            {new:true}
        );
        if(!pr) return res.status(404).json({success:false});
        res.json({success:true});
      }catch(err){
        res.status(500).json({success:false,error:err.message});
      }
})

module.exports=router;