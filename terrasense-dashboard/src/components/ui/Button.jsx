import React from 'react';

const Button = ({ variant = 'primary', size = 'md', className = '', children, ...props }) => {
  const baseClasses = "font-semibold rounded-xl transition-all duration-200 inline-flex items-center justify-center gap-2 active:scale-[0.98]";
  
  const variants = {
    primary: "bg-brand-orange text-white shadow-button hover:bg-brand-orange/90 hover:scale-[1.02] hover:shadow-lg",
    secondary: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100",
    danger: "bg-white text-semantic-danger border border-semantic-danger/20 hover:bg-semantic-danger-surface hover:border-semantic-danger/30"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-8 py-4 text-base"
  };

  return (
    <button className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;
