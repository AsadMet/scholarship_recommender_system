"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import axios from "axios"
import AdminLayout from "../../components/AdminLayout"

const UserManagement = () => {
  const { user, logout } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserDetails, setShowUserDetails] = useState(false)

  // UI state
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all") // all | user | admin
  const [sortOrder, setSortOrder] = useState("desc") // asc | desc
  const [page, setPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await axios.get("/api/users")
      setUsers(response.data)
    } catch (error) {
      setMessage("Failed to fetch users")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await axios.delete(`/api/users/${userId}`)
        setUsers(users.filter((u) => u._id !== userId))
        setMessage("User deleted successfully!")
      } catch (error) {
        setMessage("Failed to delete user")
      }
    }
  }

  const viewUserDetails = async (userId) => {
    try {
      const response = await axios.get(`/api/users/${userId}`)
      setSelectedUser(response.data)
      setShowUserDetails(true)
    } catch (error) {
      setMessage("Failed to fetch user details")
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Normalize/display name in Title Case
  const formatName = (name) => {
    if (!name) return ""
    return name
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .map((word) => {
        // handle hyphenated parts like "anne-marie"
        return word
          .split(/[-']/)
          .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
          .join("-")
      })
      .join(" ")
  }

  // Filter / sort / paginate derived data
  const normalizedSearch = search.trim().toLowerCase()
  const filteredUsers = users
    .filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false
      if (!normalizedSearch) return true
      return (
        (u.name || "").toLowerCase().includes(normalizedSearch) ||
        (u.email || "").toLowerCase().includes(normalizedSearch) ||
        (u.profile?.major || "").toLowerCase().includes(normalizedSearch)
      )
    })
    .sort((a, b) => {
      const left = new Date(a.createdAt).getTime()
      const right = new Date(b.createdAt).getTime()
      return sortOrder === "asc" ? left - right : right - left
    })

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize))
  const pagedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize)

  const handleUpdateRole = async (userId, newRole) => {
    try {
      const res = await axios.put(`/api/users/${userId}`, { role: newRole })
      setUsers((prev) => prev.map((u) => (u._id === userId ? res.data : u)))
      setMessage("User updated successfully")
      // Also update selected user if open
      if (selectedUser && selectedUser._id === userId) setSelectedUser(res.data)
    } catch (err) {
      console.error(err)
      setMessage("Failed to update user")
    }
  }

  const changePage = (newPage) => {
    setPage(Math.max(1, Math.min(totalPages, newPage)))
  }

  // Keep current page valid when filters change
  useEffect(() => {
    if (page > totalPages) setPage(1)
  }, [totalPages])

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  const headerActions = (
    <div className="header-stats">
      <span className="strong">Total: {users.length}</span>
      <span className="muted">Showing {filteredUsers.length}</span>
    </div>
  )

  return (
    <AdminLayout title="User Management" headerActions={headerActions}>
      {message && (
        <div className={message.includes("success") ? "alert-success" : "alert-error"}>
          {message}
        </div>
      )}

      {showUserDetails && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowUserDetails(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 className="modal-title">User Details</h3>
              <button onClick={() => setShowUserDetails(false)} className="modal-close">×</button>
            </div>

            <div className="modal-meta modal-strong">
              <strong>Name:</strong> {formatName(selectedUser.name)}
            </div>
            <div className="modal-meta">
              <strong>Email:</strong> {selectedUser.email}
            </div>
            <div className="modal-meta">
              <strong>Role:</strong> {selectedUser.role}
            </div>
            <div className="modal-meta">
              <strong>Joined:</strong> {formatDate(selectedUser.createdAt)}
            </div>

            {selectedUser.profile && (
              <div style={{ marginTop: "1.5rem" }}>
                <h4 style={{ marginBottom: "1rem" }}>Profile Information</h4>
               
                <div style={{ marginBottom: "0.5rem" }}>
                  <strong>GPA:</strong> {selectedUser.profile.gpa || "Not provided"}
                </div>
                <div style={{ marginBottom: "0.5rem" }}>
                  <strong>Major:</strong> {selectedUser.profile.major || "Not provided"}
                </div>
  
              </div>
            )}

            {/* Role editing */}
            <div style={{ marginTop: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <label style={{ fontWeight: "600" }}>Role:</label>
              <select value={selectedUser.role} onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })} className="input">
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>

              <button onClick={() => handleUpdateRole(selectedUser._id, selectedUser.role)} className="btn-primary">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flex: 1 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Search name, email or major"
              className="search-input"
            />
          </div>

          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <button onClick={() => { setRoleFilter("all"); setPage(1) }} className={`filter-btn ${roleFilter === "all" ? "active" : ""}`}>All</button>
            <button onClick={() => { setRoleFilter("user"); setPage(1) }} className={`filter-btn ${roleFilter === "user" ? "active" : ""}`}>Users</button>
            <button onClick={() => { setRoleFilter("admin"); setPage(1) }} className={`filter-btn ${roleFilter === "admin" ? "active" : ""}`}>Admins</button>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <div className="muted">{filteredUsers.length} result{filteredUsers.length !== 1 ? "s" : ""}</div>
          <button onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")} className="filter-btn">Sort: {sortOrder === "asc" ? "Oldest" : "Newest"}</button>
        </div>
      </div>

      <div className="card">
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr className="table-head">
                <th className="table-th">Name</th>
                <th className="table-th">Email</th>
                <th className="table-th">Role</th>
                <th className="table-th">Joined</th>
                <th className="table-th">Profile</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedUsers.length > 0 ? (
                pagedUsers.map((userData) => (
                  <tr key={userData._id} className="" onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <td className="table-td" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div className="avatar">{formatName(userData.name).charAt(0) || "U"}</div>
                      <div className="name">{formatName(userData.name)}</div>
                    </td>
                    <td className="table-td muted">{userData.email}</td>
                    <td className="table-td">
                      <span className={`status-badge ${userData.role === "admin" ? "status-not-eligible" : "status-active"}`}>
                        {userData.role}
                      </span>
                    </td>
                    <td className="table-td muted">{formatDate(userData.createdAt)}</td>
                    <td className="table-td">
                      <span className={`status-badge ${userData.profile?.major ? "status-active" : "status-inactive"}`}>
                        {userData.profile?.major ? "Complete" : "Incomplete"}
                      </span>
                    </td>
                    <td className="table-td">
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button onClick={() => viewUserDetails(userData._id)} className="btn-ghost">View</button>
                        {userData.role !== "admin" && userData._id !== user?._id && (
                          <button onClick={() => handleDeleteUser(userData._id)} className="btn-danger">Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="muted" style={{ padding: "2rem", textAlign: "center" }}>No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
        <div style={{ color: "#6b7280" }}>Page {page} of {totalPages}</div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={() => changePage(page - 1)} disabled={page === 1} className="pagination-btn">Previous</button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button key={i} onClick={() => changePage(i + 1)} className={`pagination-btn ${page === i + 1 ? "active" : ""}`}>{i + 1}</button>
          ))}
          <button onClick={() => changePage(page + 1)} disabled={page === totalPages} className="pagination-btn">Next</button>
        </div>
      </div>
    </AdminLayout>
  )
}

export default UserManagement
