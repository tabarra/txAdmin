import { useTheme } from "@/hooks/theme";
import { useEffect, useRef } from "react";

type ThemeProviderProps = {
    children: React.ReactNode;
};
export default function ThemeProvider({ children }: ThemeProviderProps) {
    const { theme, setTheme } = useTheme();

    //Listener for system theme change - only overwrites default themes (light/dark)
    useEffect(() => {
        const changeHandler = (e: MediaQueryListEvent) => {
            const prefersDarkTheme = e.matches;
            if (theme === 'dark' && !prefersDarkTheme) {
                setTheme('light');
            } else if (theme === 'light' && prefersDarkTheme) {
                setTheme('dark');
            }
        }
        const browserTheme = window.matchMedia("(prefers-color-scheme: dark)");
        browserTheme.addEventListener('change', changeHandler);
        return () => { browserTheme.removeEventListener('change', changeHandler) }
    }, [theme]);

    return <>{children}</>;
}
