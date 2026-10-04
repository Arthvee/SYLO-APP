import './Navigation.css'

function Navbar() {
  return (
    <header className="navbar">
      <input className="searchInput" type="text" placeholder="Search projects or tasks..." />
      <div className="avatar">U</div>
    </header>
  )
}

export default Navbar