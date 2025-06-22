import requests
import json
from typing import Dict, List, Any, Optional
from models import ChatMessage, MCPToolCall

class OllamaClient:
    def __init__(self, base_url: str = "http://localhost:11434"):
        self.base_url = base_url
        self.model = "mistral:instruct"
    
    async def chat_with_mcp(self, message: str, context: Optional[Dict] = None, mcp_server=None, conversation_history: Optional[List[Dict]] = None) -> str:
        """
        Chat with Ollama with enhanced MCP integration for tool discovery
        """
        try:
            # Enhanced system prompt for project discovery phase
            if context and context.get("phase") == "discovery":
                system_prompt = f"""You are DIY Bot in PROJECT DISCOVERY mode. Your job is to thoroughly understand the user's DIY project before generating any steps.

DISCOVERY PHASE GOALS:
1. Ask specific questions about their project scope and requirements
2. Understand what tools they'll need for THIS specific project type
3. When they mention having tools, I will add them to their toolroom inventory automatically
4. Focus on the exact tools this project requires

IMPORTANT TOOL DISCOVERY PROCESS:
- Analyze the project type and think about what tools are typically needed
- Ask specific questions about tools they'll need for this project
- When user says they have a tool, I will automatically add it to their inventory
- Be conversational and encouraging
- Don't ask generic questions - focus on what THIS project needs

Current project: {context.get('project_description', 'No description yet')}
Project ID: {context.get('project_id', 'Unknown')}

Start by analyzing this project and asking specific tool-related questions. Focus on discovery, not step generation yet!"""
            elif context and context.get("step_id"):
                system_prompt = """You are DIY Bot in STEP EXECUTION mode. You're helping the user complete a specific step of their DIY project.

STEP EXECUTION GOALS:
1. Help the user complete the current step successfully
2. Answer questions about techniques, tools, or troubleshooting
3. Handle tool breakage by inserting replacement steps
4. Monitor tool inventory and update conditions as needed
5. Provide encouragement and guidance throughout the step

IMPORTANT CAPABILITIES:
- If a tool breaks during the step, immediately create a "replace tool" step
- Update tool conditions in inventory (working → broken, etc.)
- Add new tools to inventory if the user acquires them
- Insert additional steps if complications arise

Be supportive and practical. Focus on helping them succeed with the current step."""
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
                
                # Add specific step context if we're in step execution mode
                if context.get("step_id") and mcp_server:
                    # Find the current step and project details
                    project_id = context.get("project_id")
                    step_id = context.get("step_id")
                    if project_id and project_id in mcp_server.projects_db:
                        project = mcp_server.projects_db[project_id]
                        current_step = next((step for step in project.steps if step.id == step_id), None)
                        if current_step:
                            step_context = f"""
CURRENT STEP DETAILS:
- Step {current_step.step_number}: {current_step.title}
- Description: {current_step.description}
- Required Tools: {', '.join(current_step.required_tools)}
- Project: {project.title}

The user is currently working on this step. Focus your responses on helping them complete it successfully."""
                            messages.append({
                                "role": "system",
                                "content": step_context
                            })
            
            # Add conversation history if provided
            if conversation_history:
                for hist_msg in conversation_history:
                    role = "assistant" if hist_msg["type"] == "ai" else "user"
                    messages.append({"role": role, "content": hist_msg["content"]})
            
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
                
                # Enhanced response with tool inventory awareness and MCP function calling
                enhanced_response = ai_response
                
                # Parse user message for explicit tool ownership statements
                has_tool_phrases = ["i have a", "i have", "i've got", "i own", "i got", "yes i have", "yes, i have", "yes i do have", "i do have"]
                if mcp_server and any(phrase in message.lower() for phrase in has_tool_phrases):
                    
                    # Extract tool mentions and add them to inventory
                    tool_mappings = {
                        "drill": {"name": "Power Drill", "category": "Power Tools"},
                        "hammer": {"name": "Hammer", "category": "Hand Tools"},
                        "wrench": {"name": "Wrench Set", "category": "Hand Tools"},
                        "screwdriver": {"name": "Screwdriver Set", "category": "Hand Tools"},
                        "saw": {"name": "Hand Saw", "category": "Hand Tools"},
                        "pliers": {"name": "Pliers", "category": "Hand Tools"},
                        "level": {"name": "Level", "category": "Measuring Tools"},
                        "tape measure": {"name": "Tape Measure", "category": "Measuring Tools"},
                        "plunger": {"name": "Plunger", "category": "Plumbing Tools"},
                        "socket": {"name": "Socket Set", "category": "Hand Tools"},
                        "ratchet": {"name": "Ratchet", "category": "Hand Tools"}
                    }
                    
                    added_tools = []
                    
                    # Find which ownership phrase was used and look for tools after it
                    message_lower = message.lower()
                    ownership_phrase_found = None
                    phrase_position = -1
                    
                    for phrase in has_tool_phrases:
                        pos = message_lower.find(phrase)
                        if pos >= 0:
                            ownership_phrase_found = phrase
                            phrase_position = pos + len(phrase)
                            break
                    
                    if ownership_phrase_found and phrase_position >= 0:
                        # Look for tools mentioned after the ownership phrase
                        text_after_phrase = message_lower[phrase_position:]
                        
                        for keyword, tool_info in tool_mappings.items():
                            if keyword in text_after_phrase:
                                # Check if tool already exists
                                existing_tools = list(mcp_server.tools_db.values())
                                if not any(tool_info["name"].lower() in tool.name.lower() for tool in existing_tools):
                                    # Add the tool via MCP
                                    try:
                                        import uuid
                                        from models import Tool, ToolCondition
                                        
                                        tool_id = str(uuid.uuid4())
                                        new_tool = Tool(
                                            id=tool_id,
                                            name=tool_info["name"],
                                            category=tool_info["category"],
                                            quantity=1,
                                            condition=ToolCondition.WORKING,
                                            icon_keywords=[keyword],
                                            properties={}
                                        )
                                        mcp_server.tools_db[tool_id] = new_tool
                                        added_tools.append(tool_info["name"])
                                        print(f"Added tool {tool_info['name']} with ID {tool_id}. Total tools in DB: {len(mcp_server.tools_db)}")
                                    except Exception as e:
                                        print(f"Error adding tool {tool_info['name']}: {e}")
                    
                    if added_tools:
                        enhanced_response += f"\n\n✅ I've added these tools to your toolroom inventory: {', '.join(added_tools)}. I can now track them for your project!"
                
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
        
        Generate a comprehensive step-by-step plan with AT LEAST 3-5 detailed steps. Break down the project into logical phases:
        1. Preparation/planning steps
        2. Main execution steps  
        3. Finishing/cleanup steps
        
        For each step, specify:
        1. Step title (be specific and actionable)
        2. Detailed description (2-3 sentences with clear instructions)
        3. Required tools - IMPORTANT: Use the exact tool NAMES from the list above
        
        CRITICAL REQUIREMENTS:
        - Generate MULTIPLE steps (minimum 3, ideally 4-6 steps)
        - Use tool NAMES (like "Power Drill", "Wrench Set") in required_tools array
        - Make each step actionable and specific
        - Include preparation, execution, and completion phases
        
        Example for a typical DIY project:
        Step 1: Gather materials and prepare workspace
        Step 2: Measure and mark locations  
        Step 3: Main installation/construction work
        Step 4: Testing and adjustments
        Step 5: Cleanup and final inspection
        
        Format as JSON with this exact structure:
        {{
            "title": "Project Title",
            "steps": [
                {{
                    "title": "Step 1: Preparation", 
                    "description": "Detailed instructions for preparation phase including safety checks...",
                    "required_tools": ["Power Drill", "Wrench Set"]
                }},
                {{
                    "title": "Step 2: Main Work", 
                    "description": "Detailed instructions for the main execution phase...",
                    "required_tools": ["Hammer"]
                }},
                {{
                    "title": "Step 3: Finishing", 
                    "description": "Detailed instructions for completion and cleanup...",
                    "required_tools": []
                }}
            ]
        }}
        
        Generate AT LEAST 3 steps. Use exact tool NAMES from the available tools list.
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
                print(f"Raw AI response for step generation: {ai_response}")
                
                # Try to parse JSON from response
                try:
                    # Extract JSON from response (AI might include extra text)
                    start_idx = ai_response.find('{')
                    end_idx = ai_response.rfind('}') + 1
                    if start_idx >= 0 and end_idx > start_idx:
                        json_str = ai_response[start_idx:end_idx]
                        parsed_result = json.loads(json_str)
                        print(f"Successfully parsed JSON: {parsed_result}")
                        return parsed_result
                    else:
                        print("No valid JSON found in AI response")
                except Exception as e:
                    print(f"JSON parsing error: {e}")
                
                # Fallback: return raw response
                print("Using fallback response format")
                return {"title": "Generated Project", "raw_response": ai_response, "steps": []}
            
            print(f"AI request failed with status: {response.status_code}")
            return {"error": f"AI request failed: {response.status_code}"}
            
        except Exception as e:
            return {"error": str(e)}

# Global Ollama client instance
ollama_client = OllamaClient()