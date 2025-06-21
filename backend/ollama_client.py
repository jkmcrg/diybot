import requests
import json
from typing import Dict, List, Any, Optional
from models import ChatMessage, MCPToolCall

class OllamaClient:
    def __init__(self, base_url: str = "http://localhost:11434"):
        self.base_url = base_url
        self.model = "mistral:instruct"
    
    async def chat_with_mcp(self, message: str, context: Optional[Dict] = None, mcp_server=None) -> str:
        """
        Chat with Ollama and allow it to call MCP tools for state management
        """
        try:
            # System prompt for DIY Bot
            system_prompt = """You are DIY Bot, an intelligent assistant that helps users plan and execute DIY projects. 

Your capabilities include:
- Analyzing project requirements and breaking them into steps
- Managing tool inventory through direct database access
- Discovering and cataloging house objects during conversation
- Providing step-by-step guidance with required tools
- Handling tool breakage and replacement during projects

You have access to several tools for state management:
- get_toolroom_inventory: Check what tools the user owns
- add_tool_to_inventory: Add new tools when user acquires them
- update_tool_quantity: Modify tool quantities (when used up or broken)
- update_tool_condition: Change tool condition (working/broken/needs_maintenance)
- add_house_object: Add house objects/appliances discovered during conversation
- get_house_inventory: Check existing house objects
- create_project: Create new DIY projects
- add_project_steps: Generate step-by-step instructions
- get_projects: View all projects

When a user describes a project:
1. Ask clarifying questions to understand specifics
2. Check existing tool inventory
3. Identify required tools and check availability
4. Create shopping list for missing tools
5. Once ready, create the project and generate steps

Always be conversational and helpful. Announce when you're updating inventories or making assumptions about the user's tools/house."""

            # Build conversation context
            messages = [
                {"role": "system", "content": system_prompt}
            ]
            
            # Add project context if available
            if context:
                if context.get("project_id"):
                    messages.append({
                        "role": "system", 
                        "content": f"Current project context: {json.dumps(context)}"
                    })
            
            messages.append({"role": "user", "content": message})
            
            # Make request to Ollama
            response = requests.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": self.model,
                    "messages": messages,
                    "stream": False
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                ai_response = result["message"]["content"]
                
                # For now, return the AI response
                # TODO: Implement proper MCP tool calling integration
                return ai_response
            else:
                return f"Error communicating with AI: {response.status_code}"
                
        except Exception as e:
            return f"Error: {str(e)}"
    
    async def generate_project_steps(self, project_description: str, available_tools: List[Dict]) -> Dict:
        """
        Generate project steps based on description and available tools
        """
        tools_info = "\n".join([f"- {tool['name']} ({tool['quantity']}x, {tool['condition']})" for tool in available_tools])
        
        prompt = f"""
        Based on this project: "{project_description}"
        And these available tools:
        {tools_info}
        
        Generate a detailed step-by-step plan. For each step, specify:
        1. Step title
        2. Detailed description
        3. Required tools (only from available tools)
        
        Format as JSON with this structure:
        {{
            "title": "Project Title",
            "steps": [
                {{
                    "title": "Step 1 Title",
                    "description": "Detailed instructions...",
                    "required_tools": ["tool_id1", "tool_id2"]
                }}
            ]
        }}
        """
        
        try:
            response = requests.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                ai_response = result["response"]
                
                # Try to parse JSON from response
                try:
                    # Extract JSON from response (AI might include extra text)
                    start_idx = ai_response.find('{')
                    end_idx = ai_response.rfind('}') + 1
                    if start_idx >= 0 and end_idx > start_idx:
                        json_str = ai_response[start_idx:end_idx]
                        return json.loads(json_str)
                except:
                    pass
                
                # Fallback: return raw response
                return {"title": "Generated Project", "raw_response": ai_response}
            
            return {"error": f"AI request failed: {response.status_code}"}
            
        except Exception as e:
            return {"error": str(e)}

# Global Ollama client instance
ollama_client = OllamaClient()