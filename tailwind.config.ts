import type {Config} from 'tailwindcss';

export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['"PT Sans"', 'sans-serif'],
        headline: ['Poppins', 'sans-serif'],
        code: ['monospace'],
      },
      colors: {
        background: '#ECE5DD',
        foreground: '#075E54',
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#075E54',
        },
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#075E54',
        },
        primary: {
          DEFAULT: '#128C7E',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#F0F0F0',
          foreground: '#075E54',
        },
        muted: {
          DEFAULT: '#F0F0F0',
          foreground: '#075E54',
        },
        accent: {
          DEFAULT: '#25D366',
          foreground: '#FFFFFF',
        },
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#FFFFFF',
        },
        border: '#F0F0F0',
        input: '#F0F0F0',
        ring: '#25D366',
        chart: {
          '1': '#25D366',
          '2': '#34B7F1',
          '3': '#128C7E',
          '4': '#075E54',
          '5': '#F0F0F0',
        },
        sidebar: {
          DEFAULT: '#FFFFFF',
          foreground: '#075E54',
          primary: '#128C7E',
          'primary-foreground': '#FFFFFF',
          accent: '#25D366',
          'accent-foreground': '#FFFFFF',
          border: '#F0F0F0',
          ring: '#25D366',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
