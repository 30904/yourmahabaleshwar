/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#003580',
        'primary-light': '#1E88E5',
        'admin-primary': '#1E88E5',
        'admin-green': '#43A047',
        'admin-orange': '#FB8C00',
        secondary: '#43A047',
        accent: '#FFB700',
        'accent-hover': '#FEBB02',
        background: '#F5F7FA',
        surface: '#FFFFFF',
        border: '#E7EEF5',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      boxShadow: {
        card: '0 1px 2px rgba(0,53,128,0.06), 0 4px 16px rgba(0,53,128,0.06)',
        search: '0 4px 24px rgba(0,53,128,0.15), 0 0 0 1px rgba(0,53,128,0.08)',
        elevated: '0 8px 32px rgba(0,53,128,0.12)',
      },
      borderRadius: {
        booking: '8px',
      },
    },
  },
  plugins: [],
};
