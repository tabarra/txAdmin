
### Menu playerlist fix
## TL;DR
Server:
    - Will have it's own playerlist with {id = {name, health, vType}, ...}
    - Regularly run through the playerlist updating {health, vType} (yielding every 50 players)
    - On player join:
        - Send event "updatePlayer" with {id, name} to all admins
    - On player leave:
        - Send event "updatePlayer" with {id, false} to all admins
    - On admin join (auth):
        - Send event "setInitialPlayerlist" with {{id, name}, ...}
    - On getDetailedPlayerlist event:
        - check if admin
        - reply with event setDetailedPlayerlist and payload [ [id, health, vType] ]
Client:
    - On setInitialPlayerlist: replace existing playerlist with the inbound one
    - On updatePlayer: add/remove specific id to playerlist
    - On setDetailedPlayerlist: 
        - run through inbound playerlist updating existing data
        - try to get the dist from all players (susceptible to area culling, but that's fine)
        - TODO: decide what to do in case of missing or extra ids (missed updatePlayer?)
    - On player tab open: getDetailedPlayerlist()
    - Every 5 seconds while player tab is opened: getDetailedPlayerlist()

- Everything is sent as array, no need to waste bytes on keys;
- A list with id/name is always updated on the client (admins only);
- Health and vehicle type is provided only when the "players" tab is open, and every 5s while tab is open;
- The distance is calculated on the client side, and if the player is over the ~425m distance culling limit, it's probably not relevant to know exactly how far he is anyways;
- The initial playerlist (sent after auth) will be 20.5kb if there are 1k players with nickname 16 chars long;
- The detailed playerlist will be 6.8kb for 1k players;
- The refresh interval is dynamic and increases with the number of players - https://www.desmos.com/calculator/dx9f5ko2ge.


## React Specs
- React updates it's internal playerlist when receives the `setPlayerlist` event;
- React calls `iNeedPlayerlistDetails` when the "tabs page" is opened, and then every 5s while it's open;
- When the "players" tab open, it's okay to show the existing (outdated) playerlist, but need to show in yellow somewhere "updating playerlist..." and then remove it on the first `setPlayerlist` received after opening the page;
- The playerlist will always have the 4 values;
- `vType` can be one of: `unknown, walking, driving, biking, boating, flying`;
- `dist` is the integer distance calculated locally (so culling applies). Will be `-1` if unknown;
- `health` is always between 0 and 200, there is no unknown for this one.

```json
{
    //Example self
    "1": {
        "name": "Tabarra",
        "vType": "unknown",
        "dist": 0,
        "health": 200
    },

    //Example just joined
    "2": {
        "name": "poophead",
        "vType": "unknown",
        "dist": -1,
        "health": 0
    },

    //Example someone close
    "3": {
        "name": "tittiesface",
        "vType": "walking",
        "dist": 152,
        "health": 200
    },

    //Example someone far
    "4": {
        "name": "boaty mcboatface",
        "vType": "driving",
        "dist": -1,
        "health": 200
    }
}
```
