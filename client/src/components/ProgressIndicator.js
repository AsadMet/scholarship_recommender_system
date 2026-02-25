import React, { useState } from 'react';

const ProgressIndicator = ({ uploading, extracting, progress = 0, currentFile = '', totalFiles = 1 }) => {
  const getStatus = () => {
    if (extracting) return 'extracting';
    if (uploading) return 'uploading';
    return 'idle';
  };

  const status = getStatus();
  const currentProgress = progress || (extracting ? 70 : uploading ? 40 : 0);

  const stages = [
    { label: 'Uploading', icon: '📤', threshold: 0 },
    { label: 'Processing', icon: '⚙️', threshold: 40 },
    { label: 'Extracting', icon: '🔍', threshold: 70 },
    { label: 'Complete', icon: '✅', threshold: 100 }
  ];

  const getCurrentStage = () => {
    return stages.reduce((acc, stage) => {
      return currentProgress >= stage.threshold ? stage : acc;
    }, stages[0]);
  };

  const currentStage = getCurrentStage();

  if (!uploading && !extracting) return null;

  return (
    <div className="progress-indicator">
      <div className="progress-header">
        <div className="progress-icon">
          <span className="icon-pulse">{currentStage.icon}</span>
        </div>
        <div className="progress-text">
          <h4>{currentStage.label} Documents</h4>
          <p>{currentFile || `Processing ${totalFiles} file${totalFiles !== 1 ? 's' : ''}...`}</p>
        </div>
      </div>

      <div className="progress-bar-container">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${currentProgress}%` }}
          >
            <div className="progress-shine"></div>
          </div>
          <div className="progress-percentage">{currentProgress}%</div>
        </div>
      </div>

      <div className="progress-stages">
        {stages.map((stage, index) => (
          <div 
            key={index} 
            className={`stage ${currentProgress >= stage.threshold ? 'active' : ''} ${currentProgress > stage.threshold ? 'completed' : ''}`}
          >
            <div className="stage-icon">{stage.icon}</div>
            <div className="stage-label">{stage.label}</div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .progress-indicator {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 20px;
          padding: 2rem;
          color: white;
          margin: 2rem 0;
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
          animation: slideIn 0.5s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .progress-header {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .progress-icon {
          width: 60px;
          height: 60px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          backdrop-filter: blur(10px);
          border: 2px solid rgba(255, 255, 255, 0.3);
        }

        .icon-pulse {
          display: inline-block;
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }

        .progress-text h4 {
          margin: 0 0 0.5rem 0;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .progress-text p {
          margin: 0;
          font-size: 1rem;
          opacity: 0.9;
        }

        .progress-bar-container {
          margin-bottom: 2rem;
        }

        .progress-bar {
          position: relative;
          height: 12px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          overflow: hidden;
          backdrop-filter: blur(10px);
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #10b981, #22c55e, #34d399);
          border-radius: 10px;
          transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .progress-shine {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
          animation: shine 2s infinite;
        }

        @keyframes shine {
          0% {
            left: -100%;
          }
          100% {
            left: 100%;
          }
        }

        .progress-percentage {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 0.75rem;
          font-weight: 700;
          color: white;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
          z-index: 1;
        }

        .progress-stages {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }

        .stage {
          text-align: center;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          transition: all 0.3s ease;
          opacity: 0.5;
        }

        .stage.active {
          opacity: 1;
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.05);
        }

        .stage.completed {
          opacity: 0.8;
          background: rgba(16, 185, 129, 0.2);
        }

        .stage-icon {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }

        .stage.active .stage-icon {
          animation: bounce 1s infinite;
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .stage-label {
          font-size: 0.875rem;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .progress-stages {
            grid-template-columns: repeat(2, 1fr);
          }

          .progress-header {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default ProgressIndicator;
