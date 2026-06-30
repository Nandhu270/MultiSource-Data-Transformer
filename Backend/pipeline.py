import os
import re
import uuid
import pandas as pd
import requests
from rapidfuzz import fuzz
from typing import List, Dict, Any, Tuple

from extractor import extract_text_from_file, extract_name, parse_contact_info, extract_skills, extract_experience_sections, extract_education_sections, extract_location, extract_projects
from normalizer import normalize_phone, normalize_date, normalize_skill
from matcher import GithubResumeMatcher, ResumeData, GitHubRepoData, GitHubData
GITHUB_USERNAME_REGEX = re.compile(r"^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$")
GITHUB_URL_REGEX = re.compile(
    r"(?:https?://)?(?:www\.)?github\.com/(?P<username>[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?)(?:[/?#].*)?$",
    re.IGNORECASE,
)


def clean_value(val: Any) -> str:
    if val is None:
        return ""
    if isinstance(val, float) and (val != val or pd.isna(val)):
        return ""
    val_str = str(val).strip()
    if val_str.lower() in ["nan", "none", "null"]:
        return ""
    return val_str

def extract_github_username(value: Any) -> str:
    raw_value = clean_value(value)
    if not raw_value:
        return ""

    candidate = raw_value.strip()
    if candidate.startswith("@"):
        candidate = candidate[1:]

    if "github.com/" in candidate.lower():
        match = GITHUB_URL_REGEX.match(candidate)
        return match.group("username") if match else ""

    candidate = candidate.rstrip("/")
    return candidate if GITHUB_USERNAME_REGEX.match(candidate) else ""


def normalize_github_url(value: Any) -> str:
    username = extract_github_username(value)
    return f"https://github.com/{username}" if username else ""

