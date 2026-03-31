const mongoose=require('mongoose');

//FINDING schema
const findingSchema=new mongoose.Schema({
    path:String,
    lineNumber:Number,
    position:Number,
    body:String,
    severity:{
        type:String,
        enum:['error','warning','info']
    },
    source:{
        type:String,
        enum:['rule','ml']
    },
    confidence:Number,   //null for rules but 0-1 for ML
    feedback:{
        type:String,
        enum:['helpful','not_helpful',null]
    }
});

const prSchema=new mongoose.Schema({
    repoFullName:{
        type:String,
        required:true
    },
    prNumber:{
        type:Number,
        required:true
    },
    title:String,
    author:String,
    status:{
        type:String,
        enum:['pending','analysing','done','failed'],
        default:'pending'
    },
    findings:[findingSchema],
    linesChanged:Number,
    filesChanged:Number,
    createdAt:{
        type:Date,
        default:Date.now
    }
})

//compund index -prevents duplicate PR record
prSchema.index({repoFullName:1,prNumber:1},{unique:true})

module.exports=mongoose.model('PullRequest',prSchema);