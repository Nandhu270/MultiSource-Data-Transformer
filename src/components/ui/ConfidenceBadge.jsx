export default function ConfidenceBadge({ confidence, size = 'md', showLabel = true }) {
  const percent = Math.round(confidence * 100);

  let color, bg, label;
  if (confidence >= 0.8) {
    color = 'var(--conf-high)';
    bg = 'rgba(34, 197, 94, 0.12)';
    label = 'High';
  } else if (confidence >= 0.6) {
    color = 'var(--conf-medium)';
    bg = 'rgba(245, 158, 11, 0.12)';
    label = 'Medium';
  } else {
    color = 'var(--conf-low)';
    bg = 'rgba(239, 68, 68, 0.12)';
    label = 'Low';
  }

  const sizeStyles = {
    sm: { fontSize: 'var(--text-xs)', padding: '1px 6px', barHeight: '3px' },
    md: { fontSize: 'var(--text-xs)', padding: '2px 8px', barHeight: '4px' },
    lg: { fontSize: 'var(--text-sm)', padding: '4px 12px', barHeight: '6px' },
  };

  const s = sizeStyles[size] || sizeStyles.md;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
      {}
      <div style={{
        width: size === 'lg' ? '60px' : '40px',
        height: s.barHeight,
        background: 'rgba(148, 163, 184, 0.1)',
        borderRadius: 'var(--radius-full)',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${percent}%`,
          height: '100%',
          background: color,
          borderRadius: 'var(--radius-full)',
          transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
      </div>

      {}
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: s.fontSize,
        fontWeight: 600,
        color: color,
        background: bg,
        padding: s.padding,
        borderRadius: 'var(--radius-full)',
        fontFamily: 'var(--font-mono)',
      }}>
        {percent}%
        {showLabel && size !== 'sm' && (
          <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, opacity: 0.8 }}>
            {label}
          </span>
        )}
      </span>
    </div>
  );
}
