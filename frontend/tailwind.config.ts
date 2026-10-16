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
        primary: {
          DEFAULT: "#666CFF",
          hover: "#5C61E6",
          darken: "#5C61E6",
          tonal: "rgba(102, 108, 255, 0.12)",
          focus: "rgba(102, 108, 255, 0.20)",
        },
        brand: {
          DEFAULT: "var(--school-primary, #666CFF)",
          hover: "var(--school-primary-hover, #5C61E6)",
          light: "var(--school-primary-light, rgba(102, 108, 255, 0.12))",
          accent: "#FDB528",
        },
        canvas: {
          light: "#F7F7F9",
          dark: "#282A42",
        },
        surface: {
          light: "#FFFFFF",
          dark: "#30334E",
        },
        semantic: {
          success: "#72E128",
          warning: "#FDB528",
          error: "#FF4D49",
          info: "#26C6F9",
          secondary: "#6D788D",
        },
      },
      borderRadius: {
        xs: "2px",
        sm: "4px",
        md: "6px",
        lg: "8px",
        xl: "10px",
        "2xl": "12px",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "'Inter'", "system-ui", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "sans-serif"],
        urdu: ["var(--font-urdu)", "'Noto Naskh Arabic'", "'Urdu Typesetting'", "serif"],
      },
      boxShadow: {
        card: "0 2px 6px 0 rgba(38, 43, 67, 0.08)",
        "card-dark": "0 2px 6px 0 rgba(16, 17, 33, 0.26)",
        primary: "0 2px 6px 0 rgba(102, 108, 255, 0.35)",
      },
    },
  },
  plugins: [],
};
export default config;
