import React from 'react';

/**
 * Premium Button Component
 * Corporate design with primary navy and accent beige variants
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  icon = null,
  className = '',
  type = 'button',
  onClick,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl';

  const variants = {
    primary: 'bg-primary hover:bg-primary-hover text-white border-2 border-primary hover:border-primary-hover',
    secondary: 'bg-accent hover:bg-accent-hover text-primary dark:text-primary border-2 border-accent hover:border-accent-hover',
    outline: 'border-2 border-primary dark:border-accent text-primary dark:text-accent hover:bg-primary hover:text-white hover:border-primary dark:hover:bg-accent dark:hover:text-primary dark:hover:border-accent bg-white dark:bg-transparent',
    ghost: 'text-primary dark:text-accent hover:bg-primary/10 dark:hover:bg-accent/10',
    danger: 'bg-red-600 hover:bg-red-700 text-white border-2 border-red-600 hover:border-red-700',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${widthStyle}
        ${className}
      `}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
