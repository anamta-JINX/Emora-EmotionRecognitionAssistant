/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: '#12211B',
        canvas: '#F7F8F4',
        moss: {
          50: '#F2F7F3',
          100: '#E2EEE5',
          200: '#C5DDCA',
          300: '#9FC3A7',
          400: '#70A17C',
          500: '#4F815D',
          600: '#3E684A',
          700: '#34543E',
          800: '#2C4435',
          900: '#24382D'
        },
        peach: {
          50: '#FFF8F3',
          100: '#FCEBDD',
          200: '#F7D7BE',
          300: '#EFB88F',
          400: '#E5945E',
          500: '#D97942'
        }
      },
      boxShadow: {
        soft: '0 22px 70px rgba(35, 62, 47, 0.10)',
        card: '0 16px 45px rgba(35, 62, 47, 0.08)',
        glow: '0 18px 55px rgba(79, 129, 93, 0.22)',
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        pulseSoft: 'pulseSoft 2.8s ease-in-out infinite',
        marquee: 'marquee 28s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.55', transform: 'scale(1)' },
          '50%': { opacity: '0.95', transform: 'scale(1.04)' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};
