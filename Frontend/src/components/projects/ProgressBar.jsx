import './ProgressBar.css'

function ProgressBar({ value }) {
  return (
    <div className="progress">
      <div className="progressFill" style={{ width: `${value}%` }} />
    </div>
  )
}

export default ProgressBar