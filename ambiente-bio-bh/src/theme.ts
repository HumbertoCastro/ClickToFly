import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  typography: {
    fontFamily: "var(--font-body)",
    h1: {
      fontFamily: "var(--font-display)",
      fontWeight: 800,
    },
    h2: {
      fontFamily: "var(--font-display)",
      fontWeight: 760,
    },
    h3: {
      fontFamily: "var(--font-display)",
      fontWeight: 720,
    },
    button: {
      fontFamily: "var(--font-body)",
      fontWeight: 700,
      textTransform: "none",
    },
  },
  shape: {
    borderRadius: 12,
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1440,
    },
  },
});
