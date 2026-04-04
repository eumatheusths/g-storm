// tailwind.config.mjs
import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      // Estenda as cores existentes com o seu roxo escuro
      colors: {
        purple: {
          DEFAULT: '#3c126e', // Exemplo de roxo bem escuro e profundo
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed', // Este tom original ainda existirá se você não sobrescrever tudo, mas o padrão será o DEFAULT
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065', // Tons mais escuros ainda para áreas específicas
        },
      },
    },
  },
  plugins: [],
}