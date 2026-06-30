// ─── Updated Mock Candidates Data (Canonical Schema List) ────────────────────────

export const mockCandidates = [
  {
    candidate_id: "a7f3c2e1b9d4f8a2",
    full_name: "Akash Chandra",
    emails: ["akash.chandra@gmail.com", "akash.c@infosys.com"],
    phones: ["+919876543210"],
    location: {
      city: "Bengaluru",
      region: "Karnataka",
      country: "IN"
    },
    links: {
      linkedin: "https://linkedin.com/in/akash-chandra",
      github: "https://github.com/akash-chandra-105",
      portfolio: null,
      other: []
    },
    headline: "Senior Software Engineer specializing in full-stack development",
    years_experience: 7,
    skills: [
      { name: "python", confidence: 0.97, sources: ["recruiter_csv", "resume", "github"] },
      { name: "javascript", confidence: 0.93, sources: ["recruiter_csv", "resume"] },
      { name: "react", confidence: 0.85, sources: ["resume", "github"] },
      { name: "node.js", confidence: 0.56, sources: ["resume"] },
      { name: "postgresql", confidence: 0.93, sources: ["recruiter_csv", "resume"] },
      { name: "docker", confidence: 0.60, sources: ["github"] },
      { name: "kubernetes", confidence: 0.60, sources: ["github"] },
      { name: "aws", confidence: 0.56, sources: ["resume"] },
      { name: "typescript", confidence: 0.85, sources: ["github", "resume"] },
      { name: "django", confidence: 0.56, sources: ["resume"] },
      { name: "flask", confidence: 0.90, sources: ["recruiter_csv"] },
      { name: "git", confidence: 0.93, sources: ["recruiter_csv", "github"] },
      { name: "redis", confidence: 0.56, sources: ["resume"] },
      { name: "graphql", confidence: 0.60, sources: ["github"] },
    ],
    experience: [
      {
        company: "Infosys",
        title: "Senior Software Engineer",
        start: "2022-03",
        end: null,
        summary: "Leading full-stack development team building enterprise SaaS products using Python, React, and AWS."
      },
      {
        company: "TCS",
        title: "Software Engineer",
        start: "2019-06",
        end: "2022-02",
        summary: "Developed microservices architecture and RESTful APIs for banking applications."
      },
      {
        company: "Cognizant",
        title: "Junior Developer",
        start: "2017-08",
        end: "2019-05",
        summary: "Built internal tools and automated testing pipelines for client projects."
      }
    ],
    education: [
      {
        institution: "VIT University",
        degree: "B.Tech",
        field: "Computer Science and Engineering",
        end_year: 2017
      }
    ],
    provenance: [
      { field: "full_name", source: "recruiter_csv", method: "verbatim" },
      { field: "emails[0]", source: "recruiter_csv", method: "verbatim" },
      { field: "emails[1]", source: "resume", method: "regex" },
      { field: "phones[0]", source: "recruiter_csv", method: "verbatim" },
      { field: "location", source: "recruiter_csv", method: "inferred" },
      { field: "links.linkedin", source: "resume", method: "regex" },
      { field: "links.github", source: "github_csv", method: "verbatim" },
      { field: "headline", source: "resume", method: "inferred" },
      { field: "years_experience", source: "resume", method: "inferred" },
      { field: "experience", source: "resume", method: "regex" },
      { field: "education", source: "resume", method: "regex" },
    ],
    overall_confidence: 0.78
  },
  {
    candidate_id: "b8f2c3a5e1d9f7a4",
    full_name: "Priya Sharma",
    emails: ["priya.sharma@yahoo.com", "priya.s@wipro.com"],
    phones: ["+919876543211", "+918888888888"],
    location: {
      city: "Pune",
      region: "Maharashtra",
      country: "IN"
    },
    links: {
      linkedin: "https://linkedin.com/in/priya-sharma",
      github: "https://github.com/priya-sharma-dev",
      portfolio: "https://priyasharma.me",
      other: []
    },
    headline: "Frontend Architect specializing in React, TypeScript, and UI Design Systems",
    years_experience: 6,
    skills: [
      { name: "javascript", confidence: 0.95, sources: ["recruiter_csv", "resume"] },
      { name: "typescript", confidence: 0.90, sources: ["resume", "github"] },
      { name: "react", confidence: 0.95, sources: ["recruiter_csv", "resume", "github"] },
      { name: "node.js", confidence: 0.75, sources: ["resume"] },
      { name: "css", confidence: 0.90, sources: ["resume"] },
      { name: "html", confidence: 0.90, sources: ["resume"] },
      { name: "next.js", confidence: 0.85, sources: ["github"] },
      { name: "redux", confidence: 0.80, sources: ["resume"] },
      { name: "git", confidence: 0.90, sources: ["github"] },
    ],
    experience: [
      {
        company: "Wipro Technologies",
        title: "Frontend Architect",
        start: "2023-01",
        end: null,
        summary: "Architecting enterprise UI platform with next-gen design system and server-side components."
      },
      {
        company: "Cognizant",
        title: "Senior UI Developer",
        start: "2020-03",
        end: "2022-12",
        summary: "Led frontend migration from legacy angular dashboard to modernized React system."
      }
    ],
    education: [
      {
        institution: "Pune University",
        degree: "B.E.",
        field: "Information Technology",
        end_year: 2020
      }
    ],
    provenance: [
      { field: "full_name", source: "recruiter_csv", method: "verbatim" },
      { field: "emails[0]", source: "recruiter_csv", method: "verbatim" },
      { field: "emails[1]", source: "resume", method: "regex" },
      { field: "phones[0]", source: "recruiter_csv", method: "verbatim" },
      { field: "location", source: "recruiter_csv", method: "inferred" },
      { field: "links.linkedin", source: "resume", method: "regex" },
      { field: "links.github", source: "github_csv", method: "verbatim" },
      { field: "links.portfolio", source: "resume", method: "regex" },
      { field: "headline", source: "resume", method: "inferred" },
      { field: "years_experience", source: "resume", method: "inferred" },
    ],
    overall_confidence: 0.82
  },
  {
    candidate_id: "c9e3f4b5d2a7f8e1",
    full_name: "Rahul Verma",
    emails: ["rahul.verma@gmail.com"],
    phones: ["+919876543212"],
    location: {
      city: "Gurugram",
      region: "Haryana",
      country: "IN"
    },
    links: {
      linkedin: "https://linkedin.com/in/rahul-verma-backend",
      github: "https://github.com/rverma-backend",
      portfolio: null,
      other: []
    },
    headline: "Backend Engineer specialized in Go, Python, and Distributed Systems",
    years_experience: 5,
    skills: [
      { name: "go", confidence: 0.95, sources: ["recruiter_csv", "resume", "github"] },
      { name: "python", confidence: 0.90, sources: ["resume"] },
      { name: "postgresql", confidence: 0.85, sources: ["resume", "github"] },
      { name: "redis", confidence: 0.80, sources: ["resume"] },
      { name: "docker", confidence: 0.85, sources: ["github"] },
      { name: "kubernetes", confidence: 0.70, sources: ["resume"] },
      { name: "grpc", confidence: 0.80, sources: ["github"] },
    ],
    experience: [
      {
        company: "Paytm",
        title: "Backend Engineer",
        start: "2021-08",
        end: null,
        summary: "Building highly concurrent payment APIs and database schemas processing millions of txn/day."
      }
    ],
    education: [
      {
        institution: "IIT Delhi",
        degree: "M.Tech",
        field: "Computer Applications",
        end_year: 2021
      }
    ],
    provenance: [
      { field: "full_name", source: "recruiter_csv", method: "verbatim" },
      { field: "emails[0]", source: "recruiter_csv", method: "verbatim" },
      { field: "phones[0]", source: "recruiter_csv", method: "verbatim" },
      { field: "location", source: "recruiter_csv", method: "inferred" },
      { field: "links.github", source: "github_csv", method: "verbatim" },
      { field: "headline", source: "resume", method: "inferred" },
      { field: "years_experience", source: "resume", method: "inferred" },
    ],
    overall_confidence: 0.76
  }
];

