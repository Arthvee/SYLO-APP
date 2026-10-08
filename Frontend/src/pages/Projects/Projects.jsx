import { useState } from 'react'
import { Link } from 'react-router-dom'
import { projects as initialProjects } from '../../data/mockData'
import { calculateProgress, getProjectState } from '../../utils/calculateProgress'
import ProgressBar from '../../components/projects/ProgressBar'
import './Projects.css'

const tabs = ['All', 'Active', 'Completed']

function Projects() {
  const [projects, setProjects] = useState(initialProjects)
  const [tab, setTab] = useState('All')
  const [search, setSearch] = useState('')

  const visible = projects.filter((project) => {
    const completed = calculateProgress(project.tasks) === 100
    if (tab === 'Active' && completed) return false
    if (tab === 'Completed' && !completed) return false
    return project.name.toLowerCase().includes(search.toLowerCase())
  })

  function removeProject(id) {
    setProjects(projects.filter((project) => project.id !== id))
  }

  return (
    <div>
      <h1>Projects</h1>
      <p className="pageSubtitle">Manage your projects and track progress.</p>

      <div className="projectsToolbar">
        <div className="tabs">
          {tabs.map((name) => (
            <button
              key={name}
              className={tab === name ? 'tab activeTab' : 'tab'}
              onClick={() => setTab(name)}
            >
              {name}
            </button>
          ))}
        </div>
        <input
          className="searchInput"
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {visible.length === 0 && <p>No projects found.</p>}

      {visible.map((project) => {
        const progress = calculateProgress(project.tasks)
        return (
          <div key={project.id} className="projectRow">
            <div className="projectRowInfo">
              <Link to={`/projects/${project.id}`} className="projectLink">
                {project.name}
              </Link>
              <p className="projectDesc">{project.description}</p>
              <ProgressBar value={progress} />
              <p className="projectMeta">
                {progress}% complete, {getProjectState(progress)}, due {project.deadline}
              </p>
            </div>
            <button className="dangerButton" onClick={() => removeProject(project.id)}>
              {project.role === 'admin' ? 'Delete Project' : 'Leave/Hide Project'}
            </button>
          </div>
        )
      })}
    </div>
  )
}

export default Projects
