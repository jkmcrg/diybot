import React from 'react';
import './InventoryModal.css';

interface Project {
  id: string;
  title: string;
  description: string;
  status: 'planning' | 'in_progress' | 'completed' | 'paused';
  createdAt: string;
  completedAt?: string;
  currentStep?: number;
  totalSteps?: number;
}

interface ProjectsModalProps {
  projects: Project[];
  onSelectProject: (projectId: string) => void;
}

const ProjectsModal: React.FC<ProjectsModalProps> = ({ projects, onSelectProject }) => {
  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'completed': return '#28a745';
      case 'in_progress': return '#007bff';
      case 'planning': return '#ffc107';
      case 'paused': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getStatusLabel = (status: Project['status']) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in_progress': return 'In Progress';
      case 'planning': return 'Planning';
      case 'paused': return 'Paused';
      default: return 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="inventory-modal">
      {projects.length === 0 ? (
        <div className="empty-state">
          <p>No projects started yet.</p>
          <p>Create your first project to get started!</p>
        </div>
      ) : (
        <div className="inventory-grid">
          {projects.map((project) => (
            <div 
              key={project.id} 
              className="inventory-item project-item"
              onClick={() => onSelectProject(project.id)}
            >
              <div className="item-icon">🔨</div>
              <div className="item-details">
                <h3 className="item-name">{project.title}</h3>
                <p className="item-description">{project.description}</p>
                <div className="project-stats">
                  <span 
                    className="status"
                    style={{ color: getStatusColor(project.status) }}
                  >
                    {getStatusLabel(project.status)}
                  </span>
                  {project.currentStep && project.totalSteps && (
                    <span className="progress">
                      Step {project.currentStep} of {project.totalSteps}
                    </span>
                  )}
                </div>
                <div className="project-dates">
                  <span className="created-date">
                    Started: {formatDate(project.createdAt)}
                  </span>
                  {project.completedAt && (
                    <span className="completed-date">
                      Completed: {formatDate(project.completedAt)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsModal;