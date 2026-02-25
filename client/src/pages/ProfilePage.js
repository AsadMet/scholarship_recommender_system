"use client"

import { useState, useEffect } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

const ProfilePage = () => {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    major: "",
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (user?.profile) {
      setFormData({
        major: user.profile.major || "",
      })
    }
  }, [user])

  if (authLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleUploadTranscript = (e) => {
    e.preventDefault()
    setMessage("")

    if (!formData.major) {
      setMessage("Please select your major before proceeding.")
      return
    }

    // Navigate to upload page with major in state
    navigate("/upload", { state: { major: formData.major } })
  }

  const handleUploadDocument = () => {
    setMessage("")
    if (!formData.major) {
      setMessage("Please select your major before proceeding.")
      return
    }
    navigate("/upload", { state: { major: formData.major } })
  }

 const majors = [
  // Computing & IT
  "Computer Science",
  "Information Technology",
  "Software Engineering",
  "Information Systems",
  "Data Science",
  "Artificial Intelligence",
  "Cyber Security",
  "Computer Networking",

  // Engineering
  "Electrical Engineering",
  "Electronic Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Chemical Engineering",
  "Mechatronics Engineering",
  "Biomedical Engineering",

  // Science & Applied Science
  "Mathematics",
  "Statistics",
  "Physics",
  "Chemistry",
  "Biology",
  "Biotechnology",
  "Environmental Science",
  "Biomedical Science",

  // Business & Management
  "Business Administration",
  "Accounting",
  "Finance",
  "Economics",
  "Marketing",
  "Human Resource Management",
  "Entrepreneurship",

  // Built Environment & Design
  "Architecture",
  "Quantity Surveying",
  "Urban and Regional Planning",
  "Interior Architecture",

  // Social Sciences & Others
  "Law",
  "Psychology",
  "Education",
  "Mass Communication",
  "English Language Studies",
  "Islamic Studies",
  "Sports Science",
  "Medicine",
  "Pharmacy",

  "Other"
];



  return (
    <div>
      {/* Header */}
      <header className="header" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)' }}>
        <div className="header-content">
          <Link to="/" className="logo">
            <span className="logo-icon">📜</span>
            Scholarship Profile
          </Link>
          <nav>
            <ul className="nav-links">
              <li>
                <Link to="/">Home</Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <div className="container" style={{ padding: "2rem 0" }}>
        <div className="form-container">
          <h1>Complete Your Profile</h1>
          <p style={{ marginBottom: "2rem", color: "#6b7280" }}>
            Help us find the best scholarship matches by providing detailed information about your academic background.
          </p>

          {message && (
            <div className={`alert ${message.includes("success") ? "alert-success" : "alert-error"}`}>{message}</div>
          )}

          <form onSubmit={handleUploadTranscript}>
          

            {/* Major */}
            <div className="form-group">
              <label className="form-label">Major</label>
              <select name="major" className="form-select" value={formData.major} onChange={handleInputChange}>
                <option value="">Select your major</option>
                {majors.map((major) => (
                  <option key={major} value={major}>
                    {major}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <div className="form-group">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: "100%", padding: "1rem" }}
              >
                Upload Transcript
              </button>
            </div>
          </form>

          {/* Next Steps */}
          <div
            style={{
              marginTop: "2rem",
              padding: "1.5rem",
              background: "#eff6ff",
              borderRadius: "8px",
              border: "1px solid #93c5fd",
            }}
          >
            <h3 style={{ color: "#1e40af", marginBottom: "1rem" }}>What's Next?</h3>
            <p style={{ color: "#1e40af", marginBottom: "1rem" }}>
              Complete your profile to get better scholarship matches!
            </p>
            <div>
              <button onClick={handleUploadDocument} className="btn btn-secondary" style={{ marginRight: "1rem" }}>
                Upload Documents
              </button>
              <Link to={`/results/${user.id}`} className="btn btn-primary">
                View My Matches
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
