import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import MobileNav from '../components/MobileNav'
import Footer from '../components/Footer'
import '../styles/layouts/DashboardLayout.css'

const DashboardLayout = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)

  return (
    <div className="dashboard-layout">
      <Sidebar 
        isExpanded={isSidebarExpanded} 
        setIsExpanded={setIsSidebarExpanded} 
      />
      
      <main className={`dashboard-main ${isSidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
        <Outlet />
        <Footer />
      </main>

      <MobileNav />
    </div>
  )
}

export default DashboardLayout