export const mockCandidate = mockCandidates[0]; // fallback backward compatibility

// ─── Mock Pipeline Run History ─────────────────────────────────────────────────

export const mockPipelineRuns = [
  {
    id: "run-001",
    timestamp: "2026-06-30T10:45:00Z",
    resumeCount: 12,
    sources: ["recruiter_csv", "github_csv", "resumes"],
    status: "completed",
    candidatesProcessed: 12,
    avgConfidence: 0.78,
    conflictsResolved: 5,
    duration: "3.2s"
  },
  {
    id: "run-002",
    timestamp: "2026-06-30T09:22:00Z",
    resumeCount: 8,
    sources: ["recruiter_csv", "resumes"],
    status: "completed",
    candidatesProcessed: 8,
    avgConfidence: 0.72,
    conflictsResolved: 2,
    duration: "2.1s"
  }
];

// ─── Mock Conflict Log ─────────────────────────────────────────────────────────

export const mockConflicts = [
  {
    id: "conflict-001",
    field: "location.city",
    winner: { value: "Bengaluru", source: "recruiter_csv", confidence: 0.90 },
    loser: { value: "Bangalore", source: "resume", confidence: 0.56 },
    reason: "Recruiter CSV has higher source priority; values are equivalent (alias match)",
    rule: "FIELD_PRIORITY['location'] = ['recruiter_csv', 'resume', 'github']"
  },
  {
    id: "conflict-002",
    field: "headline",
    winner: { value: "Senior Software Engineer specializing in full-stack development", source: "resume", confidence: 0.56 },
    loser: { value: "Full Stack Developer", source: "github", confidence: 0.36 },
    reason: "Resume headline is more descriptive; GitHub bio used as fallback",
    rule: "FIELD_PRIORITY['headline'] = ['recruiter_csv', 'resume', 'github']"
  }
];

// ─── Pipeline Stages ───────────────────────────────────────────────────────────

