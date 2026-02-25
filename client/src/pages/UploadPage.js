"use client"

import { useState, useRef, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import axios from "axios"
import { useAuth } from "../contexts/AuthContext"
import ProgressIndicator from "../components/ProgressIndicator"

const UploadPage = () => {
  const location = useLocation()
  const selectedMajor = location.state?.major || ""
  const [files, setFiles] = useState([])
  const { user, updateProfileWithExtractedData } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentFile, setCurrentFile] = useState("")
  const [message, setMessage] = useState("")
  const [dragOver, setDragOver] = useState(false)
  const [extractedData, setExtractedData] = useState([])
  const fileInputRef = useRef(null)

  const handleFileSelect = (selectedFiles) => {
    if (!selectedFiles) return

    const fileArray = Array.from(selectedFiles)

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
      "image/gif",
    ]
    const maxSize = 10 * 1024 * 1024

    const validFiles = fileArray.filter((file) => {
      if (!allowedTypes.includes(file.type)) {
        setMessage(`Invalid file type: ${file.name}. Only PDF, DOC, DOCX, JPG, PNG, and GIF files are allowed.`)
        return false
      }

      if (file.size > maxSize) {
        setMessage(`File too large: ${file.name}. Maximum size is 10MB.`)
        return false
      }

      return true
    })

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles])
      setMessage("")
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFiles = e.dataTransfer.files
    handleFileSelect(droppedFiles)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragOver(false)
  }

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setExtractedData((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async () => {
    if (files.length === 0) {
      setMessage("Please select at least one file to upload")
      return
    }

    setUploading(true)
    setProgress(0)
    setMessage("")
    setExtractedData([])

    try {
      setMessage("Uploading files...")
      setProgress(10)
      
      const uploadPromises = files.map(async (file, index) => {
        setCurrentFile(`Uploading ${file.name}...`)
        const formData = new FormData()
        formData.append("document", file)

        const response = await axios.post("http://localhost:5000/api/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })

        setProgress(20 + (index / files.length) * 20)

        return {
          file: file,
          uploadResponse: response.data,
        }
      })

      const uploadResults = await Promise.all(uploadPromises)
      setProgress(40)
      setUploading(false)
      setExtracting(true)
      setMessage("Extracting data from documents...")
      setProgress(50)

      const extractionPromises = uploadResults.map(async (result, index) => {
        try {
          setCurrentFile(`Extracting data from ${result.file.name}...`)
          
          const extractResponse = await axios.post("http://localhost:5000/api/extract", {
            fileId: result.uploadResponse.fileId || result.uploadResponse.id,
            fileName: result.file.name,
            filePath: result.uploadResponse.filePath || result.uploadResponse.path,
          })

          const extractResult = extractResponse.data
          setProgress(50 + (index / uploadResults.length) * 45)

          return {
            fileName: result.file.name,
            name: extractResult.name || "Not found",
            cgpa: extractResult.cgpa?.toString() || "Not found",
            program: extractResult.program || "Not found",
            confidence: extractResult.confidence || { name: 0, cgpa: 0, program: 0 },
            error: extractResult.error || null,
          }
        } catch (extractError) {
          console.error(`Extraction failed for ${result.file.name}:`, extractError)

          if (extractError.response?.status === 503) {
            return {
              fileName: result.file.name,
              name: "Service unavailable",
              cgpa: "Service unavailable",
              program: "Service unavailable",
              confidence: { name: 0, cgpa: 0, program: 0 },
              error: "Python extraction service is not running on port 5001. Please start the extraction service.",
            }
          }

          return {
            fileName: result.file.name,
            name: "Extraction failed",
            cgpa: "Extraction failed",
            program: "Extraction failed",
            confidence: { name: 0, cgpa: 0, program: 0 },
            error: extractError.response?.data?.message || extractError.message || "Extraction service unavailable",
          }
        }
      })

      const extractionResults = await Promise.all(extractionPromises)
      setProgress(95)

      const validResults = extractionResults.filter((result) => {
        return (
          result !== undefined &&
          result !== null &&
          typeof result === "object" &&
          "fileName" in result &&
          typeof result.fileName === "string" &&
          result.fileName.length > 0
        )
      })

      console.log("Valid extraction results:", validResults)
      setExtractedData(validResults)
      setProgress(100)
      setCurrentFile("")

      const serviceUnavailable = validResults.some(
        (result) => result.error && result.error.includes("Python extraction service"),
      )

      if (serviceUnavailable) {
        setMessage(
          "Files uploaded but extraction service is unavailable. Please start the Python extraction service on port 5001 and try again.",
        )
      } else {
        if (user && validResults.length > 0) {
          const latestResult = validResults[validResults.length - 1]
          if (latestResult.name !== "Not found" || latestResult.cgpa !== "Not found" || latestResult.program !== "Not found") {
            try {
              const result = await updateProfileWithExtractedData({
                name: latestResult.name !== "Not found" ? latestResult.name : undefined,
                cgpa: latestResult.cgpa !== "Not found" ? latestResult.cgpa : undefined,
                program: latestResult.program !== "Not found" ? latestResult.program : undefined,
                major: selectedMajor,
              })
              
              if (result.success) {
                setMessage("Files uploaded, data extracted, and profile updated successfully!")
              } else {
                setMessage("Files uploaded and data extracted successfully! (Profile update failed)")
              }
            } catch (error) {
              console.error("Profile update error:", error)
              setMessage("Files uploaded and data extracted successfully! (Profile update failed)")
            }
          } else {
            setMessage("Files uploaded and data extracted successfully!")
          }
        } else {
          setMessage("Files uploaded and data extracted successfully!")
        }
      }
    } catch (error) {
      console.error("Upload error:", error)
      if (error.code === "ERR_NETWORK" || error.code === "ECONNREFUSED") {
        setMessage("Cannot connect to the server. Please make sure the backend server is running on port 5000.")
      } else {
        setMessage(error.response?.data?.message || "Upload failed")
      }
      setProgress(0)
    } finally {
      setUploading(false)
      setExtracting(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }

  const clearAll = () => {
    setFiles([])
    setExtractedData([])
    setMessage("")
    setProgress(0)
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }



  return (
    <div className="upload-page">
      <header className="upload-header">
        <div className="header-content">
          <Link to="/" className="logo">
            <span className="logo-icon">📜</span>
            <span>Upload transcript</span>
          </Link>
          <nav className="nav">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/profile" className="nav-link">Profile</Link>
            <Link to="/results" className="nav-link">My Matches</Link>
          </nav>
        </div>
      </header>

      <div className="upload-container">
        <div className="hero-section">
          <div className="hero-icon">📚</div>
          <h1 className="hero-title">Upload Your Documents</h1>
          <p className="hero-description">
            Upload your academic transcripts and documents. Our AI will automatically extract key
            information to match you with perfect scholarships.
          </p>
        </div>

        <div className="main-card">
          {message && !uploading && !extracting && (
            <div className={`alert ${message.includes("success") ? "success" : message.includes("failed") || message.includes("unavailable") || message.includes("Cannot connect") ? "error" : "info"}`}>
              <span className="alert-icon">
                {message.includes("success") ? "✅" : message.includes("failed") ? "❌" : "ℹ️"}
              </span>
              <span>{message}</span>
            </div>
          )}

          <ProgressIndicator 
            uploading={uploading}
            extracting={extracting}
            progress={progress}
            currentFile={currentFile}
            totalFiles={files.length}
          />

          <div
            className={`upload-dropzone ${dragOver ? "dragover" : ""} ${uploading || extracting ? "disabled" : ""}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !uploading && !extracting && fileInputRef.current?.click()}
          >
            <div className="dropzone-content">
              <div className="dropzone-icon">
                {uploading || extracting ? "⏳" : "📁"}
              </div>
              <h3 className="dropzone-title">
                {uploading || extracting ? "Processing your documents..." : "Drop files here or click to browse"}
              </h3>
              <p className="dropzone-text">
                Supported formats: PDF ONLY
                <br />
                <span>Maximum 10MB per file</span>
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf"
              onChange={(e) => handleFileSelect(e.target.files)}
              style={{ display: "none" }}
              disabled={uploading || extracting}
            />
          </div>

          {files.length > 0 && (
            <div className="files-section">
              <div className="files-header">
                <h3 className="files-title">
                  📋 Selected Files
                  <span className="file-count">{files.length}</span>
                </h3>
                {!uploading && !extracting && (
                  <button onClick={clearAll} className="btn-clear">
                    Clear All
                  </button>
                )}
              </div>
              <div className="files-list">
                {files.map((file, index) => (
                  <div key={index} className="file-item">
                    <div className="file-info">
                      <div className="file-icon">📄</div>
                      <div>
                        <div className="file-name">{file.name}</div>
                        <div className="file-size">{formatFileSize(file.size)}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="btn-remove"
                      disabled={uploading || extracting}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="action-section">
            <button
              onClick={uploadFiles}
              disabled={uploading || extracting || files.length === 0}
              className="btn-upload"
            >
              {uploading
                ? "📤 Uploading..."
                : extracting
                  ? "🔍 Extracting Data..."
                  : `🚀 Upload & Extract ${files.length} File${files.length !== 1 ? "s" : ""}`}
            </button>
          </div>

          {extractedData.length > 0 && (
            <div className="results-section">
              <h3 className="results-title">🎯 Extracted Information</h3>
              {extractedData
                .filter((data) => data && data.fileName)
                .map((data, index) => (
                  <div key={`${data.fileName}-${index}`} className="result-card">
                    <div className="result-header">
                      <div className="result-icon">📄</div>
                      <h4 className="result-filename">{data.fileName}</h4>
                    </div>

                    {data.error && (
                      <div className="error-box">
                        <span>⚠️</span>
                        <span>{data.error}</span>
                      </div>
                    )}

                    <div className="result-grid">
                      {[
                        { label: "Name", value: data.name, confidence: data.confidence?.name, icon: "👤" },
                        { label: "CGPA", value: data.cgpa, confidence: data.confidence?.cgpa, icon: "📊" },
                        { label: "Program", value: data.program, confidence: data.confidence?.program, icon: "🎓" },
                      ].map((item, idx) => (
                        <div key={idx} className="result-item">
                          <div className="result-item-label">
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                          </div>
                          <div className="result-item-value">
                            <span>{item.value || "Not found"}</span>
                            {false && (
                              <span 
                                className="confidence-badge"
                                style={{ backgroundColor: '#10b981' }}
                              >
                                {Math.round(item.confidence * 100)}%
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

              {extractedData.length > 0 && (
                <div className="upload-more-section">
                  <button
                    className="btn-upload-more"
                    onClick={() => {
                      setFiles([])
                      setExtractedData([])
                      setMessage("")
                    }}
                  >
                    📤 Replace Current File
                  </button>
                </div>
              )}
            </div>
          )}

          {extractedData.length > 0 && message.includes("success") && (
            <div className="success-banner">
              <div className="success-icon">🎉</div>
              <h3 className="success-title">Documents processed successfully!</h3>
              <p className="success-text">
                Your information has been extracted and analyzed. Ready to find your perfect scholarship matches?
              </p>
              <Link
                to={user ? `/results/${user.id}` : "/results"}
                className="btn-matches"
                onClick={() => {
                  try {
                    if (Array.isArray(extractedData) && extractedData.length) {
                      localStorage.setItem("extractedData", JSON.stringify(extractedData))
                    }
                  } catch (_) {}
                }}
              >
                🔍 View Scholarship Matches
              </Link>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .upload-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        }

        .upload-header {
          background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
          padding: 1rem 0;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.2);
        }

        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: white;
          text-decoration: none;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .logo-icon {
          font-size: 2rem;
        }

        .nav {
          display: flex;
          gap: 2rem;
        }

        .nav-link {
          color: white;
          text-decoration: none;
          font-weight: 500;
          transition: opacity 0.2s;
        }

        .nav-link:hover {
          opacity: 0.8;
        }

        .upload-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 3rem 1rem;
        }

        .hero-section {
          background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
          border-radius: 24px;
          padding: 3rem 2rem;
          text-align: center;
          color: white;
          margin-bottom: 2rem;
          box-shadow: 0 20px 40px rgba(59, 130, 246, 0.3);
        }

        .hero-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .hero-title {
          font-size: 2.5rem;
          font-weight: 700;
          margin: 0 0 1rem 0;
        }

        .hero-description {
          font-size: 1.1rem;
          opacity: 0.95;
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .main-card {
          background: white;
          border-radius: 24px;
          padding: 2.5rem;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
        }

        .alert {
          padding: 1.5rem;
          border-radius: 16px;
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          font-weight: 500;
          animation: slideDown 0.3s ease;
        }

        .alert.success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }

        .alert.error {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
        }

        .alert.info {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
        }

        .alert-icon {
          font-size: 1.5rem;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .upload-dropzone {
          border: 3px dashed #e2e8f0;
          border-radius: 20px;
          padding: 3rem 2rem;
          text-align: center;
          cursor: pointer;
          background: linear-gradient(135deg, #fafafa 0%, #f4f4f5 100%);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .upload-dropzone:hover:not(.disabled) {
          border-color: #3b82f6;
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          transform: scale(1.01);
        }

        .upload-dropzone.dragover {
          border-color: #3b82f6;
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          transform: scale(1.02);
        }

        .upload-dropzone.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .dropzone-content {
          position: relative;
          z-index: 1;
        }

        .dropzone-icon {
          font-size: 4rem;
          margin-bottom: 1.5rem;
          animation: bounce 2s infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .dropzone-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 0.75rem 0;
        }

        .dropzone-text {
          color: #6b7280;
          font-size: 1rem;
          margin: 0;
          line-height: 1.5;
        }

        .dropzone-text span {
          font-size: 0.9rem;
          opacity: 0.8;
        }

        .files-section {
          margin-top: 2.5rem;
        }

        .files-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .files-title {
          font-size: 1.3rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .file-count {
          background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .btn-clear {
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        .btn-clear:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
        }

        .files-list {
          display: grid;
          gap: 1rem;
        }

        .file-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          transition: all 0.3s;
        }

        .file-item:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .file-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .file-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }

        .file-name {
          font-weight: 600;
          color: #1f2937;
          font-size: 1rem;
        }

        .file-size {
          font-size: 0.9rem;
          color: #6b7280;
          margin-top: 0.25rem;
        }

        .btn-remove {
          padding: 0.75rem 1.25rem;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }

        .btn-remove:hover:not(:disabled) {
          transform: translateY(-2px);
        }

        .btn-remove:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .action-section {
          margin-top: 2.5rem;
          text-align: center;
        }

        .btn-upload {
          padding: 1.25rem 3rem;
          font-size: 1.1rem;
          font-weight: 700;
          background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
          color: white;
          border: none;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
        }

        .btn-upload:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 12px 35px rgba(59, 130, 246, 0.5);
        }

        .btn-upload:disabled {
          background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
          cursor: not-allowed;
          box-shadow: none;
        }

        .results-section {
          margin-top: 3rem;
        }

        .results-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .result-card {
          margin-bottom: 1.5rem;
          padding: 2rem;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .result-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .result-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
        }

        .result-filename {
          margin: 0;
          color: #1f2937;
          font-size: 1.2rem;
          font-weight: 700;
        }

        .error-box {
          color: #dc2626;
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
          border: 1px solid #fecaca;
          border-radius: 12px;
          padding: 1rem;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .result-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        }

        .result-item {
          padding: 1.25rem;
          background: white;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .result-item-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          font-size: 0.9rem;
          font-weight: 600;
          color: #475569;
        }

        .result-item-value {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
          font-weight: 600;
          color: #1f2937;
        }

        .confidence-badge {
          font-size: 0.75rem;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          color: white;
          font-weight: 700;
        }

        .upload-more-section {
          text-align: center;
          margin-top: 2rem;
        }

        .btn-upload-more {
          padding: 1rem 2rem;
          background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
          color: white;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
        }

        .btn-upload-more:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(107, 114, 128, 0.4);
        }

        .success-banner {
          margin-top: 3rem;
          padding: 2.5rem;
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          border-radius: 20px;
          border: 1px solid #93c5fd;
          text-align: center;
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.15);
        }

        .success-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .success-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e40af;
          margin: 0 0 1rem 0;
        }

        .success-text {
          color: #3730a3;
          margin: 0 0 1.5rem 0;
          font-size: 1.1rem;
          line-height: 1.5;
        }

        .btn-matches {
          padding: 1.25rem 2.5rem;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          text-decoration: none;
          border-radius: 16px;
          display: inline-block;
          font-size: 1.1rem;
          font-weight: 700;
          transition: all 0.3s;
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
        }

        .btn-matches:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 35px rgba(59, 130, 246, 0.5);
        }

        @media (max-width: 768px) {
          .nav {
            display: none;
          }

          .hero-title {
            font-size: 2rem;
          }

          .hero-description {
            font-size: 1rem;
          }

          .main-card {
            padding: 1.5rem;
          }

          .result-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

export default UploadPage
