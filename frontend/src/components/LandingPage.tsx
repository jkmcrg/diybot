import React, { useState } from 'react';
import './LandingPage.css';

interface LandingPageProps {
  onStartProject: (projectDescription: string) => void;
  onOpenModal: (modalType: 'house' | 'toolroom' | 'projects') => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStartProject, onOpenModal }) => {
  const [projectInput, setProjectInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectInput.trim()) {
      onStartProject(projectInput.trim());
      setProjectInput('');
    }
  };

  return (
    <div className="landing-page">
      <nav className="nav-bar">
        <h1 className="app-title">DIY Bot</h1>
        <div className="nav-buttons">
          <button 
            className="nav-button"
            onClick={() => onOpenModal('house')}
          >
            House
          </button>
          <button 
            className="nav-button"
            onClick={() => onOpenModal('toolroom')}
          >
            Toolroom
          </button>
          <button 
            className="nav-button"
            onClick={() => onOpenModal('projects')}
          >
            Projects
          </button>
        </div>
      </nav>

      <main className="main-content">
        <div className="project-prompt">
          <h2>What would you like to DIY today?</h2>
          <form onSubmit={handleSubmit} className="project-form">
            <input
              type="text"
              value={projectInput}
              onChange={(e) => setProjectInput(e.target.value)}
              placeholder="Describe your project (e.g., 'help me replace my kitchen sink faucet')"
              className="project-input"
              autoFocus
            />
            <button 
              type="submit" 
              className="start-project-button"
              disabled={!projectInput.trim()}
            >
              Start Project
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;