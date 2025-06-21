import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Modal from './Modal';
import HouseModal from './HouseModal';
import ToolroomModal from './ToolroomModal';
import ProjectsModal from './ProjectsModal';
import { api } from '../api';
import './AppFrame.css';

interface Tool {
  id: string;
  name: string;
  category: string;
  quantity: number;
  condition: 'working' | 'broken' | 'needs_maintenance';
  iconKeywords?: string[];
  properties?: Record<string, string>;
}

interface HouseObject {
  id: string;
  name: string;
  location: string;
  type: string;
  properties?: Record<string, string>;
}

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

interface AppFrameProps {
  children: React.ReactNode;
  showNavigation?: boolean;
}

const AppFrame: React.FC<AppFrameProps> = ({ children, showNavigation = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeModal, setActiveModal] = useState<'house' | 'toolroom' | 'projects' | null>(null);
  const [houseObjects, setHouseObjects] = useState<HouseObject[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data from API on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [toolsData, houseData, projectsData] = await Promise.all([
          api.getTools(),
          api.getHouseObjects(),
          api.getProjects()
        ]);
        
        setTools(toolsData);
        setHouseObjects(houseData);
        setProjects(projectsData);
      } catch (error) {
        console.error('Failed to load data:', error);
        // Keep empty arrays as fallback
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleOpenModal = (modalType: 'house' | 'toolroom' | 'projects') => {
    setActiveModal(modalType);
  };

  const handleCloseModal = () => {
    setActiveModal(null);
  };

  const handleSelectProject = (projectId: string) => {
    setActiveModal(null);
    // Navigate to project planning or execution based on project status
    const project = projects.find(p => p.id === projectId);
    if (project?.status === 'planning') {
      navigate(`/project/${projectId}/plan`);
    } else {
      navigate(`/project/${projectId}/execute`);
    }
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  const isHomePage = location.pathname === '/';

  return (
    <div className="app-frame">
      {showNavigation && (
        <nav className="app-nav">
          <div className="nav-content">
            <button 
              className={`nav-brand ${isHomePage ? 'active' : ''}`}
              onClick={handleHomeClick}
            >
              🔧 DIY Bot
            </button>
            
            <div className="nav-buttons">
              <button 
                className="nav-button"
                onClick={() => handleOpenModal('house')}
              >
                🏠 House
              </button>
              <button 
                className="nav-button"
                onClick={() => handleOpenModal('toolroom')}
              >
                🔧 Toolroom
              </button>
              <button 
                className="nav-button"
                onClick={() => handleOpenModal('projects')}
              >
                📋 Projects
              </button>
            </div>
          </div>
        </nav>
      )}

      <main className="app-content">
        {children}
      </main>
      
      <Modal
        isOpen={activeModal === 'house'}
        onClose={handleCloseModal}
        title="House Inventory"
      >
        <HouseModal houseObjects={houseObjects} />
      </Modal>

      <Modal
        isOpen={activeModal === 'toolroom'}
        onClose={handleCloseModal}
        title="Toolroom"
      >
        <ToolroomModal tools={tools} />
      </Modal>

      <Modal
        isOpen={activeModal === 'projects'}
        onClose={handleCloseModal}
        title="Projects"
      >
        <ProjectsModal 
          projects={projects}
          onSelectProject={handleSelectProject}
        />
      </Modal>
    </div>
  );
};

export default AppFrame;