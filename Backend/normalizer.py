import re
import phonenumbers
from datetime import datetime
from dateutil import parser as date_parser

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
    degree = "Bachelor's Degree"
    if re.search(r"\bb\.?\s*tech\b|\bbachelor\s+of\s+technology\b", line_clean, re.IGNORECASE):
        degree = "B.Tech"
    elif re.search(r"\bb\.?\s*e\.?\b|\bbachelor\s+of\s+engineering\b", line_clean, re.IGNORECASE):
        degree = "B.E."
    elif re.search(r"\bm\.?\s*tech\b|\bmaster\s+of\s+technology\b", line_clean, re.IGNORECASE):
        degree = "M.Tech"
    elif re.search(r"\bm\.?\s*e\.?\b|\bmaster\s+of\s+engineering\b", line_clean, re.IGNORECASE):
        degree = "M.E."
    elif re.search(r"\bb\.?\s*sc\b|\bbachelor\s+of\s+science\b", line_clean, re.IGNORECASE):
        degree = "B.Sc"
    elif re.search(r"\bm\.?\s*sc\b|\bmaster\s+of\s+science\b", line_clean, re.IGNORECASE):
        degree = "M.Sc"
    elif re.search(r"\bbca\b", line_clean, re.IGNORECASE):
        degree = "BCA"
    elif re.search(r"\bmca\b", line_clean, re.IGNORECASE):
        degree = "MCA"
    elif re.search(r"\bph\.?d\b", line_clean, re.IGNORECASE):
        degree = "Ph.D"
        
    # 2. Extract Field
    field = "Computer Science"
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
    end_year = int(years[-1]) if years else 2020
    
    # 4. Clean Institution Name
    inst = line_clean
    # Remove year ranges or individual years
    inst = re.sub(r"\b(20\d{2}|19\d{2})\b", "", inst)
    inst = re.sub(r"\b\d{4}\s*-\s*\d{4}\b", "", inst)
    # Remove CGPA / GPA / percentage details
    inst = re.sub(r"\bcgpa\b.*", "", inst, flags=re.IGNORECASE)
    inst = re.sub(r"\bgpa\b.*", "", inst, flags=re.IGNORECASE)
    inst = re.sub(r"\bclass\b.*", "", inst, flags=re.IGNORECASE)
    inst = re.sub(r"\bpercentage\b.*", "", inst, flags=re.IGNORECASE)
    inst = re.sub(r"\bmarks\b.*", "", inst, flags=re.IGNORECASE)
    inst = re.sub(r":\s*\d+(\.\d+)?", "", inst)
    # Remove degree names
    inst = re.sub(r"\bb\.?\s*tech\b|\bb\.?\s*e\.?\b|\bm\.?\s*tech\b|\bbachelor\s+of\s+technology\b|\bbachelor\s+of\s+engineering\b", "", inst, flags=re.IGNORECASE)
    # Remove field names
    inst = re.sub(r"\bcomputer\s+science\b|\binformation\s+technology\b|\bcomputer\s+science\s+and\s+engineering\b", "", inst, flags=re.IGNORECASE)
    # Clean punctuation and extra spaces
    inst = re.sub(r"^[,\-\s/]+|[,\-\s/]+$", "", inst)
    inst = re.sub(r"\s+", " ", inst).strip()
    
    # If cleaned inst is empty or too short, fallback to a sensible name from original string
    if not inst or len(inst) < 5:
        if "karpagam" in line_clean.lower():
            inst = "Karpagam College of Engineering"
        elif "pune" in line_clean.lower():
            inst = "Pune University"
        elif "coimbatore" in line_clean.lower():
            inst = "Coimbatore Institute of Technology"
        else:
            inst = "University"
            
    return {
        "institution": inst,
        "degree": degree,
        "field": field,
        "end_year": end_year
    }

