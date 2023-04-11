declare module '@mui/material/styles' {
    interface Theme {
        name: string;
        logo: string;
    }

    // allow configuration using `createTheme`
    interface ThemeOptions {
        name?: string;
        logo?: string;
    }
}
