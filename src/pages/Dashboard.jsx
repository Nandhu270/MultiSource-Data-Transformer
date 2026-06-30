import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users, TrendingUp, AlertTriangle, BarChart3,
  Upload, Settings, FileOutput, Play, Clock,
  CheckCircle2, AlertCircle, FolderOpen
} from 'lucide-react';
import { usePipeline } from '../context/PipelineContext';
import { pipelineStages, mockPipelineRuns } from '../data/mockData';
import StatCard from '../components/ui/StatCard';
import PipelineStages from '../components/ui/PipelineStages';
import SourceBadge from '../components/ui/SourceBadge';

export default function Dashboard() {
  const navigate = useNavigate();
  const { state } = usePipeline();
  const stats = state.results.stats;

  const quickActions = [
    {
      icon: Upload,
      title: 'Upload Sources',
      description: 'Resume folder + Recruiter CSV + GitHub CSV',
      path: '/upload',
      gradient: 'linear-gradient(135deg, #3b82f6, #6366f1)',
    },
    {
      icon: FileOutput,
      title: 'View Results',
      description: 'See merged profiles and output JSON',
      path: '/results',
      gradient: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
    },
    {
      icon: Settings,
      title: 'Configure Schema',
      description: 'Customize output fields and projections',
      path: '/config',
      gradient: 'linear-gradient(135deg, #14b8a6, #06b6d4)',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      {}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 'var(--space-2)' }}>
          Pipeline <span className="gradient-text">Dashboard</span>
        </h1>
        <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', maxWidth: '600px' }}>
          Monitor candidate profile transformations, track merge conflicts, and measure data quality across all sources.
        </p>
      </motion.div>

      {}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard icon={Users} label="Candidates Processed" value={stats.candidatesProcessed} color="violet" delay={0} trend={12} />
        <StatCard icon={TrendingUp} label="Avg Confidence" value={stats.avgConfidence} color="cyan" delay={1} />
        <StatCard icon={AlertTriangle} label="Conflicts Resolved" value={stats.conflictsResolved} color="blue" delay={2} />
        <StatCard icon={BarChart3} label="Total Runs" value={stats.totalRuns} color="green" delay={3} />
      </div>

      {}
      <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
          <div>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-1)' }}>Pipeline Stages</h2>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>7-stage deterministic transformation pipeline</p>
          </div>
          {state.pipeline.status === 'completed' && (
            <span className="badge badge-success"><CheckCircle2 size={12} /> All stages passed</span>
          )}
        </div>
        <PipelineStages stages={pipelineStages} currentStage={state.pipeline.currentStage} status={state.pipeline.status} />
      </motion.div>

      {}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 'var(--space-6)' }}>
        {}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Quick Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.path}
                  onClick={() => navigate(action.path)}
                  className="glass-card"
                  whileHover={{ scale: 1.01, x: 4 }}
                  whileTap={{ scale: 0.99 }}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.35 + index * 0.08 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-4)', textAlign: 'left', width: '100%', cursor: 'pointer' }}
                >
                  <div style={{
                    width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
                    background: action.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Icon size={20} color="white" />
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{action.title}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>{action.description}</div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Recent Pipeline Runs</h2>
          <div className="glass-card-static" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  {['Sources', 'Candidates', 'Confidence', 'Conflicts', 'Status', 'Duration'].map(h => (
                    <th key={h} style={{
                      padding: 'var(--space-3) var(--space-4)', textAlign: 'left',
                      fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockPipelineRuns.map((run, index) => (
                  <motion.tr key={run.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + index * 0.05 }}
                    style={{ borderBottom: index < mockPipelineRuns.length - 1 ? '1px solid var(--border-subtle)' : 'none', transition: 'background 0.15s ease' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(148, 163, 184, 0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                        {run.sources.map(s => (
                          <SourceBadge key={s} source={s} size="sm" showIcon={false} />
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <FolderOpen size={13} color="var(--text-muted)" />
                        {run.candidatesProcessed}
                      </div>
                    </td>
                    <td style={{
                      padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)',
                      color: run.avgConfidence >= 0.8 ? 'var(--conf-high)' : run.avgConfidence >= 0.6 ? 'var(--conf-medium)' : 'var(--conf-low)',
                    }}>
                      {(run.avgConfidence * 100).toFixed(0)}%
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                      {run.conflictsResolved > 0
                        ? <span style={{ color: 'var(--status-warning)' }}>{run.conflictsResolved}</span>
                        : <span style={{ color: 'var(--text-muted)' }}>0</span>}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <span className={`badge badge-${run.status === 'completed' ? 'success' : 'warning'}`}>
                        {run.status === 'completed'
                          ? <><CheckCircle2 size={10} /> Done</>
                          : <><AlertCircle size={10} /> Warn</>}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      <Clock size={11} style={{ marginRight: '4px', verticalAlign: '-1px' }} /> {run.duration}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
