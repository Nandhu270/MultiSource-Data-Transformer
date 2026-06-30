import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

const customTheme = {
  'code[class*="language-"]': {
    color: '#e2e8f0',
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    lineHeight: '1.6',
  },
  'pre[class*="language-"]': {
    background: 'transparent',
    margin: 0,
    padding: 0,
  },
  comment: { color: '#64748b' },
  punctuation: { color: '#94a3b8' },
  property: { color: '#a78bfa' },
  string: { color: '#34d399' },
  number: { color: '#f59e0b' },
  boolean: { color: '#f59e0b' },
  operator: { color: '#94a3b8' },
  keyword: { color: '#c084fc' },
  'attr-name': { color: '#a78bfa' },
  'attr-value': { color: '#34d399' },
};

export default function JsonViewer({ data, title = 'JSON Output', collapsible = true, maxHeight = '500px' }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      
      const textArea = document.createElement('textarea');
      textArea.value = jsonString;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="glass-card-static" style={{
      overflow: 'hidden',
    }}>
      {}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--space-3) var(--space-4)',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(148, 163, 184, 0.03)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
        }}>
          {}
          <div style={{ display: 'flex', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', opacity: 0.8 }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', opacity: 0.8 }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e', opacity: 0.8 }} />
          </div>
          <span style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            marginLeft: 'var(--space-2)',
          }}>
            {title}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <button
            onClick={handleCopy}
            className="btn-ghost"
            style={{ padding: '4px 8px' }}
          >
            {copied ? <Check size={14} color="var(--status-success)" /> : <Copy size={14} />}
            <span style={{ fontSize: 'var(--text-xs)' }}>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
          {collapsible && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="btn-ghost"
              style={{ padding: '4px' }}
            >
              {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
          )}
        </div>
      </div>

      {}
      {!isCollapsed && (
        <div style={{
          maxHeight: maxHeight,
          overflowY: 'auto',
          padding: 'var(--space-4)',
          background: 'rgba(6, 6, 15, 0.5)',
        }}>
          <SyntaxHighlighter
            language="json"
            style={customTheme}
            customStyle={{
              background: 'transparent',
              margin: 0,
              padding: 0,
            }}
            showLineNumbers={true}
            lineNumberStyle={{
              color: '#334155',
              fontSize: '11px',
              paddingRight: '16px',
              minWidth: '36px',
              userSelect: 'none',
            }}
          >
            {jsonString}
          </SyntaxHighlighter>
        </div>
      )}
    </div>
  );
}
