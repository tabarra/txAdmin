import { LuMoon, LuSun } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';

export function SimpleThemeToggle() {
    const { theme, setTheme } = useTheme();
    const switchTheme = () => {
        if(theme === 'light') {
            setTheme('dark');
        } else {
            setTheme('light');
        }
    }

    return <>
        <Button variant="outline" size="icon" onClick={switchTheme}>
            <LuSun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <LuMoon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
        </Button>
        {/* <Button variant="outline" size="icon" onClick={()=>{setTheme('deep-purple');}}>💜</Button> */}
    </>;
}
