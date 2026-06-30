import { motion } from 'framer-motion';
import SourceBadge from './SourceBadge';

const sourceGlowColors = {
  csv: 'rgba(59, 130, 246, 0.3)',
  github: 'rgba(168, 85, 247, 0.3)',
  resume: 'rgba(20, 184, 166, 0.3)',
};

export default function SkillCloud({ skills }) {
  if (!skills || skills.length === 0) return null;

  
  const sorted = [...skills].sort((a, b) => {
    const multiA = a.sources.length > 1 ? 1 : 0;
    const multiB = b.sources.length > 1 ? 1 : 0;
    if (multiB !== multiA) return multiB - multiA;
    return b.confidence - a.confidence;
  });

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 'var(--space-2)',
    }}>
      {sorted.map((skill, index) => {
        const isMultiSource = skill.sources.length > 1;
        const primarySource = skill.sources[0];

        
        const fontSize = skill.confidence > 0.9 ? 'var(--text-sm)' : 'var(--text-xs)';
        const padding = skill.confidence > 0.9 ? 'var(--space-2) var(--space-4)' : 'var(--space-1) var(--space-3)';

        return (
          <motion.div
            key={skill.value}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.03 }}
            whileHover={{ scale: 1.05, y: -2 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: padding,
              fontSize: fontSize,
              fontWeight: 500,
              color: 'var(--text-primary)',
              background: isMultiSource
                ? 'rgba(139, 92, 246, 0.08)'
                : 'rgba(148, 163, 184, 0.06)',
              border: `1px solid ${isMultiSource ? 'rgba(139, 92, 246, 0.2)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-full)',
              cursor: 'default',
              transition: 'all 0.2s ease',
              position: 'relative',
            }}
          >
            {}
            <span style={{
              textTransform: 'capitalize',
            }}>
              {skill.value}
            </span>

            {}
            <div style={{
              display: 'flex',
              gap: '2px',
            }}>
              {skill.sources.map(source => (
                <div
                  key={source}
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: source === 'csv'
                      ? 'var(--source-csv)'
                      : source === 'github'
                      ? 'var(--source-github)'
                      : 'var(--source-resume)',
                    boxShadow: `0 0 4px ${sourceGlowColors[source]}`,
                  }}
                  title={source}
                />
              ))}
            </div>

            {}
            {isMultiSource && (
              <div style={{
                position: 'absolute',
                inset: '-1px',
                borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.1))',
                zIndex: -1,
                filter: 'blur(2px)',
              }} />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
