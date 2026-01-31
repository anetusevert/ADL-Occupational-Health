/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Arthur D. Little Brand Colors
        adl: {
          navy: '#1a1a4e',        // Primary brand navy
          'navy-light': '#252569', // Lighter navy for hover states
          'navy-dark': '#12123a',  // Darker navy for backgrounds
          blue: '#2d4a8c',         // Secondary blue
          'blue-light': '#3d5fa8', // Lighter blue accent
          accent: '#4a6bb5',       // Accent blue
          slate: '#f4f6f9',        // Light background
          'slate-dark': '#e8ecf2', // Darker light background
          white: '#ffffff',        // Pure white
          text: '#2d3748',         // Body text
          'text-muted': '#64748b', // Muted text
        },
        // Legacy support
        gohip: {
          primary: '#1a1a4e',
          secondary: '#2d4a8c',
          accent: '#4a6bb5',
          dark: '#12123a',
          light: '#f4f6f9',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'adl-gradient': 'linear-gradient(135deg, #1a1a4e 0%, #12123a 100%)',
        'adl-gradient-light': 'linear-gradient(135deg, #252569 0%, #1a1a4e 100%)',
        'adl-gradient-subtle': 'linear-gradient(180deg, #1a1a4e 0%, #252569 50%, #1a1a4e 100%)',
      },
      boxShadow: {
        'adl': '0 4px 20px -2px rgba(26, 26, 78, 0.25)',
        'adl-lg': '0 10px 40px -4px rgba(26, 26, 78, 0.3)',
        'adl-glow': '0 0 30px rgba(74, 107, 181, 0.15)',
      }
    },
  },
  plugins: [],
}
