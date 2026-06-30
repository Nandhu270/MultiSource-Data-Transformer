import os
import json
import shutil
import tempfile
import pandas as pd
from typing import List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables from .env file statically
load_dotenv()

from pipeline import CandidatePipeline

app = FastAPI(title="Eightfold Candidate Profile Transformer API")

# Enable CORS for frontend integration
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
    config_json: str = Form(...)
):
    # 1. Parse configuration
    try:
        config = json.loads(config_json)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid config_json format: {e}")

    # Create a temporary directory structure to hold uploaded files
    temp_dir = tempfile.mkdtemp()
    resumes_dir = os.path.join(temp_dir, "resumes")
    os.makedirs(resumes_dir, exist_ok=True)

    try:
        # Save Recruiter CSV
        recruiter_path = os.path.join(temp_dir, "recruiter.csv")
        with open(recruiter_path, "wb") as f:
            shutil.copyfileobj(recruiter_csv.file, f)

        # Save GitHub CSV
        github_path = os.path.join(temp_dir, "github.csv")
        with open(github_path, "wb") as f:
            shutil.copyfileobj(github_csv.file, f)

        # Save Resumes
        for resume in resumes:
            # Avoid path traversal if filename contains directories
            safe_filename = os.path.basename(resume.filename)
            resume_path = os.path.join(resumes_dir, safe_filename)
            with open(resume_path, "wb") as f:
                shutil.copyfileobj(resume.file, f)

        # Load CSVs into DataFrames
        try:
            recruiter_df = pd.read_csv(recruiter_path)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error reading Recruiter CSV: {e}")

        try:
            github_df = pd.read_csv(github_path)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error reading GitHub CSV: {e}")

        # Initialize and run pipeline
        pipeline = CandidatePipeline(config)
        pipeline.load_resumes(resumes_dir)
        processed_candidates, complete_candidates = pipeline.process(recruiter_df, github_df)

        return {
            "status": "success",
            "candidates": processed_candidates,
            "complete_candidates": complete_candidates,
            "conflicts": pipeline.conflicts
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        # Clean up temporary directory
        shutil.rmtree(temp_dir, ignore_errors=True)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
