/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        prism: {
          ink: '#143842',
          slate: '#0d2832',
          teal: '#0e97a6',
          soft: '#ddf3f6',
          mist: '#f2f8f8',
          paper: '#ffffff',
        },
      },
      fontFamily: {
        heading: ['Outfit', 'sans-serif'],
        body: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 26px 80px -42px rgba(7, 81, 116, 0.45)',
        line: '0 1px 0 rgba(255,255,255,0.72) inset',
      },
    },
  },
  plugins: [],
};
