/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Primary Brand
        primary: "#003ec7",
        "primary-container": "#0052ff",
        "primary-fixed": "#dde1ff",
        "primary-fixed-dim": "#b7c4ff",
        "on-primary": "#ffffff",
        "on-primary-container": "#dfe3ff",
        "on-primary-fixed": "#001452",
        "on-primary-fixed-variant": "#0038b6",
        "inverse-primary": "#b7c4ff",

        // Secondary
        secondary: "#3755c3",
        "secondary-container": "#708cfd",
        "secondary-fixed": "#dde1ff",
        "secondary-fixed-dim": "#b8c4ff",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#00217a",

        // Tertiary (Success / Accent)
        tertiary: "#005851",
        "tertiary-container": "#007369",
        "tertiary-fixed": "#89f5e7",
        "tertiary-fixed-dim": "#6bd8cb",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#8bf7e9",

        // Surface & Canvas
        background: "#f8f9ff",
        surface: "#f8f9ff",
        "surface-bright": "#f8f9ff",
        "surface-dim": "#cbdbf5",
        "surface-tint": "#004ced",
        "surface-variant": "#d3e4fe",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#eff4ff",
        "surface-container": "#e5eeff",
        "surface-container-high": "#dce9ff",
        "surface-container-highest": "#d3e4fe",
        "inverse-surface": "#213145",
        "inverse-on-surface": "#eaf1ff",

        // Typography & Outlines
        "on-background": "#0b1c30",
        "on-surface": "#0b1c30",
        "on-surface-variant": "#434656",
        outline: "#737688",
        "outline-variant": "#c3c5d9",

        // Feedback / Alert
        error: "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",
      },
      borderRadius: {
        DEFAULT: "0.25rem", // 4px
        lg: "0.5rem",       // 8px
        xl: "0.75rem",      // 12px
        "2xl": "1rem",      // 16px (Card containers)
        full: "9999px",     // Circular pills / avatars
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        subtle: "0 1px 8px rgba(0,0,0,0.04)",
        card: "0 2px 4px rgba(0,0,0,0.05)",
        modal: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      },
    },
  },
  plugins: [],
};
