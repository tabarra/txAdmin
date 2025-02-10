export default {
  name: 'fivem',
  logo: 'images/txadmin.png',
  palette: {
    mode: "dark",
    primary: {
      main: "rgba(0,197,140,0.87)",
    },
    success: {
      main: "rgba(0,149,108,0.87)",
    },
    warning: {
      main: "rgb(255,189,22)",
    },
    error: {
      main: "rgb(194,13,37)",
    },
    info: {
      main: "rgb(9,96,186)",
    },
    background: {
      default: "#151a1f",
      paper: "#24282B",
    },
    action: {
      selected: "rgba(255, 255, 255, 0.1)",
    },
    secondary: {
      main: "#fff",
    },
    text: {
      primary: "#fff",
      secondary: "rgba(221,221,221,0.54)",
    },
  },
  components: {
    MuiListItem: {
      styleOverrides: {
        root: {
          border: "1px solid transparent",
          "&.Mui-selected": {
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          border: "1px solid transparent",
          "&.Mui-selected": {
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "unset"
        }
      }
    },
  },
} as const;
