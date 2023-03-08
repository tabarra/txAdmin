NOTE: mesmo arquivo da pasta ~/Desktop/PROGRAMMING/txAdmin-newDatabase

## FIXME: i just found out two players in the same server can have the same license, and doesn't seem to be just cl2, please investigate and check the logic below.

## New database schema:
```js
//Every player that have been on the server over specific threshold (15m default) gets added to the database
//FIXME: minSessionTime doesn't exist anymore
//FIXME: i think we can safely save the last 10 player names, but don't even need to use it for searches
players: [{ 
    license: 'xxxxxxxxx',
    name: 'yyyyy',
    totalPlayTime: 205,
    joined: TS,
    whitelisted: TS, //ts instead of bool so we can have a feature to automatically remove WL after xxx days 
    notes?: {
        text: '',
        lastAdmin: 'null',
        tsLastEdit: TS
    },
    activity: [
        //The most recent days with session time
        //Array max length configurable on settings page
        //Format: date, minutes played
        ['2022-03-24', 138],
        ['2022-03-25', 42],
    ],
    ids: [
        //Every identifier to ever be used with the license above
    ],
    hwids: [
        //Every HWID to ever be used with the license above
    ],
    log: [{
        //...bans, warns, commends
        id: "Bxxx-xxxx/Axxx-xxxx/Cxxx-xxxx",
        type: "ban/warn/commend",
        author: "tabarra",
        reason: "sdf sdf dsf ds",
        ts: TS,
        exp?: TS,
        revokedBy?: "tabarra"
    }]
}]

// The legacy bans collection is for bans we cannot strictly correlate to a player while migrating
// Once a day check for expired legacy bans and remove from the collection
// Reserved for:
// - bans that cannot be linked to a license
// - bans that which identifiers types are not unique (eg more than one "discord:")
// - bans without player name (meaning it was a manual id ban)
// - active bans only, do not import expired or revoked bans
// - bans with reason starting with `[IMPORTED]`
// - any future bans that get imported
legacyBans: [{
    id: "Lxxx-xxxx",
    reason: "",
    ts: TS,
    exp?: TS,
    ids: [...],
}]
```

- License is unique
- FIXME: what is the correct handling of license2?
- Any other identifier can be present in more than one player
- Identifier and HWIDs array will contain EVERY id to ever join a server with that specific license
- For hwid matching, add a setting with numbers `3, 5, 7 (default), 11, 13` (13 should be 65% of the median number of hwids FIXME: this seems to be wrong, check stats)
- If you join an account with new license, but matching identifier with another one, it will be registered as a new account
- If your identifier matches any account that is banned, the ban apllies to you
    - make sure the ban message makes clear which identifier matched and that it is from another account (maybe even say the name)
    - would be cool if we could give the player an adaptive card, as it is a lot of information to show
- (DONE) whitelist will be cease to be an action and become a prop in the player object containing only a timestamp of when it was issued
- JSON db migration of bans/warns:
    - FIXME: can i migrate Axxx-xxxx to Wxxx-xxxx?
    - if license is present, matches with a user, no multiple ids of the same type (ex more than one discord)
        - then it is added to the player history
    - else
        - added to a "legacy bans" table
- (DONE) Warns now can be revoked, as they are quite often used as "negative points" on player log instead of actual Warns 
- When we query (and find) a player on playerConnecting, cache the player object in a lru-cache so we don't have to requery on playerJoining
- FIXME: should I change how the whitelist currently works?


## Interface changes:
- Player modal MUST find any matching accounts with that identifier and show:
    - matching accounts ex "1 account with matching identifiers found"
    - if it is banned in another account
    - if any other related account has low credibility
    - also search for legacy bans
- In the player modal we would need a good space for all the warnings like the matching account, matching ban, or no-license so no-save
- FIXME: in the modal, how to handle opening for a id that already disconnected

- Break down the Players page into:
    - Overview
        - General stats, maybe a chart
        - Actions by admin
    - Players page, with a more explicit and "dumbed down" way of searching for players
        - Paginated table
        - Default view can be "latest players to join the database" (crossed the 15m default threshold)
        - Clicking on a player will bring the modal up
    - Bans/Warns/Commends page
        - Paginated table
        - Should we have a button to ban a specific identifier or identifier array? We prefer banning players instead of adding legacy bans
    - Whitelist (behavior/components to be defined)


## Database use cases:
1. Player connecting / Search by player identifier
Search for any account or legacy ban with any identifier (or license) matching the connecting users.
In other words:
    - the input string `license` should match any `players[?].license`
    - the input array `ids` should match ids in `players[?].ids`
    - the input array `hwids` should match hwids in `players[?].hwids`
For player connection, this array will be processed to check for active bans and whitelist.

2. Search for players by name
Using normalized (no unicode), lowercase, and within some levenshtein distance of a specified string.
For instance, searching for `tabara` should find `𝓣𝓪𝓫𝓪𝓻𝓻𝓪` with distance 1.

3. Find player by action ID (eg ban)
4. Get player by license
5. Edit player by license
6. Edit a player action by it's ID (the previous one kinda covers it)
7. Edit player action by ID
8. Get legacy ban by ID
9. Delete legacy ban by ID

10. List of top players by activity time (all time)
11. List of top players by activity time (last X days)
12. Paginated list of newest players
13. Paginated list of latest log entries (bans, warns, commends)

14. Count of all players, bans, warns, whitelists, players active in the last week
15. Get all actions grouped by admin name
This feature requested on #476 would allow for easier admin action auditing, as well as statistics page which people always love.

16. Database cleanup functions:
- Remove players inactive over X days
- Remove players not whitelisted
- Remove revoked, revoked or expired or all bans
- Remove revoked, older than X days, or all warns
- Remove whitelists over X days, or all whitelists

17. Insert new player
18. Insert new player action
19. Insert new legacy ban (bulk only)


## Random notes:
GH Issues:
- #578 Edit bans
    - maybe block editing legacy, expired and revoked bans
    - maybe an editLog array on the ban with author, date and reason (prefill reason with "edited expiration and reason because ___"?)
- #449 Add revoke ban/whitelist to the player modal
- #446 HWID Token bans
- #385 Save identifier history
- #522 offline warns
- #476 feature to see how many bans/kicks/warns an admin issued
    - expensive to calculate in the current db schema?

Ways to "click" on a user (reference them)
- web playerlist: currently license, change to id
- nui playerlist: id
- server log: mutex_id
- the ban/warn/commend page: license


talvez fazer os usuários serem uma classe com props .warn, .ban e etc seja uma boa
ele teria prop pra setar como offline, e uma prop pra marca-lo como temp que ele mesmo remove depois do tempo


2023 NOTE: maybe worth to separate databases? for searching ids/hwids a hyper optimized db which links the identifier to a license, and then another license just to store players, bans, etc? 
https://www.npmjs.com/package/lmdb
