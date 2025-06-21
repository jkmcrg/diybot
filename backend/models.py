from pydantic import BaseModel
from typing import Optional, List, Dict
from enum import Enum

class ToolCondition(str, Enum):
    WORKING = "working"
    BROKEN = "broken"
    NEEDS_MAINTENANCE = "needs_maintenance"

class ProjectStatus(str, Enum):
    PLANNING = "planning"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    PAUSED = "paused"

class Tool(BaseModel):
    id: str
    name: str
    category: str
    quantity: int
    condition: ToolCondition
    icon_keywords: Optional[List[str]] = None
    properties: Optional[Dict[str, str]] = None

class HouseObject(BaseModel):
    id: str
    name: str
    location: str
    type: str
    properties: Optional[Dict[str, str]] = None

class ProjectStep(BaseModel):
    id: str
    step_number: int
    title: str
    description: str
    required_tools: List[str]  # Tool IDs
    is_active: bool = False
    is_completed: bool = False

class Project(BaseModel):
    id: str
    title: str
    description: str
    status: ProjectStatus
    created_at: str
    completed_at: Optional[str] = None
    current_step: Optional[int] = None
    total_steps: Optional[int] = None
    steps: List[ProjectStep] = []
    initial_ai_message: Optional[str] = None

class ProjectCreateRequest(BaseModel):
    description: str

class MCPToolCall(BaseModel):
    function_name: str
    arguments: Dict
    
class ChatMessage(BaseModel):
    type: str
    content: str
    project_id: Optional[str] = None
    step_id: Optional[str] = None