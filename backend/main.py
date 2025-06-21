from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import json
from models import ProjectCreateRequest, Tool, HouseObject, Project
from mcp_server import mcp_server
from ollama_client import ollama_client

app = FastAPI(title="DIY Bot API", version="1.0.0")

# Enable CORS for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.get("/")
async def root():
    return {"message": "DIY Bot API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/api/tools")
async def get_tools():
    """Get all tools from inventory"""
    return list(mcp_server.tools_db.values())

@app.get("/api/house-objects")
async def get_house_objects():
    """Get all house objects"""
    return list(mcp_server.house_objects_db.values())

@app.get("/api/projects")
async def get_projects():
    """Get all projects"""
    return list(mcp_server.projects_db.values())

@app.post("/api/projects/{project_id}/generate-steps")
async def generate_steps(project_id: str):
    """Generate steps for a project"""
    try:
        if project_id not in mcp_server.projects_db:
            raise HTTPException(status_code=404, detail="Project not found")
        
        project = mcp_server.projects_db[project_id]
        
        # Use AI to generate steps based on project description
        available_tools = list(mcp_server.tools_db.values())
        steps_result = await ollama_client.generate_project_steps(
            project.description, 
            [tool.model_dump() for tool in available_tools]
        )
        
        if "error" in steps_result:
            raise HTTPException(status_code=500, detail=steps_result["error"])
        
        # Create steps in the project
        steps_data = steps_result.get("steps", [])
        project_steps = []
        
        for i, step_data in enumerate(steps_data):
            step = {
                "id": f"step_{i+1}",
                "step_number": i + 1,
                "title": step_data.get("title", f"Step {i+1}"),
                "description": step_data.get("description", ""),
                "required_tools": step_data.get("required_tools", []),
                "is_active": i == 0,  # First step is active
                "is_completed": False
            }
            project_steps.append(step)
        
        # Update project with steps
        project.steps = project_steps
        project.total_steps = len(project_steps)
        project.current_step = 1 if project_steps else None
        project.status = "in_progress"
        
        return {
            "project_id": project_id,
            "steps": project_steps,
            "status": "steps_generated"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/projects")
async def create_project(request: ProjectCreateRequest):
    """Create a new project"""
    try:
        # Create a project title from the description
        title = request.description[:50] + "..." if len(request.description) > 50 else request.description
        
        # Create project through MCP server directly
        import uuid
        project_id = str(uuid.uuid4())
        
        # Create project in MCP server database
        from models import Project, ProjectStatus
        from datetime import datetime
        
        new_project = Project(
            id=project_id,
            title=title,
            description=request.description,
            status=ProjectStatus.PLANNING,
            created_at=datetime.now().isoformat()
        )
        mcp_server.projects_db[project_id] = new_project
        
        # Get AI response for initial project discovery - analyze project and determine likely tools needed
        ai_response = await ollama_client.chat_with_mcp(
            f"A user wants to start this DIY project: '{request.description}'\n\nYour task:\n1. FIRST: Analyze this project type and think about what tools are typically needed\n2. Check their current toolroom inventory to see what they already have\n3. Ask SPECIFIC questions about the tools they'll need for THIS project\n\nFor example:\n- If it's plumbing: ask about wrenches, plungers, pipe tools\n- If it's woodworking: ask about saws, drills, measuring tools\n- If it's electrical: ask about wire strippers, voltage testers, etc.\n\nBe project-specific in your questions. Don't ask generic questions - focus on the exact tools this project will require. When they confirm they have tools, add them to their inventory immediately.",
            context={
                "project_id": project_id, 
                "phase": "discovery",
                "project_description": request.description
            },
            mcp_server=mcp_server
        )
        
        return {
            "project_id": project_id,
            "ai_response": ai_response,
            "status": "created"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/tools")
async def add_tool(tool_data: dict):
    """Add a tool to inventory (for AI to call during discovery)"""
    try:
        import uuid
        from models import Tool, ToolCondition
        
        tool_id = str(uuid.uuid4())
        new_tool = Tool(
            id=tool_id,
            name=tool_data.get("name", "Unknown Tool"),
            category=tool_data.get("category", "General"),
            quantity=tool_data.get("quantity", 1),
            condition=ToolCondition(tool_data.get("condition", "working")),
            icon_keywords=tool_data.get("icon_keywords", []),
            properties=tool_data.get("properties", {})
        )
        mcp_server.tools_db[tool_id] = new_tool
        
        return {
            "tool_id": tool_id,
            "message": f"Added {new_tool.name} to toolroom",
            "tool": new_tool.model_dump()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Get AI response
            ai_response = await ollama_client.chat_with_mcp(
                message_data.get('content', ''),
                context=message_data.get('context'),
                mcp_server=mcp_server
            )
            
            response = {
                "type": "ai_response",
                "content": ai_response,
                "timestamp": json.dumps({"timestamp": "now"})  # TODO: Add proper timestamp
            }
            await manager.send_personal_message(json.dumps(response), websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)