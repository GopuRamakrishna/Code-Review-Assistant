require('dotenv').config();
const express=require('express');

//importing routes 
const webhookRouter=require('./routes/webhook');

//import the connectDB function to connect to the dataabase
const connectDB=require('./config/db')

//connect to the db
connectDB(); //now is it ok

//register Bull worker -requiring the file starts the processor
require('./worker/reviewWorker');



//create the express object(app)
const app=express();
//port number
const PORT=process.env.PORT || 5000;


// IMPORTANT: raw body needed for HMAC verification
// Must come BEFORE express.json()
app.use('/api/webhooks', express.raw({ type: 'application/json' }));

//json parser for all other routes
app.use(express.json());

//use the webhook router 
app.use('/api/webhooks',webhookRouter);



//simple route to test the server
app.get('/',(req,res)=>{
    res.json({
        status:"success",
        message:"AI Code Reviewer running"
    })
})



//listen to the port
app.listen(PORT,()=>{
   console.log(`[Server] Running on port ${PORT}`);
  console.log('[Server] Webhook receiver: ready');
  console.log('[Server] Review worker:    ready');
});


