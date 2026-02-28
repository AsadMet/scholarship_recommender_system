"use client"


import { createContext, useContext, useState, useEffect } from "react"
import axios from "axios"

const API_BASE = process.env.REACT_APP_API_URL; // Add this at the top of your file



const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)

  // Initialize token from localStorage on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem("token")
      setToken(storedToken)
    }
  }, [])

  // Set up axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
    } else {
      delete axios.defaults.headers.common["Authorization"]
    }
  }, [token])


  

  // Check if user is logged in on app start
 useEffect(() => {
  const checkAuth = async () => {
    if (token) {
      try {
        const response = await axios.get(`${API_BASE}/api/auth/me`);
        setUser(response.data.user);
      } catch (error) {
        console.error("Auth check failed:", error);
        if (typeof window !== 'undefined') {
          localStorage.removeItem("token");
        }
        setToken(null);
      }
    }
    setLoading(false);
  };

  if (token !== null) {
    checkAuth();
  } else {
    setLoading(false);
  }
}, [token]);

  const login = async (email, password) => {
  try {
    let response
    response = await axios.post(`${API_BASE}/api/auth/login`, { email, password })

    const { token: newToken, user: userData } = response.data

    if (typeof window !== 'undefined') {
      localStorage.setItem("token", newToken)
    }
    setToken(newToken)
    setUser(userData)

     axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

    return { success: true, user: userData }
  } catch (error) {
    console.error("Login error:", error)
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Login failed",
    }
  }
}

  const loginWithOTP = async (email, otpCode) => {
  try {
    const response = await axios.post(`${API_BASE}/api/otp/verify-otp`, { email, otpCode })

    const { token: newToken, user: userData, message } = response.data

    if (typeof window !== 'undefined') {
      localStorage.setItem("token", newToken)
    }
    setToken(newToken)
    setUser(userData)

    return { 
      success: true, 
      message: message || "Login successful",
      user: userData
    }
  } catch (error) {
    console.error("OTP Login error:", error)
    return {
      success: false,
      message: error.response?.data?.message || error.message || "OTP verification failed",
    }
  }
}

  const register = async (name, email, password) => {
  try {
    const response = await axios.post(`${API_BASE}/api/auth/register`, { name, email, password })

    // Registration does not auto-login; server returns a success message
    return { success: true, message: response.data?.message || 'Registration successful' }
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Registration failed",
    }
  }
}

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem("token")
    }
    setToken(null)
    setUser(null)
    delete axios.defaults.headers.common["Authorization"]
  }

  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put(`${API_BASE}/api/auth/profile`, profileData)
      setUser(response.data.user)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Profile update failed",
      }
    }
  }

 const updateProfileWithExtractedData = async (extractedData) => {
  try {
    const response = await axios.put(`${API_BASE}/api/auth/profile/extracted-data`, extractedData)
    setUser(response.data.user)
    return { success: true, message: response.data.message }
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Profile update with extracted data failed",
    }
  }
}

  const value = {
    user,
    login,
    loginWithOTP,
    register,
    logout,
    updateProfile,
    updateProfileWithExtractedData,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
