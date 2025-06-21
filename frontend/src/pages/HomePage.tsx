import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import './HomePage.css'

function HomePage() {
  const navigate = useNavigate();
  const [projectInput, setProjectInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStartProject = async (projectDescription: string) => {
    try {
      setLoading(true);
      const result = await api.createProject(projectDescription);
      console.log('Project created:', result);
      
      // Navigate to project planning page
      const projectId = result.project_id || 'temp_project_' + Date.now();
      navigate(`/project/${projectId}/plan`);
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectInput.trim()) {
      handleStartProject(projectInput.trim());
      setProjectInput('');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <p>Creating your project...</p>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="main-content">
        <div className="project-prompt">
          <h1>What would you like to DIY today?</h1>
          <form onSubmit={handleSubmit} className="project-form">
            <input
              type="text"
              value={projectInput}
              onChange={(e) => setProjectInput(e.target.value)}
              placeholder="Describe your project (e.g., 'unclog my kitchen sink', 'build a bookshelf', 'fix squeaky door')"
              className="project-input"
              autoFocus
            />
            <button 
              type="submit" 
              className="start-project-button"
              disabled={!projectInput.trim() || loading}
            >
              Start Project
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default HomePage;