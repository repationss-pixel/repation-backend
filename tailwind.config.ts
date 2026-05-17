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
        cream: "#F2EAD9",
        "cream-dark": "#EDE3CF",
        "bg-dark": "#2C1A0A",
        "accent-gold": "#C4A06A",
        "accent-brown": "#6B3D14",
        "text-primary": "#1C1009",
        "text-secondary": "#7A6A55",
        "text-muted": "#B0A090",
        border: "#D4BFA0",
        card: "#FBF5E6",
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
