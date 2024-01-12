import { atom, useAtom, useSetAtom } from 'jotai';


/**
 * Helpers
 */
const setThemeCookieValue = (value: string) => {
    document.cookie = `txAdmin-theme=${value};path=/;SameSite=Lax;max-age=31536000;`;
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
 * Theme changer
 */
const applyNewTheme = (oldTheme: string, newTheme: string) => {
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
    const iframeBody = (document.getElementById('legacyPageIframe') as HTMLObjectElement)?.contentDocument?.body;
    if (iframeBody) {
        if (iframeTheme === 'dark') {
            iframeBody.classList.add('theme--dark');
        } else {
            iframeBody.classList.remove('theme--dark');
        }
    }

    setThemeCookieValue(newTheme);
    console.log(`Changed theme from '${oldTheme}' to '${newTheme}'.`);
}


/**
 * Hooks
 */
export const useTheme = () => {
    const [atomTheme, setAtomTheme] = useAtom(themeAtom);

    //Theme setter
    const setTheme = (newTheme: string) => {
        if (newTheme === atomTheme) return;
        applyNewTheme(atomTheme, newTheme);
        setAtomTheme(newTheme);
    }

    return {
        theme: atomTheme,
        setTheme,
    }
};


export const useToggleTheme = () => {
    const setTheme = useSetAtom(themeAtom);
    return () => setTheme((curr) => {
        if (curr === 'dark') {
            applyNewTheme(curr, 'light');
            return 'light';
        } else if (curr === 'light') {
            applyNewTheme(curr, 'dark');
            return 'dark';
        } else {
            console.log('invalid theme', curr);
            return curr;
        }
    });
}