export const pipelineStages = [
  { id: 1, name: "Detect", description: "Classify source types (Recruiter CSV, GitHub CSV, Resume folder)", icon: "Search" },
  { id: 2, name: "Extract", description: "Pull raw data from each source into native field maps", icon: "FileInput" },
  { id: 3, name: "Normalize", description: "Standardize dates (ISO 8601), phones (E.164), skills, names", icon: "Wand2" },
  { id: 4, name: "Merge", description: "Join on email / fuzzy name match, apply priority table", icon: "GitMerge" },
  { id: 5, name: "Confidence", description: "Score each field: source_weight × method_weight × corroboration", icon: "ShieldCheck" },
  { id: 6, name: "Project", description: "Reshape canonical record to config-driven output schema", icon: "Projector" },
  { id: 7, name: "Validate", description: "Validate projected output against dynamically built JSON Schema", icon: "CheckCircle2" }
];

// ─── Output Schema Definition ──────────────────────────────────────────────────

export const outputSchema = [
  { field: "candidate_id", type: "string", notes: "" },
  { field: "full_name", type: "string", notes: "" },
  { field: "emails", type: "string[]", notes: "" },
  { field: "phones", type: "string[]", notes: "E.164 format" },
  { field: "location", type: "{ city, region, country }", notes: "country: ISO-3166 alpha-2" },
  { field: "links", type: "{ linkedin, github, portfolio, other[] }", notes: "" },
  { field: "headline", type: "string | null", notes: "" },
  { field: "years_experience", type: "number | null", notes: "" },
  { field: "skills", type: "[{ name, confidence, sources[] }]", notes: "canonical skill names" },
  { field: "experience", type: "[{ company, title, start, end, summary }]", notes: "dates as YYYY-MM" },
  { field: "education", type: "[{ institution, degree, field, end_year }]", notes: "" },
  { field: "provenance", type: "[{ field, source, method }]", notes: "where each value came from" },
  { field: "overall_confidence", type: "number", notes: "" },
];

// ─── Config Presets ────────────────────────────────────────────────────────────

export const configPresets = {
  full: {
    name: "Full Canonical",
    description: "All fields with confidence and provenance metadata",
    config: {
      fields: [
        { path: "candidate_id", type: "string", required: true },
        { path: "full_name", type: "string", required: true },
        { path: "emails", type: "string[]", required: true },
        { path: "phones", type: "string[]", normalize: "E164" },
        { path: "location", type: "object", required: false },
        { path: "links", type: "object", required: false },
        { path: "headline", type: "string", required: false },
        { path: "years_experience", type: "number", required: false },
        { path: "skills", type: "object[]", normalize: "canonical" },
        { path: "experience", type: "object[]", required: false },
        { path: "education", type: "object[]", required: false },
        { path: "provenance", type: "object[]", required: true },
        { path: "overall_confidence", type: "number", required: true },
        { path: "github_profile", type: "object", required: false },
        { path: "github_repos", type: "object[]", required: false },
      ],
      include_confidence: true,
      on_missing: "null"
    }
  },
  minimal: {
    name: "Minimal",
    description: "Name, emails, skills, and confidence only",
    config: {
      fields: [
        { path: "candidate_id", type: "string", required: true },
        { path: "full_name", type: "string", required: true },
        { path: "emails", type: "string[]", required: true },
        { path: "skills", type: "object[]", normalize: "canonical" },
        { path: "overall_confidence", type: "number", required: true },
      ],
      include_confidence: false,
      on_missing: "null"
    }
  },
  custom: {
    name: "Custom",
    description: "Editable configuration — modify fields and options",
    config: {
      fields: [
        { path: "full_name", type: "string", required: true },
        { path: "emails", type: "string[]", required: true },
        { path: "phones", type: "string[]", normalize: "E164" },
        { path: "skills", type: "object[]", normalize: "canonical" },
        { path: "experience", type: "object[]", required: false },
        { path: "overall_confidence", type: "number", required: true },
      ],
      include_confidence: true,
      on_missing: "null"
    }
  }
};

// ─── Mock JSON Output (matches canonical schema) ───────────────────────────────

export const mockOutputJSON = mockCandidates;

// ─── Source Metadata ───────────────────────────────────────────────────────────

export const sourceMetadata = {
  recruiter_csv: { label: "Recruiter CSV", color: "#3b82f6", weight: 0.9 },
  github_csv: { label: "GitHub CSV", color: "#a855f7", weight: 0.6 },
  github: { label: "GitHub API", color: "#a855f7", weight: 0.6 },
  resume: { label: "Resume", color: "#14b8a6", weight: 0.7 },
  resumes: { label: "Resume Folder", color: "#14b8a6", weight: 0.7 },
};

// ─── Confidence Formula ────────────────────────────────────────────────────────

export const confidenceFormula = {
  source_weights: { recruiter_csv: 0.9, resume: 0.7, github: 0.6 },
  method_weights: { verbatim: 1.0, regex: 0.8, inferred: 0.6 },
  corroboration_boost: 1.15,
  description: "confidence = SOURCE_WEIGHT[source] × METHOD_WEIGHT[method] × (1.15 if corroborated)"
};
