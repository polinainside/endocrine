import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // App surfaces — тёплый минимализм
        bg: "#F7F6F3",
        surface: "#FFFFFF",
        border: "#ECE9E3",
        // Brand — приглушённый терракотовый оранж (по референсу); fills.
        brand: "#E36C39",
        "brand-soft": "#FBEAE0",
        // brand-ink — затемнённый оранж для мелкого ТЕКСТА (контраст AA на белом).
        "brand-ink": "#B34E1B",
        // Поверхности градиентов / фон
        raised: "#F4F2EE",
        glow: "#FCEFE7",
        // Text
        ink: "#211F1D",
        muted: "#6B6760",
        // Status — ok / warn / alarm
        ok: "#1D9E75",
        "ok-soft": "#E2F4EC",
        warn: "#8A6D00",
        "warn-soft": "#FAEEDA",
        alarm: "#E24B4A",
        "alarm-soft": "#FCEBEB",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "22px",
        btn: "14px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(33, 31, 29, 0.04), 0 10px 30px rgba(33, 31, 29, 0.05)",
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
