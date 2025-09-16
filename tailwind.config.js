/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'svpk-yellow': 'hsl(var(--org-primary))',
        'org-primary': 'hsl(var(--org-primary))',
        'org-secondary': 'hsl(var(--org-secondary))',
        'org-background': 'hsl(var(--org-background))',
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};