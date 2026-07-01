import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#0F172A",   // Navy Blue bem escuro (Luxo)
          orange: "#F97316", // Highway Orange
          accent: "#3B82F6", // Azul destaque
        }
      },
    },
  },
  plugins: [],
};
export default config;