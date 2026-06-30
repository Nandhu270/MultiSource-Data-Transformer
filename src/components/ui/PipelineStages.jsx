import { motion } from 'framer-motion';
import {
  Search, FileInput, Wand2, GitMerge, ShieldCheck,
  Projector, CheckCircle2, Loader2
} from 'lucide-react';

const iconMap = {
  Search, FileInput, Wand2, GitMerge, ShieldCheck, Projector, CheckCircle2
};

export default function PipelineStages({ stages, currentStage, status }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0',
      width: '100%',
      overflow: 'hidden',
    }}>
      {stages.map((stage, index) => {
        const Icon = iconMap[stage.icon] || Search;
        const isCompleted = currentStage > index;
        const isCurrent = currentStage === index && status === 'running';
        const isPending = currentStage <= index && !isCurrent;

        let stageColor, bgColor, borderColor, textColor;
        if (isCompleted) {
          stageColor = 'var(--status-success)';
          bgColor = 'rgba(34, 197, 94, 0.12)';
          borderColor = 'rgba(34, 197, 94, 0.3)';
          textColor = 'var(--text-primary)';
        } else if (isCurrent) {
          stageColor = 'var(--accent-violet)';
          bgColor = 'rgba(139, 92, 246, 0.12)';
          borderColor = 'rgba(139, 92, 246, 0.4)';
          textColor = 'var(--text-primary)';
        } else {
          stageColor = 'var(--text-muted)';
          bgColor = 'rgba(148, 163, 184, 0.04)';
          borderColor = 'var(--border-subtle)';
          textColor = 'var(--text-muted)';
        }

        return (
          <div key={stage.id} style={{ flex: 1, display: 'flex', alignItems: 'flex-start' }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: 1,
              position: 'relative',
            }}>
              {}
              {index > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  right: '50%',
                  width: '100%',
                  height: '2px',
                  background: isCompleted
                    ? 'var(--status-success)'
                    : 'var(--border-subtle)',
                  zIndex: 0,
                  transition: 'background 0.4s ease',
                }} />
              )}

              {}
              <motion.div
                animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: bgColor,
                  border: `2px solid ${borderColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1,
                  position: 'relative',
                  transition: 'all 0.4s ease',
                  boxShadow: isCurrent ? '0 0 16px rgba(139, 92, 246, 0.3)' : 'none',
                }}
              >
                {isCurrent ? (
                  <Loader2 size={18} color={stageColor} style={{ animation: 'spin 1s linear infinite' }} />
                ) : isCompleted ? (
                  <CheckCircle2 size={18} color={stageColor} />
                ) : (
                  <Icon size={18} color={stageColor} />
                )}
              </motion.div>

              {}
              <div style={{
                marginTop: 'var(--space-2)',
                textAlign: 'center',
                maxWidth: '100px',
              }}>
                <div style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  color: textColor,
                  transition: 'color 0.3s ease',
                }}>
                  {stage.name}
                </div>
                <div style={{
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  marginTop: '2px',
                  lineHeight: 1.3,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {stage.description}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
