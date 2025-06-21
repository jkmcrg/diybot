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
        
        # Get AI response for initial planning questions
        ai_response = await ollama_client.chat_with_mcp(
            f"I just created a new project: {request.description}. Please ask clarifying questions to understand the project requirements, check my tool inventory, and help me plan this project step by step.",
            context={"project_id": project_id},
            mcp_server=mcp_server
        )
        
        return {
            "project_id": project_id,
            "ai_response": ai_response,
            "status": "created"
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