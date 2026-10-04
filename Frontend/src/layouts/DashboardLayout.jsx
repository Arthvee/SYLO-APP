import { Outlet } from 'react-router-dom'
import Sidebar from '../components/navigation/Sidebar'
import Navbar from '../components/navigation/Navbar'
import MobileNav from '../components/navigation/MobileNav'
import './DashboardLayout.css'

function DashboardLayout() {
  return (
    <div className="layout">
      <Sidebar />
      <div className="layoutMain">
        <Navbar />
        <main className="layoutContent">
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  )
}

export default DashboardLayout