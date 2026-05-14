import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'

const icons = {
  dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  customers: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M8 6V4M16 6V4"/></svg>,
  time: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>,
  reports: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>,
  users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  logout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>,
  menu: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 12h18M3 6h18M3 18h18"/></svg>,
}

export default function Layout() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isAdmin = profile?.role === 'admin'

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const navItems = [
    { to: '/', label: 'Översikt', icon: 'dashboard' },
    ...(isAdmin ? [{ to: '/customers', label: 'Kunder', icon: 'customers' }] : []),
    { to: '/time', label: 'Tidregistrering', icon: 'time' },
    ...(isAdmin ? [{ to: '/reports', label: 'Rapporter', icon: 'reports' }] : []),
    ...(isAdmin ? [{ to: '/users', label: 'Användare', icon: 'users' }] : []),
  ]

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="app">
      {sidebarOpen && <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={closeSidebar}/>}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-name">Gravryds Last & Loss</div>
          <div className="sidebar-logo-sub">Projektverktyg</div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={closeSidebar}>
              {icons[item.icon]}{item.label}
            </NavLink>
          ))}
        </nav>
        {profile && (
          <div className="sidebar-user">
            <div className="avatar" style={{ background: profile.color + '22', color: profile.color }}>
              {profile.initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="avatar-name">{profile.name}</div>
              <div className="avatar-role">{profile.role === 'admin' ? 'Administratör' : 'Förare'}</div>
            </div>
            <button onClick={handleLogout} className="btn btn-sm" style={{ padding: '5px', border: 'none', background: 'none' }} title="Logga ut">
              {icons.logout}
            </button>
          </div>
        )}
      </aside>

      <div className="main">
        <div className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button className="hamburger" onClick={() => setSidebarOpen(o => !o)} aria-label="Meny">
              {icons.menu}
            </button>
            <span className="topbar-title" id="page-title">Gravryds</span>
          </div>
          <div className="topbar-actions" id="topbar-actions" />
        </div>
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
