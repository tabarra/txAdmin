import { createMuiTheme } from "@material-ui/core";

export const MenuTheme = createMuiTheme({
  palette: {
    type: "dark",
    primary: {
      main: "rgba(0,197,140,0.87)",
    },
    background: {
      default: "#151a1f",
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
