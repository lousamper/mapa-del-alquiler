import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: "#ff8ed1",     // rosa (CTA)
        blue: "#3b82f6",        // azul secundario
        navy: "#0b1f3b",        // texto
        background: "#f5f5f5",  // fondo
      },
    },
  },
  plugins: [],
} satisfies Config;
