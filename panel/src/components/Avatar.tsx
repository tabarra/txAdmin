import { cn } from "@/lib/utils";
import { AvatarFallback, AvatarImage, Avatar as ShadcnAvatar } from "./ui/avatar";

// Yoinked from https://github.com/discourse/discourse/blob/67bcef3959298c3e5d0229fdb0e80449cd0721bb/lib/letter_avatar.rb#L137
const colors = ["#c67d28", "#3d9bf3", "#4af34b", "#ee59a6", "#34f0e0", "#b19c9b", "#f07891", "#6f9a4e", "#edb3f5", "#ed655f", "#59ef9b", "#2bfe46", "#a3d4f5", "#41988e", "#a587f6", "#b5a626", "#bbe5ce", "#4da419", "#b3f665", "#ea5d25", "#e19b73", "#8e8cbc", "#df788c", "#f9ae1b", "#f475e1", "#898d66", "#4bbf92", "#bcef8e", "#a4c791", "#ad7895", "#3bc359", "#dec6dc", "#4491bb", "#ecccb3", "#9fc348", "#bc79bd", "#a6a055", "#b5e925", "#ecb155", "#7993a0", "#eada6e", "#f19dbf", "#3ec8ea", "#85f322", "#58956e", "#3be4f8", "#b77776", "#fbc32d", "#71c47a", "#c57346", "#50afbb", "#67e7ee", "#f04885", "#e495f1", "#b4bc9f", "#ac8455", "#b487fb", "#ecc23a", "#d9b06d", "#58f4c7", "#ba9def", "#71e660", "#ce73a5", "#f4b2a3", "#e68b1a", "#f17d59", "#53a042", "#6bbea6", "#c5a1d2", "#c6cbf5", "#ee7513", "#e47774", "#839c29", "#91b2a8", "#8baadc", "#e95f7d", "#57b2e6", "#9dc877", "#ed8c4c", "#e5b9ba", "#90ced4", "#ecd19e", "#b9bd4f", "#22d042", "#54ee81", "#858c86", "#439d5e", "#a8b319", "#8c91f0", "#97f17d", "#43a26b", "#c89c15", "#a9adbd", "#e274bd", "#85e7bf", "#c2a13f", "#f14d63", "#f1d935", "#7bcc69", "#d2c977", "#e56c9b", "#f05b48", "#bb73d2", "#f0a364", "#b2d939", "#b38774", "#ccd318", "#ba8739", "#dfb087", "#cc9497", "#74df32", "#5fc32e", "#7ba0ec", "#b5ac83", "#8edcca", "#f08c70", "#ac91a4", "#e47c2d", "#8797f3", "#2acd7d", "#c0e974", "#77aa72", "#9e8a1a", "#49beb7", "#b9e5f3", "#e36b37", "#c4cdca", "#848f3c", "#e9c0ed", "#3e96dc", "#cdc98d", "#6a8cbe", "#a183cd", "#87869e", "#c68b51", "#73ab20", "#65b543", "#958977", "#258eb7", "#b782af", "#a87d85", "#7c8e57", "#ec9cab", "#e8c25b", "#dbc845", "#90db22", "#db5fbb", "#919ad9", "#a5b964", "#7feea3", "#e0b2c6", "#779978", "#7cd45c", "#aca169", "#e79b87", "#9d8465", "#7ab992", "#35a633", "#46a35a", "#96bed5", "#d26b3c", "#a698b9", "#9fc29f", "#278dde", "#cab0a1", "#5f8ce5", "#a88e57", "#5daacb", "#9f8e36", "#0ea827", "#5e9695", "#bbce88", "#9de0a6", "#eb9ed0", "#6de8d8", "#8dc957", "#d07c76", "#8e7dd6", "#13edae", "#48db29", "#ea666f", "#a88e4f", "#bc8723", "#5f9b8f", "#94ad74", "#df705f", "#e480ec", "#ce7236", "#c37758", "#eb8c5e", "#ebca7d", "#e99b99", "#d6d6ee", "#f6c823", "#977dab", "#8491ac", "#838e76", "#c77e96", "#3da27b", "#3ab097", "#d78d45", "#e19adc", "#dc4da7", "#e9a140", "#82dd89", "#51bf81", "#a9a28c", "#aeb1de", "#ecae2f", "#e9bcb4", "#45deac", "#47e85d", "#76d3ee", "#9de053", "#da6949", "#7ea924"];

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
