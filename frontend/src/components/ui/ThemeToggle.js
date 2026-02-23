import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg transition-all duration-200 hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-accent ${className}`}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 text-accent" />
      ) : (
        <Moon className="h-5 w-5 text-primary" />
      )}
    </button>
  );
};

export default ThemeToggle;
