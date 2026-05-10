import React from 'react';

const Badge = ({ variant = 'default', className = '', children }) => {
  const baseClasses = "text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center justify-center transition-colors";
  
  const variants = {
    // Classification Badges
    default: "bg-semantic-success-surface text-semantic-success",
    'normal': "bg-green-100 text-green-700",
    'water-deficiency': "bg-blue-100 text-blue-700",
    'salinity-stress': "bg-orange-100 text-orange-700",
    'over-fertilization': "bg-yellow-100 text-yellow-700",
    'heat-stress': "bg-red-100 text-red-700",
    'nutrient-imbalance': "bg-purple-100 text-purple-700",
    
    // Severity Badges
    critical: "bg-semantic-danger-surface text-semantic-danger",
    warning: "bg-semantic-warning-surface text-semantic-warning",
    info: "bg-semantic-info-surface text-semantic-info",
    success: "bg-semantic-success-surface text-semantic-success"
  };

  return (
    <span className={`${baseClasses} ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
