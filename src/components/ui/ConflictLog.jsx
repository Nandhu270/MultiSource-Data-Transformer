import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ChevronDown, ChevronRight, ArrowRight } from 'lucide-react';
import SourceBadge from './SourceBadge';
import ConfidenceBadge from './ConfidenceBadge';

export default function ConflictLog({ conflicts }) {
  const [expandedId, setExpandedId] = useState(null);

  if (!conflicts || conflicts.length === 0) {
    return (
      <div style={{
        padding: 'var(--space-8)',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: 'var(--text-sm)',
      }}>
        No conflicts detected — all sources agree ✓
      </div>
    );
  }

  const formatValue = (val) => {
    if (val === null || val === undefined) return '—';
    if (typeof val === 'object') {
      return JSON.stringify(val);
    }
    return String(val);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {conflicts.map((conflict) => {
        const isExpanded = expandedId === conflict.id;

        return (
          <div key={conflict.id} className="glass-card-static" style={{
            overflow: 'hidden',
            transition: 'border-color 0.2s ease',
            borderColor: isExpanded ? 'rgba(245, 158, 11, 0.2)' : undefined,
          }}>
            {}
            <button
              onClick={() => setExpandedId(isExpanded ? null : conflict.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-4)',
                textAlign: 'left',
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(245, 158, 11, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <AlertTriangle size={16} color="var(--status-warning)" />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--accent-violet)',
                    fontSize: 'var(--text-xs)',
                  }}>
                    {conflict.field}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>—</span>
                  <SourceBadge source={conflict.winner.source} size="sm" />
                  <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>wins</span>
                </div>
              </div>

              {isExpanded
                ? <ChevronDown size={16} color="var(--text-muted)" />
                : <ChevronRight size={16} color="var(--text-muted)" />
              }
            </button>

            {}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{
                    padding: '0 var(--space-4) var(--space-4)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-3)',
                  }}>
                    {}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-3)',
                      padding: 'var(--space-3)',
                      background: 'rgba(148, 163, 184, 0.03)',
                      borderRadius: 'var(--radius-md)',
                    }}>
                      {}
                      <div style={{
                        flex: 1,
                        padding: 'var(--space-3)',
                        background: 'rgba(239, 68, 68, 0.05)',
                        border: '1px solid rgba(239, 68, 68, 0.15)',
                        borderRadius: 'var(--radius-sm)',
                        minWidth: 0,
                      }}>
                        <div style={{
                          fontSize: '10px',
                          color: 'var(--text-muted)',
                          marginBottom: 'var(--space-1)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}>
                          Rejected
                        </div>
                        <div style={{
                          fontSize: 'var(--text-sm)',
                          fontWeight: 500,
                          color: 'var(--text-secondary)',
                          textDecoration: 'line-through',
                          opacity: 0.7,
                          wordBreak: 'break-all',
                        }}>
                          {formatValue(conflict.loser.value)}
                        </div>
                        <div style={{ marginTop: 'var(--space-1)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <SourceBadge source={conflict.loser.source} size="sm" />
                          <ConfidenceBadge confidence={conflict.loser.confidence} size="sm" showLabel={false} />
                        </div>
                      </div>

                      <ArrowRight size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />

                      {}
                      <div style={{
                        flex: 1,
                        padding: 'var(--space-3)',
                        background: 'rgba(34, 197, 94, 0.05)',
                        border: '1px solid rgba(34, 197, 94, 0.15)',
                        borderRadius: 'var(--radius-sm)',
                        minWidth: 0,
                      }}>
                        <div style={{
                          fontSize: '10px',
                          color: 'var(--status-success)',
                          marginBottom: 'var(--space-1)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}>
                          Accepted ✓
                        </div>
                        <div style={{
                          fontSize: 'var(--text-sm)',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          wordBreak: 'break-all',
                        }}>
                          {formatValue(conflict.winner.value)}
                        </div>
                        <div style={{ marginTop: 'var(--space-1)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <SourceBadge source={conflict.winner.source} size="sm" />
                          <ConfidenceBadge confidence={conflict.winner.confidence} size="sm" showLabel={false} />
                        </div>
                      </div>
                    </div>

                    {}
                    <div style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                    }}>
                      <span><strong style={{ color: 'var(--text-secondary)' }}>Reason:</strong> {conflict.reason}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-violet)', opacity: 0.7 }}>
                        {conflict.rule}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
