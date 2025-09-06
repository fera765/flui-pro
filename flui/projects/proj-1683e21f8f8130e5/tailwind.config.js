module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5fbfe',
          100: '#e0f0fe',
          200: '#bae0fe',
          300: '#7cc0ff',
          400: '#36a6ff',
          500: '#008aff',
          600: '#0064d6',
          700: '#0050b0',
          800: '#003980',
          900: '#001f4d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      borderRadius: {
        '3xl': '1.75rem',
        '4xl': '2rem',
      },
    }
  },
  plugins: [],
}