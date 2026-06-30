import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, File, X, CheckCircle2 } from 'lucide-react';

export default function FileDropZone({
  label,
  accept,
  icon: CustomIcon,
  acceptedFormats = [],
  onFileSelect,
  file = null,
  status = 'empty',
  onClear,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && onFileSelect) {
      onFileSelect(droppedFile);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && onFileSelect) {
      onFileSelect(selectedFile);
    }
  };

  const Icon = CustomIcon || Upload;

  return (
    <div style={{ position: 'relative' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        style={{ display: 'none' }}
      />

      <motion.div
        onClick={status === 'empty' ? handleClick : undefined}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        whileHover={status === 'empty' ? { scale: 1.01 } : {}}
        whileTap={status === 'empty' ? { scale: 0.99 } : {}}
        style={{
          border: `2px dashed ${
            isDragging
              ? 'var(--accent-violet)'
              : status === 'uploaded'
              ? 'var(--status-success)'
              : 'var(--border-default)'
          }`,
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-8) var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-3)',
          cursor: status === 'empty' ? 'pointer' : 'default',
          background: isDragging
            ? 'rgba(139, 92, 246, 0.06)'
            : status === 'uploaded'
            ? 'rgba(34, 197, 94, 0.04)'
            : 'rgba(148, 163, 184, 0.02)',
          transition: 'all 0.25s ease',
          minHeight: '160px',
          position: 'relative',
        }}
      >
        <AnimatePresence mode="wait">
          {status === 'uploaded' && file ? (
            <motion.div
              key="uploaded"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--space-3)',
              }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(34, 197, 94, 0.12)',
                border: '2px solid rgba(34, 197, 94, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <CheckCircle2 size={24} color="var(--status-success)" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                }}>
                  <File size={14} />
                  {typeof file === 'string' ? file : file.name}
                </div>
                <div style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--status-success)',
                  marginTop: 'var(--space-1)',
                }}>
                  File ready
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--space-3)',
              }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: isDragging ? 'rgba(139, 92, 246, 0.15)' : 'rgba(148, 163, 184, 0.06)',
                border: `2px solid ${isDragging ? 'rgba(139, 92, 246, 0.3)' : 'var(--border-subtle)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.25s ease',
              }}>
                <Icon size={22} color={isDragging ? 'var(--accent-violet)' : 'var(--text-muted)'} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                }}>
                  {label || 'Drop file here or click to browse'}
                </div>
                {acceptedFormats.length > 0 && (
                  <div style={{
                    display: 'flex',
                    gap: 'var(--space-1)',
                    justifyContent: 'center',
                    marginTop: 'var(--space-2)',
                  }}>
                    {acceptedFormats.map(fmt => (
                      <span key={fmt} style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        background: 'rgba(148, 163, 184, 0.08)',
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-sm)',
                        textTransform: 'uppercase',
                        fontFamily: 'var(--font-mono)',
                      }}>
                        {fmt}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Clear button */}
        {status === 'uploaded' && onClear && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            style={{
              position: 'absolute',
              top: 'var(--space-3)',
              right: 'var(--space-3)',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'rgba(148, 163, 184, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)'}
          >
            <X size={14} color="var(--text-secondary)" />
          </button>
        )}
      </motion.div>
    </div>
  );
}
