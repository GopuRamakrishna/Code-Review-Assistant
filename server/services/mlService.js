const axios=require('axios');

const ML_URL=process.env.ML_SERVICE_URL  || 'http://localhost:8000';


// function to check if the ML service is up by calling its health endpoint
async function isMLServiceUp(){
    try{
        await axios.get(`${ML_URL}/health`,{timeout:30000});
        return true;
    }catch(err){
        return false;
    }
}


async function analyzeCode(code,filename){
    try{
        const {data}=await axios.post(
            `${ML_URL}/analyze`,
            {
                code,filename,language:"javascript"
            },
            {timeout:30000}
        )
        console.log(`[ML] ${filename}: ${data.findings.length} findings in ${data.duration_ms}ms`);
        return data.findings.map(f=>({
            path:filename,position:null,lineNumber:null,
            body: `[AI ${Math.round(f.confidence * 100)}%] Potential bug pattern — review this block.\n\`\`\`\n${f.chunk_text}\n\`\`\``,
            severity:f.confidence>=0.90?'error':'warning',
            source:'ml', confidence:f.confidence,chunkText:f.chunk_text
        }));


    }catch(err){
        console.warn(`[ML] Unavailable for ${filename}: ${err.message}`);
        return [];
    }

}


module.exports = { analyzeCode, isMLServiceUp };

