import { cn } from "@/lib/utils";
import { AvatarFallback, AvatarImage, Avatar as ShadcnAvatar } from "./ui/avatar";

// "Optimally distinct colors" from http://medialab.github.io/iwanthue/
// Params: H 0~360, C 25~90, L 35~80, 128 colors
// NOTE: same app used to generate discourse's colors, but diff parameters (and seed)
const colors = ["#de87ff", "#4ad63b", "#8625c2", "#81da23", "#7135ce", "#b1d408", "#3953eb", "#5ab000", "#ad30ce", "#01a91e", "#e533cd", "#00ad3f", "#ff2ebe", "#00d577", "#d800ab", "#71dd65", "#5836c0", "#97d947", "#0044cd", "#c3cf23", "#6369ff", "#c8c200", "#015fe8", "#fcbc01", "#ba69ff", "#afd440", "#d669ff", "#1c7a00", "#ff5ee8", "#5a9300", "#a0009e", "#70dc85", "#f301a0", "#00a75d", "#f4006b", "#69dba1", "#b20084", "#b8a900", "#0178f1", "#e4b100", "#0266d2", "#e49700", "#0277d8", "#f27b00", "#0091e0", "#dd2b00", "#00d1db", "#d80029", "#50dbc0", "#ff409c", "#00702b", "#ff8ff6", "#386500", "#bd88ff", "#617700", "#948eff", "#db7d00", "#3f49a4", "#ff7c29", "#24509c", "#ffb14a", "#6b3b9a", "#e2c45f", "#872b84", "#019967", "#ce0073", "#007144", "#ff76d0", "#4d5e00", "#82a3ff", "#ff6434", "#5aceff", "#b93600", "#81b5ff", "#9c3700", "#00a7b6", "#ff4a61", "#01a79e", "#ff4b77", "#007f6b", "#b1003c", "#b4d086", "#92266c", "#887b00", "#d2b0ff", "#ac6500", "#005f9e", "#ff794e", "#007db0", "#ff695a", "#017574", "#a6111d", "#abc6ff", "#975100", "#b0bcff", "#966800", "#ffabed", "#265e33", "#ff77af", "#375b3a", "#a7004d", "#cbc98f", "#972063", "#f7bb73", "#005a83", "#ff915a", "#5f487e", "#5e5800", "#e1b9e9", "#6b4e0b", "#ff9cc5", "#4a582a", "#ff8792", "#83986d", "#873464", "#d0b58b", "#6f4274", "#feb595", "#893650", "#dba98f", "#952f28", "#b093bc", "#ff8d79", "#a06a80", "#7e432c", "#e8b0cc", "#9c6e57", "#ff9fa8"];

//Modified code from from @wowjeeez
//It's impossible to be inclusive to different alphabets and also have meaningful initials, but I tried my best 
const getInitials = (username: string) => {
    username = username.normalize('NFKD').replace(/[\u0300-\u036F]/g, '');
    let letters = '';
    if (/^[A-Z][a-z]*((?:[A-Z][a-z]*)+)$/.test(username)) {
        // pascal
        const upperCaseLetters = username.match(/[A-Z]/g);
        letters = upperCaseLetters ? upperCaseLetters.slice(0, 2).join('') : '??';
    } else if (/^[a-z]+([_\-.][a-z]+)+$/.test(username)) {
        // snake, kebab, dot
        const words = username.split(/[_\-.]/);
        letters = words[0][0] + words[1][0];
    } else {
        // default
        const justAlphanumerics = username.replace(/[^a-zA-Z0-9]/g, '');
        if (justAlphanumerics.length === 0) {
            letters = username.length ? username[0] : '??';
        } else if (justAlphanumerics.length <= 2) {
            letters = justAlphanumerics;
        } else {
            letters = justAlphanumerics[0] + justAlphanumerics[justAlphanumerics.length - 1];
        }
    }
    return letters.toLocaleUpperCase();
};

//Apparently based on the hash DJB2, the distribution is relatively even
const getUsernameColor = (username: string) => {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        const char = username.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
    }
    return colors[Math.abs(hash) % colors.length];
};


type Props = {
    username: string;
    profilePicture?: string;
    className?: string;
};
export default function Avatar({ username, profilePicture, className }: Props) {
    return <ShadcnAvatar
        className={cn(
            'bg-zinc-200 dark:bg-zinc-800 transition-colors text-zinc-200',
            className
        )}
    >
        {
            profilePicture &&
            <AvatarImage
                src={profilePicture}
                alt={username}
            />
        }
        <AvatarFallback
            className={className}
            style={{ backgroundColor: getUsernameColor(username) }}
            delayMs={profilePicture ? 1000 : undefined}
        >
            {getInitials(username)}
        </AvatarFallback>
    </ShadcnAvatar>;
}
