import { createContext, useContext, useReducer, useCallback } from 'react';
import { mockCandidates, mockPipelineRuns, mockConflicts, mockOutputJSON, configPresets } from '../data/mockData';

const PipelineContext = createContext(null);

function projectCandidates(candidates, config) {
  if (!config || !config.fields) return candidates;

  return candidates.map(candidate => {
    const projected = {
      candidate_id: candidate.candidate_id
    };

    config.fields.forEach(field => {
      const path = field.path;
      const from = field.from || path;

      // Extract the value from candidate
      let val = undefined;
      
      // Resolve basic nested properties
      if (from.includes('.')) {
        const parts = from.split('.');
        let current = candidate;
        for (let part of parts) {
          if (current) current = current[part];
        }
        val = current;
      } else if (from.endsWith('[]')) {
        const baseKey = from.slice(0, -2);
        val = candidate[baseKey];
      } else if (from === 'skills[].value' || from === 'skills') {
        val = candidate.skills?.map(s => s.name);
      } else {
        val = candidate[from];
      }

      // Apply on_missing policy
      if ((val === undefined || val === null) && config.on_missing === 'null') {
        val = null;
      }

      if (val !== undefined && val !== null) {
        if (config.include_confidence) {
          // Wrapped value matching the configuration fields definition
          let source = 'merged';
          let confidence = candidate.overall_confidence;

          // Deduce matching source/confidence if available
          if (from.startsWith('emails') || from === 'primary_email') {
            source = 'recruiter_csv';
            confidence = 0.9;
          } else if (from.startsWith('phones') || from === 'phone') {
            source = 'recruiter_csv';
            confidence = 0.9;
          } else if (from.startsWith('location')) {
            source = 'recruiter_csv';
            confidence = 0.9;
          } else if (from.startsWith('links')) {
            source = 'resume';
            confidence = 0.7;
          } else if (from.startsWith('skills')) {
            source = 'merged';
            confidence = 0.95;
          } else if (from.startsWith('experience')) {
            source = 'resume';
            confidence = 0.7;
          } else if (from.startsWith('education')) {
            source = 'resume';
            confidence = 0.7;
          }

          projected[path] = {
            value: val,
            source,
            confidence
          };
        } else {
          projected[path] = val;
        }
      }
    });

    if (config.include_confidence) {
      projected.overall_confidence = candidate.overall_confidence;
      projected.provenance = candidate.provenance;
    }

    return projected;
  });
}

const initialState = {
  // Source uploads — folder for resumes, file for CSVs
  sources: {
    recruiterCsv: { file: null, status: 'empty', filename: '' },
    githubCsv: { file: null, status: 'empty', filename: '' },
    resumeFolder: { files: [], status: 'empty', folderName: '', fileCount: 0 }
  },
  // Pipeline execution
  pipeline: {
    status: 'idle', // idle | running | completed | error
    currentStage: 0,
    totalStages: 7,
    startTime: null,
    duration: null
  },
  // Results
  results: {
    candidates: [],
    completeCandidates: [],
    selectedCandidate: null,
    outputJSON: null,
    conflicts: [],
    runs: mockPipelineRuns,
    stats: {
      candidatesProcessed: 0,
      avgConfidence: 0,
      conflictsResolved: 0,
      totalRuns: mockPipelineRuns.length
    }
  },
  // Config
  activeConfig: 'full',
  customConfig: configPresets.full.config
};

