import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChatInterface from '../components/ChatInterface';
import { api } from '../api';
import './ProjectPlanningPage.css';

interface ProjectPlanningPageProps {}

const ProjectPlanningPage: React.FC<ProjectPlanningPageProps> = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showGenerateButton, setShowGenerateButton] = useState(false);

  useEffect(() => {
    const loadProject = async () => {
      try {
        const projects = await api.getProjects();
        const currentProject = projects.find((p: any) => p.id === projectId);
        
        if (currentProject) {
          setProject(currentProject);
          // Show generate button if project is in planning phase
          setShowGenerateButton(currentProject.status === 'planning');
        } else {
          // Project not found, redirect to home
          navigate('/');
        }
      } catch (error) {
        console.error('Failed to load project:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      loadProject();
    } else {
      navigate('/');
    }
  }, [projectId, navigate]);

  const handleGenerateSteps = async () => {
    try {
      setLoading(true);
      // TODO: Implement step generation API call
      console.log('Generating steps for project:', projectId);
      
      // For now, navigate to execution page
      // In real implementation, this would call the AI to generate steps
      navigate(`/project/${projectId}/execute`);
    } catch (error) {
      console.error('Failed to generate steps:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="project-planning-page">
        <div className="loading-container">
          <p>Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="project-planning-page">
        <div className="error-container">
          <p>Project not found</p>
          <button onClick={handleBackToHome}>Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="project-planning-page">
      <header className="planning-header">
        <div className="header-content">
          <button className="back-button" onClick={handleBackToHome}>
            ← Back to Home
          </button>
          <div className="project-info">
            <h1>{project.title}</h1>
            <p className="project-description">{project.description}</p>
            <div className="project-status">
              <span className={`status-badge ${project.status}`}>
                {project.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="planning-content">
        <div className="planning-section">
          <div className="section-header">
            <h2>📋 Project Planning</h2>
            <p>Let's gather all the information needed for your project. I'll ask questions about your specific requirements, check your tool inventory, and help you prepare everything needed.</p>
          </div>

          <div className="chat-container">
            <ChatInterface 
              projectId={projectId}
              onGenerateSteps={handleGenerateSteps}
              showGenerateButton={showGenerateButton}
            />
          </div>
        </div>

        <aside className="planning-sidebar">
          <div className="info-panel">
            <h3>🔧 Planning Checklist</h3>
            <ul className="checklist">
              <li>
                <span className="check">✓</span>
                Project description provided
              </li>
              <li>
                <span className="check pending">○</span>
                Gather specific requirements
              </li>
              <li>
                <span className="check pending">○</span>
                Check tool inventory
              </li>
              <li>
                <span className="check pending">○</span>
                Identify missing tools
              </li>
              <li>
                <span className="check pending">○</span>
                Create shopping list
              </li>
              <li>
                <span className="check pending">○</span>
                Ready for step generation
              </li>
            </ul>
          </div>

          <div className="info-panel">
            <h3>💡 Tips</h3>
            <ul className="tips-list">
              <li>Be specific about your project details</li>
              <li>Mention any constraints or preferences</li>
              <li>Ask about tool alternatives if needed</li>
              <li>Don't hesitate to ask questions!</li>
            </ul>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default ProjectPlanningPage;