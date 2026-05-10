import React from 'react';

const SunCloud = ({ className = "", temp = 25 }) => {
  // Rotate faster if higher temp
  const rotationDuration = Math.max(5, 30 - temp) + "s";
  
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <svg
        width="120"
        height="100"
        viewBox="0 0 120 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Sun */}
        <g style={{ transformOrigin: '40px 40px', animation: `sunRotate ${rotationDuration} linear infinite` }}>
          <circle cx="40" cy="40" r="20" fill="#F9C74F" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <rect
              key={deg}
              x="38"
              y="5"
              width="4"
              height="10"
              rx="2"
              fill="#F9C74F"
              transform={`rotate(${deg}, 40, 40)`}
            />
          ))}
        </g>

        {/* Cloud */}
        <g className="animate-gentleFloat" style={{ animation: 'gentleFloat 4s ease-in-out infinite' }}>
          <path
            d="M95 50C108.807 50 120 61.1929 120 75C120 88.8071 108.807 100 95 100H45C31.1929 100 20 88.8071 20 75C20 61.1929 31.1929 50 45 50C45.3121 50 45.6226 50.0058 45.9312 50.0171C50.218 40.5432 59.8519 34 71 34C82.8051 34 92.9349 41.3653 96.9531 51.7876C96.3093 51.716 95.6589 51.6787 95 51.6787V50Z"
            fill="#FAF7F2"
            fillOpacity="0.9"
          />
          <path
            d="M95 50C108.807 50 120 61.1929 120 75C120 88.8071 108.807 100 95 100H45C31.1929 100 20 88.8071 20 75C20 61.1929 31.1929 50 45 50C45.3121 50 45.6226 50.0058 45.9312 50.0171C50.218 40.5432 59.8519 34 71 34C82.8051 34 92.9349 41.3653 96.9531 51.7876C96.3093 51.716 95.6589 51.6787 95 51.6787V50Z"
            stroke="#B3D9F7"
            strokeWidth="2"
            strokeOpacity="0.5"
          />
        </g>
      </svg>
    </div>
  );
};

export default SunCloud;
