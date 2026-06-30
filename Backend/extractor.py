import re
import os
import pdfplumber
import docx

# Regex patterns
EMAIL_REGEX = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
# Highly specific phone regex to avoid matching zip codes, dates, or ID numbers
PHONE_REGEX = re.compile(r"(?:\+?\d{1,3}[-.\s]?)?\(?[6-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b|\+?\d{10,12}\b")
# LINKEDIN_REGEX = re.compile(r"(?:https?://)?(?:www\.)?linkedin\.com/in/[a-zA-Z0-9-_/]+", re.IGNORECASE)
# GITHUB_REGEX = re.compile(r"(?:https?://)?(?:www\.)?github\.com/[a-zA-Z0-9-_/]+", re.IGNORECASE)
LINKEDIN_REGEX = re.compile(r"(?:https?://)?(?:www\.)?linkedin\.com/in/[a-zA-Z0-9-_%]+/?", re.IGNORECASE)
GITHUB_REGEX = re.compile(r"(?:https?://)?(?:www\.)?github\.com/[a-zA-Z0-9-]+/?", re.IGNORECASE)
# Regex patterns for contact information

def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"

                for link in getattr(page, "hyperlinks", []):
                    uri = link.get("uri")
                    if uri:
                        text += uri + "\n"
    except Exception as e:
        print(f"Error reading PDF {file_path}: {e}")
    return text

def extract_text_from_docx(file_path: str) -> str:
    text = ""
    try:
        doc = docx.Document(file_path)

        for para in doc.paragraphs:
            text += para.text + "\n"

        for rel in doc.part.rels.values():
            if "hyperlink" in rel.reltype:
                text += rel.target_ref + "\n"

    except Exception as e:
        print(f"Error reading DOCX {file_path}: {e}")
    return text

def extract_text_from_file(file_path: str) -> str:
    """Determine file type and extract text."""
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext == ".docx":
        return extract_text_from_docx(file_path)
    return ""

def extract_name(text: str) -> str:
    """Heuristic to extract the candidate's name from the resume text."""
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    if not lines:
        return ""
    # Name is usually in the first 4 lines
    for line in lines[:4]:
        line_clean = line.strip()
        # Ignore lines containing emails, websites, or phone numbers
        if "@" in line_clean or "http" in line_clean or "github.com" in line_clean or "linkedin.com" in line_clean:
            continue
        # Ignore lines with too many numbers
        if sum(c.isdigit() for c in line_clean) > 2:
            continue
        # Ignore lines that start with bullet points or common section names
        if any(line_clean.lower().startswith(x) for x in ["curriculum", "resume", "cv", "profile", "contact", "email", "phone"]):
            continue
        # A name should contain mostly alphabetic characters, spaces, and optional dots
        cleaned = re.sub(r"[^\w\s\.]", "", line_clean).strip()
        words = cleaned.split()
        # A name typically has 1-4 words, each capitalized
        if 1 <= len(words) <= 4:
            if all(w[0].isupper() for w in words if w and w[0].isalpha()):
                return cleaned
    # Fallback to first line
    return lines[0] if lines else ""

def parse_contact_info(text: str) -> dict:
    """Parse emails, phones, and profile links from text."""
    emails = list(set(EMAIL_REGEX.findall(text)))
    
    # Clean up phone matches
    phones = []
    for p in PHONE_REGEX.findall(text):
        cleaned = p.strip()
        # Strip out non-digits to verify length
        digits_only = re.sub(r"\D", "", cleaned)
        if 10 <= len(digits_only) <= 15:
            phones.append(cleaned)
    phones = list(set(phones))
    
    linkedin_matches = LINKEDIN_REGEX.findall(text)
    github_matches = GITHUB_REGEX.findall(text)
    
    linkedin = linkedin_matches[0].strip() if linkedin_matches else None
    if linkedin and not linkedin.lower().startswith("http"):
        linkedin = f"https://{linkedin}"
        
    github = github_matches[0].strip() if github_matches else None
    if github and not github.lower().startswith("http"):
        github = f"https://{github}"
    
    return {
        "emails": emails,
        "phones": phones,
        "linkedin": linkedin,
        "github": github
    }

