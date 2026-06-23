import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#effbf0',
          100: '#d8f1db',
          200: '#b2e2b6',
          300: '#82cd87',
          400: '#5fa86a',
          500: '#3a8d4b',
          600: '#2f7a3f',
          700: '#256232',
          800: '#1d4e27',
          900: '#163a1d'
        },
        accent: {
          50: '#f1fbf4',
          100: '#d9f5e1',
          200: '#b7e8c2',
          300: '#84d696',
          400: '#5fbc72',
          500: '#3d9f55',
          600: '#2f7f42',
          700: '#246136',
          800: '#1b4d2c',
          900: '#153b23'
        }
      }
    }
  },
  plugins: [require('@tailwindcss/typography')]
};

export default config;
