import React from 'react';

/**
 * Premium Card Component
 * Clean, elegant design with subtle shadows
 */
const Card = ({
  children,
  className = '',
  hover = false,
  onClick,
  padding = 'md',
  ...props
}) => {
  const baseStyles = 'bg-surface dark:bg-surface-dark rounded-xl shadow-lg transition-all duration-200';
  const hoverStyles = hover ? 'hover:shadow-xl cursor-pointer' : '';
  
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      onClick={onClick}
      className={`
        ${baseStyles}
        ${hoverStyles}
        ${paddings[padding]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => (
  <div className={`mb-4 ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-xl font-semibold text-primary dark:text-gray-100 ${className}`}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className = '' }) => (
  <p className={`text-secondary dark:text-gray-300 ${className}`}>
    {children}
  </p>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={className}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={`mt-6 pt-4 border-t border-secondary/20 ${className}`}>
    {children}
  </div>
);

export default Card;
