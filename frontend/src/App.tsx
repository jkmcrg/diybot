import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ProjectPlanningPage from './pages/ProjectPlanningPage'
import ProjectExecutionPage from './pages/ProjectExecutionPage'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/project/:projectId/plan" element={<ProjectPlanningPage />} />
          <Route path="/project/:projectId/execute" element={<ProjectExecutionPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
