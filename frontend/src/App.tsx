import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AppFrame from './components/AppFrame'
import HomePage from './pages/HomePage'
import ProjectPlanningPage from './pages/ProjectPlanningPage'
import ProjectExecutionPage from './pages/ProjectExecutionPage'
import './App.css'

function App() {
  return (
    <Router>
      <AppFrame>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/project/:projectId/plan" element={<ProjectPlanningPage />} />
          <Route path="/project/:projectId/execute" element={<ProjectExecutionPage />} />
        </Routes>
      </AppFrame>
    </Router>
  )
}

export default App
