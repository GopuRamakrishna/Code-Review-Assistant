from fastapi import FastAPI,HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List,Optional
import os,time
from dotenv import load_dotenv
from model import CodeBERTClassifier
from chunker import chunk_code


load_dotenv()

app=FastAPI(title="AI Code Review ML Service")

# add the middleware 
app.add_middleware(CORSMiddleware,allow_origins=["*"],allow_methods=["*"])

print("[ML] Loading CodeBERT model...")
classifier=CodeBERTClassifier()  # load the model once at startup and reuse for all requests
print("[ML] CodeBERT model ready.")


ThRESHOLD=float(os.getenv("CONFIDENCE_THRESHOLD","0.4")) 

class AnalyzeRequest(BaseModel):
    code:str
    language:Optional[str]="javascript"
    filename:Optional[str]="unknown"

class Finding(BaseModel):
    confidence:float
    label:str
    chunk_index:int
    chunk_text:str


class AnalyzeResponse(BaseModel):
    filename: str
    findings: List[Finding]
    total_chunks: int
    duration_ms: int


@app.get("/health")
def health():
    return {"status":"ok","model":"codebert-base"}

@app.post("/analyze",response_model=AnalyzeResponse)
def analyze(req:AnalyzeRequest):   # analyze the code and return findings
    if not req.code.strip():
        raise HTTPException(status_code=400,detail="Code is empty")
    start=time.time()
    chunks=chunk_code(req.code)  # split the code into chunks
    findings=[]
    for i,chunk in enumerate(chunks):
        label,confidence=classifier.predict(chunk)
        print(f"[ML DEBUG] chunk {i}: label={label}, confidence={confidence:.4f}")  # add this
        # if label=="bug" and confidence>=ThRESHOLD:
        if confidence>=ThRESHOLD:
            findings.append(Finding(confidence=round(confidence,4),label=label,chunk_index=i,chunk_text=chunk[:200]))
    duration=int((time.time()-start)*1000)

    print(f"[ML] {req.filename}: {len(chunks)} chunks → {len(findings)} findings ({duration}ms)")
    return AnalyzeResponse(filename=req.filename, findings=findings, total_chunks=len(chunks), duration_ms=duration)
