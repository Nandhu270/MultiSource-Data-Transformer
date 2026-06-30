import re
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from rapidfuzz import fuzz
from normalizer import normalize_skill

class ResumeData(BaseModel):
    name: str = Field(..., description="Candidate name")
    emails: List[str] = Field(default_factory=list, description="Candidate email addresses")
    skills: List[str] = Field(default_factory=list, description="Skills listed on the resume")
    projects: List[str] = Field(default_factory=list, description="Projects listed on the resume")
    text: str = Field("", description="Raw text of the resume")

class GitHubRepoData(BaseModel):
    name: str = Field(..., description="Repository name")
    description: str = Field("", description="Repository description")
    language: Optional[str] = Field(None, description="Primary language of the repository")
    topics: List[str] = Field(default_factory=list, description="Repository topics/tags")
    html_url: str = Field("", description="URL to the repository")

class GitHubData(BaseModel):
    username: str = Field(..., description="GitHub username")
    profile_name: Optional[str] = Field(None, description="GitHub profile name")
    bio: Optional[str] = Field(None, description="GitHub bio")
    email: Optional[str] = Field(None, description="GitHub public email")
    repos: List[GitHubRepoData] = Field(default_factory=list, description="List of public repositories")

class SkillMatchDetail(BaseModel):
    skill: str
    matched: bool
    source: Optional[str] = None  # "language", "topic", "repo_name", "description"
    priority_level: Optional[str] = None  # "Priority 1 (High)", "Priority 2 (Medium-High)", etc.
    match_score: float
    matched_repos: List[str] = Field(default_factory=list, description="Names of repositories using this skill")
    skill_type: str = Field(..., description="'tech_stack' or 'conceptual'")

class ProjectMatchDetail(BaseModel):
    resume_project: str
    matched_repo: Optional[str] = None
    similarity_score: float
    matched: bool

class MatchReport(BaseModel):
    jaccard_similarity: float = Field(..., description="Jaccard similarity between resume skills and GitHub skills")
    tech_stack_match_score: float = Field(..., description="Weighted match score of resume skills on GitHub (75% weight)")
    project_name_match_score: float = Field(..., description="Fuzzy match score of resume projects to GitHub repos")
    profile_match_score: float = Field(..., description="Name and email match score between resume and GitHub profile")
    overall_score: float = Field(..., description="Final weighted sum score")
    fuzzy_rating: str = Field(..., description="Fuzzy logic rating: Low, Medium, High, Excellent")
    skill_matches: List[SkillMatchDetail] = Field(default_factory=list)
    project_matches: List[ProjectMatchDetail] = Field(default_factory=list)

