import React, { useState } from 'react';

const PasswordInput = ({ 
  name,
  value,
  onChange,
  placeholder,
  error,
  required = false,
  autoFocus = false
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="password-input-wrapper">
      <div className={`input-container ${error ? 'error' : ''} ${isFocused ? 'focused' : ''}`}>
        <span className="input-icon">🔒</span>
        <input
          type={showPassword ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoFocus={autoFocus}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="glass-input"
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="toggle-password"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? '👁️' : '👁️‍🗨️'}
        </button>
      </div>
      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <style jsx>{`
        .password-input-wrapper {
          margin-bottom: 1rem;
          width: 100%;
        }

        .input-container {
          position: relative;
          width: 100%;
        }

        .input-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          font-size: 1.25rem;
          z-index: 1;
          pointer-events: none;
          opacity: 0.7;
        }

        .glass-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.9);
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          padding: 0.75rem 3rem 0.75rem 3rem;
          color: #1f2937;
          font-size: 1rem;
          transition: all 0.3s ease;
          outline: none;
        }

        .glass-input::placeholder {
          color: #9ca3af;
        }

        .glass-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .input-container.error .glass-input {
          border-color: #ef4444;
          animation: shake 0.3s ease;
        }

        .toggle-password {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1.25rem;
          opacity: 0.7;
          transition: opacity 0.2s ease;
          padding: 0.25rem;
        }

        .toggle-password:hover {
          opacity: 1;
        }

        .error-message {
          color: #fca5a5;
          font-size: 0.875rem;
          margin-top: 0.5rem;
          animation: slideDown 0.3s ease;
          font-weight: 500;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
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

        @media (max-width: 640px) {
          .glass-input {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default PasswordInput;
