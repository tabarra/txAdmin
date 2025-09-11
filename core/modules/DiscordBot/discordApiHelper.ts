const modulename = 'DiscordApiHelper';
import consoleFactory from '@lib/console';
const console = consoleFactory(modulename);

const DISCORD_API_BASE = 'https://discord.com/api/v10';

export type DiscordMemberResult = {
    isMember: boolean;
    memberRoles?: string[];
    error?: string;
};

export type DiscordUserProfile = {
    tag: string;
    avatar?: string;
};

/**
 * Lightweight Discord API helper for member/role resolution
 * Uses HTTP API directly without requiring a full Discord bot client
 */
export class DiscordApiHelper {
    private token: string;
    private guildId: string;
    private headers: Record<string, string>;
    private guildName?: string;
    private memberCache = new Map<string, { timestamp: number; data: DiscordMemberResult }>();
    private readonly CACHE_TTL = 60_000; // 1 minute cache

    constructor(token: string, guildId: string) {
        this.token = token;
        this.guildId = guildId;
        this.headers = {
            'Authorization': `Bot ${token}`,
            'Content-Type': 'application/json',
        };
        this.fetchGuildInfo();
    }

    /**
     * Fetches basic guild information
     */
    private async fetchGuildInfo() {
        try {
            const response = await fetch(`${DISCORD_API_BASE}/guilds/${this.guildId}`, {
                headers: this.headers
            });
            
            if (response.ok) {
                const guild = await response.json();
                this.guildName = guild.name;
            }
        } catch (error) {
            console.warn(`Failed to fetch guild info: ${(error as Error).message}`);
        }
    }

    /**
     * Get guild name
     */
    getGuildName(): string | undefined {
        return this.guildName;
    }

    /**
     * Check if a user is a member of the guild and get their roles
     */
    async resolveMemberRoles(userId: string): Promise<DiscordMemberResult> {
        // Check cache first
        const cached = this.memberCache.get(userId);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.data;
        }

        try {
            const response = await fetch(`${DISCORD_API_BASE}/guilds/${this.guildId}/members/${userId}`, {
                headers: this.headers
            });

            if (response.status === 404) {
                const result = { isMember: false };
                this.memberCache.set(userId, { timestamp: Date.now(), data: result });
                return result;
            }

            if (!response.ok) {
                throw new Error(`Discord API returned ${response.status}: ${response.statusText}`);
            }

            const member = await response.json();
            const result = {
                isMember: true,
                memberRoles: member.roles as string[]
            };
            
            this.memberCache.set(userId, { timestamp: Date.now(), data: result });
            return result;
        } catch (error) {
            console.verbose.error(`Failed to resolve Discord member ${userId}: ${(error as Error).message}`);
            return {
                isMember: false,
                error: (error as Error).message
            };
        }
    }

    /**
     * Get user profile information (tag and avatar)
     */
    async resolveMemberProfile(userId: string): Promise<DiscordUserProfile | null> {
        try {
            const response = await fetch(`${DISCORD_API_BASE}/users/${userId}`, {
                headers: this.headers
            });

            if (!response.ok) {
                throw new Error(`Discord API returned ${response.status}: ${response.statusText}`);
            }

            const user = await response.json();
            const tag = user.discriminator === '0' 
                ? `@${user.username}`
                : `${user.username}#${user.discriminator}`;
            
            return {
                tag,
                avatar: user.avatar 
                    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
                    : undefined
            };
        } catch (error) {
            console.verbose.error(`Failed to resolve Discord user profile ${userId}: ${(error as Error).message}`);
            return null;
        }
    }

    /**
     * Clear member cache
     */
    clearCache() {
        this.memberCache.clear();
    }
}

// Global instance for Discord API helper
let discordApiHelper: DiscordApiHelper | null = null;

/**
 * Get or create Discord API helper instance
 */
export function getDiscordApiHelper(): DiscordApiHelper | null {
    // Only create if we have Discord whitelist enabled and credentials
    if (
        (txConfig.whitelist.mode === 'discordMember' || txConfig.whitelist.mode === 'discordRoles')
        && txConfig.discordBot.token
        && txConfig.discordBot.guild
    ) {
        if (!discordApiHelper || 
            discordApiHelper['token'] !== txConfig.discordBot.token ||
            discordApiHelper['guildId'] !== txConfig.discordBot.guild
        ) {
            discordApiHelper = new DiscordApiHelper(
                txConfig.discordBot.token,
                txConfig.discordBot.guild
            );
        }
        return discordApiHelper;
    }
    
    // Clear helper if not needed
    if (discordApiHelper) {
        discordApiHelper = null;
    }
    return null;
}