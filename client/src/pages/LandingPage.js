"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useNavigate } from "react-router-dom"

const LandingPage = () => {
  const { user, login, logout } = useAuth()
  const [showLogin, setShowLogin] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // Prevent white flash after carousel animation
useEffect(() => {
  document.body.style.backgroundColor = "#ffffff"; // match your main background color
  return () => {
    document.body.style.backgroundColor = ""; // reset when leaving
  };
}, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    const result = await login(formData.email, formData.password)

    if (result.success) {
      setShowLogin(false)
      setFormData({ email: "", password: "" })
      // Redirect based on role
      const role = result.user?.role || user?.role
      if (role === "admin") {
        navigate("/admin/dashboard")
      } else {
        navigate("/")
      }
    } else {
      setMessage(result.message)
    }
    setLoading(false)
  }

  const images = [
"graduationpic1.png",
"graduationpic2.png",
"graduationpic3.png",
"graduationpic4.png"
];

const [index, setIndex] = useState(0);

// Auto-slide every 4s
useEffect(() => {
  const timer = setInterval(() => {
    setIndex((i) => (i + 1) % images.length);
  }, 4000);
  return () => clearInterval(timer);
}, []);

// Manual next/prev handlers
const nextSlide = () => {
  setIndex((i) => (i + 1) % images.length);
};

const prevSlide = () => {
  setIndex((i) => (i - 1 + images.length) % images.length);
};


  return (
    <div>
      <header className="header">
        <div className="header-content">
          <Link to="/" className="logo">
            <span className="logo-icon">📜</span>
            Scholarships Recommender 
          </Link>
          <nav>
            <ul className="nav-links" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              listStyle: 'none',
              margin: 0,
              padding: 0
            }}>
              {user ? (
                <>
                 
                <li>
                  <Link to="/profile" className="nav-link" style={{
                    color: 'white',
                    textDecoration: 'none',
                    padding: '0.6rem 1.2rem',
                    borderRadius: '8px',
                    transition: 'all 0.3s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: '500',
                    fontSize: '0.95rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}>
                    Profile
                  </Link>
                </li>
                
                <li>
                  <Link to="/results" className="nav-link" style={{
                    color: 'white',
                    textDecoration: 'none',
                    padding: '0.6rem 1.2rem',
                    borderRadius: '8px',
                    transition: 'all 0.3s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: '500',
                    fontSize: '0.95rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}>
                    My Matches
                  </Link>
                </li>
                
                <li style={{ marginLeft: '1rem' }}>
                  <button 
                    className="btn btn-secondary" 
                    onClick={logout}
                    style={{
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      color: 'white',
                      border: '1.5px solid rgba(239, 68, 68, 0.4)',
                      padding: '0.6rem 1.5rem',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      backdropFilter: 'blur(10px)',
                      fontSize: '0.95rem',
                      boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)';
                      e.target.style.borderColor = 'rgba(220, 38, 38, 0.6)';
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
                      e.target.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.3)';
                    }}
                  >
                    Logout
                  </button>
                </li>
              </>
              ) : (
                <>
                  <li>
                    <Link 
                      to="/login" 
                      className="btn btn-primary"
                      style={{
                        background: 'white',
                        color: '#1e40af',
                        border: 'none',
                        padding: '0.5rem 1.25rem',
                        borderRadius: '6px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        textDecoration: 'none',
                        display: 'inline-block',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 4px 12px rgba(255, 255, 255, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      Student Login
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/register" 
                      className="btn btn-outline"
                      style={{
                        background: 'transparent',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        padding: '0.5rem 1.25rem',
                        borderRadius: '6px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        textDecoration: 'none',
                        display: 'inline-block'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.06)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'transparent';
                      }}
                    >
                      Sign up
                    </Link>
                  </li>
                  <li>
                    <button
                      className="btn btn-primary"
                       onClick={() => navigate("/admin/login")}
                      style={{
                        background: 'rgba(102, 126, 234, 0.3)',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        padding: '0.5rem 1.25rem',
                        borderRadius: '6px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backdropFilter: 'blur(10px)'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#1e40afea';
                        e.target.style.borderColor = '#1e3a8a';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = '#2563eb';
                        e.target.style.borderColor = '#1d4ed8';
                      }}
                    >
                      Admin Login
                    </button>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
      </header>
      

      <section className="hero">
        {user && user.role !== "admin" && (
          <h2>Welcome , {user.email?.split('@')[0]}!</h2>
           )}
           <div className="animated-bg">
               <span style={{ top: "20%", left: "10%", animationDuration: "20s" }}></span>
               <span style={{ top: "50%", left: "40%", animationDuration: "20s" }}></span>
               <span style={{ top: "70%", left: "80%", animationDuration: "20s" }}></span>
               <span style={{ top: "30%", left: "70%", animationDuration: "20s" }}></span>
              </div>
          <div className="container">   
          <div className="hero-content">          
            <h1 className="hero-title">
              Look For Your Perfect
              <span className="hero-highlight"> Scholarship</span>
            </h1>
        
            <p className="hero-description">             
              Connect with the scholarship that you're looking for without wasting any of your time. Our system will help you to find the most suitable scholarship 
              based on your uploaded transcript. Feel free to upload your document.
            </p>
            
            {user && user.role !== "admin" && (
              <Link to="/profile">
                 <button className="upload-btn">
                  Upload Now
                 </button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Graduation Carousel Section */}
         <section className="carousel-section">
  <div className="carousel-wrapper">

    {/* Slider Track */}
    <div 
      className="carousel-track"
      style={{ transform: `translateX(-${index * 100}%)` }}
    >
      {images.map((src, i) => (
        <div className="slide" key={i}>
          <img src={src} alt={`Slide ${i}`} />
        </div>
      ))}
    </div>

    {/* Arrows */}
    <button className="arrow left" onClick={prevSlide}>{'<'}</button>
    <button className="arrow right" onClick={nextSlide}>{'>'}</button>

    {/* Dot Indicators */}
    <div className="carousel-dots">
      {images.map((_, i) => (
        <span
          key={i}
          className={`dot ${i === index ? "active" : ""}`}
          onClick={() => setIndex(i)}
        ></span>
      ))}
    </div>

  </div>
</section>



      <section className="features">
        <div className="container">
          <div className="section-header">
            <h2>Explore the features that simplify your scholarship search</h2>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Smart Matching</h3>
              <p>
                Our intelligent algorithm connects you with scholarships tailored to your academic background, interests, and financial needs.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📚</div>
              <h3>Comprehensive Database</h3>
              <p>Explore a vast database of scholarships from global universities, foundations, and organizations.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Easy Application</h3>
              <p>
                Experience a smoother application process organized, efficient, and always on time.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⏰</div>
              <h3>Deadlines Alerts</h3>
              <p>Never miss out on scholarships that are available for you</p>

            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="footer-logo">

                Scholarships Recommender
              </div>
              <p>Helping students reach their academic goals through intelligent scholarship matching.</p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        /* Clean header styles */
        .header {
          background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
          color: white;
          padding: 1rem 0;
          box-shadow: 0 2px 10px rgba(102, 126, 234, 0.2);
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .logo {
          font-size: 1.8rem;
          font-weight: bold;
          text-decoration: none;
          color: white;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .logo-icon {
          font-size: 3rem;
        }

        .nav-links {
          display: flex;
          gap: 2rem;
          list-style: none;
          align-items: center;
        }

        .nav-link {
          color: white;
          text-decoration: none;
          font-weight: 500;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          transition: background-color 0.2s ease;
        }

        .nav-link:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        /* Clean hero section */
        .hero {
          background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
          color: white;
          padding: 100px 0;
          text-align: center;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .hero-title {
          font-size: 3.5rem;
          margin-bottom: 1.5rem;
          font-weight: 700;
          line-height: 1.2;
        }

        .hero-highlight {
          color: #ffd700;
        }

        .hero-description {
          font-size: 1.2rem;
          margin-bottom: 2.5rem;
          opacity: 0.9;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.6;
        }

        .hero-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-block;
        }

        .btn-primary {
          background: white;
          color: #667eea;
        }

        .btn-primary:hover {
          background: #f8f9ff;
          transform: translateY(-1px);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .btn-large {
          padding: 1rem 2rem;
          font-size: 1.1rem;
        }

        /* Clean features section */
        .features {
          padding: 80px 0;
          background: #f8fafc;
        }

        .section-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .section-header h2 {
          font-size: 2.5rem;
          margin-bottom: 1rem;
          color: #1a202c;
          font-weight: 700;
        }

        .section-header p {
          font-size: 1.1rem;
          color: #6b7280;
          max-width: 500px;
          margin: 0 auto;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
        }

        .feature-card {
          text-align: center;
          padding: 2.5rem 2rem;
          border-radius: 12px;
          background: white;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
          transition: transform 0.2s ease;
        }

        .feature-card:hover {
          transform: translateY(-5px);
        }

        .feature-icon {
          font-size: 3rem;
          margin-bottom: 1.5rem;
        }

        .feature-card h3 {
          font-size: 1.4rem;
          margin-bottom: 1rem;
          color: #1a202c;
          font-weight: 600;
        }

        .feature-card p {
          color: #6b7280;
          line-height: 1.6;
        }

        /* Clean footer */
        .footer {
          background: #1f2937;
          color: white;
          padding: 1rem 0 1rem;
        }

        .footer-content {
          margin-bottom: 0.5rem;
        }

        .footer-logo {
          font-size: 1.3rem;
          font-weight: bold;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .footer-brand p {
          color: #d1d5db;
          line-height: 1.6;
          max-width: 400px;
        }

        .footer-bottom {
          border-top: 1px solid #374151;
          padding-top: 2rem;
          text-align: center;
          color: #9ca3af;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .hero-title {
            font-size: 2.5rem;
          }

          .hero-buttons {
            flex-direction: column;
            align-items: center;
          }

          .section-header h2 {
            font-size: 2rem;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }

          .nav-links {
            flex-direction: column;
            gap: 1rem;
          }

          .header-content {
            flex-direction: column;
            gap: 1rem;
          }
        }

        @media (max-width: 480px) {
          .hero {
            padding: 60px 0;
          }

          .hero-title {
            font-size: 2rem;
          }

          .features {
            padding: 60px 0;
          }
        }

   /* Graduation carousel section */
  .carousel-section {
  display: flex;
  justify-content: center;
  padding: 2rem 0;
  background: #ffffff;
}

.carousel-wrapper {
  width: 96%;
  max-width: 1100px;
  position: relative;
  overflow: hidden;
  border-radius: 18px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.15);
}

/* Track */
.carousel-track {
  display: flex;
  transition: transform 0.6s ease;
}

/* Slide */
.slide {
  aspect-ratio: 16/9;   /* NEW */
   min-width: 100%;
  overflow: hidden;
}

.slide img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Responsive Fix */
@media (max-width: 768px) {
  .slide img {
    height: auto;
    max-height: 240px;
  }
}

/* Arrows */
.arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.75);
  border: none;
  padding: 0.8rem 1.1rem;
  border-radius: 50%;
  font-size: 1.4rem;
  font-weight: bold;
  cursor: pointer;
  transition: 0.25s ease;
  backdrop-filter: blur(8px);
  z-index: 10;
}

.arrow:hover {
  background: rgba(255,255,255,1);
  transform: translateY(-50%) scale(1.1);
}

.arrow.left { left: 12px; }
.arrow.right { right: 12px; }

/* Dots */
.carousel-dots {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
}

.dot {
  width: 12px;
  height: 12px;
  background: #e5e7eb;
  border-radius: 50%;
  cursor: pointer;
  transition: 0.25s ease;
}

.dot.active {
  background: #3b82f6;
  transform: scale(1.2);
}

/* Smooth continuous sliding */
@keyframes smoothSlide {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); } 
  /* because we duplicated images once */
}

      /* ✨ Glowing floating orbs animation */
.animated-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
  pointer-events: none;
}

.animated-bg span {
  position: absolute;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.6) 0%, transparent 70%);
  box-shadow: 0 0 30px 10px rgba(255, 255, 255, 0.3);
  animation: floatOrb 10s ease-in-out infinite;
}

/* glowing motion animation */
@keyframes floatOrb {
  0% {
    transform: translateY(0) translateX(0) scale(1);
    opacity: 0.8;
  }
  25% {
    transform: translateY(-30px) translateX(20px) scale(1.1);
    opacity: 1;
  }
  50% {
    transform: translateY(-60px) translateX(-20px) scale(1.2);
    opacity: 0.7;
  }
  75% {
    transform: translateY(-30px) translateX(10px) scale(1.1);
    opacity: 0.9;
  }
  100% {
    transform: translateY(0) translateX(0) scale(1);
    opacity: 0.8;
  }
}
  .upload-btn {
  margin-top: 20px;
  padding: 12px 24px;
  font-size: 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  background-color: #6c63ff;
  color: white;
}

.upload-btn:hover {
  opacity: 0.9;
}


      

      `}</style>
    </div>
  )
}

export default LandingPage
