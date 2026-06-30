Architecture Overview
This project is a Multi-Source Candidate Profile Transformer. It parses, normalizes, matches, and merges candidate profiles from three distinct sources:

Recruiter CSV: Spreadsheets managed by recruiters containing candidate contact info and status.
GitHub CSV: Data scraped or exported from GitHub (usernames, repositories, etc.).
Resumes: Documents in PDF or Word (DOCX) format.

1. Backend Architecture (Python + FastAPI)
The backend is located in the 

Backend
 folder and is built on a modular Python stack:


app.py
: The entry point. Exposes a FastAPI application with CORS enabled. It defines a single, robust endpoint:
POST /api/run_pipeline: Accepts the Recruiter CSV, GitHub CSV, a list of Resume files, and a JSON configuration string (defining conflict resolution rules). It processes these in a secure temporary directory and returns the processed profiles and conflicts.


pipeline.py
: The core orchestrator. Contains the CandidatePipeline class, which:
Loads and parses resumes.
Cleans and extracts GitHub usernames from URLs and handles.
Calls the GitHub API (optionally authenticated) to fetch additional profile details.
Matches profiles across the three sources using fuzzy matching (rapidfuzz) on names, emails, and phone numbers.
Merges fields and flags conflicts according to the user-defined configuration.


extractor.py
: Handles file parsing and information extraction.
Uses pdfplumber to extract text and embedded hyperlinks from PDFs.
Uses python-docx to parse Word documents.
Uses regular expressions and heuristics to extract names, emails, phone numbers, LinkedIn/GitHub links, skills, experience, and education.


normalizer.py
: Standardizes data fields.
Normalizes phone numbers (e.g., removing spaces, dashes, adding country codes using the phonenumbers library).
Standardizes dates and skill names to ensure accurate matching and merging.
2. Frontend Architecture (React + Vite)
The frontend is a single-page React application located in the root directory:

Vite: Used as the build tool and development server for fast HMR (Hot Module Replacement).


package.json
:
framer-motion: Powers smooth transitions and animations.
lucide-react: Provides modern UI icons.
react-router-dom: Handles routing/navigation.
UI Layout: Under 

src/components
 and 

src/pages
. It provides:
An upload interface for CSVs and Resumes.
An interactive configuration dashboard where users can define source priority (e.g., "Prefer Resume for Skills, but Recruiter CSV for Phone Number").
A results dashboard displaying merged profiles, resolved fields, and highlighted conflicts.
How to Run the Project
Follow these steps to set up and run both the backend and frontend services.

Prerequisites
Python 3.8+ installed.
Node.js (v18+) and npm installed.
Step 1: Run the Backend
Open your terminal and navigate to the Backend directory:

powershell
cd "Backend"
Create a Virtual Environment: and run your virtual environment

env
GITHUB_TOKEN=your_personal_access_token_here
Start the FastAPI Server:

powershell
python app.py
The backend will start running on http://localhost:8000.

Step 2: Run the Frontend
Open a new terminal in the root directory

npm install
Start the Vite Development Server:

npm run dev
The frontend will start running on http://localhost:5173

