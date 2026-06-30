import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PipelineProvider } from './context/PipelineContext';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import UploadSources from './pages/UploadSources';
import Results from './pages/Results';
import ConfigEditor from './pages/ConfigEditor';
import './App.css';

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <Router>
      <PipelineProvider>
        <div className="app-layout">
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
          <div
            className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
          >
            <Header />
            <div className="page-content">
              <Routes>
                <Route path="/" element={<ConfigEditor />} />
                <Route path="/upload" element={<UploadSources />} />
                <Route path="/results" element={<Results />} />
              </Routes>
            </div>
          </div>
        </div>
      </PipelineProvider>
    </Router>
  );
}

export default App;
