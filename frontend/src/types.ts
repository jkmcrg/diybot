export interface Tool {
  id: string;
  name: string;
  category: string;
  quantity: number;
  condition: 'working' | 'broken' | 'needs_maintenance';
  iconKeywords?: string[];
  properties?: Record<string, string>;
}

export interface HouseObject {
  id: string;
  name: string;
  location: string;
  type: string;
  properties?: Record<string, string>;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: 'planning' | 'in_progress' | 'completed' | 'paused';
  createdAt: string;
  completedAt?: string;
  currentStep?: number;
  totalSteps?: number;
}