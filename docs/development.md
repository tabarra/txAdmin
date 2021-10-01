# txAdmin Development

If you are interested in development of txAdmin, this short guide 
will help setup your environment. Before starting, please make sure you
are at least a little bit familiar with the basics of Node ecosystem
& JS.

## Requirements
* Node v12 or higher

## Getting Started

### Install Path

txAdmin expects itself to be located in a specific location within a 
FXServer artifact. When attempting to run a developer build, please ensure
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

### Menu Development
Menu related development setup can be found [here](https://github.com/tabarra/txAdmin/blob/master/docs/menu.md#development)