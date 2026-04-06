import React from 'react'
import {Outlet,NavLink} from 'react-router-dom'
import {useSocket} from '../hooks/useSocket'


function Layout() {
  const {connected} = useSocket();

  return (
   
<div className="app-shell">

      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">⬡</span>
          <span className="brand-name">CodeReview<br/><em>AI</em></span>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/prs" className="nav-link">
            <span className="nav-icon">⌥</span>
            Pull Requests
         </NavLink>
          <NavLink to="/analytics" className="nav-link">
            <span className="nav-icon">◈</span>
            Analytics
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <span className={`live-dot ${connected ? 'live' : 'offline'}`}/>
          <span className="live-label">
            {connected ? 'Live' : 'Connecting…'}
          </span>
        </div>
      </aside>

      <main className="main-area">
        <Outlet />
      </main>

    </div>
  )
}

export default Layout;