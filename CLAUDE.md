# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DIY Bot is a comprehensive DIY project assistant application that helps users plan and execute home improvement projects. The system learns about the user's tools and house objects, provides step-by-step guidance, and maintains intelligent inventory management.

## Architecture

**Frontend**: React + Vite + TypeScript
- Location: `/frontend/`
- Main components in `/frontend/src/components/`
- Landing page with project input and modal navigation
- Real-time chat interface for project steps

**Backend**: FastAPI + Python
- Location: `/backend/`
- Main application: `backend/main.py`
- WebSocket support for real-time chat
- MCP server integration for AI state management

**Database**: Neo4j
- Graph database for tools, projects, house objects
- Complex relationships and inventory management
- Service runs on default Neo4j port (7687)

**AI**: Ollama + Mistral
- Model: `mistral:instruct`
- Integrated via MCP server for direct state manipulation
- Handles project planning, tool discovery, step generation

## Development Commands

### Frontend (React + Vite)
```bash
cd frontend
npm install                 # Install dependencies
npm run dev                 # Start development server (http://localhost:5173)
npm run build              # Build for production
npm run preview            # Preview production build
```

### Backend (FastAPI)
```bash
cd backend
source venv/bin/activate   # Activate virtual environment
pip install -r requirements.txt  # Install dependencies (if requirements.txt exists)
python main.py             # Start FastAPI server (http://localhost:8000)
# Or use: uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Database (Neo4j)
```bash
brew services start neo4j  # Start Neo4j service
brew services stop neo4j   # Stop Neo4j service
neo4j console              # Run in console mode
# Neo4j Browser: http://localhost:7474
# Default credentials: neo4j/neo4j (change on first login)
```

### AI (Ollama)
```bash
ollama list                # List installed models
ollama run mistral:instruct # Test Mistral model
ollama serve               # Start Ollama server (if not running)
```

## Key Features Implementation

### Project Planning Flow
1. User enters project description on landing page
2. AI asks clarifying questions to gather context
3. AI assesses existing tools via MCP server
4. Missing tools generate shopping list
5. "Prepare Tools" step always first, adds new tools to inventory
6. "Generate Steps" button appears when AI satisfied with preparation
7. Dynamic step insertion for tool replacement/acquisition

### AI-Controlled State Management
- All inventory changes go through AI conversation
- MCP server provides direct database access to AI
- AI announces assumption updates and inventory changes
- Conversational tool discovery with standard set assumptions

### Component Structure
- `LandingPage`: Main interface with project input
- `Modal`: Reusable modal wrapper
- `HouseModal`: Display house objects inventory
- `ToolroomModal`: Visual tool inventory with conditions
- `ProjectsModal`: Project history and management

## Development Patterns

### Adding New Components
- Create component in `/frontend/src/components/`
- Include corresponding CSS file
- Follow existing naming conventions (PascalCase)
- Use TypeScript interfaces for props

### API Integration
- Backend WebSocket endpoint: `/ws`
- Real-time communication for chat functionality
- REST endpoints for CRUD operations (to be implemented)

### Database Schema (Neo4j)
- Nodes: User, Project, Step, Tool, HouseObject
- Relationships: OWNS, REQUIRES, LOCATED_IN, PART_OF, COMPLETED
- Tool inference logic (socket wrench → individual sockets)

## Current Status

**Implemented**:
- ✅ Basic project structure and dependencies
- ✅ React frontend with landing page and modals
- ✅ FastAPI backend with WebSocket support
- ✅ Neo4j database setup and connection
- ✅ Ollama + Mistral AI integration

**Next Steps**:
- [ ] Implement MCP server for AI state management  
- [ ] Create Neo4j data models and relationships
- [ ] Integrate Ollama with FastAPI backend
- [ ] Implement project planning and step generation
- [ ] Add Noun Project icon integration
- [ ] Build step-by-step workflow with inline chat

## Testing

Run the application:
1. Start Neo4j: `brew services start neo4j`
2. Start backend: `cd backend && source venv/bin/activate && python main.py`
3. Start frontend: `cd frontend && npm run dev`
4. Visit: http://localhost:5173

## Notes

- Frontend and backend run on different ports with CORS enabled
- Neo4j requires initial password setup on first run
- Ollama model (mistral:instruct) should be pulled before use
- All tool/inventory management must go through AI conversation
- Project steps support dynamic insertion and renumbering