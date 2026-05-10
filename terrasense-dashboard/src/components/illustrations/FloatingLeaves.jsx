import React from 'react';

const Leaf = ({ className = "", style = {} }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`absolute ${className}`}
    style={style}
  >
    <path
      d="M20.24 12.24C20.24 16.65 16.65 20.24 12.24 20.24C7.83 20.24 4.24 16.65 4.24 12.24C4.24 7.83 12.24 3.76 12.24 3.76C12.24 3.76 20.24 7.83 20.24 12.24Z"
      fill="currentColor"
    />
    <path
      d="M12.24 3.76V20.24"
      stroke="white"
      strokeWidth="0.5"
      strokeLinecap="round"
      opacity="0.3"
    />
  </svg>
);

const FloatingLeaves = ({ count = 6, className = "" }) => {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden z-0 ${className}`}>
      <Leaf 
        className="text-[#2D6A4F] w-12 h-12" 
        style={{ top: '15%', left: '10%', animation: 'leafDrift 12s infinite ease-in-out' }} 
      />
      <Leaf 
        className="text-[#52B788] w-8 h-8" 
        style={{ top: '45%', left: '85%', animation: 'leafDrift 15s infinite ease-in-out -2s' }} 
      />
      <Leaf 
        className="text-[#95D5B2] w-16 h-16" 
        style={{ top: '75%', left: '20%', animation: 'leafDrift 18s infinite ease-in-out -5s' }} 
      />
      <Leaf 
        className="text-[#D8F3DC] w-10 h-10" 
        style={{ top: '25%', left: '70%', animation: 'leafDrift 14s infinite ease-in-out -1s' }} 
      />
      <Leaf 
        className="text-[#F9C74F] w-6 h-6" 
        style={{ top: '65%', left: '50%', animation: 'leafDrift 20s infinite ease-in-out -8s' }} 
      />
      <Leaf 
        className="text-[#52B788] w-14 h-14" 
        style={{ top: '10%', left: '40%', animation: 'leafDrift 16s infinite ease-in-out -4s' }} 
      />
    </div>
  );
};

export default FloatingLeaves;