class GithubResumeMatcher:
    @staticmethod
    def calculate_jaccard_similarity(set_a: set, set_b: set) -> float:
        """Calculate Jaccard Similarity between two sets (Intersection over Union)."""
        if not set_a and not set_b:
            return 0.0
        intersection = set_a & set_b
        union = set_a | set_b
        if not union:
            return 0.0
        return round(len(intersection) / len(union), 4)

    @staticmethod
    def get_fuzzy_rating(score: float) -> str:
        """
        Determine the fuzzy rating using triangular/trapezoidal membership functions.
        Maps the continuous score (0.0 to 1.0) into one of the four fuzzy sets.
        """
        # Membership in 'Low'
        mu_low = max(0.0, 1.0 - score / 0.3)
        
        # Membership in 'Medium'
        if score <= 0.25:
            mu_med = max(0.0, score / 0.25)
        else:
            mu_med = max(0.0, 1.0 - (score - 0.25) / 0.35)
            
        # Membership in 'High'
        if score <= 0.5:
            mu_high = max(0.0, (score - 0.3) / 0.2)
        else:
            mu_high = max(0.0, 1.0 - (score - 0.5) / 0.4)
            
        # Membership in 'Excellent'
        mu_excel = max(0.0, (score - 0.7) / 0.3) if score >= 0.7 else 0.0
        
        ratings = {
            "Low": mu_low,
            "Medium": mu_med,
            "High": mu_high,
            "Excellent": mu_excel
        }
        
        # Return the key with the highest membership value
        return max(ratings, key=ratings.get)

    def match(self, resume: ResumeData, github: GitHubData) -> MatchReport:
        # 1. Set Union & Normalization
        resume_skills = {normalize_skill(s) for s in resume.skills if normalize_skill(s)}
        
        github_languages = set()
        github_topics = set()
        github_repo_names = set()
        github_descriptions_text = ""
        
        for repo in github.repos:
            if repo.language:
                github_languages.add(normalize_skill(repo.language))
            for topic in repo.topics:
                github_topics.add(normalize_skill(topic))
            github_repo_names.add(repo.name.lower())
            if repo.description:
                github_descriptions_text += " " + repo.description.lower()
        
        # Use Regex & Word Boundary to extract matching skills mentioned in github repo names/descriptions
        extracted_from_repos = set()
        all_text = " ".join(github_repo_names) + " " + github_descriptions_text
        for skill in resume_skills:
            # Word boundary regex search to avoid partial word matches
            pattern = r"\b" + re.escape(skill) + r"\b"
            if re.search(pattern, all_text):
                extracted_from_repos.add(skill)
        
        # Set Union of all GitHub skill indicators
        github_skills = github_languages | github_topics | extracted_from_repos
        
        # Define CS fundamental and conceptual keywords
        fundamental_keywords = {
            "data structures", "algorithms", "dsa", 
            "operating systems", "os", "operating system",
            "computer networks", "networking", "computer network",
            "database management", "dbms", "database", "databases", "database management system",
            "object oriented", "oop", "oops", "object oriented programming",
            "software engineering", "sdlc", "agile", "scrum",
            "system design", "distributed systems", "distributed system",
            "computer architecture", "coa", "computer organization",
            "compiler design", "compilers",
            "theory of computation", "toc",
            "discrete mathematics", "discrete maths",
            "web development", "frontend", "backend", "full stack", "web design",
            "cloud computing", "devops", "testing", "software testing",
            "machine learning", "deep learning", "artificial intelligence", "ai", "ml", "nlp", "computer vision",
            "mongodb", "mysql", "git", "github", "vs code", "vscode", "web technologies", "web technology",
            "problem-solving", "problem solving", "adaptability", "soft skills", "soft skill", "communication",
            "time management", "management"
        }

        # Filter out conceptual skills from Jaccard calculation
        jaccard_resume_skills = {
            s for s in resume_skills 
            if not any(kw in s.lower() or fuzz.ratio(s.lower(), kw) >= 85 for kw in fundamental_keywords)
        }
        jaccard_github_skills = {
            s for s in github_skills 
            if not any(kw in s.lower() or fuzz.ratio(s.lower(), kw) >= 85 for kw in fundamental_keywords)
        }
        jaccard = self.calculate_jaccard_similarity(jaccard_resume_skills, jaccard_github_skills)
        
        # 2. Rule-Based Priority & Weighted Heuristic for Tech Stack Match
        skill_details = []
        total_tech_weight = 0.0
        
        if resume_skills:
            for skill in resume_skills:
                norm_skill = normalize_skill(skill)
                if not norm_skill:
                    continue
                    
                max_score = 0.0
                best_source = None
                best_priority = None
                matched_repos = []
                
                for repo in github.repos:
                    repo_matched = False
                    repo_score = 0.0
                    repo_source = None
                    repo_priority = None
                    
                    # Rule 1: Exact/Fuzzy match in primary language (High Priority)
                    if repo.language and (norm_skill == normalize_skill(repo.language) or fuzz.ratio(norm_skill, normalize_skill(repo.language)) >= 90):
                        repo_matched = True
                        repo_score = 1.0
                        repo_source = "language"
                        repo_priority = "Priority 1 (High)"
                    
                    # Rule 2: Exact/Fuzzy match in topics (Medium-High Priority)
                    elif any(norm_skill == normalize_skill(topic) or fuzz.ratio(norm_skill, normalize_skill(topic)) >= 90 for topic in repo.topics):
                        repo_matched = True
                        repo_score = 0.85
                        repo_source = "topic"
                        repo_priority = "Priority 2 (Medium-High)"
                    
                    # Rule 3: Mention in repo name (Medium Priority)
                    elif norm_skill in repo.name.lower() or fuzz.partial_ratio(norm_skill, repo.name.lower()) >= 85:
                        repo_matched = True
                        repo_score = 0.75
                        repo_source = "repo_name"
                        repo_priority = "Priority 3 (Medium)"
                    
                    # Rule 4: Mention in repo description (Low-Medium Priority)
                    elif repo.description and re.search(r"\b" + re.escape(norm_skill) + r"\b", repo.description.lower()):
                        repo_matched = True
                        repo_score = 0.60
                        repo_source = "description"
                        repo_priority = "Priority 4 (Low-Medium)"
                        
                    if repo_matched:
                        matched_repos.append(repo.name)
                        if repo_score > max_score:
                            max_score = repo_score
                            best_source = repo_source
                            best_priority = repo_priority
                
                # Classify skill
                is_conceptual = False
                skill_lower = skill.lower()
                for keyword in fundamental_keywords:
                    if keyword in skill_lower or fuzz.ratio(skill_lower, keyword) >= 85:
                        is_conceptual = True
                        break
                skill_type = "conceptual" if is_conceptual else "tech_stack"
                
                total_tech_weight += max_score
                skill_details.append(SkillMatchDetail(
                    skill=skill,
                    matched=max_score > 0.0,
                    source=best_source,
                    priority_level=best_priority,
                    match_score=max_score,
                    matched_repos=matched_repos,
                    skill_type=skill_type
                ))
            
            # Calculate tech stack score using only tech_stack skills
            tech_stack_skills = [s for s in skill_details if s.skill_type == "tech_stack"]
            if tech_stack_skills:
                tech_stack_match_score = sum(s.match_score for s in tech_stack_skills) / len(tech_stack_skills)
            else:
                tech_stack_match_score = 1.0
        else:
            tech_stack_match_score = 1.0
            
        # 3. Fuzzy Project Matching (Rapid Fuzz)
        project_details = []
        total_proj_score = 0.0
        if resume.projects:
            for proj in resume.projects:
                max_proj_sim = 0.0
                best_repo_match = None
                
                for repo in github.repos:
                    # Compare project name to repo name & description using Rapid Fuzz
                    sim_name = fuzz.token_set_ratio(proj.lower(), repo.name.lower())
                    sim_desc = fuzz.partial_ratio(proj.lower(), repo.description.lower()) if repo.description else 0.0
                    sim = max(sim_name, sim_desc)
                    if sim > max_proj_sim:
                        max_proj_sim = sim
                        best_repo_match = repo.name
                
                # Scale similarity to 0.0 - 1.0
                scaled_sim = round(max_proj_sim / 100.0, 4)
                matched = max_proj_sim >= 75.0
                
                total_proj_score += scaled_sim
                project_details.append(ProjectMatchDetail(
                    resume_project=proj,
                    matched_repo=best_repo_match if matched else None,
                    similarity_score=scaled_sim,
                    matched=matched
                ))
            project_name_match_score = total_proj_score / len(resume.projects)
        else:
            project_name_match_score = 0.0
            
        # 4. Profile Matching
        profile_name_sim = 0.0
        if resume.name and github.profile_name:
            profile_name_sim = fuzz.ratio(resume.name.lower(), github.profile_name.lower()) / 100.0
            
        email_matched = 0.0
        if github.email and github.email.lower() in [e.lower() for e in resume.emails]:
            email_matched = 1.0
        elif any(e.lower() in github.username.lower() for e in resume.emails):
            # Fallback if username contains email prefix
            email_matched = 0.5
            
        profile_match_score = 0.5 * profile_name_sim + 0.5 * email_matched
        
        # 5. Weight Sum (75% on Tech Stack Match, 25% on others)
        # If there are no projects, adjust weights dynamically so we don't penalize candidates
        if resume.projects:
            w_tech = 0.75
            w_proj = 0.15
            w_profile = 0.10
        else:
            w_tech = 0.85
            w_proj = 0.0
            w_profile = 0.15
            
        overall_score = (w_tech * tech_stack_match_score) + (w_proj * project_name_match_score) + (w_profile * profile_match_score)
        
        # Round scores
        overall_score = round(overall_score, 4)
        jaccard = round(jaccard, 4)
        tech_stack_match_score = round(tech_stack_match_score, 4)
        project_name_match_score = round(project_name_match_score, 4)
        profile_match_score = round(profile_match_score, 4)
        
        # Get fuzzy logic rating
        fuzzy_rating = self.get_fuzzy_rating(overall_score)
        
        return MatchReport(
            jaccard_similarity=jaccard,
            tech_stack_match_score=tech_stack_match_score,
            project_name_match_score=project_name_match_score,
            profile_match_score=profile_match_score,
            overall_score=overall_score,
            fuzzy_rating=fuzzy_rating,
            skill_matches=skill_details,
            project_matches=project_details
        )
