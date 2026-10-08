import { projects } from '../../data/mockData'
import { calculateProgress, getProjectState } from '../../utils/calculateProgress'
import ProgressBar from '../../components/projects/ProgressBar'
import './Dashboard.css'

function Dashboard() {
  const allTasks = projects.flatMap((project) => project.tasks)
  const stats = [
    { label: 'Total Projects', value: projects.length },
    { label: 'Total Tasks', value: allTasks.length },
    { label: 'Completed', value: allTasks.filter((t) => t.status === 'completed').length },
    { label: 'In Progress', value: allTasks.filter((t) => t.status === 'in-progress').length },
  ]

  return (
    <div>
      <h1>Dashboard</h1>
      <p className="pageSubtitle">Here is what is happening with your projects.</p>

      <div className="statGrid">
        {stats.map((stat) => (
          <div key={stat.label} className="statCard">
            <p className="statValue">{stat.value}</p>
            <p className="statLabel">{stat.label}</p>
          </div>
        ))}
      </div>

      <h2>Recent Projects</h2>
      <div className="projectGrid">
        {projects.map((project) => {
          const progress = calculateProgress(project.tasks)
          return (
            <div key={project.id} className="projectCard">
              <h3>{project.name}</h3>
              <p className="projectDesc">{project.description}</p>
              <ProgressBar value={progress} />
              <p className="projectMeta">{progress}% complete</p>
              <p className="stateTag">{getProjectState(progress)}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Dashboard