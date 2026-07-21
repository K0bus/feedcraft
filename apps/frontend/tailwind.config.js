/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue'
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#090A0F',
          900: '#12151E',
          800: '#1A1E2C',
          700: '#262B3E',
          600: '#343B52'
        },
        brand: {
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          accent: '#8B5CF6'
        },
        neon: {
          green: '#10B981',
          red: '#EF4444',
          amber: '#F59E0B',
          cyan: '#06B6D4'
        },
        discord: {
          DEFAULT: '#5865F2',
          hover: '#4752C4',
          dark: '#2C2F33'
        }
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        sans: ['Inter', 'sans-serif']
      },
      boxShadow: {
        'glow-indigo': '0 0 25px -5px rgba(99, 102, 241, 0.35)',
        'glow-purple': '0 0 25px -5px rgba(139, 92, 246, 0.35)',
        'glow-green': '0 0 20px -5px rgba(16, 185, 129, 0.4)',
        'glow-red': '0 0 20px -5px rgba(239, 68, 68, 0.4)'
      }
    }
  },
  plugins: []
}
