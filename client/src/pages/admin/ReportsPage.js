"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import axios from "axios"
import AdminLayout from "../../components/AdminLayout"

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { Bar } from "react-chartjs-2"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const ReportsPage = () => {
  const { user, logout } = useAuth()
  const [stats, setStats] = useState({})
  const [userAnalytics, setUserAnalytics] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [statsResponse, analyticsResponse] = await Promise.all([
          axios.get("/api/reports/stats"),
          axios.get("/api/reports/users"),
        ])

        setStats(statsResponse.data.stats)
        setUserAnalytics(analyticsResponse.data)
      } catch (error) {
        console.error("Failed to fetch reports:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [])

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <div
          style={{
            width: "60px",
            height: "60px",
            border: "4px solid rgba(99,102,241,0.2)",
            borderTop: "4px solid #667eea",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }`}</style>
      </div>
    )
  }

  // Prepare chart data
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const registrationLabels = (userAnalytics.usersByMonth || []).map((d) => `${monthNames[d._id.month - 1]} ${d._id.year}`)
  const registrationCounts = (userAnalytics.usersByMonth || []).map((d) => d.count)
  const registrationData = {
    labels: registrationLabels,
    datasets: [
      {
        label: "New users",
        data: registrationCounts,
        backgroundColor: "rgba(102,126,234,0.85)",
      },
    ],
  }

  const majorsTop = (userAnalytics.usersByMajor || []).slice(0, 8)
  const toTitleCase = (s) => (s || "").toLowerCase().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
  const majorsLabels = majorsTop.map((d) => toTitleCase(String(d._id)))
  const majorsValues = majorsTop.map((d) => d.count)
  const majorsData = {
    labels: majorsLabels,
    datasets: [
      {
        label: "Students",
        data: majorsValues,
        backgroundColor: "rgba(240,147,251,0.9)",
      },
    ],
  }

  const statCards = [
    {
      value: stats.totalUsers,
      label: "Total Users",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
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
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
          <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
        </svg>
      ),
    },
    {
      value: stats.activeScholarships,
      label: "Active Scholarships",
      gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
      ),
    },
    {
      value: stats.totalApplications,
      label: "Total Applications",
      gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
      ),
    },
  ]

  return (
    <AdminLayout title="Reports & Analytics">
      <style>
        {`
          @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px);} to { opacity: 1; transform: translateY(0);} }
          .stat-card { animation: fadeInUp 0.6s ease-out; transition: all 0.3s ease; }
          .stat-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(0,0,0,0.12); }
          .section-card { transition: all 0.25s ease; }
          .section-card:hover { box-shadow: 0 12px 30px rgba(0,0,0,0.06); }
          .progress-bar { height: 8px; border-radius: 999px; background: #eef2ff; overflow: hidden; }
          .progress-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg,#667eea,#764ba2); }
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
        {statCards.map((card, i) => (
          <div
            key={i}
            className="stat-card"
            style={{
              background: card.gradient,
              padding: "1.75rem",
              borderRadius: "16px",
              color: "white",
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 8px 20px rgba(15,23,36,0.06)",
            }}
          >
            <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "90px", height: "90px", background: "rgba(255,255,255,0.08)", borderRadius: "50%" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ marginBottom: "0.75rem", opacity: 0.95 }}>{card.icon}</div>
              <div style={{ fontSize: "2.25rem", fontWeight: "700", marginBottom: "0.25rem" }}>{card.value}</div>
              <div style={{ fontSize: "0.95rem", opacity: 0.95, fontWeight: "500" }}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
        {/* User registration trends */}
        <div className="section-card" style={{ background: "white", borderRadius: "16px", overflow: "hidden" }}>
          <div style={{ padding: "1.25rem 1.5rem", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M3 3v18h18" /></svg>
            <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "600" }}>User Registration Trends</h3>
          </div>
          <div style={{ padding: "1rem" }}>
            <div style={{ height: "220px" }}>
              <Bar data={registrationData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
            </div>
            <div style={{ marginTop: "1rem" }}>
              {userAnalytics.usersByMonth?.length ? (
                userAnalytics.usersByMonth.map((data, index) => (
                  <div key={index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: index < userAnalytics.usersByMonth.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                    <div style={{ fontWeight: "600", color: "#111827" }}>{monthNames[data._id.month - 1]} {data._id.year}</div>
                    <div style={{ color: "#667eea", fontWeight: "700" }}>{data.count} users</div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: "center", padding: "1.5rem", color: "#9ca3af" }}>No data available</div>
              )}
            </div>
          </div>
        </div>

        {/* Popular majors */}
        <div className="section-card" style={{ background: "white", borderRadius: "16px", overflow: "hidden" }}>
          <div style={{ padding: "1.25rem 1.5rem", background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", color: "white", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 6 2-7L2 9h7z" /></svg>
            <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "600" }}>Popular Majors</h3>
          </div>
          <div style={{ padding: "1rem" }}>
            <div style={{ height: "220px" }}>
              <Bar data={majorsData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
            </div>
            <div style={{ marginTop: "1rem" }}>
              {majorsTop.length ? (
                majorsTop.map((data, idx) => {
                  const widthPercent = majorsValues.length ? Math.round((data.count / Math.max(...majorsValues)) * 100) : 0
                  return (
                    <div key={idx} style={{ padding: "0.8rem 0", borderBottom: idx < majorsTop.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                        <div style={{ fontWeight: "600", color: "#111827" }}>{toTitleCase(String(data._id))}</div>
                        <div style={{ fontWeight: "700", color: "#667eea" }}>{data.count}</div>
                      </div>
                      <div className="progress-bar"><div className="progress-fill" style={{ width: `${widthPercent}%` }} /></div>
                    </div>
                  )
                })
              ) : (
                <div style={{ textAlign: "center", padding: "1.5rem", color: "#9ca3af" }}>No data available</div>
              )}
            </div>
          </div>
        </div>
      </div>


    </AdminLayout>
  )
}

export default ReportsPage