def extract_skills(text: str) -> list:
    """
    Dynamically extract skills from the resume text.
    Locates the Skills section, splits the content, and cleans the tokens.
    """
    lines = [line.strip() for line in text.split("\n")]
    skills_start_idx = -1
    skills_headers = ["skills", "technical skills", "technologies", "core competencies", "skills & tools", "areas of expertise", "it skills"]
    next_section_headers = ["experience", "employment", "work history", "education", "projects", "links", "languages", "interests", "certifications", "activities", "awards"]
    
    for i, line in enumerate(lines):
        line_lower = line.lower()
        if any(h in line_lower for h in skills_headers):
            if len(line) < 30:
                skills_start_idx = i
                break
                
    skills_lines = []
    if skills_start_idx != -1:
        for line in lines[skills_start_idx + 1:]:
            line_lower = line.lower()
            if any(h in line_lower for h in next_section_headers):
                if len(line) < 40:
                    break
            skills_lines.append(line)
    else:
        # Scan for lines that look like lists of skills (multiple commas/semicolons)
        for line in lines:
            line_clean = line.strip()
            if line_clean.count(",") >= 2 or line_clean.count(";") >= 2:
                skills_lines.append(line)

    extracted_skills = []
    ignore_words = {
        "and", "the", "for", "with", "using", "from", "to", "skills", "technical", "technologies", "tools",
        "internship", "intern", "rest", "and rest", "responsive", "built responsive", "strong",
        "demonstrating", "demonstrating strong", "while", "initiative", "solutions", "pvt", "ltd", "pvt.ltd",
        "learning", "basic", "intermediate", "advanced", "expert", "level", "knowledge", "understanding",
        "exposure", "experience", "etc", "hands-on", "hands on"
    }
    
    for line in skills_lines:
        line_clean = line.strip()
        if not line_clean:
            continue
            
        # Clean bullet points
        line_clean = re.sub(r"^[-*•o+\d\.\s]+", "", line_clean)
        
        # Split by comma, semicolon, or vertical bar
        parts = re.split(r"[,;|]|\s{2,}", line_clean)
        for part in parts:
            part_clean = part.strip()
            
            # Clean prefixes like "languages:", "developer tools:", "databases:", etc.
            part_clean = re.sub(r"^(languages|developer tools|databases|database|tools|frameworks|libraries|other)\s*:\s*", "", part_clean, flags=re.IGNORECASE).strip()
            
            # Remove parenthetical notes like (basic), (intermediate), (advanced), (expert)
            part_clean = re.sub(r"\(.*?\)", "", part_clean).strip()
            
            # Remove trailing/leading punctuation
            part_clean = re.sub(r"^[^\w+]+|[^\w+]+$", "", part_clean)
            
            if not part_clean or len(part_clean) < 2 or len(part_clean) > 30:
                continue
                
            part_lower = part_clean.lower()
            if len(part_clean.split()) > 4:
                continue
            if part_lower in ignore_words:
                continue
            if any(w in part_lower for w in ["pvt", "ltd", "solutions", "internship", "intern", "developer intern", "demonstrating", "responsive"]):
                continue
                
            extracted_skills.append(part_clean)
            
    # Deduplicate preserving order
    seen = set()
    unique_skills = []
    for s in extracted_skills:
        s_lower = s.lower()
        if s_lower not in seen:
            seen.add(s_lower)
            unique_skills.append(s)
            
    return unique_skills

