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
      console.log('Generating steps for project:', projectId);
      
      // Call the AI to generate project-specific steps
      const result = await api.generateSteps(projectId!);
      console.log('Steps generated:', result);
      
      // Navigate to execution page
      navigate(`/project/${projectId}/execute`);
    } catch (error) {
      console.error('Failed to generate steps:', error);
      alert('Failed to generate steps. Please try again.');
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
      <div className="project-header">
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

      <main className="planning-content">
        <div className="planning-section">
          <div className="section-header">
            <h2>🔍 Project Discovery</h2>
            <p>I'm gathering information about your project. I'll ask specific questions to understand your needs and help you identify the right tools. When you mention tools you have, I'll add them to your toolroom inventory.</p>
            {showGenerateButton && (
              <div className="ready-indicator">
                <span className="ready-badge">✅ Ready to generate steps!</span>
              </div>
            )}
          </div>

          <div className="chat-container">
            <ChatInterface 
              projectId={projectId}
              onGenerateSteps={handleGenerateSteps}
              showGenerateButton={showGenerateButton}
              initialMessage={project?.initial_ai_message}
            />
          </div>
        </div>

        <aside className="planning-sidebar">
          <div className="info-panel">
            <h3>🔍 Discovery Process</h3>
            <ul className="checklist">
              <li>
                <span className="check">✓</span>
                Project description provided
              </li>
              <li>
                <span className="check pending">○</span>
                Understand project scope
              </li>
              <li>
                <span className="check pending">○</span>
                Identify required tools
              </li>
              <li>
                <span className="check pending">○</span>
                Add tools to inventory
              </li>
              <li>
                <span className="check pending">○</span>
                Verify project readiness
              </li>
              <li>
                <span className="check pending">○</span>
                Generate detailed steps
              </li>
            </ul>
          </div>

          <div className="info-panel">
            <h3>💡 Discovery Tips</h3>
            <ul className="tips-list">
              <li>Tell me about any tools you already have</li>
              <li>Mention your experience level with DIY</li>
              <li>Describe the current condition/setup</li>
              <li>Ask about alternatives if unsure</li>
              <li>I'll add tools to your inventory as we chat</li>
            </ul>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default ProjectPlanningPage;