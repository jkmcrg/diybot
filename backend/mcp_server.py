from mcp.server import Server
from mcp.types import Tool as MCPTool, TextContent
import json
from typing import Dict, List, Any
from models import Tool, HouseObject, Project, ProjectStep, ToolCondition, ProjectStatus
import uuid
from datetime import datetime

class DIYBotMCPServer:
    def __init__(self):
        self.server = Server("diybot-mcp")
        self.tools_db: Dict[str, Tool] = {}
        self.house_objects_db: Dict[str, HouseObject] = {}
        self.projects_db: Dict[str, Project] = {}
        
        # Initialize with some default tools
        self._init_default_data()
        
        # Register MCP tools
        self._register_tools()
    
    def _init_default_data(self):
        """Initialize with some default tools and house objects"""
        # Add some default tools
        socket_wrench = Tool(
            id="tool_1",
            name="Socket Wrench Set",
            category="Hand Tools",
            quantity=1,
            condition=ToolCondition.WORKING,
            icon_keywords=["wrench", "socket", "ratchet"],
            properties={"size": "Metric", "pieces": "42"}
        )
        self.tools_db[socket_wrench.id] = socket_wrench
        
        cutoff_wheels = Tool(
            id="tool_2",
            name="Cutoff Wheels",
            category="Consumables",
            quantity=3,
            condition=ToolCondition.WORKING,
            icon_keywords=["wheel", "cutting", "disc"],
            properties={"size": "4.5 inch", "grit": "80"}
        )
        self.tools_db[cutoff_wheels.id] = cutoff_wheels
    
    def _register_tools(self):
        """Register all MCP tools that AI can call"""
        
        @self.server.list_tools()
        async def list_tools() -> List[MCPTool]:
            return [
                MCPTool(
                    name="get_toolroom_inventory",
                    description="Get current toolroom inventory",
                    inputSchema={
                        "type": "object",
                        "properties": {},
                    }
                ),
                MCPTool(
                    name="add_tool_to_inventory",
                    description="Add a new tool to the toolroom inventory",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "category": {"type": "string"},
                            "quantity": {"type": "integer"},
                            "condition": {"type": "string", "enum": ["working", "broken", "needs_maintenance"]},
                            "icon_keywords": {"type": "array", "items": {"type": "string"}},
                            "properties": {"type": "object"}
                        },
                        "required": ["name", "category", "quantity", "condition"]
                    }
                ),
                MCPTool(
                    name="update_tool_quantity",
                    description="Update tool quantity (e.g., when tools are used up or broken)",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "tool_id": {"type": "string"},
                            "change_amount": {"type": "integer"},
                            "reason": {"type": "string"}
                        },
                        "required": ["tool_id", "change_amount", "reason"]
                    }
                ),
                MCPTool(
                    name="update_tool_condition",
                    description="Update tool condition (working, broken, needs_maintenance)",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "tool_id": {"type": "string"},
                            "condition": {"type": "string", "enum": ["working", "broken", "needs_maintenance"]},
                            "notes": {"type": "string"}
                        },
                        "required": ["tool_id", "condition"]
                    }
                ),
                MCPTool(
                    name="add_house_object",
                    description="Add a new house object/appliance",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "location": {"type": "string"},
                            "type": {"type": "string"},
                            "properties": {"type": "object"}
                        },
                        "required": ["name", "location", "type"]
                    }
                ),
                MCPTool(
                    name="get_house_inventory",
                    description="Get current house objects inventory",
                    inputSchema={
                        "type": "object",
                        "properties": {},
                    }
                ),
                MCPTool(
                    name="create_project",
                    description="Create a new DIY project",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "title": {"type": "string"},
                            "description": {"type": "string"}
                        },
                        "required": ["title", "description"]
                    }
                ),
                MCPTool(
                    name="add_project_steps",
                    description="Add steps to a project",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "project_id": {"type": "string"},
                            "steps": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "title": {"type": "string"},
                                        "description": {"type": "string"},
                                        "required_tools": {"type": "array", "items": {"type": "string"}}
                                    },
                                    "required": ["title", "description", "required_tools"]
                                }
                            }
                        },
                        "required": ["project_id", "steps"]
                    }
                ),
                MCPTool(
                    name="get_projects",
                    description="Get all projects",
                    inputSchema={
                        "type": "object",
                        "properties": {},
                    }
                ),
            ]
        
        @self.server.call_tool()
        async def call_tool(name: str, arguments: Dict[str, Any]) -> List[TextContent]:
            try:
                if name == "get_toolroom_inventory":
                    tools_list = list(self.tools_db.values())
                    return [TextContent(
                        type="text",
                        text=json.dumps([tool.model_dump() for tool in tools_list], indent=2)
                    )]
                
                elif name == "add_tool_to_inventory":
                    tool_id = str(uuid.uuid4())
                    new_tool = Tool(
                        id=tool_id,
                        name=arguments["name"],
                        category=arguments["category"],
                        quantity=arguments["quantity"],
                        condition=ToolCondition(arguments["condition"]),
                        icon_keywords=arguments.get("icon_keywords"),
                        properties=arguments.get("properties")
                    )
                    self.tools_db[tool_id] = new_tool
                    return [TextContent(
                        type="text",
                        text=f"Added tool '{new_tool.name}' to inventory with ID {tool_id}"
                    )]
                
                elif name == "update_tool_quantity":
                    tool_id = arguments["tool_id"]
                    if tool_id in self.tools_db:
                        old_qty = self.tools_db[tool_id].quantity
                        self.tools_db[tool_id].quantity += arguments["change_amount"]
                        # Ensure quantity doesn't go below 0
                        if self.tools_db[tool_id].quantity < 0:
                            self.tools_db[tool_id].quantity = 0
                        
                        return [TextContent(
                            type="text",
                            text=f"Updated {self.tools_db[tool_id].name} quantity from {old_qty} to {self.tools_db[tool_id].quantity}. Reason: {arguments['reason']}"
                        )]
                    else:
                        return [TextContent(type="text", text=f"Tool with ID {tool_id} not found")]
                
                elif name == "update_tool_condition":
                    tool_id = arguments["tool_id"]
                    if tool_id in self.tools_db:
                        old_condition = self.tools_db[tool_id].condition
                        self.tools_db[tool_id].condition = ToolCondition(arguments["condition"])
                        notes = arguments.get("notes", "")
                        
                        return [TextContent(
                            type="text",
                            text=f"Updated {self.tools_db[tool_id].name} condition from {old_condition} to {self.tools_db[tool_id].condition}. {notes}"
                        )]
                    else:
                        return [TextContent(type="text", text=f"Tool with ID {tool_id} not found")]
                
                elif name == "add_house_object":
                    obj_id = str(uuid.uuid4())
                    new_obj = HouseObject(
                        id=obj_id,
                        name=arguments["name"],
                        location=arguments["location"],
                        type=arguments["type"],
                        properties=arguments.get("properties")
                    )
                    self.house_objects_db[obj_id] = new_obj
                    return [TextContent(
                        type="text",
                        text=f"Added house object '{new_obj.name}' in {new_obj.location} with ID {obj_id}"
                    )]
                
                elif name == "get_house_inventory":
                    objects_list = list(self.house_objects_db.values())
                    return [TextContent(
                        type="text",
                        text=json.dumps([obj.model_dump() for obj in objects_list], indent=2)
                    )]
                
                elif name == "create_project":
                    project_id = str(uuid.uuid4())
                    new_project = Project(
                        id=project_id,
                        title=arguments["title"],
                        description=arguments["description"],
                        status=ProjectStatus.PLANNING,
                        created_at=datetime.now().isoformat()
                    )
                    self.projects_db[project_id] = new_project
                    return [TextContent(
                        type="text",
                        text=f"Created project '{new_project.title}' with ID {project_id}"
                    )]
                
                elif name == "add_project_steps":
                    project_id = arguments["project_id"]
                    if project_id in self.projects_db:
                        project = self.projects_db[project_id]
                        steps_data = arguments["steps"]
                        
                        for i, step_data in enumerate(steps_data):
                            step = ProjectStep(
                                id=str(uuid.uuid4()),
                                step_number=len(project.steps) + 1,
                                title=step_data["title"],
                                description=step_data["description"],
                                required_tools=step_data["required_tools"],
                                is_active=(i == 0 and len(project.steps) == 0)  # First step is active
                            )
                            project.steps.append(step)
                        
                        project.total_steps = len(project.steps)
                        project.current_step = 1 if project.steps else None
                        project.status = ProjectStatus.IN_PROGRESS
                        
                        return [TextContent(
                            type="text",
                            text=f"Added {len(steps_data)} steps to project '{project.title}'"
                        )]
                    else:
                        return [TextContent(type="text", text=f"Project with ID {project_id} not found")]
                
                elif name == "get_projects":
                    projects_list = list(self.projects_db.values())
                    return [TextContent(
                        type="text",
                        text=json.dumps([project.model_dump() for project in projects_list], indent=2)
                    )]
                
                else:
                    return [TextContent(type="text", text=f"Unknown tool: {name}")]
            
            except Exception as e:
                return [TextContent(type="text", text=f"Error executing {name}: {str(e)}")]

# Global MCP server instance
mcp_server = DIYBotMCPServer()