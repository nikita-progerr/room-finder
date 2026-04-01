/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#f0f4ff",
          100: "#e0eaff",
          200: "#c1d4ff",
          300: "#93b3ff",
          400: "#5e88ff",
          500: "#3461ff",
          600: "#1a3ef5",
          700: "#132de1",
          800: "#1626b6",
          900: "#18258f",
          950: "#111860",
        },
        accent: {
          green:  "#22c55e",
          yellow: "#eab308",
          red:    "#ef4444",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      animation: {
        "fade-in":     "fadeIn 0.4s ease-out",
        "slide-up":    "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-down":  "slideDown 0.3s ease-out",
        "scale-in":    "scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-slow":  "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "shimmer":     "shimmer 1.5s infinite",
        "glow":        "glow 2s ease-in-out infinite",
        "float":       "float 6s ease-in-out infinite",
        "gradient":    "gradientShift 8s ease infinite",
        "spin-slow":   "spin 3s linear infinite",
      },
      keyframes: {
        fadeIn: { 
          from: { opacity: "0" }, 
          to: { opacity: "1" } 
        },
        slideUp: { 
          from: { opacity: "0", transform: "translateY(20px)" }, 
          to: { opacity: "1", transform: "translateY(0)" } 
        },
        slideDown: { 
          from: { opacity: "0", transform: "translateY(-10px)" }, 
          to: { opacity: "1", transform: "translateY(0)" } 
        },
        scaleIn: { 
          from: { opacity: "0", transform: "scale(0.95)" }, 
          to: { opacity: "1", transform: "scale(1)" } 
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        glow: {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        gradientShift: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      transitionTimingFunction: {
        "bounce-in": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};
