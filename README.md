# Multi-Source Multi-Candidate Profile Transformer

The **Multi-Source Multi-Candidate Profile Transformer** is a high-performance system designed to ingest, parse, normalize, and match candidate information across three distinct data channels: **Recruiter CSVs**, **GitHub Scraping/CSV data**, and **PDF/Word Resumes**. 

It uses advanced matching metrics, fuzzy logic classifiers, and information-theory metrics (Shannon Entropy) to resolve field conflicts, verify projects, and evaluate candidate match confidence.

---

## Architecture & Component Design

The application follows a decoupled backend-frontend architecture:

```
                  ┌──────────────────────────────────────────────┐
                  │                  Ingestion                   │
                  │  ┌──────────────┐ ┌────────────┐ ┌────────┐  │
                  │  │Recruiter CSV │ │ GitHub CSV │ │Resumes │  │
                  │  └──────┬───────┘ └─────┬──────┘ └───┬────┘  │
                  └─────────┼───────────────┼────────────┼───────┘
                            │               │            │
                            └───────────────┼────────────┘
                                            ▼
                  ┌──────────────────────────────────────────────┐
                  │                FastAPI API                   │
                  │          (POST /api/run_pipeline)            │
                  └─────────────────────────┬────────────────────┘
                                            │
                                            ▼
                  ┌──────────────────────────────────────────────┐
                  │             pipeline.py Orchestrator         │
                  └──────┬───────────────┬──────────────┬────────┘
                         │               │              │
                         ▼               ▼              ▼
                  ┌────────────┐  ┌────────────┐  ┌────────────┐
                  │extractor.py│  │normalizer.py│  │ matcher.py │
                  │(PDF/Word)  │  │(Standards) │  │(Algorithms)│
                  └────────────┘  └────────────┘  └────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │            JSON output / conflicts           │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │             React Results Frontend           │
                  └──────────────────────────────────────────────┘
```

### 1. Backend Service (FastAPI)
The backend is located in the `Backend/` directory and contains the following core components:

*   **[`app.py`](Backend/app.py)**: The entrypoint exposing a FastAPI server. It handles CORS, temporary file management for uploaded resumes, and serves the `POST /api/run_pipeline` endpoint.
*   **[`pipeline.py`](Backend/pipeline.py)**: The central pipeline orchestrator. It manages the sequential processing flow:
    1.  Parse PDF/Word files and extract structural text.
    2.  Ingest Recruiter and GitHub CSV records.
    3.  Call the GitHub API (with optional authorization token) to scrape repository metadata, primary languages, description keywords, and topics.
    4.  Run the side-by-side matching engine across sources.
    5.  Perform conflict resolution based on user priority matrices and compute Shannon entropy.
    6.  Project the resulting unified candidates record.
*   **[`matcher.py`](Backend/matcher.py)**: The core algorithmic engine. It computes similarity coefficients (Jaccard, Dice, Cosine), fuzzy name/email overlaps, project name matching, project boost calculations, and mapping to fuzzy logic ratings.
*   **[`extractor.py`](Backend/extractor.py)**: Responsible for unstructured document parsing. It uses `pdfplumber` to extract text and hyperlinks from PDFs, and `python-docx` for Word files, applying targeted regular expressions to extract contacts, links, skills, experience, and education.
*   **[`normalizer.py`](Backend/normalizer.py)**: Standardizes variable formats. It uses `phonenumbers` to format international dialing numbers, standardizes date ranges to a `YYYY-MM` schema, and applies dictionary maps to normalize syntax (e.g., mapping `JS` $\rightarrow$ `javascript`, `ReactJS` $\rightarrow$ `react`).

### 2. Frontend Client (React)
The frontend is a modern React application optimized with Vite:
*   **[`PipelineContext.jsx`](src/context/PipelineContext.jsx)**: Global state provider. Handles configuration values, pipeline run history, pipeline status loops, and merges frontend states.
*   **[`Results.jsx`](src/pages/Results.jsx)**: Interactive results panel detailing verified candidates, side-by-side field values, conflict logs, and granular GitHub repository match metrics.

---

##  Key Features

*   **Multi-Source Extraction**: Seamlessly extracts and aligns fields from unstructured PDFs/DOCX and structured tables.
*   **Conflict Resolution Engine**: Resolves contradicting contact information, locations, or names using configurable source weights, method weights, and corroboration boosts.
*   **Fuzzy Project & Skill Alignment**: Compares projects declared on a candidate's resume with their public GitHub repositories.
*   **Shannon Entropy Conflict Meter**: Computes data conflict levels on fields using information theory to flag records requiring manual verification.
*   **JD Matching**: Extracts keywords from a natural-language Job Description (JD) and ranks candidates using Dice similarity.
*   **Aesthetics & UX**: A premium dark-mode interface with progress animations, visual status indicators, and responsive charts.

---

## Core Algorithms & Mathematical Logic

The candidate transformer incorporates several mathematical, probabilistic, and string similarity algorithms to verify data correctness and reasoning.

