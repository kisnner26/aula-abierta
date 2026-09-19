import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          blue:      '#1D95FB',
          red:       '#D31A2A',
          yellow:    '#FED401',
          sky:       '#A1D5F8',
          turquoise: '#54C7F0',
          cream:     '#FFF5DD',
          ink:       '#1F1B16',
          night:     '#152638',
        },
        // Semantic dark-mode surfaces — the ONLY sanctioned dark greys.
        // Use `dark:bg-surface-card` etc. instead of arbitrary hex values.
        surface: {
          paper:   '#FFFCF7',
          page:    '#0F1115',
          deep:    '#101216',
          sunken:  '#14171B',
          card:    '#17191D',
          raised:  '#1A1D22',
          overlay: '#22262C',
        },
        neutral: {
          50:  '#FAFAF8',
          100: '#F4F3F0',
          200: '#E8E6E1',
          300: '#D4D1CA',
          400: '#B8B4AB',
          500: '#938F86',
          600: '#706C64',
          700: '#524F48',
          800: '#36332D',
          900: '#1E1C18',
        },
      },
      fontFamily: {
        display: ['Freude', 'Nunito', 'ui-rounded', 'system-ui', 'sans-serif'],
        body:    ['Open Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'card':  '1rem',
        'card-lg': '1.5rem',
        'input': '0.75rem',
      },
      backgroundImage: {
        // Brand gradients — depth and warmth instead of flat fills.
        'gradient-blue':   'linear-gradient(135deg, #38A6FF 0%, #1D95FB 55%, #0B6FCB 100%)',
        'gradient-red':    'linear-gradient(135deg, #F0455A 0%, #D31A2A 60%, #A50F1E 100%)',
        'gradient-yellow': 'linear-gradient(135deg, #FFE067 0%, #FED401 60%, #F2B705 100%)',
        'gradient-sky':    'linear-gradient(160deg, #C9E8FF 0%, #A1D5F8 100%)',
        'gradient-sunrise':'linear-gradient(120deg, #FED401 0%, #FB7185 50%, #1D95FB 100%)',
        // Subtle mesh for hero/empty backgrounds.
        'mesh-joy': 'radial-gradient(at 12% 18%, rgba(29,149,251,0.18) 0px, transparent 50%), radial-gradient(at 88% 12%, rgba(254,212,1,0.18) 0px, transparent 45%), radial-gradient(at 78% 92%, rgba(211,26,42,0.12) 0px, transparent 48%)',
        'shimmer': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)',
      },
      boxShadow: {
        'soft':  '0 2px 8px rgba(29, 149, 251, 0.08)',
        'card':  '0 4px 24px rgba(0, 0, 0, 0.07)',
        'lift':  '0 12px 30px -8px rgba(31, 27, 22, 0.18)',
        'brand': '0 18px 45px rgba(29, 149, 251, 0.18)',
        'red-soft': '0 14px 32px rgba(211, 26, 42, 0.16)',
        'glow-blue':   '0 0 0 1px rgba(29,149,251,0.20), 0 10px 30px -6px rgba(29,149,251,0.45)',
        'glow-red':    '0 0 0 1px rgba(211,26,42,0.20), 0 10px 30px -6px rgba(211,26,42,0.40)',
        'glow-yellow': '0 0 0 1px rgba(254,212,1,0.30), 0 10px 30px -6px rgba(254,212,1,0.50)',
        'focus': '0 0 0 3px rgba(29, 149, 251, 0.25)',
        'focus-danger': '0 0 0 3px rgba(211, 26, 42, 0.20)',
        // 3D "pressable toy" button shadows (deep-red lip under the red gradient).
        'btn-red': 'inset 0 1px 0 rgba(255,255,255,0.28), 0 4px 0 -1px #A50F1E, 0 10px 20px -8px rgba(211,26,42,0.55)',
        'btn-red-active': 'inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 0 -1px #A50F1E',
      },
      animation: {
        'pulse-soft': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'mascot-float': 'mascot-float 5s ease-in-out infinite',
        'soft-pop': 'soft-pop 420ms ease-out both',
        'shimmer': 'shimmer 1.6s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 6s ease infinite',
        'wiggle': 'wiggle 0.6s ease-in-out',
        'glow-pulse': 'glow-pulse 2.4s ease-in-out infinite',
        'float-slow': 'mascot-float 7s ease-in-out infinite',
        'bob': 'bob 3s ease-in-out infinite',
        'sheen': 'sheen 2.5s ease-in-out infinite',
      },
      keyframes: {
        'mascot-float': {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) rotate(-1deg)' },
          '50%':      { transform: 'translate3d(0, -10px, 0) rotate(1deg)' },
        },
        'soft-pop': {
          '0%':   { transform: 'translate3d(0, 10px, 0) scale(.98)', opacity: '0' },
          '100%': { transform: 'translate3d(0, 0, 0) scale(1)', opacity: '1' },
        },
        'shimmer': {
          '0%':   { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(120%)' },
        },
        'gradient-shift': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%':      { 'background-position': '100% 50%' },
        },
        'wiggle': {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%':      { transform: 'rotate(-7deg)' },
          '75%':      { transform: 'rotate(7deg)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%':      { opacity: '1', transform: 'scale(1.06)' },
        },
        'bob': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-5px)' },
        },
        'sheen': {
          '0%':        { transform: 'translateX(-150%) skewX(-18deg)' },
          '60%, 100%': { transform: 'translateX(220%) skewX(-18deg)' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      screens: {
        'xs': '480px',
      },
    },
  },
  plugins: [forms({ strategy: 'class' })],
}

export default config
