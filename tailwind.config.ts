import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // App surfaces
        bg: "#F5F8FC",
        surface: "#FFFFFF",
        border: "#E3EAF2",
        // Brand
        brand: "#1E6FD9",
        "brand-soft": "#E6F1FB",
        // Text
        ink: "#0F2540",
        muted: "#5B6B7F",
        // Status — ok / warn / alarm
        ok: "#1D9E75",
        "ok-soft": "#E1F5EE",
        warn: "#E0A800",
        "warn-soft": "#FAEEDA",
        alarm: "#E24B4A",
        "alarm-soft": "#FCEBEB",
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
        btn: "12px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 37, 64, 0.04), 0 4px 16px rgba(15, 37, 64, 0.04)",
      },
      maxWidth: {
        phone: "420px",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
        "scale-in": "scale-in 180ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
