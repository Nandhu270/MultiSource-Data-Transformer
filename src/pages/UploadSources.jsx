import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Upload, FileText, CheckCircle2, AlertCircle,
  FolderOpen, FolderUp, Link2, X, Play, ArrowRight,
  Loader2, Cpu, Database, GitBranch, Activity, Settings,
  FileSpreadsheet, File
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

  const [pipelineResult, setPipelineResult] = useState(null);
  const [jobDescription, setJobDescription] = useState('');

  
  useEffect(() => {
    if (!state.configSaved && state.pipeline.status !== 'completed') {
      navigate('/');
    }
  }, [state.configSaved, state.pipeline.status, navigate]);

  
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

  
  const handleRecruiterCsv = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      dispatch({ type: 'SET_RECRUITER_CSV', payload: { file, filename: file.name } });
    }
  };

  
  const handleGithubCsv = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      dispatch({ type: 'SET_GITHUB_CSV', payload: { file, filename: file.name } });
    }
  };

  const handleRunPipeline = async () => {
    dispatch({ type: 'START_PIPELINE' });
    setPipelineResult(null);
    const startTime = Date.now();

    try {
      const formData = new FormData();
      
      if (sources.recruiterCsv.file) {
        formData.append('recruiter_csv', sources.recruiterCsv.file);
      }
      if (sources.githubCsv.file) {
        formData.append('github_csv', sources.githubCsv.file);
      }
      
      sources.resumeFolder.files.forEach(file => {
        formData.append('resumes', file);
      });

      formData.append('config_json', JSON.stringify(state.customConfig));
      if (jobDescription) {
        formData.append('job_description', jobDescription);
      }

      const response = await fetch('http://localhost:8000/api/run_pipeline', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errText = await response.text();
        let errMsg = 'Failed to run pipeline';
        try {
          const errData = JSON.parse(errText);
          errMsg = errData.detail || errMsg;
        } catch(e) {}
        throw new Error(errMsg);
      }

      const result = await response.json();
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      
      setPipelineResult({
        candidates: result.candidates,
        completeCandidates: result.complete_candidates,
        conflicts: result.conflicts,
        duration
      });

    } catch (err) {
      dispatch({ type: 'RESET_PIPELINE' });
      alert(`Error running pipeline: ${err.message}`);
    }
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

  if (state.pipeline.status === 'running') {
    return (
      <PipelineProcessing 
        sources={sources} 
        pipelineResult={pipelineResult}
        onAnimationComplete={(payload) => {
          dispatch({
            type: 'COMPLETE_PIPELINE_LIVE',
            payload
          });
          navigate('/results');
          setPipelineResult(null);
        }}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      {}
      <input ref={folderInputRef} type="file" webkitdirectory="" directory="" multiple onChange={handleFolderUpload} style={{ display: 'none' }} />
      <input ref={recruiterCsvRef} type="file" accept=".csv" onChange={handleRecruiterCsv} style={{ display: 'none' }} />
      <input ref={githubCsvRef} type="file" accept=".csv" onChange={handleGithubCsv} style={{ display: 'none' }} />

      {}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 'var(--space-2)' }}>
          Upload <span className="gradient-text">Sources</span>
        </h1>
        <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', maxWidth: '750px' }}>
          Upload the 3 required inputs: Resume Folder, Recruiter CSV, and GitHub CSV.
          The transformer will merge the profiles according to the schema configured in the Configuration tab.
        </p>
      </motion.div>

      {}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 'var(--space-6)',
      }}>

        {}
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

        {}
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

        {}
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

      {}
      <motion.div className="glass-card" style={{ padding: 'var(--space-6)' }}>
        <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
          Job Description (Optional)
        </h3>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>
          Paste the Job Description to automatically calculate the Dice-Sørensen candidate matching score.
        </p>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste Job Description here (e.g. 'Looking for a Senior Python Developer with React and SQL experience...')"
          style={{
            width: '100%',
            height: '100px',
            background: 'rgba(255, 255, 255, 0.01)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-primary)',
            resize: 'vertical',
          }}
        />
      </motion.div>

      {}
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

const stages = [
  { title: 'Initializing Data', desc: 'Reading recruiter and GitHub CSV files...' },
  { title: 'Loading Resumes', desc: 'Loading candidate resumes from folder...' },
  { title: 'Extracting Skills', desc: 'Extracting skills and timelines using LLM parser...' },
  { title: 'Fetching GitHub Data', desc: 'Scanning and downloading repository statistics...' },
  { title: 'Aligning Profiles', desc: 'Running fuzzy match and resolving merge conflicts...' },
  { title: 'Calculating Scores', desc: 'Computing Jaccard similarity and tech weights...' },
  { title: 'Projecting Schema', desc: 'Formatting output profiles to your custom configuration...' },
];

function PipelineProcessing({ sources, pipelineResult, onAnimationComplete }) {
  const [progress, setProgress] = useState(0);

  
  const stageIndex = Math.min(6, Math.floor((progress / 100) * 7));
  const currentStage = stages[stageIndex];

  
  useEffect(() => {
    let animId;
    const updateProgress = () => {
      setProgress((prev) => {
        if (pipelineResult) {
          
          if (prev >= 100) {
            cancelAnimationFrame(animId);
            return 100;
          }
          return Math.min(100, prev + 3);
        } else {
          
          if (prev >= 95) {
            return 95;
          }
          return prev + (95 - prev) * 0.02;
        }
      });
      animId = requestAnimationFrame(updateProgress);
    };
    animId = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(animId);
  }, [pipelineResult]);

  
  useEffect(() => {
    if (progress >= 100 && pipelineResult) {
      const timeout = setTimeout(() => {
        onAnimationComplete(pipelineResult);
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [progress, pipelineResult, onAnimationComplete]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: 'var(--space-6)',
      textAlign: 'center',
    }}>
      {}
      <div className="glass-card-static" style={{
        width: '100%',
        maxWidth: '400px',
        padding: 'var(--space-8)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-5)',
      }}>
        {}
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          border: '3px solid rgba(139, 92, 246, 0.1)',
          borderTopColor: 'var(--accent-purple)',
          animation: 'spin 1s linear infinite',
        }} />

        {}
        <div>
          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            {progress >= 100 ? 'Processing Complete' : 'Processing Profiles...'}
          </h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            {progress >= 100 ? 'Redirecting to results...' : `Stage ${stageIndex + 1}/7: ${currentStage.title}`}
          </p>
        </div>

        {}
        <div style={{ width: '100%' }}>
          <div style={{ width: '100%', height: '4px', background: 'rgba(148, 163, 184, 0.1)', borderRadius: '2px', overflow: 'hidden', marginBottom: '6px' }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: 'var(--gradient-primary)',
              transition: 'width 0.1s ease-out',
            }} />
          </div>
          <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {Math.round(progress)}%
          </div>
        </div>
      </div>
    </div>
  );
}
