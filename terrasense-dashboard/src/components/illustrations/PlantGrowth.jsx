import React from 'react';

const PlantGrowth = ({ stage = 1, className = "" }) => {
  const stages = [1, 2, 3, 4, 5];
  
  const getStageContent = (s, isActive) => {
    const color = isActive ? "#52B788" : "#D8F3DC";
    const opacity = isActive ? "1" : "0.5";
    const scale = isActive ? "scale-110" : "scale-100";

    switch(s) {
      case 1: // Seed
        return <circle cx="40" cy="160" r="8" fill={color} opacity={opacity} className={`transition-all duration-500 ${scale}`} />;
      case 2: // Sprout
        return (
          <g className={`transition-all duration-500 ${scale}`} opacity={opacity}>
            <path d="M100 160C100 140 115 130 120 130" stroke={color} strokeWidth="4" strokeLinecap="round" />
            <path d="M100 160C100 145 85 135 80 135" stroke={color} strokeWidth="3" strokeLinecap="round" />
          </g>
        );
      case 3: // Small Plant
        return (
          <g className={`transition-all duration-500 ${scale}`} opacity={opacity}>
            <path d="M180 160V120" stroke={color} strokeWidth="4" strokeLinecap="round" />
            <path d="M180 140Q200 130 210 140" fill={color} />
            <path d="M180 130Q160 120 150 130" fill={color} />
          </g>
        );
      case 4: // Full Plant
        return (
          <g className={`transition-all duration-500 ${scale}`} opacity={opacity}>
            <path d="M260 160V100" stroke={color} strokeWidth="5" strokeLinecap="round" />
            <path d="M260 130Q290 110 300 130" fill={color} />
            <path d="M260 115Q230 100 220 120" fill={color} />
            <path d="M260 145Q290 140 300 160" fill={color} />
          </g>
        );
      case 5: // Flowering
        return (
          <g className={`transition-all duration-500 ${scale}`} opacity={opacity}>
            <path d="M340 160V90" stroke={color} strokeWidth="5" strokeLinecap="round" />
            <path d="M340 120Q380 100 390 120" fill={color} />
            <path d="M340 105Q300 85 290 110" fill={color} />
            <circle cx="340" cy="85" r="10" fill="#F9C74F" />
            <circle cx="340" cy="85" r="4" fill="#FF6B35" />
          </g>
        );
      default: return null;
    }
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <svg
        width="420"
        height="180"
        viewBox="0 0 420 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Connection Line */}
        <path d="M40 160H340" stroke="#FAF7F2" strokeWidth="2" strokeDasharray="4 4" />
        
        {/* Soil Base */}
        <rect y="160" width="420" height="20" fill="#8B6347" fillOpacity="0.2" />

        {stages.map((s) => (
          <React.Fragment key={s}>
            {getStageContent(s, stage === s)}
          </React.Fragment>
        ))}
      </svg>
    </div>
  );
};

export default PlantGrowth;
