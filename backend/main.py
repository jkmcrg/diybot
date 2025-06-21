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
        # Use AI to analyze the project and create it
        ai_response = await ollama_client.chat_with_mcp(
            f"Create a new project: {request.description}. Ask any clarifying questions needed.",
            mcp_server=mcp_server
        )
        
        # For now, create a basic project
        # TODO: Implement proper AI integration with MCP tool calling
        project_id = "temp_project_id"
        
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