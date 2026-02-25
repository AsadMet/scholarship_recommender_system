import React from 'react';

const AnimatedBackground = () => {
  return (
    <div className="animated-bg">
      <span style={{ top: "15%", left: "10%", animationDuration: "18s" }}></span>
      <span style={{ top: "50%", left: "70%", animationDuration: "22s" }}></span>
      <span style={{ top: "70%", left: "20%", animationDuration: "20s" }}></span>
      <span style={{ top: "30%", left: "80%", animationDuration: "24s" }}></span>
      <span style={{ top: "85%", left: "60%", animationDuration: "19s" }}></span>
      
      <style jsx>{`
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
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.5) 0%, transparent 70%);
          box-shadow: 0 0 40px 15px rgba(255, 255, 255, 0.25);
          animation: floatOrb 10s ease-in-out infinite;
        }

        @keyframes floatOrb {
          0% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: 0.7;
          }
          25% {
            transform: translateY(-40px) translateX(30px) scale(1.15);
            opacity: 0.9;
          }
          50% {
            transform: translateY(-80px) translateX(-30px) scale(1.25);
            opacity: 0.6;
          }
          75% {
            transform: translateY(-40px) translateX(15px) scale(1.1);
            opacity: 0.85;
          }
          100% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: 0.7;
          }
        }

        @media (max-width: 640px) {
          .animated-bg span {
            width: 80px;
            height: 80px;
          }
        }
      `}</style>
    </div>
  );
};

export default AnimatedBackground;
