import React, { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import AnimatedBackground from "../components/AnimatedBackground"
import GlassmorphicCard from "../components/GlassmorphicCard"
import FormInput from "../components/FormInput"
import PasswordInput from "../components/PasswordInput"

const LoginPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ email: "", password: "" })
  const [rememberMe, setRememberMe] = useState(false)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage("")
    setLoading(true)

    const result = await login(form.email, form.password)
    setLoading(false)

    if (result.success) {
      const role = result.user?.role
      if (role === "admin") {
        navigate("/admin/dashboard")
      } else {
        navigate("/")
      }
    } else {
      setMessage(result.message || "Login failed")
    }
  }

  return (
    <div className="auth-page">
      <AnimatedBackground />
      
      <div className="auth-content">
        <GlassmorphicCard>
          <div className="auth-header">
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">Student Login</p>
          </div>

          {message && (
            <div className="alert-banner error" role="alert">
              <span>⚠️</span>
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <FormInput
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
              icon="✉️"
              required
              autoFocus
            />

            <PasswordInput
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />

            <div className="form-extras">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <a href="#" className="forgot-password">
                Forgot password?
              </a>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="btn-submit"
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  <span>Logging in...</span>
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>

          <div className="divider">
            <span>OR</span>
          </div>

          <Link to="/otp" className="btn-secondary">
            Use OTP Login
          </Link>

          <p className="auth-footer">
            Don't have an account? <Link to="/register" className="link">Sign up</Link>
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

        .auth-form {
          margin-bottom: 1.5rem;
        }

        .form-extras {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .remember-me {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.9rem;
          cursor: pointer;
        }

        .remember-me input[type="checkbox"] {
          width: 1rem;
          height: 1rem;
          cursor: pointer;
          accent-color: #3b82f6;
        }

        .forgot-password {
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.9rem;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .forgot-password:hover {
          color: white;
          text-decoration: underline;
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

        .divider {
          position: relative;
          text-align: center;
          margin: 1.5rem 0;
        }

        .divider::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          width: 100%;
          height: 1px;
          background: rgba(255, 255, 255, 0.3);
        }

        .divider span {
          position: relative;
          background: transparent;
          padding: 0 1rem;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.875rem;
          font-weight: 500;
        }

        .btn-secondary {
          width: 100%;
          display: block;
          text-align: center;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          padding: 0.75rem 1.5rem;
          backdrop-filter: blur(8px);
          transition: all 0.3s ease;
          text-decoration: none;
          font-weight: 500;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.5);
          transform: translateY(-1px);
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

          .form-extras {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  )
}

export default LoginPage
