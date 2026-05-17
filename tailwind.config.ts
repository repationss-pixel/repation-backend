import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        background: "#F2EAD9",
        foreground: "#1C1009",
        beige: {
          DEFAULT: "#F2EAD9",
          dark: "#EDE3CF",
          card: "#FBF5E6",
        },
        wood: {
          DEFAULT: "#2C1A0A",
          light: "#6B3D14",
        },
        gold: "#C4A06A",
        border: "#D4BFA0",
        repation: {
          DEFAULT: "#6B3D14",
          dark: "#2C1A0A",
          light: "#C4A06A",
        },
        primary: {
          DEFAULT: "#6B3D14",
          50: "#fdf6ee",
          100: "#f5e3c8",
          200: "#e9c38e",
          300: "#d9a05a",
          400: "#C4A06A",
          500: "#6B3D14",
          600: "#5a3311",
          700: "#47280d",
          800: "#2C1A0A",
          900: "#1a0f06",
        },
      },
    },
  },
  plugins: [],
};
export default config;
