/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // all React source files
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3B4261',
          hover: '#2F354F',
          50: '#F5F6F8',
          100: '#E8E9ED',
          200: '#CDD0D9',
          300: '#A8ADB9',
          400: '#7D8494',
          500: '#3B4261',
          600: '#2F354F',
          700: '#252A3E',
          800: '#1B1F2D',
          900: '#12141C',
        },
        secondary: {
          DEFAULT: '#9BA7B1',
          light: '#B8C2CB',
          dark: '#7E8C97',
        },
        accent: {
          DEFAULT: '#CFC6A8',
          hover: '#BEB493',
          light: '#E2DBC9',
          dark: '#B8AF91',
        },
        background: {
          DEFAULT: '#E8E5D6',
          dark: '#1E2233',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#2A3048',
        },
      },
      boxShadow: {
        'soft': '0 2px 15px rgba(59, 66, 97, 0.08)',
        'soft-lg': '0 10px 40px rgba(59, 66, 97, 0.12)',
      },
      borderRadius: {
        'card': '0.75rem',
      },
    },
  },
  plugins: [],
};

