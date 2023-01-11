//NOTE: extracted from discord.js due to some package issue importing it


export const enum MessageButtonStyles {
    PRIMARY = 1,
    SECONDARY = 2,
    SUCCESS = 3,
    DANGER = 4,
    LINK = 5,
}

export const enum ApplicationCommandType {
    ChatInput = 1,
    User = 2,
    Message = 3
}

export const enum ApplicationCommandOptionType {
    Subcommand = 1,
    SubcommandGroup = 2,
    String = 3,
    Integer = 4,
    Boolean = 5,
    User = 6,
    Channel = 7,
    Role = 8,
    Mentionable = 9,
    Number = 10,
    Attachment = 11
}
