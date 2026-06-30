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
    title: Optional[str] = Field(None, description="Candidate job title or headline from resume")

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
    source: Optional[str] = None                                                   
    priority_level: Optional[str] = None                                                         
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
    dice_similarity: float = Field(0.0, description="Dice-Sørensen coefficient between resume skills and GitHub skills")
    tech_stack_match_score: float = Field(..., description="Weighted match score of resume skills on GitHub (75% weight)")
    project_name_match_score: float = Field(..., description="Fuzzy match score of resume projects to GitHub repos")
    profile_match_score: float = Field(..., description="Name and email match score between resume and GitHub profile")
    semantic_title_match: float = Field(0.0, description="Cosine similarity (TF-IDF) between resume title and target job title")
    overall_score: float = Field(..., description="Final weighted sum score")
    harmonic_match_score: float = Field(0.0, description="Harmonic Mean (F1-Score) between skill match and profile/experience match")
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
    def calculate_dice_coefficient(set_a: set, set_b: set) -> float:
        """Calculate Dice-Sørensen Coefficient between two sets."""
        if not set_a and not set_b:
            return 0.0
        intersection = set_a & set_b
        total_elements = len(set_a) + len(set_b)
        if total_elements == 0:
            return 0.0
        return round((2.0 * len(intersection)) / total_elements, 4)

    @staticmethod
    def calculate_cosine_similarity(text_a: str, text_b: str) -> float:
        """Calculate Cosine Similarity using TF-IDF representation for job titles."""
        if not text_a or not text_b:
            return 0.0
        
                                  
        words_a = [w for w in re.findall(r'\w+', text_a.lower()) if w]
        words_b = [w for w in re.findall(r'\w+', text_b.lower()) if w]
        
        if not words_a or not words_b:
            return 0.0
            
                    
        vocab = set(words_a + words_b)
        
                          
        tf_a = {word: words_a.count(word) for word in vocab}
        tf_b = {word: words_b.count(word) for word in vocab}
        
                                                                 
        df = {}
        for word in vocab:
            count = 0
            if word in words_a:
                count += 1
            if word in words_b:
                count += 1
            df[word] = count
            
        import math
        vector_a = []
        vector_b = []
        for word in vocab:
                                                           
            idf = math.log(2.0 / df[word]) + 1.0
            vector_a.append(tf_a[word] * idf)
            vector_b.append(tf_b[word] * idf)
            
                        
        dot_product = sum(a * b for a, b in zip(vector_a, vector_b))
        mag_a = math.sqrt(sum(a * a for a in vector_a))
        mag_b = math.sqrt(sum(b * b for b in vector_b))
        
        if mag_a == 0.0 or mag_b == 0.0:
            return 0.0
            
        return round(dot_product / (mag_a * mag_b), 4)

    @staticmethod
    def calculate_shannon_entropy(values: List[Any]) -> float:
        """Calculate Shannon Entropy for a list of values to measure disagreement/conflict."""
                                      
        valid_vals = [str(v).strip().lower() for v in values if v is not None and str(v).strip() != ""]
        if not valid_vals:
            return 0.0
        import math
        total = len(valid_vals)
        counts = {}
        for val in valid_vals:
            counts[val] = counts.get(val, 0) + 1
        
        entropy = 0.0
        for count in counts.values():
            p = count / total
            entropy -= p * math.log2(p)
        return round(entropy, 4)

    @staticmethod
    def calculate_harmonic_match(skill_match: float, experience_match: float) -> float:
        """Calculate the Harmonic Mean (F1-Score) between skill match and experience/profile match."""
        if (skill_match + experience_match) == 0.0:
            return 0.0
        return round((2.0 * skill_match * experience_match) / (skill_match + experience_match), 4)

    @staticmethod
    def get_fuzzy_rating(score: float) -> str:
        """
        Determine the fuzzy rating using standard triangular/trapezoidal membership functions.
        Maps the continuous score (0.0 to 1.0) into one of the four fuzzy sets: Low, Medium, High, Excellent.
        """
                             
        if score <= 0.2:
            mu_low = 1.0
        elif score <= 0.45:
            mu_low = (0.45 - score) / 0.25
        else:
            mu_low = 0.0
            
                                
        if score <= 0.25 or score >= 0.75:
            mu_med = 0.0
        elif score <= 0.5:
            mu_med = (score - 0.25) / 0.25
        else:
            mu_med = (0.75 - score) / 0.25
            
                              
        if score <= 0.55 or score >= 0.9:
            mu_high = 0.0
        elif score <= 0.75:
            mu_high = (score - 0.55) / 0.2
        else:
            mu_high = (0.9 - score) / 0.15
            
                                   
        if score <= 0.8:
            mu_excel = 0.0
        else:
            mu_excel = (score - 0.8) / 0.2
            
        ratings = {
            "Low": mu_low,
            "Medium": mu_med,
            "High": mu_high,
            "Excellent": mu_excel
        }
        
                                                          
        return max(ratings, key=ratings.get)

    def match(self, resume: ResumeData, github: GitHubData, csv_title: str = "Software Engineer") -> MatchReport:
                                      
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
        
                                                                                                          
        extracted_from_repos = set()
        all_text = " ".join(github_repo_names) + " " + github_descriptions_text
        for skill in resume_skills:
                                                                      
            pattern = r"\b" + re.escape(skill) + r"\b"
            if re.search(pattern, all_text):
                extracted_from_repos.add(skill)
        
                                                  
        github_skills = github_languages | github_topics | extracted_from_repos
        
                                                       
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
            "web technologies", "web technology",
            "problem-solving", "problem solving", "adaptability", "soft skills", "soft skill", "communication",
            "time management", "management"
        }

                                                               
        jaccard_resume_skills = {
            s for s in resume_skills 
            if not any(kw in s.lower() or fuzz.ratio(s.lower(), kw) >= 85 for kw in fundamental_keywords)
        }
        jaccard_github_skills = {
            s for s in github_skills 
            if not any(kw in s.lower() or fuzz.ratio(s.lower(), kw) >= 85 for kw in fundamental_keywords)
        }
        jaccard = self.calculate_jaccard_similarity(jaccard_resume_skills, jaccard_github_skills)
        dice = self.calculate_dice_coefficient(jaccard_resume_skills, jaccard_github_skills)
        
                                                                          
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
                    
                                                                                   
                    if repo.language and (norm_skill == normalize_skill(repo.language) or fuzz.ratio(norm_skill, normalize_skill(repo.language)) >= 90):
                        repo_matched = True
                        repo_score = 1.0
                        repo_source = "language"
                        repo_priority = "Priority 1 (High)"
                    
                                                                                
                    elif any(norm_skill == normalize_skill(topic) or fuzz.ratio(norm_skill, normalize_skill(topic)) >= 90 for topic in repo.topics):
                        repo_matched = True
                        repo_score = 0.85
                        repo_source = "topic"
                        repo_priority = "Priority 2 (Medium-High)"
                    
                                                                    
                    elif norm_skill in repo.name.lower() or fuzz.partial_ratio(norm_skill, repo.name.lower()) >= 85:
                        repo_matched = True
                        repo_score = 0.75
                        repo_source = "repo_name"
                        repo_priority = "Priority 3 (Medium)"
                    
                                                                               
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
            
                                                                     
            tech_stack_skills = [s for s in skill_details if s.skill_type == "tech_stack"]
            if tech_stack_skills:
                tech_stack_match_score = sum(s.match_score for s in tech_stack_skills) / len(tech_stack_skills)
            else:
                tech_stack_match_score = 1.0
        else:
            tech_stack_match_score = 1.0
            
                                                
        project_details = []
        total_proj_score = 0.0
        if resume.projects:
            for proj in resume.projects:
                max_proj_sim = 0.0
                best_repo_match = None
                
                for repo in github.repos:
                                                                                      
                    sim_name = fuzz.token_set_ratio(proj.lower(), repo.name.lower())
                    sim_desc = fuzz.partial_ratio(proj.lower(), repo.description.lower()) if repo.description else 0.0
                    sim = max(sim_name, sim_desc)
                    if sim > max_proj_sim:
                        max_proj_sim = sim
                        best_repo_match = repo.name
                
                                               
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
            
                             
        profile_name_sim = 0.0
        if resume.name and github.profile_name:
            profile_name_sim = fuzz.ratio(resume.name.lower(), github.profile_name.lower()) / 100.0
            
        email_matched = 0.0
        if github.email and github.email.lower() in [e.lower() for e in resume.emails]:
            email_matched = 1.0
        elif any(e.lower() in github.username.lower() for e in resume.emails):
                                                        
            email_matched = 0.5
            
        profile_match_score = 0.5 * profile_name_sim + 0.5 * email_matched
        
                                                                                 
        resume_title = resume.title or ""
        semantic_title_match = self.calculate_cosine_similarity(resume_title, csv_title)
        
                                                                                                                       
        harmonic_match_score = self.calculate_harmonic_match(tech_stack_match_score, profile_match_score)
        
                      
        w_tech = 0.85
        w_profile = 0.15
        
                                                                       
        overall_score = (w_tech * tech_stack_match_score) + (w_profile * profile_match_score)
        
                                                                                                          
        if resume.projects and project_name_match_score > 0.0:
                                                                                        
            boost = project_name_match_score * 0.10
            overall_score = min(overall_score + boost, 1.0)
        
                      
        overall_score = round(overall_score, 4)
        jaccard = round(jaccard, 4)
        tech_stack_match_score = round(tech_stack_match_score, 4)
        project_name_match_score = round(project_name_match_score, 4)
        profile_match_score = round(profile_match_score, 4)
        
                                
        fuzzy_rating = self.get_fuzzy_rating(overall_score)
        
        return MatchReport(
            jaccard_similarity=jaccard,
            dice_similarity=dice,
            tech_stack_match_score=tech_stack_match_score,
            project_name_match_score=project_name_match_score,
            profile_match_score=profile_match_score,
            semantic_title_match=semantic_title_match,
            overall_score=overall_score,
            harmonic_match_score=harmonic_match_score,
            fuzzy_rating=fuzzy_rating,
            skill_matches=skill_details,
            project_matches=project_details
        )
