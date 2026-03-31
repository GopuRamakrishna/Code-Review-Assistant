const mongoose=require('mongoose')

async function connectDB(){
    try{
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("mongoDB connected successfully");

    }catch(err){
        console.error("Error connecting to mongoDB",err.message);
        process.exit(1); //exit the process with failure code
    }
}


module.exports=connectDB;