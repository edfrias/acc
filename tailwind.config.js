/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colores corporativos del club
        'club-white': '#FFFEFE',
        'club-black': '#000101',
        'club-red': '#DB121A',
        'club-yellow': '#FCDD09',
        'club-blue': '#0198FF',

        // Mantenemos la estructura de primary/accent para compatibilidad
        primary: {
          50: '#f0f9ff',
          100: '#e0f3ff',
          200: '#bae6ff',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0198FF', // Color azul corporativo
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#FCDD09', // Color amarillo corporativo
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#DB121A', // Color rojo corporativo
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Montserrat', 'Inter', 'system-ui', 'sans-serif'],
      },
      screens: {
        'max-h-750': { 'raw': '(max-height: 750px)' },
        'min-h-750': { 'raw': '(min-height: 750px)' },
        'md-h-750': { 'raw': '(min-width: 768px) and (min-height: 750px)' },
        'lg-h-750': { 'raw': '(min-width: 1024px) and (min-height: 750px)' },
      }
    },
  },
  plugins: [],
}
