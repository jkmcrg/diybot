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
          
          // Use project steps if they exist, otherwise show message to generate steps
          if (currentProject.steps && currentProject.steps.length > 0) {
            setSteps(currentProject.steps);
            setCurrentStep(currentProject.steps.find((s: Step) => s.is_active) || currentProject.steps[0]);
          } else {
            // No steps generated yet - redirect back to planning
            console.log('No steps found for project, redirecting to planning');
            navigate(`/project/${projectId}/plan`);
            return;
          }
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
      <div className="project-header">
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
              key={currentStep.id} // Force reset when step changes
              projectId={projectId}
              stepId={currentStep.id}
              initialMessage={`I'm here to help you with Step ${currentStep.step_number}: ${currentStep.title}. 

${currentStep.description}

${currentStep.required_tools.length > 0 ? `You'll need these tools: ${currentStep.required_tools.map(toolId => {
                const tool = getToolById(toolId);
                return tool ? tool.name : toolId;
              }).join(', ')}.` : 'No specific tools required for this step.'}

If you encounter any issues, need clarification, or if tools break during this step, just let me know! I can help troubleshoot or add replacement steps as needed.`}
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