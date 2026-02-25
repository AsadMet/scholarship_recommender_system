import React, { useMemo } from 'react';

const PasswordStrengthIndicator = ({ password }) => {
  const calculateStrength = (pwd) => {
    let strength = 0;
    if (!pwd) return { score: 0, level: 'none' };
    
    if (pwd.length >= 6) strength++;
    if (pwd.length >= 10) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;
    
    let level = 'weak';
    if (strength >= 5) level = 'strong';
    else if (strength >= 3) level = 'medium';
    
    return { score: strength, level };
  };

  const strength = useMemo(() => calculateStrength(password), [password]);

  if (!password) return null;

  const getLabel = () => {
    if (strength.level === 'strong') return 'Strong';
    if (strength.level === 'medium') return 'Medium';
    return 'Weak';
  };

  const getBars = () => {
    const bars = [];
    for (let i = 0; i < 5; i++) {
      let className = 'strength-bar';
      if (i < strength.score) {
        className += ` active ${strength.level}`;
      }
      bars.push(<div key={i} className={className}></div>);
    }
    return bars;
  };

  return (
    <div className="strength-indicator">
      <div className="strength-bars">
        {getBars()}
      </div>
      <div className={`strength-label ${strength.level}`}>
        {getLabel()}
      </div>

      <style jsx>{`
        .strength-indicator {
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .strength-bars {
          display: flex;
          gap: 4px;
          height: 6px;
          margin-bottom: 0.5rem;
        }

        .strength-bar {
          flex: 1;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
          transition: all 0.3s ease;
        }

        .strength-bar.active.weak {
          background-color: #ef4444;
        }

        .strength-bar.active.medium {
          background-color: #f59e0b;
        }

        .strength-bar.active.strong {
          background-color: #22c55e;
        }

        .strength-label {
          font-size: 0.875rem;
          font-weight: 600;
          transition: color 0.3s ease;
        }

        .strength-label.weak {
          color: #fca5a5;
        }

        .strength-label.medium {
          color: #fcd34d;
        }

        .strength-label.strong {
          color: #86efac;
        }
      `}</style>
    </div>
  );
};

export default PasswordStrengthIndicator;
