import { useLocation, NavLink } from 'react-router-dom';
import { ChevronRight, Activity } from 'lucide-react';
import { usePipeline } from '../../context/PipelineContext';

const pageNames = {
  '/': 'Configuration',
  '/upload': 'Upload Sources',
  '/results': 'Pipeline Results',
};

export default function Header() {
  const location = useLocation();
  const { state } = usePipeline();
  const pageName = pageNames[location.pathname] || 'Dashboard';

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: 'var(--header-height)',
      background: 'rgba(6, 6, 15, 0.8)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 var(--space-8)',
      zIndex: 50,
    }}>
      {}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
      }}>
        <span style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--text-muted)',
          fontWeight: 500,
        }}>
          TransformRecruit
        </span>
        <ChevronRight size={14} color="var(--text-muted)" />
        <span style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--text-primary)',
          fontWeight: 600,
        }}>
          {pageName}
        </span>
      </div>

      {}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-1)',
        background: 'rgba(255, 255, 255, 0.02)',
        padding: '3px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
      }}>
        {[
          { path: '/', label: '1. Configuration' },
          { path: '/upload', label: '2. Upload Sources' },
          { path: '/results', label: '3. Results' },
        ].map(tab => {
          const isActive = location.pathname === tab.path;
          
          let isEnabled = true;
          if (tab.path === '/upload') {
            isEnabled = state.configSaved || location.pathname === '/upload' || state.pipeline.status === 'completed';
          } else if (tab.path === '/results') {
            isEnabled = state.pipeline.status === 'completed';
          }

          return (
            <NavLink
              key={tab.path}
              to={isEnabled ? tab.path : '#'}
              onClick={(e) => {
                if (!isEnabled) {
                  e.preventDefault();
                }
              }}
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: isActive ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                border: '1px solid ' + (isActive ? 'rgba(139, 92, 246, 0.2)' : 'transparent'),
                padding: '5px 14px',
                borderRadius: 'var(--radius-sm)',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                opacity: isEnabled ? 1 : 0.4,
                cursor: isEnabled ? 'pointer' : 'not-allowed',
                pointerEvents: isEnabled ? 'auto' : 'none',
              }}
            >
              {tab.label}
            </NavLink>
          );
        })}
      </div>

      {}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-4)',
      }}>
        {}
        {state.pipeline.status === 'running' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-2) var(--space-3)',
            background: 'rgba(139, 92, 246, 0.08)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            borderRadius: 'var(--radius-full)',
          }}>
            <Activity size={14} color="var(--accent-violet)" style={{ animation: 'pulse-glow 1.5s infinite' }} />
            <span style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--accent-violet)',
              fontWeight: 600,
            }}>
              Stage {state.pipeline.currentStage + 1}/7
            </span>
          </div>
        )}

        {state.pipeline.status === 'completed' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-2) var(--space-3)',
            background: 'rgba(34, 197, 94, 0.08)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            borderRadius: 'var(--radius-full)',
          }}>
            <div style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: 'var(--status-success)',
              boxShadow: '0 0 6px rgba(34, 197, 94, 0.4)',
            }} />
            <span style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--status-success)',
              fontWeight: 600,
            }}>
              Complete — {state.pipeline.duration}s
            </span>
          </div>
        )}

        {}
        <div style={{
          display: 'flex',
          gap: 'var(--space-1)',
        }}>
          {['recruiterCsv', 'githubCsv', 'resumeFolder'].map(source => {
            const isUploaded = state.sources[source]?.status === 'uploaded';
            const colors = {
              recruiterCsv: 'var(--source-csv)',
              githubCsv: 'var(--source-github)',
              resumeFolder: 'var(--source-resume)',
            };
            return (
              <div
                key={source}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: isUploaded
                    ? colors[source]
                    : 'rgba(148, 163, 184, 0.2)',
                  transition: 'background 0.3s ease',
                }}
                title={`${source}: ${isUploaded ? 'uploaded' : 'empty'}`}
              />
            );
          })}
        </div>
      </div>
    </header>
  );
}
