import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Upload, FileOutput, Settings,
  ChevronLeft, ChevronRight, Zap, Activity
} from 'lucide-react';
import { usePipeline } from '../../context/PipelineContext';

const navItems = [
  { path: '/', icon: Upload, label: 'Upload Sources' },
  { path: '/results', icon: FileOutput, label: 'Results' },
  { path: '/config', icon: Settings, label: 'Configuration' },
];

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const { state } = usePipeline();

  const pipelineStatus = state.pipeline.status;

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        background: 'rgba(12, 12, 29, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div style={{
        padding: collapsed ? 'var(--space-5) var(--space-4)' : 'var(--space-5) var(--space-6)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        minHeight: '64px',
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--gradient-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)',
        }}>
          <Zap size={20} color="white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              <div style={{
                fontSize: 'var(--text-base)',
                fontWeight: 700,
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
              }}>
                <span className="gradient-text">Eightfold</span>
              </div>
              <div style={{
                fontSize: '10px',
                color: 'var(--text-muted)',
                fontWeight: 500,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}>
                Profile Transformer
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav style={{
        flex: 1,
        padding: 'var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-1)',
      }}>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: collapsed ? 'var(--space-3)' : 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: isActive ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                border: isActive ? '1px solid rgba(139, 92, 246, 0.2)' : '1px solid transparent',
                transition: 'all 0.2s ease',
                textDecoration: 'none',
                justifyContent: collapsed ? 'center' : 'flex-start',
                position: 'relative',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(148, 163, 184, 0.06)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  style={{
                    position: 'absolute',
                    left: '-4px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '3px',
                    height: '20px',
                    borderRadius: '2px',
                    background: 'var(--gradient-primary)',
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon size={20} style={{ flexShrink: 0 }} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: isActive ? 600 : 500,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          );
        })}
      </nav>

      {/* Pipeline status */}
      <div style={{
        padding: 'var(--space-4)',
        borderTop: '1px solid var(--border-subtle)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          padding: 'var(--space-3)',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(148, 163, 184, 0.04)',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: pipelineStatus === 'completed'
              ? 'var(--status-success)'
              : pipelineStatus === 'running'
              ? 'var(--accent-violet)'
              : 'var(--text-muted)',
            boxShadow: pipelineStatus === 'running'
              ? '0 0 8px rgba(139, 92, 246, 0.5)'
              : pipelineStatus === 'completed'
              ? '0 0 8px rgba(34, 197, 94, 0.3)'
              : 'none',
            animation: pipelineStatus === 'running' ? 'pulse-glow 2s infinite' : 'none',
            flexShrink: 0,
          }} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-muted)',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                }}
              >
                {pipelineStatus === 'completed'
                  ? 'Pipeline complete'
                  : pipelineStatus === 'running'
                  ? 'Pipeline running…'
                  : 'Pipeline idle'}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        style={{
          position: 'absolute',
          right: '-12px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'var(--bg-card-hover)';
          e.currentTarget.style.borderColor = 'var(--accent-violet)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'var(--bg-elevated)';
          e.currentTarget.style.borderColor = 'var(--border-default)';
        }}
      >
        {collapsed
          ? <ChevronRight size={14} color="var(--text-secondary)" />
          : <ChevronLeft size={14} color="var(--text-secondary)" />
        }
      </button>
    </motion.aside>
  );
}
