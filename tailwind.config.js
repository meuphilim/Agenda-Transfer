/** @type {import('tailwindcss').Config} */
import { colors } from "./src/theme/colors";

export default {
  darkMode: ["class"], // ou 'media', se preferir
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 🔹 Tokens semânticos principais
        background: colors.background,
        foreground: colors.foreground,

        card: colors.card,
        "card-foreground": colors["card-foreground"],

        primary: colors.primary,
        "primary-dark": colors["primary-dark"],
        "primary-light": colors["primary-light"],
        "primary-foreground": colors["primary-foreground"],

        secondary: colors.secondary,
        "secondary-foreground": colors["secondary-foreground"],

        accent: colors.accent,
        "accent-foreground": colors["accent-foreground"],

        muted: colors.muted,
        "muted-foreground": colors["muted-foreground"],

        border: colors.border,
        input: colors.input,
        ring: colors.ring,

        // 🔹 Escalas contextuais (status / feedback)
        info: colors.info,
        success: colors.success,
        warning: colors.warning,
        danger: colors.danger,
      },
    },
  },
  plugins: [],
};
