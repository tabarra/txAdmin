import { createMuiTheme } from "@material-ui/core";

export const MenuTheme = createMuiTheme({
  palette: {
    type: "dark",
    primary: {
      main: "rgba(0,197,140,0.87)",
    },
    success: {
      main: "rgba(0,149,108,0.87)",
    },
    error: {
      main: "rgba(184,14,36,0.87)",
    },
    info: {
      main: "rgba(9,96,186,0.87)",
    },
    background: {
      default: "#151a1f",
      paper: "#24282B",
    },
    action: {
      selected: "rgba(255, 255, 255, 0.08)",
    },
    secondary: {
      main: "#fff",
    },
    text: {
      secondary: "rgba(221,221,221,0.54)",
      primary: "#fff",
    },
  },
});
