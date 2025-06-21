import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import LandingPage from '../components/LandingPage'
import Modal from '../components/Modal'
import HouseModal from '../components/HouseModal'
import ToolroomModal from '../components/ToolroomModal'
import ProjectsModal from '../components/ProjectsModal'
import { api } from '../api'

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

function HomePage() {
  const navigate = useNavigate();
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

  const handleStartProject = async (projectDescription: string) => {
    try {
      setLoading(true);
      const result = await api.createProject(projectDescription);
      console.log('Project created:', result);
      
      // Reload projects to get updated data
      const updatedProjects = await api.getProjects();
      setProjects(updatedProjects);
      
      // Navigate to project planning page instead of showing alert
      // For now, use a temporary project ID - in real implementation, use result.project_id
      const projectId = result.project_id || 'temp_project_' + Date.now();
      navigate(`/project/${projectId}/plan`);
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading DIY Bot...</p>
      </div>
    );
  }

  return (
    <>
      <LandingPage 
        onStartProject={handleStartProject}
        onOpenModal={handleOpenModal}
      />
      
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
    </>
  );
}

export default HomePage;