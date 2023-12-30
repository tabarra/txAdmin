# Feature Graveyard
In txAdmin codebase, we try to keep things lean, this is one of the few reasons after one year of project, our code base is not *that* bad.  
And as part of the process, we "retired" many features and parts of our code base, here is a relation of the majority of them and the reason why:

- **Setup script:** Now everything is automatic when you start with a profile set in the convars;
- **Admin add script:** Now its done via the master account creation UI flow, and the Admin Manager page;
- **Config tester:** With the gained knowledge of the edge cases, it became way easier to implement better checks and actionable error messages on the settings page;
- **Resources injector:** With the integration with  FiveM, our plans for it changed drastically. It may or may not come back, meanwhile it was removed to prevent issues;
- **Automatic cache cleaner:** This feature were created due to the vast number of requests, but in the end this "common knowledge" was based on misinformation, therefore it was removed since we don't actually need it;
- **SSL support:** With the rework of the entire web layer of txAdmin in preparation with the FiveM integration, we ended up removing this (tricky to implement) feature. But don't worry, one of the benefits from the integration is that now we have the FiveM cfx.re reverse proxy, which by default supports HTTPS;
- **Experiments:** Well... not much to experience with right now;
- **Discord static commands:** I don't think anyone ever used it since they can do it with basically any other bot;
- **Set process priority:** Although it was quite requested in the beginning, people just don't seem to use it;
- **Menu Weed troll effect:** It was just too similar to the drunk effect one, not worth keeping;
- **Discord /status command:** Removed to give place for the persistent & auto-updated embed message;
- **Import bans from EasyAdmin, BanSQL, vMenu, vRP, el_bwh:** It was there for over a year, who wanted to migrate could have migrated already. Furthermore it is kinda easy write code to import it directly into the database JSON file;
- **Cfx.re proxy URL:** The `https://monitor-xxxxx.users.cfx.re/` reverse proxy URL has been deprecated due to the complexity it added to txAdmin while being used by only 1% of all txAdmin servers.
- **Host CPU/memory stats on sidebar:** That was not really that useful, and took precious sidebar space.

Don't cry because they are gone.  
Smile because they once existed :)
