import React from 'react';

const HillScape = ({ className = "" }) => {
  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <svg
        viewBox="0 0 1200 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
        preserveAspectRatio="none"
      >
        {/* Background Hills - Light Green */}
        <path
          d="M0 160C200 60 400 140 600 100C800 60 1000 140 1200 100V160H0Z"
          fill="#D8F3DC"
          fillOpacity="0.8"
        />
        {/* Mid Hills - Medium Green */}
        <path
          d="M0 160C150 100 300 160 450 120C600 80 750 160 900 110C1050 60 1200 130 1200 130V160H0Z"
          fill="#95D5B2"
          fillOpacity="0.6"
        />
        {/* Foreground Hills - Dark Forest Green */}
        <path
          d="M0 160C300 120 600 160 900 130C1200 100 1200 160 1200 160H0Z"
          fill="#2D6A4F"
        />
      </svg>
    </div>
  );
};

export default HillScape;
