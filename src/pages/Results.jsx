import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, Building2, Briefcase, MapPin,
  Code2, Award, Info, Download, ExternalLink,
  Link2, GraduationCap, Calendar, Clock, Globe,
  Shield, Hash, CheckCircle2, ChevronRight, Check,
  Play, Upload
} from 'lucide-react';
import GithubIcon from '../components/icons/GithubIcon';
import { usePipeline } from '../context/PipelineContext';
import { mockCandidates, mockConflicts, mockOutputJSON } from '../data/mockData';
import SourceBadge from '../components/ui/SourceBadge';
import ConfidenceBadge from '../components/ui/ConfidenceBadge';
import SkillCloud from '../components/ui/SkillCloud';
import ExperienceTimeline from '../components/ui/ExperienceTimeline';
import ConflictLog from '../components/ui/ConflictLog';

export default function Results() {
  const navigate = useNavigate();
  const { state, dispatch } = usePipeline();

  // Multi-candidate setup
  const hasResults = state.pipeline.status === 'completed';
  const candidates = hasResults ? state.results.candidates : [];
  const selectedCandidate = state.results.selectedCandidate || candidates[0];
  const conflicts = hasResults ? state.results.conflicts : [];
  const outputJSON = hasResults ? state.results.outputJSON : null;

  // Safe unwrap utility for wrapped object values (when include_confidence is active)
  const unwrap = (val) => {
    if (val && typeof val === 'object' && 'value' in val && 'source' in val) {
      return val.value;
    }
    return val;
  };

  // Safe ID parsing helper for wrapped/plain formats
  const getCid = (c) => {
    if (!c) return '';
    const raw = c.candidate_id;
    return typeof raw === 'object' && raw !== null && 'value' in raw ? raw.value : raw;
  };

  // Safe location formatter to avoid double commas or empty parts
  const getFormattedLocation = (locObj) => {
    const loc = unwrap(locObj);
    if (!loc) return 'No location mentioned';
    const parts = [
      unwrap(loc.city),
      unwrap(loc.region),
      unwrap(loc.country)
    ].map(p => p ? String(p).strip ? String(p).trim() : p : '').filter(p => p && p.toLowerCase() !== 'nan');
    return parts.join(', ') || 'No location mentioned';
  };

  // Resolve complete profile details matching selected candidate ID
  const completeCandidate = (state.results.completeCandidates || []).find(
    c => getCid(c) === getCid(selectedCandidate)
  ) || selectedCandidate;

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(outputJSON, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pipeline_candidates_output.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!hasResults) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-12) var(--space-6)',
        textAlign: 'center',
        minHeight: '60vh',
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px dashed var(--border-default)',
        gap: 'var(--space-4)',
        marginTop: 'var(--space-8)'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.1))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent-violet)',
          marginBottom: 'var(--space-2)'
        }}>
          <Upload size={36} />
        </div>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>No Pipeline Data</h2>
        <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', maxWidth: '450px', marginBottom: 'var(--space-4)' }}>
          Please upload your Recruiter CSV, GitHub CSV, and Candidate Resumes to run the transformer pipeline.
        </p>
        <button onClick={() => navigate('/')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Play size={16} />
          Upload Files and Run
        </button>
      </div>
    );
  }

  if (hasResults && candidates.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-12) var(--space-6)',
        textAlign: 'center',
        minHeight: '60vh',
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px dashed var(--border-default)',
        gap: 'var(--space-4)',
        marginTop: 'var(--space-8)'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(245, 158, 11, 0.1))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--status-error)',
          marginBottom: 'var(--space-2)'
        }}>
          <Info size={36} color="var(--status-error)" />
        </div>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>No Candidates Processed</h2>
        <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', maxWidth: '450px', marginBottom: 'var(--space-4)' }}>
          The pipeline completed successfully, but no candidate profiles could be merged. Please verify that the names or emails in your Recruiter CSV match those in your Resumes or GitHub CSV.
        </p>
        <button onClick={() => navigate('/')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Play size={16} />
          Upload Files and Try Again
        </button>
      </div>
    );
  }

  const handleSelectCandidate = (candidate) => {
    dispatch({ type: 'SELECT_CANDIDATE', payload: candidate });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}
      >
        <div>
          <h1 style={{
            fontSize: 'var(--text-3xl)',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            marginBottom: 'var(--space-2)',
          }}>
            Pipeline <span className="gradient-text">Results</span>
          </h1>
          <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', maxWidth: '600px' }}>
            {hasResults
              ? `Successfully processed ${candidates.length} candidates according to config schema projection.`
              : 'Showing demo candidates. Upload sources and run the pipeline for live results.'}
          </p>
        </div>
        <button onClick={handleDownload} className="btn-primary">
          <Download size={16} />
          Download JSON
        </button>
      </motion.div>

      {/* Info banner */}
      {!hasResults && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{
          padding: 'var(--space-4)',
          background: 'rgba(139, 92, 246, 0.06)',
          border: '1px solid rgba(139, 92, 246, 0.15)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)',
        }}>
          <Info size={18} color="var(--accent-violet)" />
          <span>
            Displaying mock candidate outputs for preview.{' '}
            <button onClick={() => navigate('/')} style={{
              color: 'var(--accent-violet)', fontWeight: 600, textDecoration: 'underline',
            }}>Upload sources</button> to process new profile files.
          </span>
        </motion.div>
      )}

      {/* Candidates Scrollable Master Table */}
      <motion.div
        className="glass-card-static"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ overflow: 'hidden' }}
      >
        <div style={{
          padding: 'var(--space-4) var(--space-6)',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(148, 163, 184, 0.02)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700 }}>Candidate Profiles (Scrollable List)</h2>
          <span className="badge badge-success">
            <CheckCircle2 size={12} /> schema valid
          </span>
        </div>

        {/* Scrollable table container */}
        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-surface)', zIndex: 10, boxShadow: '0 1px 0 var(--border-subtle)' }}>
              <tr>
                <th style={{ padding: 'var(--space-3) var(--space-6)', width: '40px', background: 'var(--bg-surface)' }}></th>
                {['Candidate ID', 'Full Name', 'Email ID', 'Phone', 'Overall Confidence'].map(h => (
                  <th key={h} style={{
                    padding: 'var(--space-3) var(--space-4)',
                    textAlign: 'left',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    background: 'var(--bg-surface)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {candidates.map((c) => {
                const isSelected = getCid(selectedCandidate) === getCid(c);

                const getFieldVal = (obj, key) => {
                  if (!obj || !obj[key]) return '—';
                  const raw = obj[key];
                  return typeof raw === 'object' && raw !== null && 'value' in raw ? raw.value : raw;
                };

                const candidateName = getFieldVal(c, 'full_name');
                const candidateEmails = unwrap(c.emails) || [getFieldVal(c, 'primary_email')];
                const candidatePhones = unwrap(c.phones) || [getFieldVal(c, 'phone')];
                const candidateConf = getFieldVal(c, 'overall_confidence') || 0.75;

                return (
                  <tr
                    key={getCid(c)}
                    onClick={() => handleSelectCandidate(c)}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(139, 92, 246, 0.06)' : 'transparent',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.background = 'rgba(148, 163, 184, 0.02)';
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <td style={{ padding: 'var(--space-3) var(--space-6)', textAlign: 'center' }}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        border: `2px solid ${isSelected ? 'var(--accent-violet)' : 'var(--border-default)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {isSelected && (
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: 'var(--accent-violet)',
                          }} />
                        )}
                      </div>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                      {getCid(c)?.substring(0, 8)}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {candidateName}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--text-secondary)' }}>
                      {Array.isArray(candidateEmails) ? candidateEmails.join(', ') : candidateEmails}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                      {Array.isArray(candidatePhones) ? candidatePhones.join(', ') : candidatePhones}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <ConfidenceBadge confidence={candidateConf} size="sm" showLabel={false} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Detailed View Container (Shows complete fields + conflicts) */}
      {completeCandidate && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--space-6)',
          }}>
            {/* Left Column: Core Fields, Edu, Provenance */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              {/* Profile card */}
              <div className="glass-card-static" style={{ overflow: 'hidden' }}>
                <div style={{
                  padding: 'var(--space-6)',
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(6, 182, 212, 0.05))',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-4)',
                }}>
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '50%',
                    background: 'var(--gradient-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'white', flexShrink: 0,
                  }}>
                    {unwrap(completeCandidate.full_name)?.split(' ').map(n => n[0]).join('') || 'C'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>{unwrap(completeCandidate.full_name)}</h2>
                    {unwrap(completeCandidate.headline) && (
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {unwrap(completeCandidate.headline)}
                      </div>
                    )}
                    {unwrap(completeCandidate.github_profile)?.bio && (
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '4px' }}>
                        "{unwrap(completeCandidate.github_profile).bio}"
                      </div>
                    )}
                    <div style={{ marginTop: 'var(--space-2)' }}>
                      <ConfidenceBadge confidence={unwrap(completeCandidate.overall_confidence) || 0.75} size="md" />
                    </div>
                  </div>
                </div>

                {/* Core parameters */}
                <FieldRow icon={Mail} label="Email list" value={unwrap(completeCandidate.emails)?.join(', ')} />
                <FieldRow icon={Phone} label="Phone numbers" value={unwrap(completeCandidate.phones)?.join(', ')} />
                <FieldRow icon={MapPin} label="Location coordinates" value={getFormattedLocation(completeCandidate.location)} />
                <FieldRow icon={Clock} label="Total Experience" value={
                  unwrap(completeCandidate.years_experience) ? `${unwrap(completeCandidate.years_experience)} years` : 'N/A'
                } />

                {/* Portfolio/Links */}
                {unwrap(completeCandidate.links) && (
                  <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                      <Link2 size={16} color="var(--text-muted)" />
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Links</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginLeft: 'calc(16px + var(--space-3))' }}>
                      {unwrap(completeCandidate.links).linkedin && (
                        <a href={unwrap(completeCandidate.links).linkedin} target="_blank" rel="noopener noreferrer" style={{
                          fontSize: 'var(--text-xs)', color: 'var(--accent-blue)',
                          background: 'rgba(59, 130, 246, 0.08)', padding: '3px 10px', borderRadius: 'var(--radius-full)',
                          display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(59, 130, 246, 0.2)',
                        }}><ExternalLink size={10} /> LinkedIn</a>
                      )}
                      {unwrap(completeCandidate.links).github && (
                        <a href={unwrap(completeCandidate.links).github} target="_blank" rel="noopener noreferrer" style={{
                          fontSize: 'var(--text-xs)', color: 'var(--accent-purple)',
                          background: 'rgba(168, 85, 247, 0.08)', padding: '3px 10px', borderRadius: 'var(--radius-full)',
                          display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(168, 85, 247, 0.2)',
                        }}><GithubIcon size={10} /> GitHub</a>
                      )}
                      {unwrap(completeCandidate.links).portfolio && (
                        <a href={unwrap(completeCandidate.links).portfolio} target="_blank" rel="noopener noreferrer" style={{
                          fontSize: 'var(--text-xs)', color: 'var(--accent-teal)',
                          background: 'rgba(20, 184, 166, 0.08)', padding: '3px 10px', borderRadius: 'var(--radius-full)',
                          display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(20, 184, 166, 0.2)',
                        }}><Globe size={10} /> Portfolio</a>
                      )}
                    </div>
                  </div>
                )}

                {/* ID */}
                <div style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', background: 'rgba(148, 163, 184, 0.03)' }}>
                  <Hash size={11} style={{ verticalAlign: '-1px', marginRight: '4px' }} />
                  candidate_id: {getCid(completeCandidate)}
                </div>
              </div>

              {/* Education */}
              {unwrap(completeCandidate.education) && (
                <div className="glass-card-static" style={{ padding: 'var(--space-6)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                    <GraduationCap size={18} color="var(--accent-blue)" />
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700 }}>Education Details</h3>
                  </div>
                  {unwrap(completeCandidate.education).map((edu, i) => (
                    <div key={i} style={{
                      padding: 'var(--space-3)',
                      background: 'rgba(59, 130, 246, 0.04)',
                      border: '1px solid rgba(59, 130, 246, 0.1)',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: i < unwrap(completeCandidate.education).length - 1 ? 'var(--space-2)' : 0,
                    }}>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{unwrap(edu.degree || edu).degree || edu.degree} in {unwrap(edu.field || edu).field || edu.field}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '2px' }}>{unwrap(edu.institution || edu).institution || edu.institution}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>Year: {unwrap(edu.end_year || edu).end_year || edu.end_year}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Provenance */}
              {unwrap(completeCandidate.provenance) && (
                <div className="glass-card-static" style={{ padding: 'var(--space-6)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                    <Shield size={18} color="var(--accent-violet)" />
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700 }}>Field Provenance</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {unwrap(completeCandidate.provenance).map((p, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                        padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--text-xs)', transition: 'background 0.15s ease',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(148, 163, 184, 0.04)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-violet)', minWidth: '120px' }}>{unwrap(p.field || p).field || p.field}</span>
                        <SourceBadge source={unwrap(p.source || p).source || p.source} size="sm" />
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', background: 'rgba(148, 163, 184, 0.06)', padding: '1px 6px', borderRadius: 'var(--radius-sm)' }}>{unwrap(p.method || p).method || p.method}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Skills & Experience */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              {/* Skills cloud */}
              {unwrap(completeCandidate.skills) && (
                <div className="glass-card-static" style={{ padding: 'var(--space-6)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                    <Code2 size={18} color="var(--accent-violet)" />
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700 }}>Skills Inventory</h3>
                  </div>
                  <SkillCloud skills={unwrap(completeCandidate.skills).map(s => {
                    const unwrappedSkill = unwrap(s);
                    return {
                      value: unwrappedSkill.name || unwrappedSkill,
                      sources: (unwrappedSkill.sources || ['resume']).map(src => src === 'recruiter_csv' ? 'csv' : src === 'github_csv' ? 'github' : src),
                      confidence: unwrappedSkill.confidence || 0.7,
                    };
                  })} />
                </div>
              )}

              {/* Experience */}
              {unwrap(completeCandidate.experience) && (
                <div className="glass-card-static" style={{ padding: 'var(--space-6)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
                    <Award size={18} color="var(--accent-cyan)" />
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700 }}>Work Experience</h3>
                  </div>
                  <ExperienceTimeline experiences={unwrap(completeCandidate.experience).map(exp => {
                    const unwrappedExp = unwrap(exp);
                    return {
                      title: unwrappedExp.title || 'Developer',
                      company: unwrappedExp.company || 'Company',
                      start_date: unwrappedExp.start || '2020-01',
                      end_date: unwrappedExp.end,
                      source: 'resume',
                      confidence: 0.7,
                    };
                  })} />
                </div>
              )}

              {/* GitHub Repositories */}
              {unwrap(completeCandidate.github_repos) && unwrap(completeCandidate.github_repos).length > 0 && (
                <div className="glass-card-static" style={{ padding: 'var(--space-6)', marginTop: 'var(--space-6)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                    <GithubIcon size={18} color="var(--accent-purple)" />
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700 }}>GitHub Repositories</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    {unwrap(completeCandidate.github_repos).map((repo, i) => (
                      <div key={i} style={{
                        padding: 'var(--space-3)',
                        background: 'rgba(168, 85, 247, 0.03)',
                        border: '1px solid rgba(168, 85, 247, 0.1)',
                        borderRadius: 'var(--radius-md)',
                      }}>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {repo.name}
                        </div>
                        {repo.description && (
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            {repo.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Merge Conflicts Resolved Section */}
          {conflicts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Info size={18} color="var(--status-warning)" />
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700 }}>Merge Conflicts Resolved</h3>
                <span className="badge badge-warning" style={{ fontSize: '10px' }}>{conflicts.length} resolved</span>
              </div>
              <ConflictLog conflicts={conflicts} />
            </motion.div>
          )}
        </div>
      )}

    </div>
  );
}

// ─── Helper: Field Row ─────────────────────────────────────────────────────────

function FieldRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div style={{
      padding: 'var(--space-3) var(--space-4)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      transition: 'background 0.15s ease',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(148, 163, 184, 0.03)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <Icon size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1px' }}>
          {label}
        </div>
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>
          {value}
        </div>
      </div>
    </div>
  );
}
