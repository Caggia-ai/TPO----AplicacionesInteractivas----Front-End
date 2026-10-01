import daisyui from "daisyui";

/** Tema DaisyUI a dos tintas: negro y blanco, sin ningún gris. */
const common = {
  "--rounded-box": "0",
  "--rounded-btn": "0",
  "--rounded-badge": "0",
  "--tab-radius": "0",
  "--animation-btn": "0.08s",
  "--animation-input": "0s",
  "--btn-focus-scale": "1",
  "--border-btn": "3px",
  "--tab-border": "3px",
  "--btn-text-case": "none",
};

export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Dela Gothic One'", "'Reggae One'", "'Hiragino Sans'", "'Yu Gothic'", "Impact", "sans-serif"],
        body: ["'Zen Kaku Gothic New'", "'Hiragino Sans'", "'Yu Gothic'", "'Helvetica Neue'", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        manga: {
          ...common,
          "color-scheme": "light",
          primary: "#000000",
          "primary-content": "#ffffff",
          secondary: "#ffffff",
          "secondary-content": "#000000",
          accent: "#000000",
          "accent-content": "#ffffff",
          neutral: "#000000",
          "neutral-content": "#ffffff",
          "base-100": "#ffffff",
          "base-200": "#ffffff",
          "base-300": "#ffffff",
          "base-content": "#000000",
          info: "#000000",
          "info-content": "#ffffff",
          success: "#000000",
          "success-content": "#ffffff",
          warning: "#000000",
          "warning-content": "#ffffff",
          error: "#000000",
          "error-content": "#ffffff",
        },
      },
      {
        mangadark: {
          ...common,
          "color-scheme": "dark",
          primary: "#ffffff",
          "primary-content": "#000000",
          secondary: "#000000",
          "secondary-content": "#ffffff",
          accent: "#ffffff",
          "accent-content": "#000000",
          neutral: "#ffffff",
          "neutral-content": "#000000",
          "base-100": "#000000",
          "base-200": "#000000",
          "base-300": "#000000",
          "base-content": "#ffffff",
          info: "#ffffff",
          "info-content": "#000000",
          success: "#ffffff",
          "success-content": "#000000",
          warning: "#ffffff",
          "warning-content": "#000000",
          error: "#ffffff",
          "error-content": "#000000",
        },
      },
    ],
    darkTheme: "mangadark",
    base: true,
    styled: true,
    utils: true,
    logs: false,
  },
};
