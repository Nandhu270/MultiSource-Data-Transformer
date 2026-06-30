import os
import json
import shutil
import tempfile
import pandas as pd
from typing import List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from pipeline import CandidatePipeline

app = FastAPI(title="Eightfold Candidate Profile Transformer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/run_pipeline")
async def run_pipeline(
    recruiter_csv: UploadFile = File(...),
    github_csv: UploadFile = File(...),
    resumes: List[UploadFile] = File(...),
    config_json: str = Form(...),
    job_description: str = Form(None)
):
    try:
        config = json.loads(config_json)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid config_json format: {e}")

    temp_dir = tempfile.mkdtemp()
    resumes_dir = os.path.join(temp_dir, "resumes")
    os.makedirs(resumes_dir, exist_ok=True)

    try:
        recruiter_path = os.path.join(temp_dir, "recruiter.csv")
        with open(recruiter_path, "wb") as f:
            shutil.copyfileobj(recruiter_csv.file, f)

        github_path = os.path.join(temp_dir, "github.csv")
        with open(github_path, "wb") as f:
            shutil.copyfileobj(github_csv.file, f)

        for resume in resumes:
            safe_filename = os.path.basename(resume.filename)
            resume_path = os.path.join(resumes_dir, safe_filename)
            with open(resume_path, "wb") as f:
                shutil.copyfileobj(resume.file, f)

        try:
            recruiter_df = pd.read_csv(recruiter_path)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error reading Recruiter CSV: {e}")

        try:
            github_df = pd.read_csv(github_path)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error reading GitHub CSV: {e}")

        pipeline = CandidatePipeline(config, job_description=job_description)
        pipeline.load_resumes(resumes_dir)
        processed_candidates, _ = pipeline.process(recruiter_df, github_df)

        return {
            "status": "success",
            "candidates": processed_candidates,
            "conflicts": pipeline.conflicts
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
