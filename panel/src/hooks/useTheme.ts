import { atom, useAtom } from 'jotai';


/**
 * Helpers
 */
const setThemeCookieValue = (value: string) => {
    document.cookie = `txAdmin-theme=${value};path=/;max-age=31536000;`;
}


/**
 * Constants
 */
const root = window.document.documentElement;
const availableCustomThemes = window.txConsts.customThemes.map((theme) => theme.name);
const customThemesClasses = window.txConsts.customThemes.map((theme) => `theme-${theme.name}`);
const defaultThemes = ['dark', 'light'];
const initialAtomValue = availableCustomThemes.find((name) => root.classList.contains(`theme-${name}`))
    ?? defaultThemes.find((name) => root.classList.contains(name))
    ?? window.txConsts.defaultTheme;


/**
 * Atom
 */
const themeAtom = atom(initialAtomValue);

//Resetting cookie to a valid value + refreshing expiration
setThemeCookieValue(initialAtomValue);


/**
 * Hook
 */
export const useTheme = () => {
    const [atomTheme, setAtomTheme] = useAtom(themeAtom);

    //Theme setter
    const setTheme = (newTheme: string) => {
        if (newTheme === atomTheme) return;

        //Changing app theme
        let iframeTheme;
        root.classList.remove(...defaultThemes, ...customThemesClasses);
        if (defaultThemes.includes(newTheme)) {
            root.classList.add(newTheme);
            iframeTheme = newTheme;
        } else if (availableCustomThemes.includes(newTheme)) {
            const selectorTheme = window.txConsts.customThemes.find((theme) => theme.name === newTheme)
            const lightDarkSelector = selectorTheme?.isDark ? 'dark' : 'light';
            root.classList.add(lightDarkSelector, `theme-${newTheme}`);
            iframeTheme = lightDarkSelector;
        } else {
            throw new Error(`invalid theme ${newTheme}`);
        }

        //Changing iframe theme
        const iframeBody = (document.getElementById('legacyPageiframe') as HTMLObjectElement)?.contentDocument?.body;
        if (iframeBody) {
            if (iframeTheme === 'dark') {
                iframeBody.classList.add('theme--dark');
            } else {
                iframeBody.classList.remove('theme--dark');
            }
        }

        //Setting atom/cookie
        setAtomTheme(newTheme);
        setThemeCookieValue(newTheme);
        console.log(`Changed theme from '${atomTheme}' to '${newTheme}'.`);
    }

    return {
        theme: atomTheme,
        setTheme,
    }
};
