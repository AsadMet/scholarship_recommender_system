"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import axios from "axios"
import AdminLayout from "../../components/AdminLayout"

const AdminDashboard = () => {
  const { user, logout } = useAuth()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalScholarships: 0,
    activeScholarships: 0,
    totalApplications: 0,
  })
  const [recentUsers, setRecentUsers] = useState([])
  const [recentApplications, setRecentApplications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get("/api/reports/stats")
        setStats(response.data.stats)
        setRecentUsers(response.data.recentUsers)
        setRecentApplications(response.data.recentApplications)
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <div
          style={{
            width: "60px",
            height: "60px",
            border: "4px solid rgba(255,255,255,0.3)",
            borderTop: "4px solid white",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    )
  }

  const statCards = [
    {
      value: stats.totalUsers,
      label: "Total Users",
      gradient: "linear-gradient(135deg, rgba(79,70,229,0.95) 0%, rgba(99,102,241,0.9) 100%)",
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      ),
    },
    {
      value: stats.totalScholarships,
      label: "Total Scholarships",
      gradient: "linear-gradient(135deg, rgba(88,80,255,0.9) 0%, rgba(79,70,229,0.9) 100%)",
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="2">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
          <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
        </svg> 
      ),
    },
    {
      value: stats.activeScholarships,
      label: "Active Scholarships",
      gradient: "linear-gradient(135deg, rgba(56,189,248,0.9) 0%, rgba(14,165,233,0.85) 100%)",
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
      ),
    },
    {
      value: stats.totalApplications,
      label: "Total Applications",
      gradient: "linear-gradient(135deg, rgba(34,197,94,0.9) 0%, rgba(16,185,129,0.85) 100%)",
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
      ),
    },
  ]

  return (
    <AdminLayout title="Dashboard">
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.8;
            }
          }
          .stat-card {
            animation: fadeInUp 0.6s ease-out;
            transition: all 0.3s ease;
          }
          .stat-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
          }
          .action-card {
            transition: all 0.3s ease;
          }
          .action-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 24px rgba(0,0,0,0.12);
          }
          .section-card {
            transition: all 0.3s ease;
          }
          .section-card:hover {
            box-shadow: 0 8px 16px rgba(0,0,0,0.08);
          }
        `}
      </style>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2.5rem",
        }}
      >
        {statCards.map((card, index) => (
          <div
            key={index}
            className="stat-card"
            style={{
              background: card.gradient,
              padding: "2rem",
              borderRadius: "16px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
              color: "white",
              position: "relative",
              overflow: "hidden",
              animationDelay: `${index * 0.1}s`,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-20px",
                right: "-20px",
                width: "86px",
                height: "86px",
                background: "rgba(255,255,255,0.05)",
                borderRadius: "12px",
                transform: "rotate(14deg)"
              }}
            />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ marginBottom: "1rem", opacity: 0.9 }}>{card.icon}</div>
              <div style={{ fontSize: "2.5rem", fontWeight: "700", marginBottom: "0.5rem" }}>{card.value}</div>
              <div style={{ fontSize: "0.95rem", opacity: 0.95, fontWeight: "500" }}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "2rem",
          marginBottom: "2.5rem",
        }}
      >
        <div
          className="section-card"
          style={{
            background: "white",
            borderRadius: "16px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "1.25rem 1.5rem",
              background: "linear-gradient(135deg, rgba(79,70,229,0.95) 0%, rgba(99,102,241,0.92) 100%)",
              color: "white",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "600" }}>Recent Users</h3>
          </div>
          <div style={{ padding: "1.5rem" }}>
            {recentUsers.length > 0 ? (
              recentUsers.map((user) => (
                <div
                  key={user._id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "1rem",
                    borderBottom: "1px solid #f3f4f6",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f9fafb"
                    e.currentTarget.style.borderRadius = "8px"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: "600",
                        fontSize: "1.1rem",
                      }}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: "600", color: "#1f2937", marginBottom: "0.25rem" }}>{user.name}</div>
                      <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>{user.email}</div>
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "#9ca3af",
                      background: "#f3f4f6",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "12px",
                    }}
                  >
                    {formatDate(user.createdAt)}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: "2rem", color: "#9ca3af" }}>No recent users</div>
            )}
          </div>
        </div>

        <div
          className="section-card"
          style={{
            background: "white",
            borderRadius: "16px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "1.5rem 2rem",
              background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              color: "white",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
            <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "600" }}>Recent Applications</h3>
          </div>
          <div style={{ padding: "1.5rem" }}>
            {recentApplications.length > 0 ? (
              recentApplications.map((app, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "1rem",
                    borderBottom: "1px solid #f3f4f6",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f9fafb"
                    e.currentTarget.style.borderRadius = "8px"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent"
                  }}
                >
                  <div>
                    <div style={{ fontWeight: "600", color: "#1f2937", marginBottom: "0.25rem" }}>{app.title}</div>
                    <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                      {app.user[0]?.name || "Unknown"}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "#9ca3af",
                      background: "#f3f4f6",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "12px",
                    }}
                  >
                    {formatDate(app.applicants.appliedDate)}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: "2rem", color: "#9ca3af" }}>No recent applications</div>
            )}
          </div>
        </div>
      </div>

      <div>
        <h3
          style={{
            marginBottom: "1.5rem",
            fontSize: "1.5rem",
            fontWeight: "700",
            color: "#1f2937",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2">
            <polyline points="9 11 12 14 22 4"></polyline>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
          </svg>
          Quick Actions
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.5rem",
          }}
        >
          <Link
            to="/admin/scholarships"
            className="action-card"
            style={{
              display: "block",
              padding: "2rem",
              background: "white",
              borderRadius: "16px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              textDecoration: "none",
              color: "inherit",
              border: "2px solid transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#667eea"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "transparent"
            }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "1.25rem",
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
              </svg>
            </div>
            <h4 style={{ margin: "0 0 0.75rem 0", color: "#1f2937", fontSize: "1.2rem", fontWeight: "600" }}>
              Manage Scholarships
            </h4>
            <p style={{ margin: 0, color: "#6b7280", fontSize: "0.95rem", lineHeight: "1.6" }}>
              Add, edit, or remove scholarship opportunities
            </p>
          </Link>
          <Link
            to="/admin/users"
            className="action-card"
            style={{
              display: "block",
              padding: "2rem",
              background: "white",
              borderRadius: "16px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              textDecoration: "none",
              color: "inherit",
              border: "2px solid transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#f093fb"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "transparent"
            }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "1.25rem",
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h4 style={{ margin: "0 0 0.75rem 0", color: "#1f2937", fontSize: "1.2rem", fontWeight: "600" }}>
              Manage Users
            </h4>
            <p style={{ margin: 0, color: "#6b7280", fontSize: "0.95rem", lineHeight: "1.6" }}>
              View and manage user accounts and profiles
            </p>
          </Link>
          <Link
            to="/admin/reports"
            className="action-card"
            style={{
              display: "block",
              padding: "2rem",
              background: "white",
              borderRadius: "16px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              textDecoration: "none",
              color: "inherit",
              border: "2px solid transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#4facfe"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "transparent"
            }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "1.25rem",
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
            </div>
            <h4 style={{ margin: "0 0 0.75rem 0", color: "#1f2937", fontSize: "1.2rem", fontWeight: "600" }}>
              View Reports
            </h4>
            <p style={{ margin: 0, color: "#6b7280", fontSize: "0.95rem", lineHeight: "1.6" }}>
              Analyze platform usage and performance metrics
            </p>
          </Link>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminDashboard
