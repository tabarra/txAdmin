# Recipe Files
A Recipe is a YAML document that descrives how to deploy a server: from downloading resources, to configuring the `server.cfg` file.  
You can run a recipe from txAdmin's built-in Server Deployer.  
Recipes will be "jailed" to the target folder, so for example they won't be able to execute `write_file` to your `admins.json`.  
At the end of the deployment process, your target folder will be checked for the presence of a `server.cfg` and a `resources` folder to make sure everything went right.  
On the setup page you will be able to import a recipe via its URL or by selecting one of the recommended ones from the community.  
**If you want to run your own recipes, select the `CFX Default` from the setup page then customize it before executing.**  

  
Example recipe:
```yaml
name: PlumeESX2
version: v1.2.3
author: Toybarra
description: |-
    A full featured (8 jobs) and highly configurable yet lightweight ESX v2 base that can be easily extendable. 
    Please join our discord to know more: http://discord.gg/example.

variables:
    dbHost: localhost
    dbUsername: root
    dbPassword: ""
    dbName: test123

tasks: 
    - action: download_file
      url: https://github.com/citizenfx/cfx-server-data/archive/master.zip
      path: ./tmp/cfx-server-data.zip
```

## Meta Data
The recipe accepts the following default meta data:
- `name:` The short name for the recipe. Recommended to be under 24 characters.
- `version:` The version of your recipe.
- `author:` The short name of the author. Recommended to be under 24 characters.
- `description:` A single or multiline description for your recipe. Recommended to be under 256 characters. On YAML you can use multiline strings in many ways, fore more information check https://yaml-multiline.info.


## Tasks
Tasks are executed sequentially, and any failure stops the process.  
Attention: careful with the number of spaces used in the indentation.  

### `download_file`
Downloads a file to a specific path.  
- `url:` The URL of the file.
- `path:` The destination path for the downloaded file. This must be a file name and not a path.
```yaml
- action: download_file
  url: https://github.com/citizenfx/cfx-server-data/archive/master.zip
  path: ./tmp/cfx-server-data.zip
```

### `unzip`
Extracts a ZIP file to a targt folder. This do not work for tar files.  
- `src:` The source path.
- `dest:` The destination path.
```yaml
- action: unzip
  src: ./tmp/cfx-server-data.zip
  dest: ./tmp
```

### `move_path`
Extracts a ZIP file to a targt folder. This do not work for tar files.  
- `overwrite:` When set to true, it will replace the destination path if it already exists.
- `src:` The source path. This can be either a file or a folder. Cannot be the root path (`./`).
- `dest:` The destination path. Cannot be the root path (`./`).
```yaml
- action: move_path
  overwrite: true
  src: ./tmp/cfx-server-data-master/resources
  dest: ./resources
```

### `remove_path`
Removes a file or directory. The directory can have contents. If the path does not exist, silently does nothing.
- `path:` The path to be removed. Cannot be the root path (`./`).
```yaml
- action: remove_path
  path: ./tmp
```

### `ensure_dir`
Ensures that the directory exists. If the directory structure does not exist, it is created.
- `path:` The path to be removed. Cannot be the root path (`./`).
```yaml
- action: ensure_dir
  path: ./resources
```
