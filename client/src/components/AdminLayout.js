"use client"

import { useState, useEffect, useRef } from "react"
import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import "../styles/admin.css"

const AdminLayout = ({ children, title, headerActions }) => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarWidth, setSidebarWidth] = useState(250)
  const [isResizing, setIsResizing] = useState(false)
  const sidebarRef = useRef(null)

  const handleMouseDown = (e) => {
    setIsResizing(true)
    e.preventDefault()
  }

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return

      const newWidth = e.clientX
      if (newWidth >= 200 && newWidth <= 400) {
        setSidebarWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizing])

  const navItems = [
    { path: "/admin/dashboard", label: "Dashboard" },
    { path: "/admin/scholarships", label: "Scholarships" },
    { path: "/admin/users", label: "Users" },
    { path: "/admin/reports", label: "Reports" },
  ]

  return (
    <div className="admin-layout" style={{ display: "flex", minHeight: "100vh" }}>


      <aside
        ref={sidebarRef}
        className="admin-sidebar"
        style={{ width: sidebarOpen ? `${sidebarWidth}px` : "0px" }}
      >
        <div className="header">
          <h2 style={{ color: "white", margin: 0, fontSize: "1.5rem", fontWeight: "600" }}>Admin</h2>
        </div>

        <nav className="nav">
          <ul>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <li key={item.path}>
                  <Link to={item.path} className={`nav-link ${isActive ? "active" : ""}`}>
                    {item.label}
                  </Link>
                </li>
              )
            })}
            <li>
              <button onClick={logout} className="logout-btn">Logout</button>
            </li>
          </ul>
        </nav>

        {sidebarOpen && (
          <div
            onMouseDown={handleMouseDown}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "4px",
              height: "100%",
              background: "transparent",
              cursor: "col-resize",
              zIndex: 10,
            }}
          >
            <div style={{ width: "2px", height: "100%", background: "rgba(255,255,255,0.05)", marginLeft: "1px", transition: "background 0.2s ease" }} />
          </div>
        )}
      </aside>

      <main className="admin-content" style={{ padding: 0 }}>
        <div className="admin-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="toggle-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <div>
              <h1 className="page-title">{title}</h1>
              <p className="page-subtitle">Welcome back, {user?.name}</p>
            </div>
          </div>
          {headerActions && <div style={{ display: "flex", gap: "1rem" }}>{headerActions}</div>}
        </div>

        <div style={{ padding: "2rem" }}>{children}</div>
      </main>
    </div>
  )
}

export default AdminLayout
