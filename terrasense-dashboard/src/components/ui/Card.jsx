import React from 'react';

const Card = ({ variant = 'default', className = '', children }) => {
  const baseClasses = "rounded-2xl transition-all duration-200 p-6";
  
  const variants = {
    default: "bg-white shadow-card hover:shadow-card-hover border border-gray-100",
    dark: "bg-brand-navy text-white shadow-card",
    surface: "bg-brand-green-surface border border-brand-green-light/20",
    warning: "bg-semantic-warning-surface border border-semantic-warning/20 border-l-4 border-l-semantic-warning",
    danger: "bg-semantic-danger-surface border border-semantic-danger/20 border-l-4 border-l-semantic-danger"
  };

  return (
    <div className={`${baseClasses} ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
};

export default Card;
