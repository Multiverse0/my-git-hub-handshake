/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Tailwind semantic tokens
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        border: 'hsl(var(--border))',
        // Organization specific colors
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