/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1B2A4A',
          50: '#E8EBF1',
          100: '#C5CCDf',
          200: '#9FAABF',
          300: '#6F7FA0',
          400: '#4D5F85',
          500: '#1B2A4A',
          600: '#162342',
          700: '#111B35',
          800: '#0C1327',
          900: '#070C18',
        },
        teal: {
          DEFAULT: '#3ECFB2',
          50: '#E8FAF7',
          100: '#C0F2EA',
          200: '#93E9D9',
          300: '#63DEC7',
          400: '#3ECFB2',
          500: '#25B89B',
          600: '#1A9E84',
          700: '#12816A',
          800: '#0C6050',
          900: '#073E34',
        },
        surface: {
          DEFAULT: '#F8F9FC',
          card: '#FFFFFF',
          border: '#E4E8F0',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"DM Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(27,42,74,0.06), 0 1px 2px -1px rgba(27,42,74,0.04)',
        'card-hover': '0 4px 12px 0 rgba(27,42,74,0.10), 0 2px 4px -1px rgba(27,42,74,0.06)',
        sidebar: '1px 0 0 0 #E4E8F0',
      },
    },
  },
  plugins: [],
}
