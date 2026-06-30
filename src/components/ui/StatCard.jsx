import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export default function StatCard({ icon: Icon, label, value, suffix = '', trend, color = 'violet', delay = 0 }) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef(null);

  // Animated counter
  useEffect(() => {
    const numValue = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(numValue)) {
      setDisplayValue(value);
      return;
    }

    const duration = 1200;
    const steps = 40;
    const stepTime = duration / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += numValue / steps;
      if (current >= numValue) {
        current = numValue;
        clearInterval(timer);
      }
      setDisplayValue(
        numValue % 1 !== 0 ? current.toFixed(2) : Math.round(current)
      );
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  const colorMap = {
    violet: { gradient: 'linear-gradient(135deg, #8b5cf6, #a855f7)', glow: 'rgba(139, 92, 246, 0.15)' },
    cyan: { gradient: 'linear-gradient(135deg, #06b6d4, #14b8a6)', glow: 'rgba(6, 182, 212, 0.15)' },
    blue: { gradient: 'linear-gradient(135deg, #3b82f6, #6366f1)', glow: 'rgba(59, 130, 246, 0.15)' },
    green: { gradient: 'linear-gradient(135deg, #22c55e, #14b8a6)', glow: 'rgba(34, 197, 94, 0.15)' },
  };

  const c = colorMap[color] || colorMap.violet;

  return (
    <motion.div
      ref={ref}
      className="glass-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay * 0.1 }}
      style={{
        padding: 'var(--space-6)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Glow orb */}
      <div style={{
        position: 'absolute',
        top: '-20px',
        right: '-20px',
        width: '100px',
        height: '100px',
        background: c.glow,
        borderRadius: '50%',
        filter: 'blur(30px)',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: 'var(--radius-md)',
          background: c.gradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 4px 12px ${c.glow}`,
        }}>
          <Icon size={22} color="white" />
        </div>
        {trend && (
          <span style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            color: trend > 0 ? 'var(--status-success)' : 'var(--status-error)',
            background: trend > 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            padding: '2px 8px',
            borderRadius: 'var(--radius-full)',
          }}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>

      <div style={{ position: 'relative' }}>
        <div style={{
          fontSize: 'var(--text-3xl)',
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          marginBottom: 'var(--space-1)',
        }}>
          {displayValue}{suffix}
        </div>
        <div style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)',
          fontWeight: 500,
        }}>
          {label}
        </div>
      </div>
    </motion.div>
  );
}
