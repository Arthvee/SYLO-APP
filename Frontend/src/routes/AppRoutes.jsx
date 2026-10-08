import { Routes, Route } from 'react-router-dom'
import DashboardLayout from '../layouts/DashboardLayout'
import Dashboard from '../pages/Dashboard/Dashboard'
import Projects from '../pages/Projects/Projects'
import ProjectDetails from '../pages/ProjectDetails/ProjectDetails'
import Tasks from '../pages/Tasks/Tasks'
import Settings from '../pages/Settings/Settings'


function AppRoutes() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetails />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default AppRoutes