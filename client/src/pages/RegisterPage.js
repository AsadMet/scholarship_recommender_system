import React, { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import AnimatedBackground from "../components/AnimatedBackground"
import GlassmorphicCard from "../components/GlassmorphicCard"
import FormInput from "../components/FormInput"
import PasswordInput from "../components/PasswordInput"
import PasswordStrengthIndicator from "../components/PasswordStrengthIndicator"

const RegisterPage = () => {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" })
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("")
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage("")
    setMessageType("")

    if (!form.name || !form.email || !form.password) {
      setMessage("Please fill out all required fields.")
      setMessageType("error")
      return
    }

    if (form.password.length < 6) {
      setMessage("Password must be at least 6 characters")
      setMessageType("error")
      return
    }

    if (form.password !== form.confirm) {
      setMessage("Passwords do not match")
      setMessageType("error")
      return
    }

    setLoading(true)
    const result = await register(form.name, form.email, form.password)
    setLoading(false)

    if (result.success) {
      setMessage(result.message || "Registration successful! Redirecting...")
      setMessageType("success")
      setTimeout(() => navigate('/login'), 1200)
    } else {
      setMessage(result.message || "Registration failed")
      setMessageType("error")
    }
  }

  const passwordsMatch = form.confirm && form.password === form.confirm
  const passwordsDontMatch = form.confirm && form.password !== form.confirm

  return (
    <div className="auth-page">
      <AnimatedBackground />
      
      <div className="auth-content">
        <GlassmorphicCard>
          <div className="auth-header">
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-subtitle">Get your Scholarship Today</p>
          </div>

          {message && (
            <div className={`alert-banner ${messageType}`} role="alert">
              <span>{messageType === 'success' ? '✅' : '⚠️'}</span>
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <FormInput
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              icon="👤"
              required
              autoFocus
            />

            <FormInput
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
              icon="✉️"
              required
            />

            <PasswordInput
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Create a password"
              required
            />
            
            <PasswordStrengthIndicator password={form.password} />

            <div className="password-confirm-wrapper">
              <PasswordInput
                name="confirm"
                value={form.confirm}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
              />
              {passwordsMatch && (
                <div className="match-indicator success">
                  ✓ Passwords match
                </div>
              )}
              {passwordsDontMatch && (
                <div className="match-indicator error">
                  ✗ Passwords do not match
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="btn-submit"
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  <span>Registering...</span>
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account? <Link to="/login" className="link">Login</Link>
          </p>
        </GlassmorphicCard>
      </div>

      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 2rem 1rem;
        }

        .auth-content {
          position: relative;
          z-index: 10;
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .auth-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .auth-title {
          font-size: 2rem;
          font-weight: 700;
          color: white;
          margin-bottom: 0.5rem;
        }

        .auth-subtitle {
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.9);
          font-weight: 500;
        }

        .alert-banner {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          animation: slideDown 0.3s ease;
          font-weight: 500;
        }

        .alert-banner.error {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
        }

        .alert-banner.success {
          background: rgba(34, 197, 94, 0.15);
          border: 1px solid rgba(34, 197, 94, 0.3);
          color: #86efac;
        }

        .auth-form {
          margin-bottom: 1.5rem;
        }

        .password-confirm-wrapper {
          position: relative;
        }

        .match-indicator {
          font-size: 0.875rem;
          margin-top: -0.5rem;
          margin-bottom: 1rem;
          font-weight: 600;
          animation: slideDown 0.3s ease;
        }

        .match-indicator.success {
          color: #86efac;
        }

        .match-indicator.error {
          color: #fca5a5;
        }

        .btn-submit {
          width: 100%;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 0.875rem 2rem;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 1.5rem;
        }

        .btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
        }

        .btn-submit:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          width: 1rem;
          height: 1rem;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .auth-footer {
          text-align: center;
          margin-top: 1.5rem;
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.95rem;
        }

        .link {
          color: white;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .link:hover {
          text-decoration: underline;
        }

        @media (max-width: 640px) {
          .auth-title {
            font-size: 1.75rem;
          }
        }
      `}</style>
    </div>
  )
}

export default RegisterPage