def extract_experience_sections(text: str) -> list:
    """
    Robust extraction of experience sections from resume text.
    Only extracts from the actual Experience section, and uses strict matching for job headers.
    """
    lines = [line.strip() for line in text.split("\n")]
    
    # 1. Locate the Experience section
    exp_start_idx = -1
    exp_headers = ["experience", "employment", "work history", "professional history", "career history", "work experience"]
    next_section_headers = ["education", "skills", "projects", "links", "languages", "interests", "certifications", "activities", "awards"]
    
    for i, line in enumerate(lines):
        line_lower = line.lower()
        if any(line_lower == h or line_lower.startswith(h + " ") or line_lower.startswith(h + ":") for h in exp_headers):
            if len(line) < 30:
                exp_start_idx = i
                break
                
    # If no experience section header is found, search the whole text
    if exp_start_idx == -1:
        exp_lines = lines
    else:
        # Extract lines from experience start until the next section header
        exp_lines = []
        for line in lines[exp_start_idx + 1:]:
            line_lower = line.lower()
            if any(line_lower == h or line_lower.startswith(h + " ") or line_lower.startswith(h + ":") for h in next_section_headers):
                if len(line) < 30:
                    break
            exp_lines.append(line)
            
    # 2. Parse job blocks from the extracted lines
    experience = []
    current_block = None
    
    # Common job titles
    job_titles = ["engineer", "developer", "architect", "analyst", "manager", "lead", "programmer", "consultant", "specialist", "intern", "member of technical staff", "mts", "head", "director", "co-founder", "founder"]
    
    # Date regex (e.g., "Jan 2020 - Present", "2019-2022", "06/2018 to 08/2020")
    date_pattern = re.compile(
        r"\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december|\d{1,2})?[-.\s/]*(?:20\d{2}|19\d{2})\b", 
        re.IGNORECASE
    )

    for line in exp_lines:
        line_clean = line.strip()
        if not line_clean:
            continue
            
        # A line is NOT a job header if it starts with bullet points or common description words
        if any(line_clean.startswith(b) for b in ["-", "*", "•", "o", "+", "✓"]):
            if current_block:
                if len(current_block["summary"]) < 500:
                    current_block["summary"] = (current_block["summary"] + " " + line_clean).strip()
            continue
            
        # Check if line is too long to be a header
        if len(line_clean) > 80:
            if current_block:
                if len(current_block["summary"]) < 500:
                    current_block["summary"] = (current_block["summary"] + " " + line_clean).strip()
            continue
            
        line_lower = line_clean.lower()
        
        # Determine if it's a job header
        # has_title = any(r"\b" + re.escape(title) + r"\b" in line_lower for title in job_titles)
        has_title = any(re.search(r"\b" + re.escape(title) + r"\b", line_lower)for title in job_titles)
        has_date = len(date_pattern.findall(line_clean)) >= 1 or "present" in line_lower
        
        # A strong indicator of a job header: has a job title AND (has a date OR has separator like at, @, -, |)
        is_job_header = has_title and (has_date or any(sep in line_clean for sep in [" - ", " | ", " at ", " @ "]))
        
        if is_job_header:
            if current_block:
                experience.append(current_block)
                
            # Parse title and company
            title = line_clean
            company = "Company"
            
            # Try to split by common separators
            for sep in [" - ", " | ", " at ", " @ "]:
                if sep in line_clean:
                    parts = line_clean.split(sep, 1)
                    p0 = parts[0].strip()
                    p1 = parts[1].strip()
                    
                    # Smart title-vs-company detection based on title keywords
                    # p0_has_title = any(r"\b" + re.escape(t) + r"\b" in p0.lower() for t in job_titles)
                    # p1_has_title = any(r"\b" + re.escape(t) + r"\b" in p1.lower() for t in job_titles)
                    p0_has_title = any(re.search(r"\b" + re.escape(t) + r"\b", p0.lower())for t in job_titles)
                    p1_has_title = any(re.search(r"\b" + re.escape(t) + r"\b", p1.lower())for t in job_titles)
                    
                    if p1_has_title and not p0_has_title:
                        title = p1
                        company = p0
                    else:
                        title = p0
                        company = p1
                    break
            
            # Remove dates from title/company if they were in the header line
            dates_found = date_pattern.findall(line_clean)
            start_date = None
            end_date = None
            
            if dates_found:
                start_year = dates_found[0]
                year_match = re.search(r"\b(20\d{2}|19\d{2})\b", start_year)
                if year_match:
                    start_date = year_match.group(1) + "-01"
                
                if len(dates_found) > 1:
                    end_year = dates_found[1]
                    year_match_end = re.search(r"\b(20\d{2}|19\d{2})\b", end_year)
                    if year_match_end:
                        end_date = year_match_end.group(1) + "-01"
                elif "present" in line_lower:
                    end_date = None
            
            # Clean up title/company from dates
            for d in dates_found:
                title = title.replace(d, "").strip()
                company = company.replace(d, "").strip()
            title = re.sub(r"\s*[-|@]\s*$", "", title).strip()
            company = re.sub(r"^\s*[-|@]\s*", "", company).strip()
            
            from normalizer import normalize_date
            normalized_start = normalize_date(start_date) if start_date else ""
            normalized_end = normalize_date(end_date) if end_date else None
            
            current_block = {
                "company": company if company else None,
                "title": title if title else None,
                "start": normalized_start,
                "end": normalized_end,
                "summary": ""
            }
        else:
            if current_block:
                if len(current_block["summary"]) < 500:
                    current_block["summary"] = (current_block["summary"] + " " + line_clean).strip()
                    
    if current_block:
        experience.append(current_block)
        
    return experience

