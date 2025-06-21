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
        Chat with Ollama with enhanced MCP integration for tool discovery
        """
        try:
            # Enhanced system prompt for project discovery phase
            if context and context.get("phase") == "discovery":
                system_prompt = """You are DIY Bot in PROJECT DISCOVERY mode. Your job is to thoroughly understand the user's DIY project before generating any steps.

DISCOVERY PHASE GOALS:
1. Ask specific questions about their project scope and requirements
2. Understand what tools they'll need (don't assume - ask!)
3. When they mention tools, check their toolroom inventory
4. Add any new tools they mention to their inventory
5. Only suggest step generation when you have enough information

IMPORTANT: You have direct access to their toolroom through these functions:
- To check existing tools: Look up their current toolroom inventory
- To add tools they mention: Add them to their toolroom immediately
- To verify tool availability: Check quantities and conditions

Be conversational and thorough. Ask follow-up questions. When they mention having a tool, add it to their inventory and confirm it's been added.

Current project: {context.get('project_description', 'No description yet')}
Project ID: {context.get('project_id', 'Unknown')}

Focus on discovery, not step generation yet!"""
            else:
                system_prompt = """You are DIY Bot, an intelligent assistant that helps users plan and execute DIY projects. 

Your capabilities include:
- Analyzing project requirements and breaking them into steps  
- Managing tool inventory through direct database access
- Discovering and cataloging house objects during conversation
- Providing step-by-step guidance with required tools
- Handling tool breakage and replacement during projects

Always be conversational and helpful. Announce when you're updating inventories or making assumptions about the user's tools/house."""

            # Build conversation context with MCP function awareness
            messages = [
                {"role": "system", "content": system_prompt}
            ]
            
            # Add current toolroom inventory to context
            if mcp_server:
                current_tools = list(mcp_server.tools_db.values())
                tools_summary = f"Current toolroom inventory: {len(current_tools)} tools including: " + ", ".join([f"{tool.name} (qty: {tool.quantity}, condition: {tool.condition})" for tool in current_tools[:3]])
                if len(current_tools) > 3:
                    tools_summary += f" and {len(current_tools) - 3} more tools."
                
                messages.append({
                    "role": "system", 
                    "content": tools_summary
                })
            
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
                
                # Enhanced response with tool inventory awareness
                enhanced_response = ai_response
                
                # If this is discovery phase and user mentions tools, suggest adding them
                if context and context.get("phase") == "discovery" and mcp_server:
                    # Simple keyword detection for tool mentions
                    tool_keywords = ["screwdriver", "hammer", "drill", "wrench", "pliers", "saw", "level", "tape measure", "plunger", "snake"]
                    mentioned_tools = [tool for tool in tool_keywords if tool.lower() in message.lower()]
                    
                    if mentioned_tools:
                        enhanced_response += f"\n\nI notice you mentioned: {', '.join(mentioned_tools)}. Let me add these to your toolroom inventory so I can track them for this project."
                
                return enhanced_response
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