import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0F0F1A',
        panel: '#1F1F35',
        accent: '#FF4D6D',
        muted: '#B0B0C0',
      },
    },
  },
  plugins: [],
};

export default config;
