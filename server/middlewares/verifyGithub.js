//import the crypto
const crypto=require('crypto')

//here we write the function to verify the github oAuth using the OAuth
function verifyGithub(req,res,next){
    const signature = req.headers['x-hub-signature-256'];

     if (!signature) {
       console.error('No signature header — rejecting');
       return res.status(401).json({ error: 'Missing signature' });
  }

 
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  // Compute expected signature from raw body + secret
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(req.body).digest('hex');

  // Timing-safe comparison — prevents timing attacks
  const sigBuffer = Buffer.from(signature);
  const digestBuffer = Buffer.from(digest);

  if (sigBuffer.length !== digestBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, digestBuffer)) {
      console.error('Signature mismatch — possible forgery attempt');
      return res.status(401).json({ error: 'Invalid signature' });
  }

  console.log('Webhook signature verified');
  next(); // signature valid — continue to route handler
}

module.exports=verifyGithub;

