import React from 'react';

const GlassmorphicCard = ({ children, className = '' }) => {
  return (
    <div className={`glass-card ${className}`}>
      {children}
      
      <style jsx>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 24px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          padding: 2.5rem;
          width: 100%;
          max-width: 460px;
          animation: slideUp 0.5s ease-out;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @supports not (backdrop-filter: blur(12px)) {
          .glass-card {
            background: rgba(255, 255, 255, 0.85);
          }
        }

        @media (max-width: 640px) {
          .glass-card {
            width: 95%;
            padding: 1.5rem;
            border-radius: 20px;
          }
        }

        @media (min-width: 641px) and (max-width: 1024px) {
          .glass-card {
            max-width: 500px;
            padding: 2rem;
          }
        }
      `}</style>
    </div>
  );
};

export default GlassmorphicCard;
