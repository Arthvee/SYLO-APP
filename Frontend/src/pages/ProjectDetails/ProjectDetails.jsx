import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { projects, updateProjectTasks } from '../../data/mockData'
import { calculateProgress, getProjectState } from '../../utils/calculateProgress'
import ProgressBar from '../../components/projects/ProgressBar'
import './ProjectDetails.css'

const statusOptions = [
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
]

function ProjectDetails() {
  const { id } = useParams()
  const project = projects.find((p) => p.id === id)
  const [tasks, setTasks] = useState(project ? project.tasks : [])
  const [tab, setTab] = useState('Tasks')
  const [newTitle, setNewTitle] = useState('')
  const [newAssignee, setNewAssignee] = useState('')

  if (!project) {
    return (
      <div>
        <h1>Project not found</h1>
        <Link to="/projects" className="backLink">Back to Projects</Link>
      </div>
    )
  }

  const isAdmin = project.role === 'admin'
  const progress = calculateProgress(tasks)
  const members = [...new Set(tasks.map((t) => t.assignee).filter(Boolean))]

  function saveTasks(updated) {
    setTasks(updated)
    updateProjectTasks(project.id, updated)
  }

  function changeStatus(taskId, status) {
    saveTasks(tasks.map((task) => (task.id === taskId ? { ...task, status } : task)))
  }

  function addTask() {
    if (!newTitle.trim()) return
    const task = {
      id: `t${Date.now()}`,
      title: newTitle.trim(),
      assignee: newAssignee.trim() || 'Unassigned',
      status: 'todo',
    }
    saveTasks([...tasks, task])
    setNewTitle('')
    setNewAssignee('')
  }

  function deleteTask(taskId) {
    saveTasks(tasks.filter((task) => task.id !== taskId))
  }

  return (
    <div>
      <Link to="/projects" className="backLink">Back to Projects</Link>
      <h1>{project.name}</h1>
      <p className="pageSubtitle">{project.description}</p>
      <p className="roleTag">Your role: {isAdmin ? 'Admin' : 'Collaborator'}</p>

      <div className="tabs">
        {['Tasks', 'Members', 'Overview'].map((name) => (
          <button
            key={name}
            className={tab === name ? 'tab activeTab' : 'tab'}
            onClick={() => setTab(name)}
          >
            {name}
          </button>
        ))}
      </div>

      {tab === 'Tasks' && (
        <div>
          {isAdmin && (
            <div className="addTask">
              <input
                className="textInput"
                type="text"
                placeholder="New task title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <input
                className="textInput"
                type="text"
                placeholder="Assign to"
                value={newAssignee}
                onChange={(e) => setNewAssignee(e.target.value)}
              />
              <button className="primaryButton" onClick={addTask}>Add Task</button>
            </div>
          )}

          {tasks.map((task) => (
            <div key={task.id} className="taskRow">
              <div>
                <p className="taskTitle">{task.title}</p>
                <p className="projectMeta">{task.assignee || 'Unassigned'}</p>
              </div>
              <div className="taskActions">
                <select value={task.status} onChange={(e) => changeStatus(task.id, e.target.value)}>
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                {isAdmin && (
                  <button className="dangerButton" onClick={() => deleteTask(task.id)}>Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Members' && (
        <div>
          {members.length === 0 && <p>No members yet.</p>}
          {members.map((name) => (
            <div key={name} className="taskRow">
              <p className="taskTitle">{name}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'Overview' && (
        <div className="overview">
          <p>Deadline: {project.deadline}</p>
          <ProgressBar value={progress} />
          <p className="projectMeta">{progress}% complete, {getProjectState(progress)}</p>
          {statusOptions.map((option) => (
            <p key={option.value}>
              {option.label}: {tasks.filter((t) => t.status === option.value).length}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

export default ProjectDetails