function pipelineReducer(state, action) {
  switch (action.type) {
    case 'SET_RECRUITER_CSV':
      return {
        ...state,
        sources: {
          ...state.sources,
          recruiterCsv: { file: action.payload.file, status: 'uploaded', filename: action.payload.filename }
        }
      };
    case 'SET_GITHUB_CSV':
      return {
        ...state,
        sources: {
          ...state.sources,
          githubCsv: { file: action.payload.file, status: 'uploaded', filename: action.payload.filename }
        }
      };
    case 'SET_RESUME_FOLDER':
      return {
        ...state,
        sources: {
          ...state.sources,
          resumeFolder: {
            files: action.payload.files,
            status: 'uploaded',
            folderName: action.payload.folderName,
            fileCount: action.payload.fileCount
          }
        }
      };
    case 'SAVE_CUSTOM_CONFIG':
      return {
        ...state,
        customConfig: action.payload
      };
    case 'CLEAR_SOURCE':
      if (action.payload === 'resumeFolder') {
        return {
          ...state,
          sources: {
            ...state.sources,
            resumeFolder: initialState.sources.resumeFolder
          }
        };
      }
      return {
        ...state,
        sources: {
          ...state.sources,
          [action.payload]: { file: null, status: 'empty', filename: '' }
        }
      };
    case 'START_PIPELINE':
      return {
        ...state,
        pipeline: {
          ...state.pipeline,
          status: 'running',
          currentStage: 0,
          startTime: Date.now(),
          duration: null
        }
      };
    case 'ADVANCE_STAGE':
      return {
        ...state,
        pipeline: {
          ...state.pipeline,
          currentStage: state.pipeline.currentStage + 1
        }
      };
    case 'COMPLETE_PIPELINE': {
      const resumeCount = state.sources.resumeFolder.fileCount || 3;
      const projectedList = projectCandidates(mockCandidates, state.customConfig);
      return {
        ...state,
        pipeline: {
          ...state.pipeline,
          status: 'completed',
          currentStage: 7,
          duration: ((Date.now() - state.pipeline.startTime) / 1000).toFixed(1)
        },
        results: {
          ...state.results,
          candidates: projectedList,
          selectedCandidate: projectedList[0],
          outputJSON: projectedList,
          conflicts: mockConflicts,
          stats: {
            candidatesProcessed: resumeCount,
            avgConfidence: 0.78,
            conflictsResolved: 5,
            totalRuns: state.results.runs.length + 1
          }
        }
      };
    }
    case 'COMPLETE_PIPELINE_LIVE': {
      const candidates = action.payload.candidates;
      const conflicts = action.payload.conflicts;
      
      const getConfVal = (c) => {
        if (!c) return 0.75;
        const raw = c.overall_confidence;
        return typeof raw === 'object' && raw !== null && 'value' in raw ? raw.value : (raw || 0.75);
      };

      const avgConfidence = candidates.length > 0
        ? (candidates.reduce((acc, c) => acc + getConfVal(c), 0) / candidates.length).toFixed(2)
        : 0;

      return {
        ...state,
        pipeline: {
          ...state.pipeline,
          status: 'completed',
          currentStage: 7,
          duration: action.payload.duration
        },
        results: {
          ...state.results,
          candidates: candidates,
          completeCandidates: action.payload.completeCandidates || [],
          selectedCandidate: candidates[0] || null,
          outputJSON: candidates,
          conflicts: conflicts,
          stats: {
            candidatesProcessed: candidates.length,
            avgConfidence: parseFloat(avgConfidence),
            conflictsResolved: conflicts.length,
            totalRuns: state.results.runs.length + 1
          }
        }
      };
    }
    case 'SELECT_CANDIDATE':
      return {
        ...state,
        results: {
          ...state.results,
          selectedCandidate: action.payload
        }
      };
    case 'RESET_PIPELINE':
      return {
        ...state,
        pipeline: initialState.pipeline,
        results: {
          ...state.results,
          candidates: [],
          completeCandidates: [],
          selectedCandidate: null,
          outputJSON: null,
          conflicts: []
        }
      };
    case 'SET_CONFIG':
      return {
        ...state,
        activeConfig: action.payload,
        customConfig: configPresets[action.payload]?.config || state.customConfig
      };
    default:
      return state;
  }
}

export function PipelineProvider({ children }) {
  const [state, dispatch] = useReducer(pipelineReducer, initialState);

  const runPipeline = useCallback(() => {
    dispatch({ type: 'START_PIPELINE' });

    const stageDelays = [300, 500, 400, 600, 300, 400, 300];
    let totalDelay = 0;

    stageDelays.forEach((delay, index) => {
      totalDelay += delay;
      setTimeout(() => {
        dispatch({ type: 'ADVANCE_STAGE' });
        if (index === stageDelays.length - 1) {
          setTimeout(() => {
            dispatch({ type: 'COMPLETE_PIPELINE' });
          }, 200);
        }
      }, totalDelay);
    });
  }, []);

  const value = { state, dispatch, runPipeline };

  return (
    <PipelineContext.Provider value={value}>
      {children}
    </PipelineContext.Provider>
  );
}

export function usePipeline() {
  const context = useContext(PipelineContext);
  if (!context) {
    throw new Error('usePipeline must be used within a PipelineProvider');
  }
  return context;
}
