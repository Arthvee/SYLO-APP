export function calculateProgress(tasks) {
  if (!tasks || tasks.length === 0) return 0
  const done = tasks.filter((task) => task.status === 'completed').length
  return Math.floor((done / tasks.length) * 100)
}

export function getProjectState(progress) {
  if (progress >= 100) return 'Completed'
  if (progress >= 75) return 'Almost Done'
  return 'Active'
}