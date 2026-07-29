/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          black: '#050a14',
          dark: '#0a1628',
          navy: '#0d1f3c',
          blue: '#1a3a5c',
          cyan: '#00d4ff',
          'cyan-dark': '#0099cc',
          purple: '#7c3aed',
          'purple-light': '#a855f7',
          green: '#00ff88',
          yellow: '#ffcc00',
          orange: '#ff8800',
          red: '#ff3366',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'cyber-grid': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300d4ff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        'gradient-cyber': 'linear-gradient(135deg, #050a14 0%, #0d1f3c 50%, #1a0533 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(13,31,60,0.8) 0%, rgba(26,58,92,0.4) 100%)',
        'gradient-cyan': 'linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)',
        'gradient-danger': 'linear-gradient(135deg, #ff3366 0%, #ff8800 100%)',
        'gradient-safe': 'linear-gradient(135deg, #00ff88 0%, #00d4ff 100%)',
      },
      boxShadow: {
        'cyber': '0 0 20px rgba(0, 212, 255, 0.15)',
        'cyber-lg': '0 0 40px rgba(0, 212, 255, 0.2)',
        'cyber-glow': '0 0 60px rgba(0, 212, 255, 0.3)',
        'purple': '0 0 20px rgba(124, 58, 237, 0.3)',
        'red': '0 0 20px rgba(255, 51, 102, 0.3)',
        'green': '0 0 20px rgba(0, 255, 136, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'scan': 'scan 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          from: { boxShadow: '0 0 5px rgba(0,212,255,0.2)' },
          to: { boxShadow: '0 0 30px rgba(0,212,255,0.6)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
