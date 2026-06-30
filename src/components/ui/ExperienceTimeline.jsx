import { motion } from 'framer-motion';
import { Briefcase, Calendar } from 'lucide-react';
import SourceBadge from './SourceBadge';
import ConfidenceBadge from './ConfidenceBadge';

function formatDate(dateStr) {
  if (!dateStr) return 'Present';
  const [year, month] = dateStr.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(month) - 1]} ${year}`;
}

function calcDuration(start, end) {
  const s = new Date(start + '-01');
  const e = end ? new Date(end + '-01') : new Date();
  const months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (years === 0) return `${remainingMonths} mo`;
  if (remainingMonths === 0) return `${years} yr`;
  return `${years} yr ${remainingMonths} mo`;
}

export default function ExperienceTimeline({ experiences }) {
  if (!experiences || experiences.length === 0) return null;

  return (
    <div style={{
      position: 'relative',
      paddingLeft: 'var(--space-8)',
    }}>
      {}
      <div style={{
        position: 'absolute',
        left: '15px',
        top: '8px',
        bottom: '8px',
        width: '2px',
        background: 'linear-gradient(to bottom, var(--accent-violet), var(--accent-cyan), transparent)',
        borderRadius: '1px',
      }} />

      {experiences.map((exp, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
          style={{
            position: 'relative',
            paddingBottom: index < experiences.length - 1 ? 'var(--space-6)' : '0',
          }}
        >
          {}
          <div style={{
            position: 'absolute',
            left: '-25px',
            top: '4px',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: index === 0 ? 'var(--accent-violet)' : 'var(--bg-elevated)',
            border: `2px solid ${index === 0 ? 'var(--accent-violet)' : 'var(--accent-cyan)'}`,
            boxShadow: index === 0 ? '0 0 8px rgba(139, 92, 246, 0.4)' : 'none',
            zIndex: 1,
          }} />

          {}
          <div className="glass-card-static" style={{
            padding: 'var(--space-4)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 'var(--space-3)',
              flexWrap: 'wrap',
            }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{
                  fontSize: 'var(--text-base)',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                }}>
                  <Briefcase size={15} color="var(--accent-violet)" />
                  {exp.title}
                </div>
                <div style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-secondary)',
                  marginTop: 'var(--space-1)',
                }}>
                  {exp.company}
                </div>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: 'var(--space-1)',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-1)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-muted)',
                }}>
                  <Calendar size={12} />
                  {formatDate(exp.start_date)} — {formatDate(exp.end_date)}
                </div>
                <div style={{
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {calcDuration(exp.start_date, exp.end_date)}
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              marginTop: 'var(--space-3)',
            }}>
              <SourceBadge source={exp.source} size="sm" />
              <ConfidenceBadge confidence={exp.confidence} size="sm" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
