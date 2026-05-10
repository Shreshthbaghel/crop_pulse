import React from 'react';

const TreeRow = ({ className = "" }) => {
  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <svg
        viewBox="0 0 1200 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
        preserveAspectRatio="none"
      >
        {/* Deep Forest Pine Trees */}
        <path d="M50 120L80 40L110 120H50Z" fill="#2D6A4F" />
        <path d="M250 120L285 20L320 120H250Z" fill="#2D6A4F" />
        <path d="M850 120L880 50L910 120H850Z" fill="#2D6A4F" />
        
        {/* Leaf Green Round Trees */}
        <circle cx="180" cy="80" r="40" fill="#52B788" />
        <rect x="175" y="100" width="10" height="20" fill="#5C3D2E" />
        
        <circle cx="450" cy="70" r="50" fill="#52B788" />
        <rect x="445" y="100" width="10" height="20" fill="#5C3D2E" />
        
        <circle cx="720" cy="85" r="35" fill="#52B788" />
        <rect x="715" y="110" width="10" height="10" fill="#5C3D2E" />

        {/* Lime Green Small Shrubbery */}
        <path d="M380 120C380 100 420 100 420 120H380Z" fill="#95D5B2" />
        <path d="M580 120C580 90 640 90 640 120H580Z" fill="#95D5B2" />
        <path d="M980 120C980 105 1030 105 1030 120H980Z" fill="#95D5B2" />
        <path d="M1100 120C1100 80 1180 80 1180 120H1100Z" fill="#95D5B2" />
      </svg>
    </div>
  );
};

export default TreeRow;
