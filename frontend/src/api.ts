const API_BASE_URL = 'http://localhost:8000';

export interface CreateProjectRequest {
  description: string;
}

export interface CreateProjectResponse {
  project_id: string;
  ai_response: string;
  status: string;
}

export const api = {
  // Projects
  createProject: async (description: string): Promise<CreateProjectResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create project: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Get all projects
  getProjects: async () => {
    const response = await fetch(`${API_BASE_URL}/api/projects`);
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    return response.json();
  },

  // Get tools
  getTools: async () => {
    const response = await fetch(`${API_BASE_URL}/api/tools`);
    if (!response.ok) {
      throw new Error(`Failed to fetch tools: ${response.statusText}`);
    }
    return response.json();
  },

  // Get house objects
  getHouseObjects: async () => {
    const response = await fetch(`${API_BASE_URL}/api/house-objects`);
    if (!response.ok) {
      throw new Error(`Failed to fetch house objects: ${response.statusText}`);
    }
    return response.json();
  },

  // Generate steps for a project
  generateSteps: async (projectId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/generate-steps`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to generate steps: ${response.statusText}`);
    }
    
    return response.json();
  },
};

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private messageHandlers: ((message: any) => void)[] = [];

  connect() {
    this.ws = new WebSocket('ws://localhost:8000/ws');
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
    };
    
    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.messageHandlers.forEach(handler => handler(message));
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
    
    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  sendMessage(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  onMessage(handler: (message: any) => void) {
    this.messageHandlers.push(handler);
  }

  removeMessageHandler(handler: (message: any) => void) {
    const index = this.messageHandlers.indexOf(handler);
    if (index > -1) {
      this.messageHandlers.splice(index, 1);
    }
  }
}