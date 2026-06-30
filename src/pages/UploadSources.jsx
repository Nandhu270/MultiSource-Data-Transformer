import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet, FileText, Play, FolderOpen,
  ArrowRight, Loader2, CheckCircle2, Upload,
  File, X, FolderUp, Link2
} from 'lucide-react';
import { usePipeline } from '../context/PipelineContext';
import { pipelineStages } from '../data/mockData';
import PipelineStages from '../components/ui/PipelineStages';

export default function UploadSources() {
  const navigate = useNavigate();
  const { state, dispatch, runPipeline } = usePipeline();
  
  const folderInputRef = useRef(null);
  const recruiterCsvRef = useRef(null);
  const githubCsvRef = useRef(null);

  // ─── 1. Resume Folder Upload ─────────────────────────────────────────
  const handleFolderUpload = (e) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    const resumeFiles = files.filter(f =>
      f.name.toLowerCase().endsWith('.pdf') || f.name.toLowerCase().endsWith('.docx')
    );

    const firstPath = files[0].webkitRelativePath || files[0].name;
    const folderName = firstPath.split('/')[0] || 'resumes';

    dispatch({
      type: 'SET_RESUME_FOLDER',
      payload: {
        files: resumeFiles,
        folderName,
        fileCount: resumeFiles.length
      }
    });
  };

  // ─── 2. Recruiter CSV Upload ─────────────────────────────────────────
  const handleRecruiterCsv = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      dispatch({ type: 'SET_RECRUITER_CSV', payload: { file, filename: file.name } });
    }
  };

  // ─── 3. GitHub CSV Upload ────────────────────────────────────────────
  const handleGithubCsv = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      dispatch({ type: 'SET_GITHUB_CSV', payload: { file, filename: file.name } });
    }
  };

  const handleRunPipeline = () => {
    runPipeline();
    setTimeout(() => navigate('/results'), 3500);
  };

  const sources = state.sources;
  const allUploaded =
    sources.recruiterCsv.status === 'uploaded' &&
    sources.githubCsv.status === 'uploaded' &&
    sources.resumeFolder.status === 'uploaded';

  const sourceCount = [
    sources.recruiterCsv.status === 'uploaded',
    sources.githubCsv.status === 'uploaded',
    sources.resumeFolder.status === 'uploaded',
  ].filter(Boolean).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      {/* Hidden file inputs */}
      <input ref={folderInputRef} type="file" webkitdirectory="" directory="" multiple onChange={handleFolderUpload} style={{ display: 'none' }} />
      <input ref={recruiterCsvRef} type="file" accept=".csv" onChange={handleRecruiterCsv} style={{ display: 'none' }} />
      <input ref={githubCsvRef} type="file" accept=".csv" onChange={handleGithubCsv} style={{ display: 'none' }} />

      {/* Page header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 'var(--space-2)' }}>
          Upload <span className="gradient-text">Sources</span>
        </h1>
        <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', maxWidth: '750px' }}>
          Upload the 3 required inputs: Resume Folder, Recruiter CSV, and GitHub CSV.
          The transformer will merge the profiles according to the schema configured in the Configuration tab.
        </p>
      </motion.div>

      {/* ═══ GRIDS ═══ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 'var(--space-6)',
      }}>

        {/* 1. Resume Folder */}
        <div className="glass-card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '300px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, #14b8a6, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FolderOpen size={18} color="white" />
              </div>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>Resume Folder</span>
              {sources.resumeFolder.status === 'uploaded' && <CheckCircle2 size={16} color="var(--status-success)" style={{ marginLeft: 'auto' }} />}
            </div>
            {sources.resumeFolder.status === 'uploaded' ? (
              <div style={{ background: 'rgba(34, 197, 94, 0.04)', border: '1px solid rgba(34, 197, 94, 0.2)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', textAlign: 'center', position: 'relative' }}>
                <FolderUp size={22} color="var(--status-success)" style={{ marginBottom: '4px' }} />
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>{sources.resumeFolder.folderName}/</div>
                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--status-success)', marginTop: '2px' }}>{sources.resumeFolder.fileCount} Files</div>
                <button onClick={() => dispatch({ type: 'CLEAR_SOURCE', payload: 'resumeFolder' })} style={{ position: 'absolute', top: '4px', right: '4px', color: 'var(--text-muted)' }}><X size={12} /></button>
              </div>
            ) : (
              <div onClick={() => folderInputRef.current?.click()} style={{ border: '2px dashed var(--border-default)', borderRadius: 'var(--radius-md)', padding: 'var(--space-6)', textAlign: 'center', cursor: 'pointer' }}>
                <FolderUp size={22} color="var(--text-muted)" style={{ marginBottom: '4px' }} />
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)' }}>Select folder</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>PDF/DOCX folder</div>
              </div>
            )}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
            Weight: 0.7 • Extracts skills, experience & education timeline
          </div>
        </div>

        {/* 2. Recruiter CSV */}
        <div className="glass-card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '300px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileSpreadsheet size={18} color="white" />
              </div>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>Recruiter CSV</span>
              {sources.recruiterCsv.status === 'uploaded' && <CheckCircle2 size={16} color="var(--status-success)" style={{ marginLeft: 'auto' }} />}
            </div>
            {sources.recruiterCsv.status === 'uploaded' ? (
              <div style={{ background: 'rgba(34, 197, 94, 0.04)', border: '1px solid rgba(34, 197, 94, 0.2)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', textAlign: 'center', position: 'relative' }}>
                <FileSpreadsheet size={22} color="var(--status-success)" style={{ marginBottom: '4px' }} />
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{sources.recruiterCsv.filename}</div>
                <button onClick={() => dispatch({ type: 'CLEAR_SOURCE', payload: 'recruiterCsv' })} style={{ position: 'absolute', top: '4px', right: '4px', color: 'var(--text-muted)' }}><X size={12} /></button>
              </div>
            ) : (
              <div onClick={() => recruiterCsvRef.current?.click()} style={{ border: '2px dashed var(--border-default)', borderRadius: 'var(--radius-md)', padding: 'var(--space-6)', textAlign: 'center', cursor: 'pointer' }}>
                <Upload size={22} color="var(--text-muted)" style={{ marginBottom: '4px' }} />
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)' }}>Select CSV</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Demographics master</div>
              </div>
            )}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
            Weight: 0.9 • Key joins & primary details authority
          </div>
        </div>

        {/* 3. GitHub CSV */}
        <div className="glass-card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '300px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, #a855f7, #c084fc)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Link2 size={18} color="white" />
              </div>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>GitHub CSV</span>
              {sources.githubCsv.status === 'uploaded' && <CheckCircle2 size={16} color="var(--status-success)" style={{ marginLeft: 'auto' }} />}
            </div>
            {sources.githubCsv.status === 'uploaded' ? (
              <div style={{ background: 'rgba(34, 197, 94, 0.04)', border: '1px solid rgba(34, 197, 94, 0.2)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', textAlign: 'center', position: 'relative' }}>
                <Link2 size={22} color="var(--status-success)" style={{ marginBottom: '4px' }} />
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{sources.githubCsv.filename}</div>
                <button onClick={() => dispatch({ type: 'CLEAR_SOURCE', payload: 'githubCsv' })} style={{ position: 'absolute', top: '4px', right: '4px', color: 'var(--text-muted)' }}><X size={12} /></button>
              </div>
            ) : (
              <div onClick={() => githubCsvRef.current?.click()} style={{ border: '2px dashed var(--border-default)', borderRadius: 'var(--radius-md)', padding: 'var(--space-6)', textAlign: 'center', cursor: 'pointer' }}>
                <Upload size={22} color="var(--text-muted)" style={{ marginBottom: '4px' }} />
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)' }}>Select CSV</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>GitHub profile links</div>
              </div>
            )}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
            Weight: 0.6 • Syncs and pulls tech signal from GitHub
          </div>
        </div>

      </div>

      {/* Pipeline execution status */}
      {state.pipeline.status === 'running' && (
        <motion.div className="glass-card" style={{ padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
            <Loader2 size={20} color="var(--accent-violet)" style={{ animation: 'spin 1s linear infinite' }} />
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Pipeline Running...</h2>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-violet)', fontFamily: 'var(--font-mono)', marginLeft: 'auto' }}>
              Stage {Math.min(state.pipeline.currentStage + 1, 7)} / 7
            </span>
          </div>
          <PipelineStages stages={pipelineStages} currentStage={state.pipeline.currentStage} status={state.pipeline.status} />
        </motion.div>
      )}

      {/* Execution panel */}
      <motion.div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--space-6)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
      }}>
        <div>
          <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
            {allUploaded ? 'All 3 inputs successfully uploaded' : `${sourceCount}/3 inputs ready`}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            {allUploaded ? 'Ready to run the profile transformer pipeline' : 'Upload all 3 sources (Resume Folder, Recruiter CSV, GitHub CSV)'}
          </div>
        </div>
        <button
          onClick={handleRunPipeline}
          disabled={!allUploaded || state.pipeline.status === 'running'}
          className="btn-primary"
          style={{ padding: 'var(--space-4) var(--space-8)', fontSize: 'var(--text-base)' }}
        >
          {state.pipeline.status === 'running' ? (
            <>
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              Processing...
            </>
          ) : (
            <>
              <Play size={18} />
              Run Pipeline
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}
