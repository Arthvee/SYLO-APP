import { NavLink } from 'react-router-dom'
import { navItems } from './navItems'
import './Navigation.css'

function MobileNav() {
  return (
    <nav className="mobileNav">
      {navItems.map((item) => (
        <NavLink key={item.path} to={item.path} end={item.path === '/'} className="mobileLink">
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

export default MobileNav