def github_headers() -> Dict[str, str]:
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "Eightfold-Transformer-App"
    }
    token = os.environ.get("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers

def fetch_github_profile(username: str) -> dict:
    """
    Fetch public GitHub profile data.
    Supports GITHUB_TOKEN environment variable to authenticate and increase rate limits.
    """
    if not username:
        return None
    url = f"https://api.github.com/users/{username}"
    headers = github_headers()
    try:
        response = requests.get(url, headers=headers, timeout=4)
        if response.status_code == 200:
            data = response.json()
            return {
                "name": data.get("name"),
                "location": data.get("location"),
                "bio": data.get("bio"),
                "public_repos": data.get("public_repos"),
                "blog": data.get("blog")
            }
        else:
            print(f"GitHub profile API returned status code {response.status_code} for {username}: {response.text}")
    except Exception as e:
        print(f"Error fetching GitHub profile for {username}: {e}")
    return None

# def fetch_github_repos(username: str) -> list:
#     """
#     Fetch public GitHub repositories for a user.
#     Supports GITHUB_TOKEN environment variable to authenticate and increase rate limits.
#     """
#     if not username:
#         return []
#     url = f"https://api.github.com/users/{username}/repos?sort=updated&per_page=50"
#     headers = github_headers()
#     try:
#         response = requests.get(url, headers=headers, timeout=4)
#         if response.status_code == 200:
#             repos = response.json()
#             return [
#                 {
#     "name": r.get("name"),
#     "description": r.get("description") or "",
#                     "language": r.get("language"),
#                     "topics": r.get("topics") or [],
#                     "html_url": r.get("html_url"),
#                     "updated_at": r.get("updated_at"),
#                     "stargazers_count": r.get("stargazers_count", 0)
#                 }
#                 for r in repos
#             ]
#         else:
#             print(f"GitHub repos API returned status code {response.status_code} for {username}: {response.text}")
#     except Exception as e:
#         print(f"Error fetching GitHub repos for {username}: {e}")
#     return []


def fetch_github_repos(username: str) -> list:
    """
    Fetch public GitHub repositories for a user.
    Supports GITHUB_TOKEN environment variable to authenticate and increase rate limits.
    """
    if not username:
        return []

    url = f"https://api.github.com/users/{username}/repos?sort=updated&per_page=50"
    headers = github_headers()

    try:
        response = requests.get(url, headers=headers, timeout=4)
        if response.status_code == 200:
            repos = response.json()
            return [
                {
                    "name": r.get("name"),
                    "description": r.get("description") or "",
                    "language": r.get("language"),
                    "topics": r.get("topics") or [],
                    "html_url": r.get("html_url"),
                    "updated_at": r.get("updated_at"),
                    "stargazers_count": r.get("stargazers_count", 0)
                }
                for r in repos
            ]
        else:
            print(f"GitHub repos API returned status code {response.status_code} for {username}: {response.text}")
    except Exception as e:
        print(f"Error fetching GitHub repos for {username}: {e}")

    return []

# Default priority and weights
SOURCE_PRIORITY = ["recruiter_csv", "resume", "github_csv"]
SOURCE_WEIGHTS = {"recruiter_csv": 0.9, "resume": 0.7, "github_csv": 0.6}
METHOD_WEIGHTS = {"verbatim": 1.0, "regex": 0.8, "inferred": 0.6}

class CandidatePipeline:
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.conflicts = []
        self.raw_resumes = []  # List of { filename, text, contact_info, skills, experience, education }
        
    def load_resumes(self, resume_folder_path: str):
        """Pre-extract all resumes in the folder to match against CSVs later."""
        if not resume_folder_path or not os.path.exists(resume_folder_path):
            return
            
        for filename in os.listdir(resume_folder_path):
            file_path = os.path.join(resume_folder_path, filename)
            if os.path.isfile(file_path):
                text = extract_text_from_file(file_path)
                if not text:
                    continue
                contact_info = parse_contact_info(text)
                skills = extract_skills(text)
                experience = extract_experience_sections(text)
                education = extract_education_sections(text)
                location = extract_location(text)
                projects = extract_projects(text)
                
                self.raw_resumes.append({
                    "filename": filename,
                    "text": text,
                    "name": extract_name(text),
                    "contact_info": contact_info,
                    "skills": skills,
                    "experience": experience,
                    "education": education,
                    "location": location,
                    "projects": projects
                })

    def find_matching_resume(self, candidate_emails: List[str], candidate_name: str) -> Dict[str, Any]:
        """Find matching resume by email (exact) or name (fuzzy)."""
        # 1. Match by email
        for r in self.raw_resumes:
            resume_emails = r["contact_info"]["emails"]
            # Intersection of emails
            if set(candidate_emails) & set(resume_emails):
                return r
                
        # 2. Match by name fuzzy
        for r in self.raw_resumes:
            # Simple heuristic: try to find candidate name in resume text first page or header
            first_lines = "\n".join(r["text"].split("\n")[:10])
            score = fuzz.partial_ratio(candidate_name.lower(), first_lines.lower())
            if score >= 90:
                return r
        return None

    def find_matching_github(self, github_df: pd.DataFrame, candidate_emails: List[str], candidate_name: str) -> Dict[str, Any]:
        """Find matching GitHub record from CSV by email or name."""
        if github_df is None or github_df.empty:
            return None
            
        # Try to find columns for email or name
        email_col = next((c for c in github_df.columns if "email" in c.lower()), None)
        name_col = next((c for c in github_df.columns if "name" in c.lower()), None)
        link_col = next((c for c in github_df.columns if "github" in c.lower() or "link" in c.lower()), None)
        location_col = next((c for c in github_df.columns if "location" in c.lower() or "city" in c.lower() or "country" in c.lower()), None)
        
        if not link_col:
            return None
            
        def extract_row_location(row):
            if not location_col or row[location_col] is None:
                return None
            loc_val = str(row[location_col]).strip()
            if not loc_val or loc_val.lower() in ["nan", "none", "null"]:
                return None
            # Handle simple "City, Country" split
            parts = [p.strip() for p in loc_val.split(",")]
            city = parts[0]
            country = parts[1] if len(parts) > 1 else "IN"
            return {"city": city, "region": "", "country": country}

        # Match email
        if email_col:
            for _, row in github_df.iterrows():
                row_email = str(row[email_col]).strip()
                if row_email in candidate_emails:
                    return {
                        "github_url": row[link_col],
                        "email": row_email,
                        "name": row[name_col] if name_col else "",
                        "location": extract_row_location(row),
                        "raw_row": row.to_dict() if hasattr(row, "to_dict") else dict(row)
                    }
                    
        # Match name fuzzy
        if name_col:
            for _, row in github_df.iterrows():
                row_name = str(row[name_col]).strip()
                if fuzz.ratio(candidate_name.lower(), row_name.lower()) >= 90:
                    return {
                        "github_url": row[link_col],
                        "email": row[email_col] if email_col else "",
                        "name": row_name,
                        "location": extract_row_location(row),
                        "raw_row": row.to_dict() if hasattr(row, "to_dict") else dict(row)
                    }
        return None

    def resolve_field(self, field_name: str, values: Dict[str, Any], candidate_id: str) -> Tuple[Any, str, float, float]:
        """
        Resolve conflicts among sources based on priority.
        values: { source_name: { value, method } }
        Returns (winning_value, winning_source, confidence)
        """
        # Filter out empty/None values
        valid_sources = {k: v for k, v in values.items() if v["value"] is not None and v["value"] != ""}
        
        if not valid_sources:
            return None, "none", 0.0
            
        # Find the winner based on SOURCE_PRIORITY
        winner_source = None
        for src in SOURCE_PRIORITY:
            if src in valid_sources:
                winner_source = src
                break
                
        if not winner_source:
            # Fallback to first available
            winner_source = list(valid_sources.keys())[0]
            
        winner_data = valid_sources[winner_source]
        winner_val = winner_data["value"]
        winner_method = winner_data["method"]
        
        # Check for conflicts with other valid sources
        for src, data in valid_sources.items():
            if src != winner_source:
                val_differs = False
                if isinstance(winner_val, list) and isinstance(data["value"], list):
                    val_differs = set(winner_val) != set(data["value"])
                else:
                    val_differs = str(winner_val).strip().lower() != str(data["value"]).strip().lower()
                    
                if val_differs:
                    # Log conflict
                    conflict_id = str(uuid.uuid4())[:8]
                    self.conflicts.append({
                        "id": f"conflict-{conflict_id}",
                        "candidate_id": candidate_id,
                        "field": field_name,
                        "winner": {
                            "value": winner_val,
                            "source": winner_source,
                            "confidence": SOURCE_WEIGHTS.get(winner_source, 0.5) * METHOD_WEIGHTS.get(winner_method, 0.5)
                        },
                        "loser": {
                            "value": data["value"],
                            "source": src,
                            "confidence": SOURCE_WEIGHTS.get(src, 0.5) * METHOD_WEIGHTS.get(data["method"], 0.5)
                        },
                        "reason": f"Value conflict on {field_name}. Selected value from {winner_source} due to higher source priority.",
                        "rule": f"FIELD_PRIORITY = {SOURCE_PRIORITY}"
                    })
                    
        # Calculate confidence
        src_weight = SOURCE_WEIGHTS.get(winner_source, 0.5)
        mth_weight = METHOD_WEIGHTS.get(winner_method, 0.5)
        
        # Corroboration boost: if other sources agree on the exact same value
        corroborated = False
        for src, data in valid_sources.items():
            if src != winner_source:
                if isinstance(winner_val, list) and isinstance(data["value"], list):
                    if set(winner_val) == set(data["value"]):
                        corroborated = True
                else:
                    if str(winner_val).strip().lower() == str(data["value"]).strip().lower():
                        corroborated = True
                        
        # Calculate Shannon Entropy for the field across valid sources
        all_vals = [data["value"] for data in valid_sources.values()]
        entropy = GithubResumeMatcher.calculate_shannon_entropy(all_vals)

        confidence = src_weight * mth_weight
        if corroborated:
            confidence = min(confidence * 1.15, 1.0)
            
        return winner_val, winner_source, round(confidence, 2), entropy

    def process(self, recruiter_df: pd.DataFrame, github_df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Run the end-to-end merging pipeline."""
        # Replace NaN/NaT values with None
        recruiter_df = recruiter_df.where(pd.notnull(recruiter_df), None)
        if github_df is not None and not github_df.empty:
            github_df = github_df.where(pd.notnull(github_df), None)

        final_profiles = []
        raw_profiles = []
        
        # Determine Recruiter CSV columns
        email_col = next((c for c in recruiter_df.columns if "email" in c.lower()), None)
        name_col = next((c for c in recruiter_df.columns if "name" in c.lower()), None)
        phone_col = next((c for c in recruiter_df.columns if "phone" in c.lower()), None)
        city_col = next((c for c in recruiter_df.columns if "city" in c.lower()), None)
        country_col = next((c for c in recruiter_df.columns if "country" in c.lower()), None)
        
        def clean_val(val):
            if val is None:
                return ""
            if isinstance(val, float) and (val != val or pd.isna(val)):
                return ""
            val_str = str(val).strip()
            if val_str.lower() in ["nan", "none", "null"]:
                return ""
            return val_str

        final_profiles = []
        
        # Determine Recruiter CSV columns
        email_col = next((c for c in recruiter_df.columns if "email" in c.lower()), None)
        name_col = next((c for c in recruiter_df.columns if "name" in c.lower()), None)
        phone_col = next((c for c in recruiter_df.columns if "phone" in c.lower()), None)
        city_col = next((c for c in recruiter_df.columns if "city" in c.lower()), None)
        country_col = next((c for c in recruiter_df.columns if "country" in c.lower()), None)
        
        for index, row in recruiter_df.iterrows():
            raw_name = clean_val(row[name_col]) if name_col else ""
            raw_email = clean_val(row[email_col]) if email_col else ""
            raw_phone = clean_val(row[phone_col]) if phone_col else ""
            
            # Skip fully empty or junk rows (where both name and email are missing)
            if not raw_name and not raw_email:
                continue
                
            candidate_id = str(uuid.uuid4())[:16]
            if not raw_name:
                raw_name = "Candidate"
            
            emails_list = [raw_email] if raw_email else []
            phones_list = [normalize_phone(raw_phone)] if raw_phone else []
            
            # 1. Match Resume
            matching_resume = self.find_matching_resume(emails_list, raw_name)
            if not matching_resume:
                print(f"Omitting candidate {raw_name}: No matching resume found.")
                continue
            
            # Expand emails list from matching resume if found
            if matching_resume:
                emails_list = list(set(emails_list + matching_resume["contact_info"]["emails"]))
            
            # 2. Match GitHub
            matching_github = self.find_matching_github(github_df, emails_list, raw_name)
            
            # Resolve and verify GitHub URL
            github_url = None
            if matching_github and matching_github.get("github_url"):
                github_url = matching_github["github_url"]
            elif matching_resume and matching_resume.get("contact_info", {}).get("github"):
                github_url = matching_resume["contact_info"]["github"]
                
            if not github_url:
                # Check if recruiter CSV has it
                github_col = next((c for c in recruiter_df.columns if "github" in c.lower() or "git" in c.lower()), None)
                if github_col:
                    github_url = clean_val(row[github_col])
                    
            if not github_url:
                print(f"Omitting candidate {raw_name}: No GitHub URL found.")
                continue
            
            # Assemble raw values per field to resolve conflicts
            # Format: { source: { value, method } }
            
            # Name
            name_vals = {
                "recruiter_csv": {"value": raw_name, "method": "verbatim"},
            }
            if matching_resume:
                name_vals["resume"] = {"value": matching_resume.get("name") or raw_name, "method": "regex"}
                
            # Emails
            all_emails = list(emails_list)
            if matching_resume:
                all_emails.extend(matching_resume["contact_info"]["emails"])
            all_emails = list(set([clean_val(e) for e in all_emails if clean_val(e)]))
            
            # Phones
            all_phones = list(phones_list)
            if matching_resume:
                all_phones.extend([normalize_phone(p) for p in matching_resume["contact_info"]["phones"]])
            all_phones = list(set([clean_val(p) for p in all_phones if clean_val(p)]))
            
            # Location
            city_val = clean_val(row[city_col]) if city_col else ""
            country_val = clean_val(row[country_col]) if country_col else ""
            location_recruiter = {"city": city_val, "region": "", "country": country_val} if (city_val or country_val) else None
            
            location_vals = {
                "recruiter_csv": {"value": location_recruiter, "method": "verbatim"}
            }
            # Location on resume
            if matching_resume and matching_resume.get("location"):
                location_vals["resume"] = {"value": matching_resume["location"], "method": "inferred"}
            # Location on GitHub CSV
            if matching_github and matching_github.get("location"):
                location_vals["github_csv"] = {"value": matching_github["location"], "method": "verbatim"}

            # Links (github_url is already resolved)
            
            # 3. Fetch GitHub Profile & Repositories via API (live/offline resilient)
            github_profile_data = None
            github_repos = []
            username = None
            if github_url:
                username = extract_github_username(github_url)

                if username:
                    github_url = normalize_github_url(github_url)
                    github_profile_data = fetch_github_profile(username)
                    github_repos = fetch_github_repos(username)

            # Project Verification: Check if candidate's resume projects are on their GitHub
            resume_projects = matching_resume.get("projects", []) if matching_resume else []
            
            # Match resume projects to GitHub repos if GitHub details are available
            has_matching_project = False
            if resume_projects:
                if username and github_repos:
                    # Ignore extremely common words that don't differentiate projects
                    ignore_words = {"using", "with", "system", "project", "application", "app", "development", "and", "the", "for", "in", "of", "a", "an", "to"}
                    for proj in resume_projects:
                        proj_clean = re.sub(r"[^\w\s]", "", proj.lower()).strip()
                        proj_words = [w for w in proj_clean.split() if len(w) > 2 and w not in ignore_words]
                        if not proj_words:
                            proj_words = [w for w in proj_clean.split() if len(w) > 0]
                        if not proj_words:
                            continue
                        
                        for repo in github_repos:
                            repo_name = repo["name"].lower()
                            repo_desc = (repo.get("description") or "").lower()
                            # Match if any significant word of the project is in the repo name or description, or fuzzy match
                            if any(word in repo_name or word in repo_desc for word in proj_words) or fuzz.partial_ratio(proj_clean, repo_name) >= 80:
                                has_matching_project = True
                                break
                        if has_matching_project:
                            break
                            
                if not has_matching_project:
                    # Log a warning instead of neglecting/discarding the candidate entirely.
                    # This prevents valid candidates from being completely lost due to API limits or minor naming mismatches.
                    print(f"Warning: Resume projects {resume_projects} for candidate {raw_name} were not verified on GitHub (username: {username}).")

            # If GitHub API returned a location, add it to location_vals
            if github_profile_data and github_profile_data.get("location"):
                loc_str = github_profile_data["location"].strip()
                if loc_str and loc_str.lower() not in ["nan", "none", "null"]:
                    parts = [p.strip() for p in loc_str.split(",")]
                    github_api_loc = {"city": parts[0], "region": "", "country": parts[1] if len(parts) > 1 else "US"}
                    location_vals["github_api"] = {"value": github_api_loc, "method": "inferred"}

            github_blog = github_profile_data.get("blog") if github_profile_data else None
            if github_blog and not github_blog.lower().startswith("http"):
                github_blog = f"https://{github_blog}"

            links_vals = {
                "github_csv": {"value": {"linkedin": None, "github": github_url, "portfolio": github_blog, "other": []} if github_url else None, "method": "verbatim"}
            }
            if matching_resume:
                links_vals["resume"] = {
                    "value": {
                        "linkedin": matching_resume["contact_info"]["linkedin"],
                        "github": matching_resume["contact_info"]["github"],
                        "portfolio": None,
                        "other": []
                    },
                    "method": "regex"
                }

            # Resolve values
            final_name, name_src, name_conf, name_entropy = self.resolve_field("full_name", name_vals, candidate_id)
            final_location, loc_src, loc_conf, loc_entropy = self.resolve_field("location", location_vals, candidate_id)
            final_links, links_src, links_conf, links_entropy = self.resolve_field("links", links_vals, candidate_id)
            
            # Calculate profile-wide average Shannon Entropy
            entropies = [name_entropy, loc_entropy, links_entropy]
            profile_entropy = round(sum(entropies) / len(entropies), 4)
            
            # Assemble Skills (merged list with highest confidence)
            skills_map = {}
            # Resume skills
            if matching_resume:
                for s in matching_resume["skills"]:
                    norm_s = normalize_skill(s)
                    if not norm_s:
                        continue
                    # Check for fuzzy match in existing keys
                    matched_key = None
                    for existing_key in skills_map:
                        if fuzz.ratio(norm_s, existing_key) >= 90:
                            matched_key = existing_key
                            break
                    if matched_key:
                        if "resume" not in skills_map[matched_key]["sources"]:
                            skills_map[matched_key]["sources"].append("resume")
                    else:
                        skills_map[norm_s] = {
                            "name": norm_s,
                            "confidence": 0.56,  # resume + inferred
                            "sources": ["resume"]
                        }
            # Add GitHub signals (mock languages)
            # if matching_github:
            #     github_skills = ["python", "git"]  # default mock skills
            #     for s in github_skills:
            #         norm_s = normalize_skill(s)
            #         if norm_s in skills_map:
            #             skills_map[norm_s]["sources"].append("github")
            #             skills_map[norm_s]["confidence"] = min(skills_map[norm_s]["confidence"] * 1.15, 1.0)
            #         else:
            #             skills_map[norm_s] = {
            #                 "name": norm_s,
            #                 "confidence": 0.60,
            #                 "sources": ["github"]
            #             }

            # Add GitHub signals from repository metadata
            github_skills = set()

            for repo in github_repos:
                if repo.get("language"):
                    github_skills.add(repo["language"])

                for topic in repo.get("topics", []):
                    github_skills.add(topic)

                repo_text = f"{repo.get('name', '')} {repo.get('description', '')}"
                for skill in extract_skills(repo_text):
                    github_skills.add(skill)

            if matching_github and not github_skills:
                github_skills.add("git")

            for s in github_skills:
                norm_s = normalize_skill(s)
                if not norm_s:
                    continue

                # Check for fuzzy match in existing keys
                matched_key = None
                for existing_key in skills_map:
                    if fuzz.ratio(norm_s, existing_key) >= 90:
                        matched_key = existing_key
                        break

                if matched_key:
                    if "github" not in skills_map[matched_key]["sources"]:
                        skills_map[matched_key]["sources"].append("github")
                    skills_map[matched_key]["confidence"] = min(skills_map[matched_key]["confidence"] * 1.15, 1.0)
                else:
                    skills_map[norm_s] = {
                        "name": norm_s,
                        "confidence": 0.60,
                        "sources": ["github"]
                    }
            
            final_skills = list(skills_map.values())

            # Experience & Education (mostly from resume)
            final_experience = matching_resume["experience"] if matching_resume else []
            final_education = matching_resume["education"] if matching_resume else []
            
            # Run Advanced Matcher
            match_details_dict = None
            overall_conf = None
            if matching_resume and (username or matching_github):
                resume_data = ResumeData(
                    name=matching_resume.get("name") or raw_name or "",
                    emails=matching_resume.get("contact_info", {}).get("emails") or emails_list or [],
                    skills=matching_resume.get("skills") or [],
                    projects=matching_resume.get("projects") or [],
                    text=matching_resume.get("text") or ""
                )
                
                repo_list = []
                for r in github_repos:
                    repo_list.append(GitHubRepoData(
                        name=r.get("name") or "",
                        description=r.get("description") or "",
                        language=r.get("language"),
                        topics=r.get("topics") or [],
                        html_url=r.get("html_url") or ""
                    ))
                
                github_data = GitHubData(
                    username=username or "",
                    profile_name=github_profile_data.get("name") if github_profile_data else (matching_github.get("name") if matching_github else None),
                    bio=github_profile_data.get("bio") if github_profile_data else None,
                    email=github_profile_data.get("email") if github_profile_data else (matching_github.get("email") if matching_github else None),
                    repos=repo_list
                )
                
                # Determine job title from Recruiter CSV if available
                title_col = next((c for c in recruiter_df.columns if "title" in c.lower() or "role" in c.lower()), None)
                csv_title = clean_val(row[title_col]) if title_col else "Software Engineer"

                matcher = GithubResumeMatcher()
                match_report = matcher.match(resume_data, github_data, csv_title=csv_title)
                match_details_dict = match_report.model_dump()
                overall_conf = match_report.overall_score
            
            # Base Canonical Record
            canonical_record = {
                "candidate_id": candidate_id,
                "full_name": final_name,
                "emails": all_emails,
                "phones": all_phones,
                "location": final_location or {"city": "", "region": "", "country": ""},
                "links": final_links or {"linkedin": None, "github": None, "portfolio": None, "other": []},
                "headline": "Software Engineer" if matching_resume else None,
                "years_experience": len(final_experience) if final_experience else 0,
                "skills": final_skills,
                "experience": final_experience,
                "education": final_education,
                "github_profile": github_profile_data,
                "github_repos": github_repos,
                "match_details": match_details_dict,
                "profile_entropy": profile_entropy,
                "field_entropies": {
                    "full_name": name_entropy,
                    "location": loc_entropy,
                    "links": links_entropy
                },
                "provenance": [
                    {"field": "full_name", "source": name_src, "method": "verbatim" if name_src == "recruiter_csv" else "regex"},
                    {"field": "emails", "source": "recruiter_csv", "method": "verbatim"},
                    {"field": "phones", "source": "recruiter_csv", "method": "verbatim"},
                    {"field": "location", "source": loc_src, "method": "verbatim" if loc_src == "recruiter_csv" else "inferred"},
                    {"field": "links", "source": links_src, "method": "verbatim" if links_src == "github_csv" else "regex"}
                ],
                "overall_confidence": overall_conf if overall_conf is not None else round(
                    min(
                        (
                            sum(
                                [name_conf] + 
                                ([loc_conf] if final_location else []) + 
                                ([links_conf] if final_links else []) + 
                                ([sum(s["confidence"] for s in final_skills) / len(final_skills)] if final_skills else []) + 
                                ([0.7] if final_experience else []) + 
                                ([0.7] if final_education else [])
                            ) / (
                                1 + 
                                (1 if final_location else 0) + 
                                (1 if final_links else 0) + 
                                (1 if final_skills else 0) + 
                                (1 if final_experience else 0) + 
                                (1 if final_education else 0)
                            )
                        ) + (0.1 if (resume_projects and has_matching_project) else 0.0),
                        1.0
                    ),
                    2
                )
            }
            
            # Merge all other columns from the recruiter CSV row
            for col in recruiter_df.columns:
                cleaned_col = col.strip()
                if cleaned_col not in canonical_record:
                    canonical_record[cleaned_col] = clean_val(row[col])
                if cleaned_col.lower() not in canonical_record:
                    canonical_record[cleaned_col.lower()] = clean_val(row[col])

            # Merge all other columns from the matched GitHub CSV row
            if matching_github and "raw_row" in matching_github:
                for col, val in matching_github["raw_row"].items():
                    cleaned_col = col.strip()
                    if cleaned_col not in canonical_record:
                        canonical_record[cleaned_col] = clean_val(val)
                    if cleaned_col.lower() not in canonical_record:
                        canonical_record[cleaned_col.lower()] = clean_val(val)

            # Project using config
            projected = self.project_record(canonical_record)
            final_profiles.append(projected)
            raw_profiles.append(canonical_record)
            
        return final_profiles, raw_profiles

    def project_record(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """Project the canonical record based on the config.json schema fields."""
        fields_config = self.config.get("fields", [])
        include_confidence = self.config.get("include_confidence", True)
        on_missing = self.config.get("on_missing", "null")
        
        projected = {
            "candidate_id": record["candidate_id"]
        }
        
        for field in fields_config:
            if field.get("required") is False:
                continue
            path = field["path"]
            # Handle basic path resolution
            val = None
            if "." in path:
                parts = path.split(".")
                curr = record
                for p in parts:
                    if isinstance(curr, dict):
                        curr = curr.get(p)
                val = curr
            else:
                val = record.get(path)
                # Try case-insensitive matching if not found
                if val is None:
                    val = record.get(path.lower())
                    
            # Smart Fallbacks for flat custom fields:
            if val is None:
                if path in ["github_url", "github"]:
                    val = record.get("links", {}).get("github")
                elif path in ["linkedin_url", "linkedin"]:
                    val = record.get("links", {}).get("linkedin")
                elif path in ["portfolio_url", "portfolio"]:
                    val = record.get("links", {}).get("portfolio")
                elif path == "city":
                    val = record.get("location", {}).get("city")
                elif path == "country":
                    val = record.get("location", {}).get("country")
                elif path in ["region", "state"]:
                    val = record.get("location", {}).get("region")
                elif path in ["email", "primary_email"]:
                    val = record["emails"][0] if record.get("emails") else None
                elif path in ["phone", "mobile"]:
                    val = record["phones"][0] if record.get("phones") else None
                
            # Handle on missing policy
            if val is None or val == "" or val == [] or val == {}:
                if on_missing == "null":
                    val = "N/A"
                elif on_missing == "omit":
                    continue
                elif on_missing == "error":
                    raise ValueError(f"Missing required field: {path}")
                    
            if include_confidence and path not in ["candidate_id", "overall_confidence", "provenance"]:
                # Wrap with confidence/source metadata
                source = "merged"
                confidence = record["overall_confidence"]
                
                # Deduce source from provenance
                prov_entry = next((p for p in record["provenance"] if p["field"] == path), None)
                if prov_entry:
                    source = prov_entry["source"]
                    
                projected[path] = {
                    "value": val,
                    "source": source,
                    "confidence": confidence
                }
            else:
                projected[path] = val
                
        if "match_details" in record:
            has_skills_or_projects = any(
                f["path"] in ["skills", "projects"] and f.get("required") is not False 
                for f in fields_config
            )
            if has_skills_or_projects:
                projected["match_details"] = record["match_details"]
                
        if "profile_entropy" in record:
            projected["profile_entropy"] = record["profile_entropy"]
        if "field_entropies" in record:
            projected["field_entropies"] = record["field_entropies"]
            
        return projected
