import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChatInterface from '../components/ChatInterface';
import { api } from '../api';
import './ProjectExecutionPage.css';

interface Step {
  id: string;
  step_number: number;
  title: string;
  description: string;
  required_tools: string[];
  is_active: boolean;
  is_completed: boolean;
}

const ProjectExecutionPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState<Step | null>(null);
  const [loading, setLoading] = useState(true);
  const [tools, setTools] = useState<any[]>([]);

  useEffect(() => {
    const loadProjectData = async () => {
      try {
        const [projects, toolsData] = await Promise.all([
          api.getProjects(),
          api.getTools()
        ]);
        
        const currentProject = projects.find((p: any) => p.id === projectId);
        
        if (currentProject) {
          setProject(currentProject);
          setTools(toolsData);
          
          // For demo purposes, create some mock steps
          const mockSteps: Step[] = [
            {
              id: 'step_1',
              step_number: 1,
              title: 'Prepare Tools and Materials',
              description: 'Gather all necessary tools and materials. Check that everything is in working condition and make any needed purchases.',
              required_tools: ['tool_1'],
              is_active: true,
              is_completed: false
            },
            {
              id: 'step_2',
              step_number: 2,
              title: 'Turn Off Water Supply',
              description: 'Locate the water shut-off valve under the sink and turn it clockwise to shut off the water supply. Test by turning on the faucet.',
              required_tools: [],
              is_active: false,
              is_completed: false
            },
            {
              id: 'step_3',
              step_number: 3,
              title: 'Disconnect Old Faucet',
              description: 'Use your wrench to disconnect the water supply lines from the old faucet. Remove the mounting nuts that hold the faucet to the sink.',
              required_tools: ['tool_1'],
              is_active: false,
              is_completed: false
            }
          ];
          
          setSteps(mockSteps);
          setCurrentStep(mockSteps.find(s => s.is_active) || mockSteps[0]);
        } else {
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
      loadProjectData();
    } else {
      navigate('/');
    }
  }, [projectId, navigate]);

  const handleStepComplete = () => {
    if (!currentStep) return;

    setSteps(prev => prev.map(step => {
      if (step.id === currentStep.id) {
        return { ...step, is_active: false, is_completed: true };
      }
      if (step.step_number === currentStep.step_number + 1) {
        return { ...step, is_active: true };
      }
      return step;
    }));

    // Move to next step
    const nextStep = steps.find(s => s.step_number === currentStep.step_number + 1);
    if (nextStep) {
      setCurrentStep({ ...nextStep, is_active: true });
    }
  };

  const getToolById = (toolId: string) => {
    return tools.find(tool => tool.id === toolId);
  };

  const getStepStatus = (step: Step) => {
    if (step.is_completed) return 'completed';
    if (step.is_active) return 'active';
    return 'pending';
  };

  if (loading) {
    return (
      <div className="project-execution-page">
        <div className="loading-container">
          <p>Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project || !currentStep) {
    return (
      <div className="project-execution-page">
        <div className="error-container">
          <p>Project not found</p>
          <button onClick={() => navigate('/')}>Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="project-execution-page">
      <header className="execution-header">
        <div className="header-content">
          <button className="back-button" onClick={() => navigate('/')}>
            ← Back to Home
          </button>
          <div className="project-info">
            <h1>{project.title}</h1>
            <div className="progress-info">
              <span>Step {currentStep.step_number} of {steps.length}</span>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${(currentStep.step_number / steps.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="execution-content">
        <div className="steps-section">
          <div className="current-step">
            <div className="step-header">
              <h2>{currentStep.title}</h2>
              <span className="step-number">Step {currentStep.step_number}</span>
            </div>
            
            <div className="step-description">
              <p>{currentStep.description}</p>
            </div>

            {currentStep.required_tools.length > 0 && (
              <div className="required-tools">
                <h3>🔧 Required Tools:</h3>
                <div className="tools-list">
                  {currentStep.required_tools.map(toolId => {
                    const tool = getToolById(toolId);
                    return tool ? (
                      <div key={toolId} className="tool-item">
                        <span className="tool-icon">🔧</span>
                        <div className="tool-details">
                          <span className="tool-name">{tool.name}</span>
                          <span className="tool-condition">({tool.condition})</span>
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            <div className="step-actions">
              <button 
                className="done-button"
                onClick={handleStepComplete}
                disabled={currentStep.step_number === steps.length && currentStep.is_completed}
              >
                {currentStep.step_number === steps.length ? 'Complete Project' : 'Mark as Done'}
              </button>
            </div>
          </div>

          <div className="chat-section">
            <ChatInterface 
              projectId={projectId}
              stepId={currentStep.id}
            />
          </div>
        </div>

        <aside className="steps-sidebar">
          <div className="steps-overview">
            <h3>📋 Project Steps</h3>
            <div className="steps-list">
              {steps.map(step => (
                <div 
                  key={step.id} 
                  className={`step-item ${getStepStatus(step)}`}
                >
                  <div className="step-indicator">
                    {step.is_completed ? '✓' : step.step_number}
                  </div>
                  <div className="step-info">
                    <span className="step-title">{step.title}</span>
                    {step.required_tools.length > 0 && (
                      <span className="step-tools">
                        {step.required_tools.length} tool{step.required_tools.length > 1 ? 's' : ''} needed
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default ProjectExecutionPage;