### 1. Dice-Sørensen Similarity Coefficient (DSC)
The system uses the **Dice-Sørensen similarity coefficient** in two areas:
*   Comparing the overlap between candidate skills and GitHub repositories.
*   Performing the **Job Description (JD) match score** calculation. 

Compared to Jaccard similarity, the Dice coefficient gives double weight to the size of the intersection, making it ideal for determining keyword overlap when candidates might have larger skill lists:
$$\text{Dice}(A, B) = \frac{2 \times |A \cap B|}{|A| + |B|}$$
*   **Implementation:** [`calculate_dice_coefficient(set_a, set_b)`](file:///k:/EightFold%20AI/Backend/matcher.py#L70-L78)

### 2. Cosine Similarity (TF-IDF Vector Space Model)
To match the candidate's resume headline/job title with the recruiter's target title (e.g., "Senior Software Engineer" vs "Software Engineer"), the system implements a **TF-IDF (Term Frequency-Inverse Document Frequency)** vectorizer and computes **Cosine Similarity**:
*   Term Frequencies ($TF$) are calculated locally.
*   Smooth Inverse Document Frequency ($IDF$) is calculated using:
    $$\text{IDF}(t) = \ln\left(\frac{2}{\text{DF}(t)}\right) + 1.0$$
*   The Cosine Similarity of the TF-IDF weight vectors $\vec{a}$ and $\vec{b}$ is computed as:
    $$\text{Cosine Similarity} = \frac{\vec{a} \cdot \vec{b}}{\|\vec{a}\| \|\vec{b}\|}$$
*   **Implementation:** [`calculate_cosine_similarity(text_a, text_b)`](file:///k:/EightFold%20AI/Backend/matcher.py#L81-L127)

### 3. Shannon Entropy (Information Theory Conflict Detection)
When consolidating identical candidate profile fields across different data sources (e.g., different locations or names extracted from Recruiter CSV, Resume, and GitHub Profile), the system measures data contradictions using **Shannon Entropy**:
$$H(X) = - \sum_{i=1}^{n} P(x_i) \log_2 P(x_i)$$
*Where $P(x_i)$ is the probability of a value $x_i$ appearing across all extracted sources. If all sources agree, the entropy is $0.0$. If there is a complete mismatch, entropy climbs, raising a conflict flag.*
*   **Implementation:** [`calculate_shannon_entropy(values)`](file:///k:/EightFold%20AI/Backend/matcher.py#L130-L146)

### 4. Fuzzy String Matching (Levenshtein Distance Ratios)
For matching candidate names, email fallback mappings, and repository names, the project leverages `rapidfuzz` (using C-optimized Levenshtein distances):
*   `fuzz.ratio`: Exact sequence comparison.
*   `fuzz.partial_ratio`: Matches sub-sequences (useful for finding resume skills inside repository descriptions).
*   `fuzz.token_set_ratio`: Handles word re-ordering and token intersection (used for matching resume project names to repository names).

### 5. Harmonic Mean (Harmonic Match Score)
To ensure balanced evaluation, the system computes the **Harmonic Mean** between the `tech_stack_match_score` (representing skill matches) and `profile_match_score` (representing name/email verification):
$$\text{Harmonic Match} = \frac{2 \times S_{\text{tech\_stack}} \times S_{\text{profile}}}{S_{\text{tech\_stack}} + S_{\text{profile}}}$$
*Because the harmonic mean penalizes extreme outliers, a candidate with a $1.0$ profile verification but a $0.0$ skill match will correctly receive a $0.0$ overall harmonic match score, rather than a misleading $0.5$ arithmetic average.*
*   **Implementation:** [`calculate_harmonic_match(skill_match, experience_match)`](file:///k:/EightFold%20AI/Backend/matcher.py#L149-L153)

### 6. Triangular and Trapezoidal Fuzzy Membership Functions
To categorize candidate matches into qualitative sets (`Low Match`, `Medium Match`, `High Match`, `Excellent Match`), the score is evaluated using piecewise fuzzy membership equations $\mu(x)$:
*   **$\mu_{\text{Low}}(x)$**: $1.0$ up to $0.2$, dropping to $0.0$ at $0.45$.
*   **$\mu_{\text{Medium}}(x)$**: Triangle peaking at $0.5$, active between $0.25$ and $0.75$.
*   **$\mu_{\text{High}}(x)$**: Triangle peaking at $0.75$, active between $0.55$ and $0.90$.
*   **$\mu_{\text{Excellent}}(x)$**: Ramps up from $0.0$ at $0.80$ to $1.0$ at $1.0$.
*   **Implementation:** [`get_fuzzy_rating(score)`](file:///k:/EightFold%20AI/Backend/matcher.py#L156-L188)

### 7. Weighted Priority Field Resolution
Resolves conflicts on profile details using configurable source priorities (`SOURCE_WEIGHTS`) and extraction methods (`METHOD_WEIGHTS`):
*   **`SOURCE_WEIGHTS`**: `recruiter_csv`: 0.9, `resume`: 0.7, `github_csv`: 0.6.
*   **`METHOD_WEIGHTS`**: `verbatim`: 1.0, `regex`: 0.8, `inferred`: 0.6.
*   **Corroboration Boost**: If multiple distinct sources agree on a value, its confidence is boosted:
    $$\text{Confidence} = \min(\text{Source Weight} \times \text{Method Weight} \times 1.15, 1.0)$$

---

## Candidate Scoring Engine (GitHub Route vs Fallback)

### Route A: GitHub Profile Present
When a public GitHub profile matches a candidate, the confidence and match ratings are computed as follows:

1.  **Tech Stack Match Score (`tech_stack_match_score`)**: Filters out CS fundamentals, matches normalized resume skills to GitHub languages (1.0), topics (0.85), repo names (0.75), or descriptions (0.60), and averages them:
    $$\text{Tech Stack Match Score} = \frac{\sum_{s \in \text{Tech Stack Skills}} \text{Max Match Score}(s)}{|\text{Tech Stack Skills}|}$$
2.  **Base Score**:
    $$\text{Base Score} = (0.85 \times \text{Tech Stack Match Score}) + (0.15 \times \text{Profile Match Score})$$
3.  **Project Match Boost**:
    If resume projects are verified on GitHub using token ratios, the candidate is rewarded:
    $$\text{Boost} = \text{Project Match Score} \times 0.10$$
    $$\text{Overall Score} = \min(\text{Base Score} + \text{Boost}, 1.0)$$

### Route B: GitHub Profile Absent (Fallback Route)
If no GitHub profile can be found or matched, the candidate is evaluated on profile metadata completeness:
$$\text{Fallback Confidence} = \min \left( \frac{C_{\text{name}} + C_{\text{loc}} + C_{\text{links}} + \bar{C}_{\text{skills}} + 0.7_{\text{exp}} + 0.7_{\text{edu}}}{1 + I_{\text{loc}} + I_{\text{links}} + I_{\text{skills}} + I_{\text{exp}} + I_{\text{edu}}} + \text{Project Boost}, 1.0 \right)$$
*Where $C$ represents the resolved field confidence, $I$ is an indicator ($1$ if field is present, $0$ if absent), and Project Boost adds $0.1$ if any project matches.*

---

## How to Run the Project

### Prerequisites
*   **Python 3.10+** (tested on 3.12)
*   **Node.js v18+** & **npm**

---

### Step 1: Backend Setup & Execution

1.  Navigate to the `Backend` directory:
    ```bash
    cd Backend
    ```
2.  Create and activate a virtual environment:
    *   **Windows**:
        ```powershell
        python -m venv venv
        venv\Scripts\activate
        ```
    *   **Mac/Linux**:
        ```bash
        python3 -m venv venv
        source venv/bin/activate
        ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  *(Optional)* Create a `.env` file inside the `Backend` directory and add your GitHub Personal Access Token to avoid API rate limits:
    ```env
    GITHUB_TOKEN=your_github_personal_access_token
    ```
5.  Start the FastAPI application:
    ```bash
    python app.py
    ```
    The server will spin up at `http://localhost:8000`.

---

### Step 2: Frontend Setup & Execution

1.  Open a new terminal at the root directory of the project.
2.  Install npm dependencies:
    ```bash
    npm install
    ```
3.  Start the Vite React development server:
    ```bash
    npm run dev
    ```
    The frontend client will open at `http://localhost:5173`.

---

### Step 3: Run Automated Tests
To verify the mathematical correctness, matcher scoring, normalizers, and parsing scripts:
1. Ensure you are in the `Backend` directory with your virtual environment activated.
2. Run the unit tests using `pytest`:
    ```bash
    venv\Scripts\python -m pytest
    ```
    All 17 integration and mathematical assertions should output as passed.

---

## Output


<img width="1917" height="1073" alt="Screenshot 2026-07-01 020220" src="https://github.com/user-attachments/assets/eee440ba-385f-4960-80d2-fca7332a7a68" />


<img width="1918" height="1078" alt="Screenshot 2026-07-01 020249" src="https://github.com/user-attachments/assets/83eda972-6093-4b48-aa4a-0741e5fa9837" />


<img width="1917" height="1077" alt="Screenshot 2026-07-01 020256" src="https://github.com/user-attachments/assets/005834d4-fc0a-43a7-982a-b6317b3e16aa" />


<img width="1917" height="1077" alt="Screenshot 2026-07-01 020325" src="https://github.com/user-attachments/assets/d6a1e445-0f22-484d-8048-7320ea422937" />


<img width="1918" height="1078" alt="Screenshot 2026-07-01 020338" src="https://github.com/user-attachments/assets/3e156e41-ae28-4bde-8eee-324fa8620973" />


---

## Demo Video


https://github.com/user-attachments/assets/8b710e75-2901-424d-9ad7-ae543f8f9fdb



