import React from 'react';

const WaterDrop = ({ percentage = 60, className = "" }) => {
  const fillHeight = 100 - percentage;
  
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <svg
        width="100"
        height="120"
        viewBox="0 0 100 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <clipPath id="dropClip">
            <path d="M50 0C50 0 0 50 0 85C0 104.33 22.3858 120 50 120C77.6142 120 100 104.33 100 85C100 50 50 0 50 0Z" />
          </clipPath>
        </defs>

        {/* Drop Background */}
        <path
          d="M50 0C50 0 0 50 0 85C0 104.33 22.3858 120 50 120C77.6142 120 100 104.33 100 85C100 50 50 0 50 0Z"
          fill="#B3D9F7"
          fillOpacity="0.3"
        />

        {/* Animated Water Fill */}
        <g clipPath="url(#dropClip)">
          <rect
            x="0"
            y={fillHeight}
            width="100"
            height="120"
            fill="#4A90D9"
            className="transition-all duration-1000 ease-in-out"
          />
          {/* Wave Animation */}
          <path
            d="M0 10 Q25 0 50 10 Q75 20 100 10V0H0V10Z"
            fill="#B3D9F7"
            fillOpacity="0.4"
            transform={`translate(0, ${fillHeight - 5})`}
          >
            <animate
              attributeName="d"
              dur="3s"
              repeatCount="indefinite"
              values="M0 10 Q25 0 50 10 Q75 20 100 10V0H0V10Z; M0 10 Q25 20 50 10 Q75 0 100 10V0H0V10Z; M0 10 Q25 0 50 10 Q75 20 100 10V0H0V10Z"
            />
          </path>
        </g>

        {/* Drop Outline */}
        <path
          d="M50 0C50 0 0 50 0 85C0 104.33 22.3858 120 50 120C77.6142 120 100 104.33 100 85C100 50 50 0 50 0Z"
          stroke="#4A90D9"
          strokeWidth="2"
          strokeOpacity="0.5"
        />
      </svg>
    </div>
  );
};

export default WaterDrop;
