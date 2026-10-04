import { NavLink } from 'react-router-dom'
import { navItems } from './navItems'
import './Navigation.css'

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="logo">Sylo</div>
      <nav>
        {navItems.map((item) => (
          <NavLink key={item.path} to={item.path} end={item.path === '/'} className="navLink">
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar