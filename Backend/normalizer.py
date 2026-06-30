import re
import phonenumbers
from datetime import datetime
from dateutil import parser as date_parser
from rapidfuzz import fuzz

STANDARD_DEGREES = [
    "B.Tech", "B.E.", "M.Tech", "M.E.", "B.Sc", "M.Sc", "BCA", "MCA", "MBA", "Ph.D.",
    "Higher Secondary", "Secondary School", "Bachelor's Degree", "Master's Degree"
]

STANDARD_FIELDS = [
    "Computer Science", "Information Technology", "Electronics & Communication",
    "Electrical Engineering", "Mechanical Engineering", "Civil Engineering",
    "Data Science", "Artificial Intelligence", "Software Engineering"
]

# A simple dictionary of skill aliases to canonical names
SKILL_ALIASES = {
    "py": "python",
    "python3": "python",
    "js": "javascript",
    "javascript": "javascript",
    "ts": "typescript",
    "reactjs": "react",
    "react.js": "react",
    "nodejs": "node.js",
    "node": "node.js",
    "postgres": "postgresql",
    "postgres_db": "postgresql",
    "docker_container": "docker",
    "k8s": "kubernetes",
    "kube": "kubernetes",
    "amazon web services": "aws",
    "git_version_control": "git"
}

def normalize_phone(phone_str: str, default_region: str = "IN") -> str:
    """
    Normalize phone number to E.164 format.
    Returns original string if parsing fails.
    """
    if not phone_str:
        return ""
    # Remove common characters that aren't digits or +
    cleaned = re.sub(r"[^\d+]", "", phone_str)
    try:
        parsed = phonenumbers.parse(cleaned, default_region)
        if phonenumbers.is_valid_number(parsed):
            return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
    except Exception:
        pass
    return phone_str

def normalize_date(date_str: str) -> str:
    """
    Normalize date string to YYYY-MM format.
    Returns original string if parsing fails.
    """
    if not date_str or date_str.lower() in ["present", "null", "none"]:
        return ""
    try:
        parsed_dt = date_parser.parse(date_str, default=datetime(1970, 1, 1))
        return parsed_dt.strftime("%Y-%m")
    except Exception:
        pass
    
    # Fallback regex check for YYYY-MM or YYYY
    match_ym = re.search(r"(\d{4})[-/](\d{1,2})", date_str)
    if match_ym:
        year, month = match_ym.groups()
        return f"{year}-{int(month):02d}"
    
    match_y = re.search(r"\b(\d{4})\b", date_str)
    if match_y:
        return f"{match_y.group(1)}-01"
        
    return date_str

def normalize_skill(skill_str: str) -> str:
    """
    Normalize skill name to lowercase, stripped, and map aliases.
    """
    if not skill_str:
        return ""
    cleaned = skill_str.strip().lower()
    return SKILL_ALIASES.get(cleaned, cleaned)

def normalize_education(line: str) -> dict:
    """
    Normalize education details from a raw text line.
    Extracts degree, field of study, end year, and cleans the institution name.
    """
    line_clean = line.strip()
    
    # 1. Extract Degree
    degree = ""
    if re.search(r"\bhsc\b|higher\s+secondary", line_clean, re.IGNORECASE):
        degree = "Higher Secondary"
    elif re.search(r"\bsslc\b|secondary\s+school", line_clean, re.IGNORECASE):
        degree = "Secondary School"
    elif re.search(r"\bb\.?\s*tech\b|\bbachelor\s+of\s+technology\b", line_clean, re.IGNORECASE):
        degree = "B.Tech"
    elif re.search(r"\bb\.?\s*e\.?\b|\bbachelor\s+of\s+engineering\b", line_clean, re.IGNORECASE):
        degree = "B.E."
        
    # 2. Extract Field
    field = ""
    if re.search(r"\bcomputer\s+science\b|\bcs\b|\bcse\b", line_clean, re.IGNORECASE):
        field = "Computer Science"
    elif re.search(r"\binformation\s+technology\b|\bit\b", line_clean, re.IGNORECASE):
        field = "Information Technology"
    elif re.search(r"\belectronics\b|\bece\b", line_clean, re.IGNORECASE):
        field = "Electronics & Communication"
    elif re.search(r"\bmechanical\b|\bmech\b", line_clean, re.IGNORECASE):
        field = "Mechanical Engineering"
        
    # 3. Extract Year (Prefer the last 4-digit year in range)
    years = re.findall(r"\b(20\d{2}|19\d{2})\b", line_clean)
    end_year = int(years[-1]) if years else None
    
    # 4. Clean Institution Name
    inst = line_clean
    # Remove year ranges or individual years
    inst = re.sub(r"\b(20\d{2}|19\d{2})\b", "", inst)
    inst = re.sub(r"\b\d{4}\s*-\s*\d{4}\b", "", inst)
    # Remove CGPA / GPA / percentage details precisely
    inst = re.sub(r"\bcgpa\b\s*(?::\s*)?\d+(?:\.\d+)?", "", inst, flags=re.IGNORECASE)
    inst = re.sub(r"\bgpa\b\s*(?::\s*)?\d+(?:\.\d+)?", "", inst, flags=re.IGNORECASE)
    inst = re.sub(r"\bclass\b\s*(?::\s*)?\w+", "", inst, flags=re.IGNORECASE)
    inst = re.sub(r"\bpercentage\b\s*(?::\s*)?\d+(?:\.\d+)?%?", "", inst, flags=re.IGNORECASE)
    inst = re.sub(r"\bmarks\b\s*(?::\s*)?\d+", "", inst, flags=re.IGNORECASE)
    inst = re.sub(r"\b(?:cgpa|gpa)\b", "", inst, flags=re.IGNORECASE)
    # Remove degree names
    inst = re.sub(r"\bb\.?\s*tech\b|\bb\.?\s*e\.?\b|\bm\.?\s*tech\b|\bbachelor\s+of\s+technology\b|\bbachelor\s+of\s+engineering\b", "", inst, flags=re.IGNORECASE)
    # Remove field names
    inst = re.sub(r"\bcomputer\s+science\b|\binformation\s+technology\b|\bcomputer\s+science\s+and\s+engineering\b", "", inst, flags=re.IGNORECASE)
    # Clean punctuation and extra spaces
    inst = re.sub(r"^[,\-\s/]+|[,\-\s/]+$", "", inst)
    inst = re.sub(r"\s+", " ", inst).strip()
    
    # If cleaned inst is empty or too short, fallback to a generic name
    if not inst or len(inst) < 3:
        inst = "University"
        
    # Fuzzy align degree to standard list
    if degree:
        best_deg = None
        best_score = 0
        for std_deg in STANDARD_DEGREES:
            score = fuzz.ratio(degree.lower(), std_deg.lower())
            if score > best_score:
                best_score = score
                best_deg = std_deg
        if best_score >= 80:
            degree = best_deg

    # Fuzzy align field of study to standard list
    if field:
        best_field = None
        best_score = 0
        for std_field in STANDARD_FIELDS:
            score = fuzz.ratio(field.lower(), std_field.lower())
            if score > best_score:
                best_score = score
                best_field = std_field
        if best_score >= 80:
            field = best_field
            
    return {
        "institution": inst,
        "degree": degree if degree else "",
        "field": field if field else "",
        "end_year": end_year
    }

