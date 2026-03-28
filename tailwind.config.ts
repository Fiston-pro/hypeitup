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
        sans: ["var(--font-dm-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ["var(--font-syne)", "var(--font-dm-sans)", "ui-sans-serif", "system-ui"],
      },
      colors: {
        background: "#0a0a0a",
        accent: "#f5c842",
      },
    },
  },
  plugins: [],
};
export default config;
