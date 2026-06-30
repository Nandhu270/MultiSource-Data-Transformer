import { FileSpreadsheet, FileText, Link } from 'lucide-react';
import GithubIcon from '../icons/GithubIcon';

const sourceConfig = {
  recruiter_csv: { label: 'Recruiter CSV', className: 'badge-csv', icon: FileSpreadsheet },
  github_csv: { label: 'GitHub CSV', className: 'badge-github', icon: FileSpreadsheet },
  github: { label: 'GitHub', className: 'badge-github', icon: GithubIcon },
  resume: { label: 'Resume', className: 'badge-resume', icon: FileText },
  resumes: { label: 'Resumes', className: 'badge-resume', icon: FileText },
};

export default function SourceBadge({ source, showIcon = true, size = 'md' }) {
  const config = sourceConfig[source];
  if (!config) return null;

  const Icon = config.icon;

  const sizeStyles = {
    sm: { fontSize: '10px', padding: '1px 6px', iconSize: 10 },
    md: { fontSize: 'var(--text-xs)', padding: '2px 8px', iconSize: 12 },
    lg: { fontSize: 'var(--text-sm)', padding: '4px 12px', iconSize: 14 },
  };

  const s = sizeStyles[size] || sizeStyles.md;

  return (
    <span
      className={`badge ${config.className}`}
      style={{ fontSize: s.fontSize, padding: s.padding }}
    >
      {showIcon && <Icon size={s.iconSize} />}
      {config.label}
    </span>
  );
}
