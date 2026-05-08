/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        parchment: "#FDF5E6",
        charcoal: "#2D2D2D",
      },
      fontFamily: {
        serifCn: ['"Noto Serif SC"', "Georgia", '"Songti SC"', "serif"],
      },
      keyframes: {
        breathe: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.95" },
          "50%": { transform: "scale(1.01)", opacity: "1" },
        },
        shiver: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-0.5px)" },
          "75%": { transform: "translateX(0.5px)" },
        },
      },
      animation: {
        breathe: "breathe 1.6s ease-in-out infinite",
        shiver: "shiver 0.18s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
