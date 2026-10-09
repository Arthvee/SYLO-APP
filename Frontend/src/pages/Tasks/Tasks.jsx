import { useMemo, useState } from 'react'
import { projects, updateProjectTasks } from '../../data/mockData'
import './Tasks.css'

const statusTabs = ['All', 'todo', 'in-progress', 'completed']
const statusLabels = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  completed: 'Completed',
}

function Tasks() {
  const initialTasks = useMemo(
    () =>
      projects.flatMap((project) =>
        project.tasks.map((task) => ({
          ...task,
          projectId: project.id,
          projectName: project.name,
        }))
      ),
    []
  )

  const [tasks, setTasks] = useState(initialTasks)
  const [tab, setTab] = useState('All')
  const [search, setSearch] = useState('')

  const visibleTasks = tasks.filter((task) => {
    const matchesTab = tab === 'All' || task.status === tab
    const searchText = search.toLowerCase()
    const matchesSearch =
      task.title.toLowerCase().includes(searchText) ||
      task.projectName.toLowerCase().includes(searchText) ||
      (task.assignee || 'Unassigned').toLowerCase().includes(searchText)

    return matchesTab && matchesSearch
  })

  const stats = [
    { label: 'Total Tasks', value: tasks.length },
    { label: 'To Do', value: tasks.filter((task) => task.status === 'todo').length },
    { label: 'In Progress', value: tasks.filter((task) => task.status === 'in-progress').length },
    { label: 'Completed', value: tasks.filter((task) => task.status === 'completed').length },
  ]

  function changeStatus(taskId, projectId, nextStatus) {
    const updatedTasks = tasks.map((task) =>
      task.id === taskId && task.projectId === projectId ? { ...task, status: nextStatus } : task
    )

    setTasks(updatedTasks)

    const project = projects.find((item) => item.id === projectId)
    if (!project) return

    const updatedProjectTasks = project.tasks.map((task) =>
      task.id === taskId ? { ...task, status: nextStatus } : task
    )

    updateProjectTasks(projectId, updatedProjectTasks)
  }

  return (
    <div>
      <h1>Tasks</h1>
      <p className="pageSubtitle">Track work across all active projects.</p>

      <div className="statGrid">
        {stats.map((stat) => (
          <div key={stat.label} className="statCard">
            <p className="statValue">{stat.value}</p>
            <p className="statLabel">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="taskToolbar">
        <div className="taskFilters">
          {statusTabs.map((name) => (
            <button
              key={name}
              className={tab === name ? 'tab activeTab' : 'tab'}
              onClick={() => setTab(name)}
            >
              {name === 'All' ? 'All' : statusLabels[name]}
            </button>
          ))}
        </div>

        <input
          className="searchInput"
          type="text"
          placeholder="Search tasks or assignees..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {visibleTasks.length === 0 && <p>No tasks match your filters.</p>}

      <div className="taskList">
        {visibleTasks.map((task) => (
          <div key={`${task.projectId}-${task.id}`} className="taskCard">
            <div className="taskDetails">
              <p className="taskProject">{task.projectName}</p>
              <p className="taskTitle">{task.title}</p>
              <div className="taskMeta">
                <span>Assignee: {task.assignee || 'Unassigned'}</span>
                <span>Status: {statusLabels[task.status] || task.status}</span>
              </div>
            </div>

            <div className="taskActions">
              <span className={`statusBadge status-${task.status}`}>{statusLabels[task.status] || task.status}</span>
              <select
                value={task.status}
                onChange={(event) => changeStatus(task.id, task.projectId, event.target.value)}
              >
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Tasks
