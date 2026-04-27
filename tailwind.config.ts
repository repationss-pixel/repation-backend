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
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#1D9E75",
          50: "#e8f7f2",
          100: "#c5ebdf",
          200: "#8fd8c0",
          300: "#59c4a0",
          400: "#2eb588",
          500: "#1D9E75",
          600: "#178560",
          700: "#116b4d",
          800: "#0b5239",
          900: "#063826",
        },
      },
    },
  },
  plugins: [],
};
export default config;
