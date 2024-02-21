# txAdmin Development
If you are interested in development of txAdmin, this short guide will help setup your environment. 
Before starting, please make sure you are familiar with the basics of NodeJS & ecosystem.
> **Note:** This guide does not cover translations, [which are very easy to do!](./translation.md)  


## Requirements
- Windows, as the `main-builder.js` is doesn't yet work for other OSs;
- NodeJS v16.x to match the one in FXServer;
- FXServer;


## Project Structure
- `core`: Node Backend & Components. This part is transpiled by `tsc` and then bundled with `esbuild`;
- `resource`: The in-game resource that runs under the `monitor` name. These files will be synchronized with the deploy path when running the `dev:main` npm script;
- `menu`: React source code for txAdmin's NUI Menu. It is transpiled & built using Vite;
- `web`: Legacy SSR templates & static assets used for the txAdmin's web panel. It uses EJS as templating engine, and will soon be deprecated in favor of `panel`;
- `panel`: The new UI built with React and Vite;
- `scripts`: The scripts used for development only;
- `shared`: Stuff used across multiple workspaces like small functions and type definitions.


## Preparing the environment
1. First, clone the txAdmin repository into a folder outside the fxserver directory;
```sh
git clone https://github.com/tabarra/txAdmin
```
2. Install dependencies & prepare commit hook;
```sh
# for each workspace (core/nui/panel/shared) + root
npm install
npm run prepare
```
3. Add a environment variable `TXADMIN_DEV_FXSERVER_PATH` with the path to your FXServer folder (eg. `E:\\FiveM\\6683\\`).


## Development Workflows

### Core/Panel/Resource
This workflow is controlled by `main-builder.js`, which is responsible for:
- Watching and copying static files (resource, docs, license, entry file, etc) to the deploy path;
- Watching and re-transpiling the core files, and then bundling and deploying it;
- Run FXServer (in the same terminal), and restarting it when the core is modified (like `nodemon`, but fancy).
  
In dev mode, core will redirect the panel `index.html` to use Vite, so you first need to start it, and only then start the `main-builder.js`:
```sh
# run vite
cd panel
npm run dev

# In a new terminal - run main-builder.js
cd core
npm run dev
```
  
### NUI Menu
```sh
cd nui

#To run Vite on game dev mode:
npm run dev

#To run Vite on browser dev mode:
npm run browser
```
Keep in mind that for every change you will need to restart the `monitor` resource, and unless you started the server with `+setr txAdmin-debugMode true` txAdmin will detect that as a crash and restart your server.  
Also, when running in game mode, it takes between 10 and 30 seconds for the vite builder to finish for you to be able to restart the `monitor` resource ingame.


### Resource event naming rules:

- The event prefix must be `tx<cl|sv>:` indicating where it is registered.
- Events that request something (like permission) from the server starts with `txsv:req`.
- Events can have verbs like `txsv:checkAdminStatus` or `txcl:setServerCtx`.
- Since most events are menu related, scoping events to menu is not required.


### Building/Publishing
First make sure the files are linted properly and that the typecheck is successful, and then run the build command. The output will be on the `dist/` folder.
```sh
npm run lint
npm run typecheck
npm run build
```

## Note regarding the Web UI

**⚠Warning: The /web/ ui is considered legacy and will be migrated to /panel/.**

**DO NOT** Modify `css/coreui.css`. Either do a patch in the `custom.css` or modify the SCSS variables.  
This doc is a reference if you are trying to re-build the `css/coreui.css` from the SCSS source.  
The only thing I changed from CoreUI was the `aside-menu` size from 200px to 300px in `scss/_variables.scss : $aside-menu-width`.  
You can find the other variable names in `node_modules/@coreui/coreui/scss/coreui`.

```bash
git clone https://github.com/coreui/coreui-free-bootstrap-admin-template.git coreui
cd coreui
npm i

# If you want to make sure you used the same version of CoreUI
git checkout 0cb1d81a8471ff4b6eb80c41b45c61a8e2ab3ef6

# Edit your stuff and then to compile:
npx node-sass --output-style expanded --source-map true --source-map-contents true --precision 6 src/scss/style.scss src/css/style.css
```

Then copy the `src/css/style.css` to txAdmin's folder.
  