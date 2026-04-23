/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#84cc16", // Vibrant Olive / Lime 500
          dark: "#65a30d",
          light: "#ecfccb",
        },
        secondary: {
          DEFAULT: "#f59e0b", // Vibrant Saffron / Amber 500
          dark: "#d97706",
          light: "#fef3c7",
        },
        accent: "#eab308", // Yellow 500
        dark: "#334155", // Slate 700
        cream: {
          DEFAULT: "#fafaf9", // Warm off-white
          dark: "#f5f5f4",
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(250, 250, 249, 0.8), rgba(250, 250, 249, 0.4))',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'premium': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      }
    },
  },
  plugins: [],
}
