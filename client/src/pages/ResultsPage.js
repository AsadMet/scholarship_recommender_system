"use client"

import { useState, useEffect } from "react"
import { Link, useParams } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useScholarships } from "../contexts/ScholarshipContext"
import {
  trackScholarshipClick,
  markPendingFeedback,
  getNextFeedbackNeeded,
  markFeedbackShown,
  clearPendingFeedback,
} from "../utils/sessionUtils"
import FeedbackBanner from "../components/FeedbackBanner"
import Tooltip from "../components/Tooltip"

const ResultsPage = () => {
  const { userId } = useParams()
  const { user, loading: authLoading } = useAuth()
  const { getScholarshipMatches, applyForScholarship } = useScholarships()
  const [matches, setMatches] = useState([])
  const [nonEligible, setNonEligible] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [applying, setApplying] = useState({})
  const [studentCtx, setStudentCtx] = useState({ cgpa: 0, program: "" })
  const [studentName, setStudentName] = useState("")
  const [feedbackScholarship, setFeedbackScholarship] = useState(null);

  const capitalizeWords = (str) => {
    if (!str || typeof str !== "string") return ""
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  // MOVED: All useEffect hooks to the TOP, before any conditional returns
  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true)
      setMessage("")
      try {
        if (user && userId && user.id === userId) {
          const matchData = await getScholarshipMatches(userId)
          if (matchData.eligible && matchData.nonEligible) {
            setMatches(matchData.eligible)
            setNonEligible(matchData.nonEligible)
          } else {
            setMatches(Array.isArray(matchData) ? matchData : [])
            setNonEligible([])
          }
          const cgpa = Number(user?.profile?.gpa || 0)
          const program = typeof user?.profile?.program === "string" ? user.profile.program : user?.profile?.major || ""
          setStudentCtx({ cgpa, program })
        } else {
          // Anonymous flow: read extracted data from localStorage
          const raw = typeof window !== "undefined" ? localStorage.getItem("extractedData") : null
          const items = raw ? JSON.parse(raw) : []
          const latest = Array.isArray(items) && items.length > 0 ? items[items.length - 1] : null
          const cgpa = latest?.cgpa ? Number.parseFloat(String(latest.cgpa).replace(/[^0-9.]/g, "")) : 0
          const program = latest?.program || ""
          const major = program // For anonymous users, major defaults to program
          setStudentCtx({ cgpa, program })
          const name = latest?.name || latest?.studentName || latest?.fullName || ""
          setStudentName(capitalizeWords(name))

          // Call public matches on backend
          let res
          try {
            res = await fetch("/api/scholarships/public-matches", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ cgpa, program, age: 0, major }),
            })
          } catch (_) {}
          if (!res || !res.ok) {
            res = await fetch("http://localhost:5000/api/scholarships/public-matches", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ cgpa, program, age: 0, major }),
            })
          }
          const data = await res.json()
          if (data.eligible && data.nonEligible) {
            setMatches(data.eligible)
            setNonEligible(data.nonEligible)
          } else {
            setMatches(Array.isArray(data) ? data : Array.isArray(data?.matches) ? data.matches : [])
            setNonEligible([])
          }
        }
      } catch (error) {
        setMessage("Failed to load scholarship matches")
      } finally {
        setLoading(false)
      }
    }

    fetchMatches()
  }, [user, userId, getScholarshipMatches])

  // MOVED: Feedback check useEffect to the TOP
  useEffect(() => {
    const checkForFeedback = () => {
      // Only check if document is visible
      if (document.visibilityState === "visible") {
        const scholarshipId = getNextFeedbackNeeded();
        if (scholarshipId && !feedbackScholarship) {
          // Find the scholarship details
          const scholarship = matches.find(m => m.scholarship._id === scholarshipId);
          if (scholarship) {
            setFeedbackScholarship({
              id: scholarshipId,
              title: scholarship.scholarship.title,
            });
            markFeedbackShown(scholarshipId);
          }
        }
      }
    };

    // Check immediately
    checkForFeedback();

    // Listen for page visibility changes (user returning to tab)
    document.addEventListener("visibilitychange", checkForFeedback);

    return () => {
      document.removeEventListener("visibilitychange", checkForFeedback);
    };
  }, [matches, feedbackScholarship]);

  // NOW the conditional returns can come AFTER all hooks
  if (authLoading) {
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
            width: "50px",
            height: "50px",
            border: "3px solid rgba(255,255,255,0.3)",
            borderTop: "3px solid white",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        ></div>
      </div>
    )
  }

  const handleApply = async (scholarshipId) => {
    setApplying((prev) => ({ ...prev, [scholarshipId]: true }))
    setMessage("")

    const result = await applyForScholarship(scholarshipId)

    if (result.success) {
      setMessage(result.message)
      setMatches((prev) =>
        prev.map((match) => (match.scholarship._id === scholarshipId ? { ...match, applied: true } : match)),
      )
    } else {
      setMessage(result.message)
    }

    setApplying((prev) => ({ ...prev, [scholarshipId]: false }))
  }

  const handleApplyNowClick = async (scholarship) => {
    if (!scholarship.provider.website) {
      alert("No website available for this scholarship provider");
      return;
    }

    // Track the click asynchronously (non-blocking)
    trackScholarshipClick(
      scholarship._id,
      user?._id || null
    ).catch(err => {
      // Silently fail - tracking shouldn't block the user
      console.log("Tracking failed:", err);
    });

    // Mark this scholarship for feedback
    markPendingFeedback(scholarship._id);

    // Immediately open the scholarship website
    window.open(scholarship.provider.website, "_blank");
  };

  const handleFeedbackClose = (responseType) => {
    if (feedbackScholarship) {
      clearPendingFeedback(feedbackScholarship.id);
      setFeedbackScholarship(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getMatchColor = (score) => {
    if (score >= 80) return "#10b981" // Green
    if (score >= 60) return "#f59e0b" // Yellow
    return "#ef4444" // Red
  }

  const normalize = (s) => (typeof s === "string" ? s.trim().toLowerCase() : "")
  const programMatches = (eligibleCourses, program) => {
    const courses = Array.isArray(eligibleCourses) ? eligibleCourses : []
    const hasConstraint = courses.length > 0
    if (!hasConstraint) return { ok: true, detail: "Open to any program" }
    const p = normalize(program)
    const ok = courses.some((c) => {
      const cc = normalize(c)
      if (!cc || !p) return false
      return cc === p || cc.includes(p) || p.includes(cc)
    })
    return { ok, detail: ok ? "Program matches eligible courses" : "Program does not match eligible courses" }
  }

  const getStudyLevelLabel = (scholarship) => {
    const levels = Array.isArray(scholarship?.studyLevels) ? scholarship.studyLevels : []
    const normalized = new Set(levels.map((level) => String(level).toLowerCase()))
    if (scholarship?.studyLevel) normalized.add(String(scholarship.studyLevel).toLowerCase())

    const hasDiploma = normalized.has("diploma")
    const hasDegree = normalized.has("degree")

    if (hasDiploma && hasDegree) return "Diploma & Degree"
    if (hasDiploma) return "Diploma"
    if (hasDegree) return "Degree"
    return null
  }

  const getEligibilityReasons = (scholarship) => {
    const reasons = []
    const req = scholarship?.requirements || {}
    const minGpa = typeof req.minGPA === "number" ? req.minGPA : null
    if (minGpa === null || isNaN(minGpa)) {
      reasons.push("No minimum GPA required")
    } else if (Number(studentCtx.cgpa) >= minGpa) {
      reasons.push(`Meets minimum GPA (${Number(studentCtx.cgpa)} ≥ ${minGpa})`)
    } else {
      reasons.push(`Below minimum GPA (${Number(studentCtx.cgpa)} < ${minGpa})`)
    }

    const prog = programMatches(scholarship?.eligibleCourses, studentCtx.program)
    reasons.push(prog.detail)

    return reasons
  }

  const getTotalScore = (match) => {
    if (!match || typeof match !== "object") return 0
    if (typeof match.totalScore === "number") return match.totalScore
    if (typeof match.matchScore === "number") return match.matchScore
    const rule = match.scoreBreakdown?.ruleBasedScore ?? 0
    const content = match.scoreBreakdown?.contentScore ?? 0
    return Math.round(rule + content)
  }

  const getBreakdownTooltipContent = (match, scholarship) => {
    const ruleBasedScore = match.scoreBreakdown?.ruleBasedScore ?? 0
    const contentScore = match.scoreBreakdown?.contentScore ?? 0
    const programOpenness = match.components?.programOpenness ?? 0
    const majorOpenness = match.components?.majorOpenness ?? 0

    const req = scholarship?.requirements || {}
    const minGpa = typeof req.minGPA === "number" ? req.minGPA : null

    // Debug log to see actual values
    console.log('🔍 Tooltip Debug:', { 
      scholarship: scholarship.title,
      programOpenness, 
      majorOpenness, 
      contentScore,
      fullComponents: match.components 
    });

    // Determine explanations for program and major scores
    const getProgramExplanation = () => {
      if (programOpenness >= 50) {
        return `<strong>25 points</strong> - This scholarship accepts <strong>all programs</strong>, including yours`;
      } else if (programOpenness >= 25) {
        return `<strong>25 points</strong> - Your program <strong>matches</strong> the scholarship requirements`;
      } else {
        return `<strong>0 points</strong> - Your program does <strong>not match</strong> the eligible programs`;
      }
    }

    const getMajorExplanation = () => {
      if (majorOpenness >= 50) {
        return `<strong>25 points</strong> - This scholarship accepts <strong>all majors</strong>, including yours`;
      } else if (majorOpenness >= 25) {
        return `<strong>25 points</strong> - Your major <strong>matches</strong> the scholarship requirements`;
      } else {
        return `<strong>0 points</strong> - Your major does <strong>not match</strong> the eligible majors`;
      }
    }

    const getRuleExplanation = () => {
      if (minGpa === null || isNaN(minGpa)) {
        return `<strong>50 points</strong> - No minimum GPA required, you automatically qualify`;
      } else if (studentCtx.cgpa >= minGpa) {
        return `<strong>50 points</strong> - Your GPA (<strong>${studentCtx.cgpa}</strong>) meets the minimum requirement of <strong>${minGpa}</strong>`;
      } else {
        return `<strong>0 points</strong> - Your GPA (<strong>${studentCtx.cgpa}</strong>) is below the minimum requirement of <strong>${minGpa}</strong>`;
      }
    }

    let tooltipHTML = `
      <div style="text-align: left; min-width: 260px;">
        <div style="margin-bottom: 14px; padding-bottom: 12px; border-bottom: 2px solid rgba(255,255,255,0.3);">
          <div style="font-size: 1rem; font-weight: 700; margin-bottom: 6px; color: #fbbf24;">
            📊 How Your Match Score is Calculated
          </div>
          <div style="font-size: 0.9rem; opacity: 0.95; background: rgba(255,255,255,0.1); padding: 6px 8px; border-radius: 4px;">
            <strong>Total Score: ${getTotalScore(match)}%</strong>
          </div>
          <div style="font-size: 0.75rem; opacity: 0.8; margin-top: 6px; font-style: italic;">
            Your match score combines two equally weighted components:
          </div>
        </div>
        
        <div style="margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.15);">
          <div style="font-weight: 700; margin-bottom: 6px; color: #60a5fa; font-size: 0.9rem;">
            ✅ Rule-Based Score: ${ruleBasedScore}% <span style="opacity: 0.6; font-weight: 400; font-size: 0.75rem;">(50% weight)</span>
          </div>
          <div style="font-size: 0.8rem; opacity: 0.9; line-height: 1.5; margin-bottom: 4px;">
            <strong>What it checks:</strong> Your eligibility based on GPA requirements
          </div>
          <div style="font-size: 0.75rem; opacity: 0.85; line-height: 1.4; background: rgba(96, 165, 250, 0.15); padding: 6px 8px; border-radius: 4px; border-left: 3px solid #60a5fa;">
            ${getRuleExplanation()}
          </div>
        </div>
        
        <div style="margin-bottom: 4px;">
          <div style="font-weight: 700; margin-bottom: 6px; color: #10b981; font-size: 0.9rem;">
            🎯 Content-Based Score: ${contentScore}% <span style="opacity: 0.6; font-weight: 400; font-size: 0.75rem;">(50% weight)</span>
          </div>
          <div style="font-size: 0.8rem; opacity: 0.9; line-height: 1.5; margin-bottom: 6px;">
            <strong>What it checks:</strong> How well your academic background matches the scholarship
          </div>
          <div style="background: rgba(16, 185, 129, 0.15); padding: 8px; border-radius: 4px; border-left: 3px solid #10b981;">
            <div style="font-size: 0.75rem; opacity: 0.85; line-height: 1.5; margin-bottom: 6px;">
              <div style="margin-bottom: 4px;">📚 <strong>Program Match (25 points):</strong></div>
              <div style="margin-left: 16px; margin-bottom: 8px;">
                ${getProgramExplanation()}
              </div>
              <div style="margin-bottom: 4px;">🎓 <strong>Major Match (25 points):</strong></div>
              <div style="margin-left: 16px;">
                ${getMajorExplanation()}
              </div>
            </div>
          </div>
          <div style="font-size: 0.7rem; opacity: 0.7; margin-top: 8px; font-style: italic; text-align: center;">
            💡 Tip: Higher content scores mean better academic fit!
          </div>
        </div>
      </div>
    `
    return tooltipHTML
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
            width: "50px",
            height: "50px",
            border: "3px solid rgba(255,255,255,0.3)",
            borderTop: "3px solid white",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        ></div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <header
        style={{
          background: "linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)",
          padding: "1rem 0",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Link to="/" className="logo">
            <span className="logo-icon">📜</span>
            Scholarship Matches 
          </Link>
          <nav>
            <ul className="nav-links">
              <div style={{ display: "flex", gap: "2rem" }}>
                <Link to="/profile">
                  Profile
                </Link>
                <Link to="/upload">
                  Upload Documents
                </Link>
              </div>
            </ul>
          </nav>
        </div>
      </header>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: "bold",
              color: "#1f2937",
              marginBottom: "1rem",
            }}
          >
            {studentName ? `Congratulations, ${studentName}!` : "Your Scholarship Matches"}
          </h1>
          <p
            style={{
              fontSize: "1.1rem",
              color: "#6b7280",
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            {matches.length > 0
              ? `We found ${matches.length} scholarships that match your profile.`
              : "Based on your profile, here are scholarships that match your qualifications."}
          </p>
        </div>

        {message && (
          <div
            style={{
              padding: "1rem",
              marginBottom: "2rem",
              borderRadius: "8px",
              backgroundColor: message.includes("success") || message.includes("submitted") ? "#d1fae5" : "#fee2e2",
              color: message.includes("success") || message.includes("submitted") ? "#065f46" : "#991b1b",
              border: `1px solid ${message.includes("success") || message.includes("submitted") ? "#a7f3d0" : "#fecaca"}`,
            }}
          >
            {message}
          </div>
        )}

        {matches.length === 0 ? (
          <div
            style={{
              backgroundColor: "white",
              padding: "3rem",
              borderRadius: "12px",
              textAlign: "center",
              boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
            }}
          >
            <h2 style={{ fontSize: "1.5rem", color: "#1f2937", marginBottom: "1rem" }}>No Matches Found</h2>
            <p style={{ color: "#6b7280", marginBottom: "2rem" }}>
              We couldn't find any scholarships that match your current profile. Try completing your profile or
              uploading more documents to improve your matches.
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <Link
                to="/profile"
                style={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontWeight: "500",
                }}
              >
                Complete Profile
              </Link>
              <Link
                to="/upload"
                style={{
                  backgroundColor: "#f3f4f6",
                  color: "#374151",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontWeight: "500",
                }}
              >
                Upload Documents
              </Link>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
              gap: "2rem",
            }}
          >
            {matches.map((match) => {
              const scholarship = match.scholarship
              const hasDeadline = scholarship.deadline != null && scholarship.deadline !== ""
              const isExpired = hasDeadline && new Date(scholarship.deadline) < new Date()
              const levelLabel = getStudyLevelLabel(scholarship)

              return (
                <div
                  key={scholarship._id}
                  style={{
                    backgroundColor: "white",
                    padding: "1.5rem",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
                    border: "1px solid #e5e7eb",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "1rem",
                    }}
                  >
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      {levelLabel && (
                        <div
                          style={{
                            backgroundColor: "#e0f2fe",
                            color: "#075985",
                            padding: "0.25rem 0.6rem",
                            borderRadius: "999px",
                            fontSize: "0.75rem",
                            fontWeight: "600",
                          }}
                        >
                          {levelLabel}
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        backgroundColor: "#10b981",
                        color: "white",
                        padding: "0.25rem 0.75rem",
                        borderRadius: "20px",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                      }}
                    >
                      Eligible
                    </div>
                  </div>

                  <h3
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: "600",
                      color: "#1f2937",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {scholarship.title}
                  </h3>

                  <div
                    style={{
                      fontSize: "0.875rem",
                      color: hasDeadline ? (isExpired ? "#ef4444" : "#6b7280") : "#059669",
                      marginBottom: "1rem",
                    }}
                  >
                    {hasDeadline ? (
                      <>
                        Deadline: {formatDate(scholarship.deadline)}
                        {isExpired && <span style={{ color: "#ef4444" }}> (Expired)</span>}
                      </>
                    ) : (
                      "Always Open"
                    )}
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <h4 style={{ fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem", color: "#374151" }}>
                      Requirements:
                    </h4>
                    <ul style={{ fontSize: "0.8rem", color: "#6b7280", paddingLeft: "1rem", margin: 0 }}>
                      {scholarship.requirements.minGPA > 0 && <li>Minimum GPA: {scholarship.requirements.minGPA}</li>}
                      {scholarship.requirements.maxAge < 100 && <li>Maximum Age: {scholarship.requirements.maxAge}</li>}
                      {scholarship.requirements.majors.length > 0 && (
                        <li>Majors: {scholarship.requirements.majors.join(", ")}</li>
                      )}
                    </ul>
                  </div>

                  <div
                    style={{ flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}
                  >
                    <div style={{ marginBottom: "1.5rem" }}>
                      <h4 style={{ fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem", color: "#374151" }}>
                        Why you match:
                      </h4>
                      {match.matchReasons && match.matchReasons.length > 0 ? (
                        <ul style={{ fontSize: "0.8rem", color: "#374151", paddingLeft: "1rem", margin: 0 }}>
                          {match.matchReasons.map((reason, idx) => (
                            <li key={idx} style={{ marginBottom: "0.25rem" }}>
                              <span style={{ marginRight: "0.5rem" }}>{reason.icon}</span>
                              {reason.text}
                              {reason.type === 'content' && (
                                <span style={{ 
                                  marginLeft: "0.5rem", 
                                  fontSize: "0.7rem", 
                                  color: "#10b981",
                                  fontWeight: "600"
                                }}>
                                 
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <ul style={{ fontSize: "0.8rem", color: "#374151", paddingLeft: "1rem", margin: 0 }}>
                          {getEligibilityReasons(scholarship).map((reason, idx) => (
                            <li key={idx}>{reason}</li>
                          ))}
                        </ul>
                        
                      )}
                      {match.scoreBreakdown && (
                        <Tooltip
                          position="right"
                          content={getBreakdownTooltipContent(match, scholarship)}
                        >
                          <div style={{ 
                            marginTop: "0.75rem", 
                            padding: "0.5rem", 
                            background: "#f8fafc", 
                            borderRadius: "8px",
                            fontSize: "0.75rem",
                            cursor: "help",
                            transition: "all 0.2s ease",
                            border: "1px solid #e5e7eb"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#ecf0f1";
                            e.currentTarget.style.borderColor = "#3b82f6";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#f8fafc";
                            e.currentTarget.style.borderColor = "#e5e7eb";
                          }}
                          >
                            <div style={{ fontWeight: "600", marginBottom: "0.25rem", color: "#374151" }}>
                              Match Score Breakdown:
                            </div>
                            <div style={{ color: "#6b7280" }}>
                              Rule-based: {match.scoreBreakdown.ruleBasedScore}% | 
                              Content: {match.scoreBreakdown.contentScore}% | 
                              Total: {getTotalScore(match)}%
                            </div>
                          </div>
                        </Tooltip>
                      )}
                    </div>

                    <div>
                      {match.applied ? (
                        <button
                          style={{
                            width: "100%",
                            padding: "0.75rem",
                            backgroundColor: "#10b981",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            fontWeight: "500",
                            cursor: "not-allowed",
                          }}
                          disabled
                        >
                          ✓ Applied
                        </button>
                      ) : isExpired && hasDeadline ? (
                        <button
                          style={{
                            width: "100%",
                            padding: "0.75rem",
                            backgroundColor: "#9ca3af",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            fontWeight: "500",
                            cursor: "not-allowed",
                          }}
                          disabled
                        >
                          Expired
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApplyNowClick(scholarship)}
                          disabled={applying[scholarship._id]}
                          style={{
                            width: "100%",
                            padding: "0.75rem",
                            background: applying[scholarship._id]
                              ? "#9ca3af"
                              : "linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            fontWeight: "500",
                            cursor: applying[scholarship._id] ? "not-allowed" : "pointer",
                          }}
                        >
                          {applying[scholarship._id] ? "Applying..." : "Apply Now"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Not Eligible Scholarships Section */}
        {nonEligible.length > 0 && (
          <div style={{ marginTop: "4rem" }}>
            <h2
              style={{
                fontSize: "2rem",
                fontWeight: "bold",
                color: "#1f2937",
                marginBottom: "2rem",
                textAlign: "center",
              }}
            >
              Not Eligible
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
                gap: "2rem",
              }}
            >
              {nonEligible.map((item) => {
                const scholarship = item.scholarship
                const hasDeadline = scholarship.deadline != null && scholarship.deadline !== ""

                return (
                  <div
                    key={scholarship._id}
                    style={{
                      backgroundColor: "#f9fafb",
                      padding: "1.5rem",
                      borderRadius: "12px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                      border: "1px solid #e5e7eb",
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                      opacity: 0.8,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "1rem",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "1.5rem",
                          fontWeight: "bold",
                          color: "#6b7280",
                        }}
                      >
                        {scholarship.amount > 0
                          ? `RM ${scholarship.amount.toLocaleString()}` : ""}
                      </div>
                      <div
                        style={{
                          backgroundColor: "#ef4444",
                          color: "white",
                          padding: "0.25rem 0.75rem",
                          borderRadius: "20px",
                          fontSize: "0.875rem",
                          fontWeight: "500",
                        }}
                      >
                        Not Eligible
                      </div>
                    </div>

                    <h3
                      style={{
                        fontSize: "1.25rem",
                        fontWeight: "600",
                        color: "#6b7280",
                        marginBottom: "0.5rem",
                      }}
                    >
                      {scholarship.title}
                    </h3>

                    <div
                      style={{
                        fontSize: "0.875rem",
                        color: "#6b7280",
                        marginBottom: "1rem",
                      }}
                    >
                      {hasDeadline ? (
                        <>Deadline: {formatDate(scholarship.deadline)}</>
                      ) : (
                        "Always Open"
                      )}
                    </div>

                    <div style={{ marginBottom: "1rem" }}>
                      <h4 style={{ fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem", color: "#6b7280" }}>
                        Requirements:
                      </h4>
                      <ul style={{ fontSize: "0.8rem", color: "#9ca3af", paddingLeft: "1rem", margin: 0 }}>
                        {scholarship.requirements.minGPA > 0 && <li>Minimum GPA: {scholarship.requirements.minGPA}</li>}
                        {scholarship.requirements.maxAge < 100 && <li>Maximum Age: {scholarship.requirements.maxAge}</li>}
                        {scholarship.requirements.majors.length > 0 && (
                          <li>Majors: {scholarship.requirements.majors.join(", ")}</li>
                        )}
                      </ul>
                    </div>

                    <div style={{ marginBottom: "1rem" }}>
                      <h4 style={{ fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem", color: "#ef4444" }}>
                        Why you're not eligible:
                      </h4>
                      <ul style={{ fontSize: "0.8rem", color: "#6b7280", paddingLeft: "1rem", margin: 0 }}>
                        {item.reasons.map((reason, idx) => (
                          <li key={idx} style={{ marginBottom: "0.25rem" }}>
                            <span style={{ marginRight: "0.5rem" }}>{reason.icon}</span>
                            {reason.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Feedback Banner */}
      {feedbackScholarship && (
        <FeedbackBanner
          scholarshipId={feedbackScholarship.id}
          scholarshipTitle={feedbackScholarship.title}
          onClose={handleFeedbackClose}
        />
      )}
    </div>
  )
}

export default ResultsPage