def extract_education_sections(text: str) -> list:
    """
    Robust extraction of education details from the resume.
    Locates the education section, groups related lines, and extracts degree, field, institution, and year.
    """
    skip_keywords = [
    "@", "linkedin", "github", "email", "phone", "mobile",
    "examination", "university institute year"
]
    from normalizer import normalize_education
    lines = [line.strip() for line in text.split("\n")]
    
    # 1. Locate the Education section
    edu_start_idx = -1
    edu_headers = ["education", "academic profile", "academic background", "educational qualifications", "qualification", "educational background"]
    next_section_headers = ["experience", "employment", "work history", "skills", "projects", "links", "languages", "interests", "certifications", "activities", "awards"]
    
    for i, line in enumerate(lines):
        line_lower = line.lower()
        if any(line_lower == h or line_lower.startswith(h + " ") or line_lower.startswith(h + ":") for h in edu_headers):
            if len(line) < 30:
                edu_start_idx = i
                break
                
    if edu_start_idx == -1:
        edu_lines = lines
    else:
        edu_lines = []
        for line in lines[edu_start_idx + 1:]:
            line_lower = line.lower()
            if any(line_lower == h or line_lower.startswith(h + " ") or line_lower.startswith(h + ":") for h in next_section_headers):
                if len(line) < 30:
                    break
            edu_lines.append(line)
            
    # 2. Process lines and group them
    education = []
    
    # Combine adjacent lines if one contains degree/field and the other contains institution
    i = 0
    while i < len(edu_lines):
        line = edu_lines[i].strip()
        line_lower = line.lower()
        if any(k in line_lower for k in skip_keywords):
            i += 1
            continue
        if not line:
            i += 1
            continue
            
        # If the line has education keywords
        if any(keyword in line.lower() for keyword in ["university", "institute", "college", "vit", "iit", "b.tech", "b.e.", "m.tech", "bachelor", "master", "school", "hsc", "sslc"]):
            combined_line = line
            # Look ahead to see if the next line is part of the same block
            if i + 1 < len(edu_lines):
                next_line = edu_lines[i+1].strip()
                if next_line and not any(h in next_line.lower() for h in edu_headers + next_section_headers):
                    if len(next_line) < 100:
                        combined_line += " " + next_line
                        i += 1
            
            edu_details = normalize_education(combined_line)
            # Avoid duplicate institutions in the list
            if not any(e["institution"] == edu_details["institution"] and e["degree"] == edu_details["degree"] for e in education):
                education.append(edu_details)
            if len(education) >= 3:
                break
        i += 1
        
    # Fallback if nothing found in the section
    if not education:
        for line in lines:
            if any(keyword in line.lower() for keyword in ["university", "institute", "college", "vit", "iit", "b.tech", "b.e.", "m.tech"]):
                edu_details = normalize_education(line)
                if not any(e["institution"] == edu_details["institution"] for e in education):
                    education.append(edu_details)
                if len(education) >= 2:
                    break
                    
    return education

