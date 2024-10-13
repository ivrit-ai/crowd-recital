import type { Config } from "tailwindcss";
import {
  dark as darkThemeBase,
  light as lightThemeBase,
} from "daisyui/src/theming/themes";

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
  daisyui: {
    themes: [
      {
        light: {
          ...lightThemeBase,
          ".high-contrast .bg-base-content": {
            "background-color": "black",
          },
          ".high-contrast .text-base-300": {
            color: "white",
          },
        },
      },
      {
        dark: {
          ...darkThemeBase,
          ".high-contrast .bg-base-content": {
            "background-color": "white",
          },
          ".high-contrast .text-base-300": {
            color: "black",
          },
        },
      },
    ],
  },
} satisfies Config;
