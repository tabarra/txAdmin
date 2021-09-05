# THIS BRANCH IS NOT MEANT TO BE MERGED, JUST EXPERIMENTAL NOTEs

Multiserver experiment notes:
- Okay to keep using global vars (or the sa3 approach), but may be worth to let everything contained about the txAdmin class instance
- Ditch the `globals.xxx` entirely, use txGlobal and `txInstance[xxx]`
- globals.info is used only for the profile path

Multiserver Order of operations:
- start by breaking up the settings into profile and global (no ui for now)
- break `databus.txStatsData` into actually global, and per-instance
- move to outside of the instance (rename to `src/lib` and `src/modules`):
	- WebServer
	- extras/banner
	- DynamicAds
	- AdminVault
	- Translator
	- DiscordBot
- separate menu into global vs per-instance
- break settings page into two (web+routes)
- apply `/:profile/...` to all per-instance routes
- apply `txInstance[xxx]` to all per-instance core components
- apply patch to console logger
- make setup and deployer be iframe under coreui header?
- much more shit that idk yet

> Note: order must be to first break things out of the instance, then ui stuff, and only then lose the `globals.xxx`
> Note: don't reuse any code here, just saving what I tried (and just kinda failed)
