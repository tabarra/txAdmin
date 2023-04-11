// import './module-augmentation'
import { createTheme } from "@mui/material";


export const MenuThemeRedm = createTheme({
  name: 'redm',
  logo: 'images/txadmin-redm.png',
  palette: {
    mode: "dark",
    primary: {
      main: "#F7DC6F",
    },
    success: {
      main: "#82E0AA",
    },
    warning: {
      main: "#F5B041",
    },
    error: {
      main: "#E74C3C",
    },
    info: {
      main: "#85C1E9",
    },
    background: {
      default: "#332E27",
      paper: "#4B3B2E",
    },
    action: {
      selected: "rgba(255, 255, 255, 0.08)",
    },
    secondary: {
      main: "#D6A2E8",
    },
    text: {
      secondary: "#E6D5C9",
      primary: "#E8E1DC",
    },
  },
  components: {
    MuiListItem: {
      styleOverrides: {
        root: {
          "&.Mui-selected": {
            backgroundColor: "rgba(255, 255, 255, 0.08)",
          },
        },
      },
    },
    MuiPaper: { styleOverrides: { root: { backgroundImage: "unset" } } },
  },
});
