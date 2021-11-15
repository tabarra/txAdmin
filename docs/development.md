# txAdmin Development

If you are interested in development of txAdmin, this short guide 
will help setup your environment. Before starting, please make sure you
are at least a little bit familiar with the basics of Node ecosystem
& JS.

*Note: This guide won't include instructions on how to utilize Git, 
it is expected you know how to clone a repository to a specific location*

## Requirements
* Node v16 to match the one in FXServer.

## Getting Started

### Install Path

txAdmin expects itself to be located in a specific location within 
FXServer. When attempting to run a developer build, please ensure
you have cloned the repository to the right location and with a folder name
of `monitor`.

**Expected Location Relative FXServer Root**: 
`FX_SERVER_ROOT/citizen/system_resources/monitor`

### Installing Dependencies

txAdmin uses the default `npm` package manager installed alongside
Node. To install dependencies, please run the following command.

```sh
npm i
```

### Start Up Dev Build
You can automatically run FXRunner and txAdmin using the `watch` script.
This will automatically restart when changes are made to files
within the `src` directory.

```sh
npm run watch
```

## Overview

### Project Structure

* `src` - Node Backend & Components
* `scripts` - txAdmin game-scripts that run under the `monitor` resource
* `menu` - Source code and webpack configuration for the txAdmin's NUI Menu
* `web` - SSR templates & static assets used for the txAdmin's web panel.

### Web UI Development

**DO NOT** Modify `css/coreui.css`. Either do a patch in the `custom.css` or modify the SCSS variables.  
This doc is a reference if you are trying to re-build the `css/coreui.css` from the SCSS source.  
The only thing I changed from CoreUI was the `aside-menu` size from 200px to 300px in `scss/_variables.scss : $aside-menu-width`.  
You can find the other variable names in `node_modules/@coreui/coreui/scss/coreui`.

```bash
$ git clone https://github.com/coreui/coreui-free-bootstrap-admin-template.git coreui
$ cd coreui
$ npm i

# If you want to make sure you used the same version of CoreUI
$ git checkout 0cb1d81a8471ff4b6eb80c41b45c61a8e2ab3ef6

# Edit your stuff and then to compile:
$ npx node-sass --output-style expanded --source-map true --source-map-contents true --precision 6 src/scss/style.scss src/css/style.css
```

Then copy the `src/css/style.css` to txAdmin's folder.
  
----

### Menu Development

The txAdmin Menu is a Lua + TypeScript React project. Ensure you have all the dependencies by running
`npm i` in the root directory.

#### Hot Reloading Dev Environments

To run the menu in the browser you can use the `dev:menu` script. This will hot reload, everytime
a change is made.

```bash
npm run dev:menu:browser
```

To run the menu in game you can use the `dev:menu:game` script, this will also hot reload the
build process, but you must also manually restart the monitor resource each time.
```bash
npm run dev:menu:game
```

**Note**: For in-game development, you must have a txAdmin development instance instance running as well as
the `dev:menu:game` script *(You can easily start one by running `npm run watch`)*.

#### General Structure

**Lua**: You can find the majority of the relevant Lua scripts in the `./scripts/menu` directory.

**React/Typescript**: The source code for the React application can be found in the `./menu` directory.
