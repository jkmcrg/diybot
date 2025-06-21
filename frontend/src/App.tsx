import { useState } from 'react'
import LandingPage from './components/LandingPage'
import Modal from './components/Modal'
import HouseModal from './components/HouseModal'
import ToolroomModal from './components/ToolroomModal'
import ProjectsModal from './components/ProjectsModal'
import './App.css'

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

function App() {
  const [activeModal, setActiveModal] = useState<'house' | 'toolroom' | 'projects' | null>(null);
  
  // Mock data - will be replaced with real data from API
  const mockHouseObjects: HouseObject[] = [
    {
      id: '1',
      name: 'Kitchen Sink',
      location: 'Kitchen',
      type: 'Fixture',
      properties: { brand: 'Kohler', model: 'K-3380' }
    }
  ];

  const mockTools: Tool[] = [
    {
      id: '1',
      name: 'Socket Wrench Set',
      category: 'Hand Tools',
      quantity: 1,
      condition: 'working',
      properties: { size: 'Metric', pieces: '42' }
    },
    {
      id: '2',
      name: 'Cutoff Wheels',
      category: 'Consumables',
      quantity: 3,
      condition: 'working',
      properties: { size: '4.5 inch', grit: '80' }
    }
  ];

  const mockProjects: Project[] = [
    {
      id: '1',
      title: 'Replace Kitchen Sink Faucet',
      description: 'Replace old faucet with new pull-down model',
      status: 'in_progress',
      createdAt: '2024-01-15',
      currentStep: 2,
      totalSteps: 6
    }
  ];

  const handleStartProject = (projectDescription: string) => {
    console.log('Starting project:', projectDescription);
    // TODO: Implement project creation logic
  };

  const handleOpenModal = (modalType: 'house' | 'toolroom' | 'projects') => {
    setActiveModal(modalType);
  };

  const handleCloseModal = () => {
    setActiveModal(null);
  };

  const handleSelectProject = (projectId: string) => {
    console.log('Selected project:', projectId);
    setActiveModal(null);
    // TODO: Navigate to project view
  };

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
        <HouseModal houseObjects={mockHouseObjects} />
      </Modal>

      <Modal
        isOpen={activeModal === 'toolroom'}
        onClose={handleCloseModal}
        title="Toolroom"
      >
        <ToolroomModal tools={mockTools} />
      </Modal>

      <Modal
        isOpen={activeModal === 'projects'}
        onClose={handleCloseModal}
        title="Projects"
      >
        <ProjectsModal 
          projects={mockProjects}
          onSelectProject={handleSelectProject}
        />
      </Modal>
    </>
  )
}

export default App
