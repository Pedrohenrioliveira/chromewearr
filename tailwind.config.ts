import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'text-primary': '#111111',
        'primary': '#000000',
        'on-primary': '#ffffff',
        'secondary': '#5e5e5e',
        'surface-pure': '#ffffff',
        'surface-off': '#f7f7f7',
        'surface-container': '#f0edec',
        'border-hairline': '#e5e5e5',
        'text-secondary': '#737373',
        'text-disabled': '#a3a3a3',
        'status-active': '#111111',
        'status-soldout': '#d4d4d4',
        'surface-variant': '#e5e2e1',
      },
      fontFamily: {
        sans: ['var(--font-hanken)', 'Hanken Grotesk', 'sans-serif'],
        display: ['var(--font-cinzel)', 'Cinzel', 'Hanken Grotesk', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
