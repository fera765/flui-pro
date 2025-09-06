module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#1f5a8a',
        surface: '#1f2937',
        background: '#0b1020',
        text: '#e5e7eb',
        muted: '#93a3b8',
        success: '#10b981',
        danger: '#f87171',
        info: '#3b82f6',
        warning: '#f59e0b',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'ui-sans-serif'],
      },
    },
  },
  plugins: [],
};