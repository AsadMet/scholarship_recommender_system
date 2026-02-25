"use client"

import React from "react"
import { useNavigate } from "react-router-dom"
import OTPLogin from "../components/OTPLogin"
import { useAuth } from "../contexts/AuthContext"

const OTPLoginPage = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/")
    }
  }, [isAuthenticated, navigate])

  const handleLoginSuccess = (result) => {
    console.log("Login successful:", result)
    const role = result?.user?.role
    if (role === "admin") {
      navigate("/admin/dashboard")
    } else {
      navigate("/")
    }
  }

  const handleLoginError = (error) => {
    console.error("Login error:", error)
  }

  return (
    <div>
      <OTPLogin onSuccess={handleLoginSuccess} onError={handleLoginError} />
      <div style={{ marginTop: '1rem' }}>
        <p>
          Don't have an account? <a href="/register">Sign up</a>
        </p>
        <p>
          Or <a href="/login">Use email & password</a>
        </p>
      </div>
    </div>
  )
}

export default OTPLoginPage