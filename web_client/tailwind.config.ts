import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "selector",
  theme: {
    extend: {
      screens: {
        nokbd: {
          raw: "(not (hover: hover)) or (not (pointer: fine))",
        },
        nomouse: {
          raw: "not (pointer: fine)",
        },
      },
      spacing: {
        topbar: "var(--topbar-height)",
        "screen-minus-topbar": "calc(100vh - var(--topbar-height))",
      },
    },
  },
  plugins: [require("daisyui"), require("@tailwindcss/typography")],
} satisfies Config;