def extract_location(text: str) -> dict:
    """
    Scan the first 20 lines of resume text for location patterns (e.g. "City, State", "City, Country").
    Uses purely rule-based regex patterns.
    """
    lines = [line.strip() for line in text.split("\n")[:20] if line.strip()]
    
    # Pattern 1: "City, State/Country" (e.g., "Bengaluru, Karnataka", "Chennai, India", "Austin, TX")
    loc_pattern = re.compile(
        r"\b([A-Z][a-zA-Z\s]{2,19})\s*,\s*([A-Z][a-zA-Z\s]{2,19}|[A-Z]{2})\b"
    )
    
    for line in lines:
        match = loc_pattern.search(line)
        if match:
            city = match.group(1).strip()
            region_or_country = match.group(2).strip()
            
            # Determine country
            country = "IN"
            if region_or_country.upper() in ["US", "USA", "UNITED STATES"]:
                country = "US"
            elif region_or_country.upper() in ["UK", "UNITED KINGDOM"]:
                country = "UK"
            elif len(region_or_country) == 2 and region_or_country.isupper():
                country = "US"
                
            return {
                "city": city,
                "region": region_or_country if len(region_or_country) > 2 else "",
                "country": country
            }
            
    # Pattern 2: Single word city name at the end of location line (e.g., "Location: Pune")
    for line in lines:
        line_lower = line.lower()
        if "location" in line_lower or "address" in line_lower or "city" in line_lower:
            parts = re.split(r"[:\-]", line, 1)
            if len(parts) > 1:
                candidate = parts[1].strip()
                words = candidate.split()
                if words and len(words) <= 3:
                    city = " ".join(words)
                    return {
                        "city": city,
                        "region": "",
                        "country": "IN"
                    }
                    
    return None

def extract_projects(text: str) -> list:
    """
    Dynamically extract project names from the resume text.
    Locates the Projects section and parses project titles from bullet points or headers.
    """
    projects = []
    lines = [line.strip() for line in text.split("\n")]
    
    proj_start_idx = -1
    proj_headers = ["projects", "personal projects", "academic projects", "key projects", "ventures"]
    next_section_headers = ["education", "experience", "employment", "work history", "skills", "links", "languages", "interests", "certifications", "activities", "awards"]
    
    for i, line in enumerate(lines):
        line_lower = line.lower()
        if any(line_lower == h or line_lower.startswith(h + " ") or line_lower.startswith(h + ":") for h in proj_headers):
            if len(line) < 30:
                proj_start_idx = i
                break
                
    if proj_start_idx != -1:
        proj_lines = []
        for line in lines[proj_start_idx + 1:]:
            line_lower = line.lower()
            if any(line_lower == h or line_lower.startswith(h + " ") or line_lower.startswith(h + ":") for h in next_section_headers):
                if len(line) < 30:
                    break
            proj_lines.append(line)
            
        for line in proj_lines:
            line_clean = line.strip()
            if not line_clean:
                continue
            if any(line_clean.startswith(b) for b in ["-", "*", "•", "o"]):
                line_no_bullet = re.sub(r"^[-*•o\s]+", "", line_clean)
                parts = re.split(r"[:\-–|]", line_no_bullet, 1)
                proj_candidate = parts[0].strip()
                words = proj_candidate.split()
                if 1 <= len(words) <= 5:
                    proj_name = " ".join(words).strip()
                    proj_name = re.sub(r"^[^\w+]+|[^\w+]+$", "", proj_name)
                    if len(proj_name) > 3:
                        projects.append(proj_name)
            elif len(line_clean) < 60 and any(c.isupper() for c in line_clean):
                words = line_clean.split()
                if 1 <= len(words) <= 5 and all(w[0].isupper() for w in words if w and w[0].isalpha()):
                    proj_name = " ".join(words).strip()
                    proj_name = re.sub(r"^[^\w+]+|[^\w+]+$", "", proj_name)
                    if len(proj_name) > 3:
                        projects.append(proj_name)
                        
    return list(set(projects))
