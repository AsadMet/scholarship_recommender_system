import React, { useState } from 'react';

const Tooltip = ({ children, content, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionStyles = {
    top: {
      bottom: '100%',
      left: '50%',
      transform: 'translateX(-50%) translateY(-8px)',
    },
    right: {
      left: '100%',
      top: '50%',
      transform: 'translateY(-50%) translateX(8px)',
    },
    bottom: {
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%) translateY(8px)',
    },
    left: {
      right: '100%',
      top: '50%',
      transform: 'translateY(-50%) translateX(-8px)',
    },
  };

  const arrowPositions = {
    top: {
      bottom: '-6px',
      left: '50%',
      transform: 'translateX(-50%)',
      borderTop: '6px solid rgba(30, 41, 59, 0.9)',
      borderLeft: '6px solid transparent',
      borderRight: '6px solid transparent',
    },
    right: {
      left: '-6px',
      top: '50%',
      transform: 'translateY(-50%)',
      borderRight: '6px solid rgba(30, 41, 59, 0.9)',
      borderTop: '6px solid transparent',
      borderBottom: '6px solid transparent',
    },
    bottom: {
      top: '-6px',
      left: '50%',
      transform: 'translateX(-50%)',
      borderBottom: '6px solid rgba(30, 41, 59, 0.9)',
      borderLeft: '6px solid transparent',
      borderRight: '6px solid transparent',
    },
    left: {
      right: '-6px',
      top: '50%',
      transform: 'translateY(-50%)',
      borderLeft: '6px solid rgba(30, 41, 59, 0.9)',
      borderTop: '6px solid transparent',
      borderBottom: '6px solid transparent',
    },
  };

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          style={{
            position: 'absolute',
            ...positionStyles[position],
            backgroundColor: 'rgba(30, 41, 59, 0.9)',
            color: '#f1f5f9',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            lineHeight: '1.5',
            maxWidth: '320px',
            zIndex: 1000,
            backdropFilter: 'blur(10px)',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            animation: 'fadeIn 0.2s ease-in-out',
            whiteSpace: 'normal',
            wordWrap: 'break-word',
          }}
        >
          {typeof content === 'string' ? (
            <div dangerouslySetInnerHTML={{ __html: content }} />
          ) : (
            content
          )}
          <div style={arrowPositions[position]} />
        </div>
      )}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: ${
              position === 'top'
                ? 'translateX(-50%) translateY(0px)'
                : position === 'bottom'
                ? 'translateX(-50%) translateY(0px)'
                : position === 'right'
                ? 'translateY(-50%) translateX(0px)'
                : 'translateY(-50%) translateX(0px)'
            };
          }
          to {
            opacity: 1;
            transform: ${
              position === 'top'
                ? 'translateX(-50%) translateY(-8px)'
                : position === 'bottom'
                ? 'translateX(-50%) translateY(8px)'
                : position === 'right'
                ? 'translateY(-50%) translateX(8px)'
                : 'translateY(-50%) translateX(-8px)'
            };
          }
        }
      `}</style>
    </div>
  );
};

export default Tooltip;
