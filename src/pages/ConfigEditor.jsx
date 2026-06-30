import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings, Plus, Trash2, GripVertical,
  Eye, EyeOff, Code2, ToggleLeft, ToggleRight,
  Save, RotateCcw, Check, AlertCircle
} from 'lucide-react';
import { usePipeline } from '../context/PipelineContext';
import { configPresets } from '../data/mockData';
import JsonViewer from '../components/ui/JsonViewer';

const fieldTypes = ['string', 'string[]', 'number', 'boolean', 'object', 'object[]'];
const normalizeOptions = ['none', 'E164', 'canonical', 'ISO8601'];
const onMissingOptions = ['null', 'omit', 'error'];

export default function ConfigEditor() {
  const { state, dispatch } = usePipeline();
  const [config, setConfig] = useState(state.customConfig);
  const [showPreview, setShowPreview] = useState(true);
  const [saved, setSaved] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  useEffect(() => {
    dispatch({ type: 'SET_CONFIG', payload: 'full' });
  }, []);

  // Validate config
  useEffect(() => {
    const errors = [];
    const hasRequired = config.fields.some(f => f.required);
    if (config.fields.length === 0) {
      errors.push('At least one field is required');
    }
    config.fields.forEach((field, i) => {
      if (!field.path || field.path.trim() === '') {
        errors.push(`Field ${i + 1}: path is required`);
      }
    });
    setValidationErrors(errors);
  }, [config]);

  const updateField = (index, key, value) => {
    const newFields = [...config.fields];
    newFields[index] = { ...newFields[index], [key]: value };
    setConfig({ ...config, fields: newFields });
  };

  const removeField = (index) => {
    const newFields = config.fields.filter((_, i) => i !== index);
    setConfig({ ...config, fields: newFields });
  };

  const addField = () => {
    setConfig({
      ...config,
      fields: [...config.fields, { path: '', type: 'string', required: false }],
    });
  };

  const handleSave = () => {
    dispatch({ type: 'SAVE_CUSTOM_CONFIG', payload: config });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setConfig(configPresets.full.config);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h1 style={{
            fontSize: 'var(--text-3xl)',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            marginBottom: 'var(--space-2)',
          }}>
            Output <span className="gradient-text">Configuration</span>
          </h1>
          <p style={{
            fontSize: 'var(--text-base)',
            color: 'var(--text-secondary)',
            maxWidth: '600px',
          }}>
            Configure the projection schema to control which fields appear in the output and how they're formatted.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button onClick={handleReset} className="btn-secondary">
            <RotateCcw size={14} />
            Reset
          </button>
          <button onClick={handleSave} className="btn-primary" disabled={validationErrors.length > 0}>
            {saved ? <Check size={16} /> : <Save size={16} />}
            {saved ? 'Saved!' : 'Save Config'}
          </button>
        </div>
      </motion.div>



      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div style={{
          padding: 'var(--space-3) var(--space-4)',
          background: 'rgba(239, 68, 68, 0.06)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          fontSize: 'var(--text-sm)',
          color: 'var(--status-error)',
        }}>
          <AlertCircle size={16} />
          {validationErrors[0]}
        </div>
      )}

      {/* Main editor area */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: showPreview ? '1fr 1fr' : '1fr',
        gap: 'var(--space-6)',
        transition: 'grid-template-columns 0.3s ease',
      }}>
        {/* Field builder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-4)',
          }}>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>
              Schema Fields
            </h2>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="btn-ghost"
            >
              {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
              <span style={{ fontSize: 'var(--text-xs)' }}>
                {showPreview ? 'Hide' : 'Show'} Preview
              </span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {config.fields.map((field, index) => (
              <motion.div
                key={index}
                className="glass-card-static"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                }}
              >
                <GripVertical size={14} color="var(--text-muted)" style={{ cursor: 'grab', flexShrink: 0 }} />

                {/* Path */}
                <input
                  value={field.path}
                  onChange={(e) => updateField(index, 'path', e.target.value)}
                  placeholder="field path"
                  style={{
                    flex: 1,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                    padding: 'var(--space-2)',
                    minWidth: '100px',
                  }}
                />

                {/* Type */}
                <select
                  value={field.type}
                  onChange={(e) => updateField(index, 'type', e.target.value)}
                  style={{
                    width: '100px',
                    fontSize: 'var(--text-xs)',
                    padding: 'var(--space-2)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {fieldTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>

                {/* Normalize */}
                {(field.normalize || field.type === 'string') && (
                  <select
                    value={field.normalize || 'none'}
                    onChange={(e) => updateField(index, 'normalize', e.target.value === 'none' ? undefined : e.target.value)}
                    style={{
                      width: '90px',
                      fontSize: 'var(--text-xs)',
                      padding: 'var(--space-2)',
                    }}
                  >
                    {normalizeOptions.map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                )}

                {/* Required toggle */}
                <button
                  onClick={() => updateField(index, 'required', !field.required)}
                  title={field.required ? 'Required' : 'Optional'}
                  style={{ flexShrink: 0 }}
                >
                  {field.required ? (
                    <ToggleRight size={20} color="var(--accent-violet)" />
                  ) : (
                    <ToggleLeft size={20} color="var(--text-muted)" />
                  )}
                </button>

                {/* Delete */}
                <button
                  onClick={() => removeField(index)}
                  style={{
                    padding: '4px',
                    borderRadius: '4px',
                    flexShrink: 0,
                    transition: 'color 0.15s ease',
                    color: 'var(--text-muted)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--status-error)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
          </div>

          {/* Add field button */}
          <button
            onClick={addField}
            style={{
              marginTop: 'var(--space-3)',
              width: '100%',
              padding: 'var(--space-3)',
              border: '2px dashed var(--border-default)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-2)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-muted)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--accent-violet)';
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.background = 'rgba(139, 92, 246, 0.04)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-default)';
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <Plus size={16} />
            Add Field
          </button>

          {/* Global options */}
          <div className="glass-card-static" style={{
            padding: 'var(--space-4)',
            marginTop: 'var(--space-4)',
          }}>
            <h3 style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 700,
              marginBottom: 'var(--space-3)',
              color: 'var(--text-secondary)',
            }}>
              Global Options
            </h3>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>Include Confidence</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    Attach source and confidence metadata to each field
                  </div>
                </div>
                <button onClick={() => setConfig({ ...config, include_confidence: !config.include_confidence })}>
                  {config.include_confidence ? (
                    <ToggleRight size={24} color="var(--accent-violet)" />
                  ) : (
                    <ToggleLeft size={24} color="var(--text-muted)" />
                  )}
                </button>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>On Missing Policy</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    What to do when a field has no data
                  </div>
                </div>
                <select
                  value={config.on_missing}
                  onChange={(e) => setConfig({ ...config, on_missing: e.target.value })}
                  style={{
                    width: '100px',
                    fontSize: 'var(--text-xs)',
                    padding: 'var(--space-2)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {onMissingOptions.map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Live JSON Preview */}
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 700,
              marginBottom: 'var(--space-4)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}>
              <Code2 size={18} color="var(--accent-cyan)" />
              Live Preview
            </h2>
            <JsonViewer
              data={config}
              title="config.json"
              collapsible={false}
              maxHeight="600px"
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
