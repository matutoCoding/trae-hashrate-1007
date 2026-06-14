/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        cheese: {
          50: "#FBF7EF",
          100: "#F5ECDA",
          200: "#EAD8B3",
          300: "#DDC18A",
          400: "#D0A962",
          500: "#C9A66B",
          600: "#B08A4F",
          700: "#8E6C3D",
          800: "#6B502E",
          900: "#4A3620",
        },
        algae: {
          50: "#EFF6F2",
          100: "#D7E9DC",
          200: "#B0D2BA",
          300: "#88BC98",
          400: "#61A576",
          500: "#4A7C59",
          600: "#3B6346",
          700: "#2D4A34",
          800: "#1E3123",
          900: "#0F1811",
        },
        wine: {
          50: "#FAEEF1",
          100: "#F3D4DB",
          200: "#E7A9B7",
          300: "#DB7E93",
          400: "#CF536F",
          500: "#B33951",
          600: "#902D40",
          700: "#6D2130",
          800: "#4A1620",
          900: "#270B10",
        },
        cream: {
          bg: "#FAF6EF",
          surface: "#FDFBF5",
          card: "#FFFEF9",
          border: "#E8DFCD",
          text: "#2B2A27",
          subtext: "#6B655A",
        },
      },
      fontFamily: {
        serif: ['"Source Han Serif SC"', '"Noto Serif SC"', "SimSun", "serif"],
        sans: ['"Inter"', '"PingFang SC"', '"Microsoft YaHei"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 12px rgba(201, 166, 107, 0.10), 0 1px 3px rgba(43, 42, 39, 0.05)",
        cardHover: "0 8px 24px rgba(201, 166, 107, 0.18), 0 2px 6px rgba(43, 42, 39, 0.08)",
        glow: "0 0 20px rgba(201, 166, 107, 0.35)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.65" },
        },
      },
    },
  },
  plugins: [],
};
