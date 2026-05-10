import React from 'react';

const FarmScene = ({ className = "" }) => {
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <svg
        width="400"
        height="250"
        viewBox="0 0 400 250"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="rounded-[2.5rem] overflow-hidden"
      >
        {/* Sky Gradient */}
        <defs>
          <linearGradient id="skyGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4A90D9" />
            <stop offset="100%" stopColor="#B3D9F7" />
          </linearGradient>
        </defs>
        <rect width="400" height="250" fill="url(#skyGradient)" />

        {/* Background Hills */}
        <path d="M0 250C100 180 300 220 400 180V250H0Z" fill="#95D5B2" fillOpacity="0.5" />
        <path d="M-50 250C150 150 350 250 450 200V250H-50Z" fill="#52B788" fillOpacity="0.3" />

        {/* Farmhouse */}
        <rect x="250" y="160" width="60" height="40" fill="#FAF7F2" />
        <path d="M245 160L280 130L315 160H245Z" fill="#B45F43" />
        <rect x="270" y="180" width="20" height="20" fill="#5C3D2E" fillOpacity="0.2" />

        {/* Trees */}
        <circle cx="80" cy="160" r="30" fill="#2D6A4F" />
        <rect x="75" y="190" width="10" height="20" fill="#5C3D2E" />
        
        <circle cx="350" cy="180" r="25" fill="#52B788" />
        <rect x="345" y="200" width="10" height="20" fill="#5C3D2E" />

        {/* ESP32 Sensor Post */}
        <rect x="150" y="180" width="4" height="40" fill="#5C3D2E" />
        <rect x="140" y="170" width="24" height="15" rx="2" fill="#FAF7F2" stroke="#D8F3DC" strokeWidth="1" />
        <circle cx="145" cy="177" r="2" fill="#52B788" className="animate-pulse" />

        {/* Foreground Grass */}
        <path d="M0 250C100 230 300 260 400 240V250H0Z" fill="#2D6A4F" />
      </svg>
    </div>
  );
};

export default FarmScene;
