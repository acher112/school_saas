import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "var(--school-primary, #2563EB)",
          hover: "var(--school-primary-hover, #1D4ED8)",
          light: "var(--school-primary-light, #EFF6FF)",
          accent: "var(--school-accent, #F59E0B)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        urdu: ["var(--font-urdu)", "'Noto Naskh Arabic'", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
