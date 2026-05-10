import React from 'react';

const SoilCross = ({ className = "" }) => {
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <svg
        width="300"
        height="200"
        viewBox="0 0 300 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="rounded-3xl overflow-hidden shadow-lg"
      >
        {/* Grass Layer */}
        <rect width="300" height="40" fill="#52B788" />
        <path d="M0 40C50 30 100 50 150 40C200 30 250 50 300 40V0H0V40Z" fill="#2D6A4F" fillOpacity="0.3" />
        
        {/* Top Soil Layer */}
        <rect y="40" width="300" height="80" fill="#8B6347" />
        {/* Nutrient Particles */}
        <circle cx="40" cy="60" r="2" fill="#F9C74F" className="animate-pulse" />
        <circle cx="120" cy="90" r="2" fill="#F9C74F" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
        <circle cx="200" cy="70" r="2" fill="#F9C74F" className="animate-pulse" style={{ animationDelay: '1s' }} />
        <circle cx="260" cy="100" r="2" fill="#F9C74F" className="animate-pulse" style={{ animationDelay: '1.5s' }} />
        
        {/* Deep Soil Layer */}
        <rect y="120" width="300" height="80" fill="#5C3D2E" />
        {/* Roots */}
        <path d="M150 40C140 80 160 120 150 160" stroke="#FAF7F2" strokeWidth="2" strokeOpacity="0.2" />
        <path d="M150 80C170 100 190 110 200 130" stroke="#FAF7F2" strokeWidth="1.5" strokeOpacity="0.1" />
        <path d="M150 100C130 120 110 130 100 150" stroke="#FAF7F2" strokeWidth="1.5" strokeOpacity="0.1" />
      </svg>
    </div>
  );
};

export default SoilCross;
